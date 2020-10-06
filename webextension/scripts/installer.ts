import {
  AthleteModel,
  AthleteSettingsModel,
  DatedAthleteSettingsModel,
  Gender,
  SyncedActivityModel,
  UserLactateThresholdModel,
  UserSettings,
  UserZonesModel,
} from "@elevate/shared/models";
import { Helper } from "./helper";
import * as semver from "semver";
import * as _ from "lodash";
import { LegacyBrowserStorage } from "./legacy-browser-storage";
import { Constant } from "@elevate/shared/constants";
import { YearToDateProgressPresetModel } from "../../appcore/src/app/year-progress/shared/models/year-to-date-progress-preset.model";
import { ProgressMode } from "../../appcore/src/app/year-progress/shared/enums/progress-mode.enum";
import { BrowserStorageType } from "./models/browser-storage-type.enum";
import { Identifier, Versioning } from "@elevate/shared/tools";
import { Migration7x0x0x6 } from "./migrations/Migration7x0x0x6";
import ExtensionUserSettingsModel = UserSettings.ExtensionUserSettingsModel;
import UserSettingsModel = UserSettings.UserSettingsModel;

class Installer {
  public previousVersion: string;
  public currentVersion: string;

  public listen() {
    chrome.runtime.onInstalled.addListener(details => {
      if (details.reason === "install") {
        this.handleInstall(); // Pop in tab application and plugin page
      } else if (details.reason === "update") {
        this.currentVersion = Versioning.chromeToSemverVersion(chrome.runtime.getManifest().version);
        this.previousVersion = Versioning.chromeToSemverVersion(details.previousVersion);

        this.handleUpdate()
          .then(() => {
            // Check and display sync & local storage after update
            return Promise.all([
              LegacyBrowserStorage.getInstance().get(BrowserStorageType.SYNC),
              LegacyBrowserStorage.getInstance().get(BrowserStorageType.LOCAL),
            ]);
          })
          .then((result: any[]) => {
            console.log("Migration finished!");
            console.log("Synced data: ", result[0]);
            console.log("Local data: ", result[1]);
          })
          .catch(error => {
            console.error(error);
          });
      }
    });
  }

  protected isPreviousVersionLowerThanOrEqualsTo(oldVersion: string, upgradingVersion: string): boolean {
    return semver.gte(upgradingVersion, oldVersion);
  }

  protected handleInstall() {
    chrome.tabs.create(
      {
        url: Constant.LANDING_PAGE_URL,
      },
      (tab: chrome.tabs.Tab) => {
        console.log("First install. Display website new tab:", tab);
        chrome.tabs.create(
          {
            url: chrome.extension.getURL(Constant.APP_ROOT_URL),
          },
          (tab: chrome.tabs.Tab) => {
            console.log("First install. Display settings:", tab);
          }
        );
      }
    );
  }

  /**
   * Summary: Clear local history if coming from version under 5.1.1
   */
  protected migrate_to_5_1_1(): Promise<void> {
    let promise = Promise.resolve();

    //  v <= v5.1.1 ?: Clear local history if coming from version under 5.1.1
    if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "5.1.1")) {
      console.log("Migrate to 5.1.1");

      promise = LegacyBrowserStorage.getInstance()
        .rm(BrowserStorageType.LOCAL, "computedActivities")
        .then(() => {
          return LegacyBrowserStorage.getInstance().rm(BrowserStorageType.LOCAL, "syncDateTime");
        })
        .then(() => {
          console.log("Local History cleared");
          return Promise.resolve();
        })
        .catch((error: Error) => {
          return Promise.reject(error);
        });
    } else {
      console.log("Skip migrate to 5.1.1");
    }

    return promise;
  }

  /**
   * Summary: Move & convert userHrrZones to generic heartrate zones. Remove enableAlphaFitnessTrend
   */
  protected migrate_to_5_11_0(): Promise<void> {
    let promise = Promise.resolve();

    if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "5.11.0")) {
      console.log("Migrate to 5.11.0");

      promise = LegacyBrowserStorage.getInstance()
        .rm(BrowserStorageType.SYNC, ["enableAlphaFitnessTrend"])
        .then(() => {
          return LegacyBrowserStorage.getInstance().get(BrowserStorageType.SYNC);
        })
        .then((currentUserSavedSettings: any) => {
          const oldUserHrrZones = currentUserSavedSettings.userHrrZones; // Get user current zones

          if (oldUserHrrZones) {
            if (oldUserHrrZones.length > 0) {
              // If user has zones
              const newHeartRateZones: any = [];
              for (let i = 0; i < oldUserHrrZones.length; i++) {
                const hrrZone: any = oldUserHrrZones[i];
                newHeartRateZones.push({
                  from: Helper.heartrateFromHeartRateReserve(
                    hrrZone.fromHrr,
                    currentUserSavedSettings.userMaxHr,
                    currentUserSavedSettings.userRestHr
                  ),
                  to: Helper.heartrateFromHeartRateReserve(
                    hrrZone.toHrr,
                    currentUserSavedSettings.userMaxHr,
                    currentUserSavedSettings.userRestHr
                  ),
                });
              }

              if (!currentUserSavedSettings.zones) {
                currentUserSavedSettings.zones = {};
              }

              currentUserSavedSettings.zones.heartRate = newHeartRateZones;
              return LegacyBrowserStorage.getInstance()
                .set(BrowserStorageType.SYNC, null, currentUserSavedSettings)
                .then(() => {
                  return LegacyBrowserStorage.getInstance().rm(BrowserStorageType.SYNC, ["userHrrZones"]);
                });
            } else {
              // Key exists
              return LegacyBrowserStorage.getInstance().rm(BrowserStorageType.SYNC, ["userHrrZones"]);
            }
          } else {
            return Promise.resolve();
          }
        });
    } else {
      console.log("Skip migrate to 5.11.0");
    }

    return promise;
  }

  /**
   * Summary: Removing syncWithAthleteProfile local storage object & rename computedActivities to syncedActivities. remove autoSyncMinutes
   */
  protected migrate_to_6_1_2(): Promise<void> {
    let promise = Promise.resolve();

    // v <= v6.1.2 ?: Removing syncWithAthleteProfile local storage object & rename computedActivities to syncedActivities
    if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "6.1.2")) {
      console.log("Migrate to 6.1.2");

      promise = LegacyBrowserStorage.getInstance()
        .rm(BrowserStorageType.LOCAL, ["syncWithAthleteProfile"])
        .then(() => {
          return LegacyBrowserStorage.getInstance()
            .get<SyncedActivityModel[]>(BrowserStorageType.LOCAL, "computedActivities")
            .then((computedActivities: SyncedActivityModel[]) => {
              if (computedActivities) {
                return LegacyBrowserStorage.getInstance()
                  .set(BrowserStorageType.LOCAL, "syncedActivities", computedActivities)
                  .then(() => {
                    return LegacyBrowserStorage.getInstance().rm(BrowserStorageType.LOCAL, ["computedActivities"]);
                  });
              } else {
                return Promise.resolve();
              }
            })
            .then(() => {
              return LegacyBrowserStorage.getInstance().rm(BrowserStorageType.SYNC, ["autoSyncMinutes"]);
            });
        });
    } else {
      console.log("Skip migrate to 6.1.2");
    }

    return promise;
  }

  /**
   * Summary: Removing synced displayMotivationScore
   */
  protected migrate_to_6_4_0(): Promise<void> {
    let promise = Promise.resolve();

    if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "6.4.0")) {
      console.log("Migrate to 6.4.0");
      promise = LegacyBrowserStorage.getInstance().rm(BrowserStorageType.SYNC, ["displayMotivationScore"]);
    } else {
      console.log("Skip migrate to 6.4.0");
    }

    return promise;
  }

  /**
   * Summary: Migrate old user synced athletes setting to athleteSnapshot. Remove old user synced athletes setting.
   * Create datedAthleteSettings into local storage
   */
  protected migrate_to_6_5_0(): Promise<void> {
    let promise = Promise.resolve();

    if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "6.5.0")) {
      console.log("Migrate to 6.5.0");

      promise = LegacyBrowserStorage.getInstance()
        .get(BrowserStorageType.SYNC)
        .then((userSettingsModel: any) => {
          if (userSettingsModel.userGender) {
            const userGender = userSettingsModel.userGender === "men" ? Gender.MEN : Gender.WOMEN;

            const athleteModel = new AthleteModel(
              userGender,
              new AthleteSettingsModel(
                _.isNumber(userSettingsModel.userMaxHr) ? userSettingsModel.userMaxHr : null,
                _.isNumber(userSettingsModel.userRestHr) ? userSettingsModel.userRestHr : null,
                !_.isEmpty(userSettingsModel.userLTHR)
                  ? userSettingsModel.userLTHR
                  : UserLactateThresholdModel.DEFAULT_MODEL,
                _.isNumber(userSettingsModel.userFTP) ? userSettingsModel.userFTP : null,
                _.isNumber(userSettingsModel.userRunningFTP) ? userSettingsModel.userRunningFTP : null,
                _.isNumber(userSettingsModel.userSwimFTP) ? userSettingsModel.userSwimFTP : null,
                _.isNumber(userSettingsModel.userWeight) ? userSettingsModel.userWeight : null
              ) as any
            );

            // Create new athlete model structure and apply change in sync settings
            return LegacyBrowserStorage.getInstance().set(BrowserStorageType.SYNC, "athleteModel", athleteModel);
          } else {
            return Promise.resolve();
          }
        })
        .then(() => {
          // Remove deprecated old user settings
          return LegacyBrowserStorage.getInstance().rm(BrowserStorageType.SYNC, [
            "userGender",
            "userMaxHr",
            "userRestHr",
            "userLTHR",
            "userFTP",
            "userRunningFTP",
            "userSwimFTP",
            "userWeight",
          ]);
        })
        .then(() => {
          return LegacyBrowserStorage.getInstance().rm(BrowserStorageType.LOCAL, "profileConfigured");
        });
    } else {
      console.log("Skip migrate to 6.5.0");
    }

    return promise;
  }

  protected migrate_to_6_6_0(): Promise<void> {
    let promise = Promise.resolve();

    if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "6.6.0")) {
      console.log("Migrate to 6.6.0");

      // Migrate storage of zones from ZoneModel[] to number[] => less space on storage
      promise = LegacyBrowserStorage.getInstance()
        .get(BrowserStorageType.SYNC)
        .then((userSettingsModel: any) => {
          const userZonesModel = userSettingsModel.zones;

          let promiseMigrate;

          try {
            userZonesModel.speed = UserZonesModel.serialize(userZonesModel.speed);
            userZonesModel.pace = UserZonesModel.serialize(userZonesModel.pace);
            userZonesModel.gradeAdjustedPace = UserZonesModel.serialize(userZonesModel.gradeAdjustedPace);
            userZonesModel.heartRate = UserZonesModel.serialize(userZonesModel.heartRate);
            userZonesModel.power = UserZonesModel.serialize(userZonesModel.power);
            userZonesModel.runningPower = UserZonesModel.serialize(userZonesModel.runningPower);
            userZonesModel.cyclingCadence = UserZonesModel.serialize(userZonesModel.cyclingCadence);
            userZonesModel.runningCadence = UserZonesModel.serialize(userZonesModel.runningCadence);
            userZonesModel.grade = UserZonesModel.serialize(userZonesModel.grade);
            userZonesModel.elevation = UserZonesModel.serialize(userZonesModel.elevation);
            userZonesModel.ascent = UserZonesModel.serialize(userZonesModel.ascent);

            promiseMigrate = LegacyBrowserStorage.getInstance().set(BrowserStorageType.SYNC, "zones", userZonesModel);
          } catch (err) {
            console.warn(err);
            promiseMigrate = LegacyBrowserStorage.getInstance().set(
              BrowserStorageType.SYNC,
              "zones",
              ExtensionUserSettingsModel.DEFAULT_MODEL.zones
            ); // Reset to default
          }

          return promiseMigrate;
        });
    } else {
      console.log("Skip migrate to 6.6.0");
    }

    return promise;
  }

  /**
   * Force user using single athlete settings to use dated ones
   */
  protected migrate_to_6_7_0(): Promise<void> {
    let promise = Promise.resolve();

    if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "6.7.0")) {
      console.log("Migrate to 6.7.0");

      promise = LegacyBrowserStorage.getInstance()
        .get<DatedAthleteSettingsModel[]>(BrowserStorageType.LOCAL, "datedAthleteSettings")
        .then((localDatedAthleteSettingsModels: DatedAthleteSettingsModel[]) => {
          if (_.isEmpty(localDatedAthleteSettingsModels)) {
            return LegacyBrowserStorage.getInstance()
              .get(BrowserStorageType.SYNC)
              .then((userSettingsModel: any) => {
                const athleteSettings =
                  userSettingsModel && userSettingsModel.athleteModel && userSettingsModel.athleteModel.athleteSettings
                    ? userSettingsModel.athleteModel.athleteSettings
                    : AthleteSettingsModel.DEFAULT_MODEL;

                const datedAthleteSettings: DatedAthleteSettingsModel[] = [
                  new DatedAthleteSettingsModel(DatedAthleteSettingsModel.DEFAULT_SINCE, athleteSettings),
                  new DatedAthleteSettingsModel(null, athleteSettings),
                ];

                return LegacyBrowserStorage.getInstance()
                  .set(BrowserStorageType.LOCAL, "datedAthleteSettings", datedAthleteSettings)
                  .then(() => {
                    return LegacyBrowserStorage.getInstance().set(
                      BrowserStorageType.SYNC,
                      "hasDatedAthleteSettings",
                      true
                    );
                  });
              });
          } else {
            return Promise.resolve();
          }
        });
    } else {
      console.log("Skip migrate to 6.7.0");
    }

    return promise;
  }

  protected migrate_to_6_8_1(): Promise<void> {
    let promise: Promise<void>;

    if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "6.8.1")) {
      console.log("Migrate to 6.8.1");

      let userSettingsModel: ExtensionUserSettingsModel;

      // Move all user settings content inside specific key
      promise = LegacyBrowserStorage.getInstance()
        .get(BrowserStorageType.SYNC)
        .then((settings: ExtensionUserSettingsModel) => {
          const hasUserSettingsKey = !_.isEmpty((settings as any).userSettings);

          if (hasUserSettingsKey) {
            return Promise.resolve();
          } else {
            userSettingsModel = settings;

            delete (userSettingsModel as any).bestSplitsConfiguration; // Remove best split config from user settings

            return LegacyBrowserStorage.getInstance()
              .clear(BrowserStorageType.SYNC)
              .then(() => {
                return LegacyBrowserStorage.getInstance().set(
                  BrowserStorageType.SYNC,
                  "userSettings",
                  userSettingsModel
                );
              });
          }
        });
    } else {
      console.log("Skip migrate to 6.8.1");

      promise = Promise.resolve();
    }

    return promise;
  }

  protected migrate_to_6_9_0(): Promise<void> {
    let promise: Promise<void>;

    if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "6.9.0")) {
      console.log("Migrate to 6.9.0");

      let userSettingsModel: ExtensionUserSettingsModel;

      // Move all user settings content inside specific key
      promise = LegacyBrowserStorage.getInstance()
        .get(BrowserStorageType.SYNC, "userSettings")
        .then((settings: ExtensionUserSettingsModel) => {
          const hasOldYearProgressTargets =
            _.isNumber((settings as any).targetsYearRide) || _.isNumber((settings as any).targetsYearRun);

          if (hasOldYearProgressTargets) {
            userSettingsModel = settings;
            delete (userSettingsModel as any).targetsYearRide;
            delete (userSettingsModel as any).targetsYearRun;
            return LegacyBrowserStorage.getInstance().set(BrowserStorageType.SYNC, "userSettings", userSettingsModel);
          } else {
            return Promise.resolve();
          }
        });
    } else {
      console.log("Skip migrate to 6.9.0");

      promise = Promise.resolve();
    }

    return promise;
  }

  protected migrate_to_6_10_0(): Promise<void> {
    let promise: Promise<void>;

    if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "6.10.0")) {
      console.log("Migrate to 6.10.0");

      // Move all user settings content inside specific key
      promise = LegacyBrowserStorage.getInstance()
        .get(BrowserStorageType.LOCAL, "yearProgressPresets")
        .then((oldPresetModels: YearToDateProgressPresetModel[]) => {
          const migratedPresets: YearToDateProgressPresetModel[] = [];

          let hasUpgradedPresets = false;
          _.forEach(oldPresetModels, (presetModel: any /*YearToDateProgressPresetModel*/) => {
            if (_.isUndefined(presetModel.mode)) {
              presetModel.mode = ProgressMode.YEAR_TO_DATE;
              hasUpgradedPresets = true;
            }
            migratedPresets.push(presetModel);
          });

          if (hasUpgradedPresets) {
            return LegacyBrowserStorage.getInstance().set(
              BrowserStorageType.LOCAL,
              "yearProgressPresets",
              migratedPresets
            );
          } else {
            return Promise.resolve();
          }
        });
    } else {
      console.log("Skip migrate to 6.10.0");

      promise = Promise.resolve();
    }

    return promise;
  }

  protected migrate_to_6_11_0(): Promise<void> {
    let promise: Promise<void> = Promise.resolve();

    if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "6.11.0")) {
      console.log("Migrate to 6.11.0");

      const alreadyMigratedMessage = "Abort 6.11.0 migration. Already migrated";

      // Move all user settings from sync to local
      promise = Promise.all([
        LegacyBrowserStorage.getInstance().get(BrowserStorageType.SYNC, "userSettings"),
        LegacyBrowserStorage.getInstance().get(BrowserStorageType.LOCAL),
      ])
        .then(result => {
          if (!result[0]) {
            throw Error(alreadyMigratedMessage);
          }

          const userSettingsModel: ExtensionUserSettingsModel = result[0] as ExtensionUserSettingsModel;
          const localBrowserStorage: any = (result[1] as any) || ({} as any);

          localBrowserStorage.userSettings = userSettingsModel;

          return LegacyBrowserStorage.getInstance().set(BrowserStorageType.LOCAL, null, localBrowserStorage); // Update local storage
        })
        .then(() => {
          return LegacyBrowserStorage.getInstance().rm(BrowserStorageType.SYNC, "userSettings"); // Remove userSettings from sync
        })
        .then(() => {
          return Promise.all([
            LegacyBrowserStorage.getInstance().get(BrowserStorageType.LOCAL, "userSettings"), // Get userSettings from local now
            LegacyBrowserStorage.getInstance().get(BrowserStorageType.LOCAL, "datedAthleteSettings"),
          ]);
        })
        .then(result => {
          const userSettingsModel: ExtensionUserSettingsModel = result[0] as ExtensionUserSettingsModel;
          const datedAthleteSettings: DatedAthleteSettingsModel[] = result[1] as DatedAthleteSettingsModel[];

          // Create new athlete storage local
          const athleteModel: AthleteModel = (userSettingsModel as any).athleteModel;
          const isSingleAthleteSettingsMode = (userSettingsModel as any).hasDatedAthleteSettings === false;

          if (isSingleAthleteSettingsMode) {
            const athleteSettings: AthleteSettingsModel =
              athleteModel && (athleteModel as any).athleteSettings
                ? (athleteModel as any).athleteSettings
                : AthleteSettingsModel.DEFAULT_MODEL;

            athleteModel.datedAthleteSettings = [
              new DatedAthleteSettingsModel(DatedAthleteSettingsModel.DEFAULT_SINCE, athleteSettings),
              new DatedAthleteSettingsModel(null, athleteSettings),
            ];
          } else if (athleteModel) {
            athleteModel.datedAthleteSettings = datedAthleteSettings;
          }

          // Remove deprecated keys
          delete (athleteModel as any).athleteSettings;
          delete (userSettingsModel as any).athleteModel;
          delete (userSettingsModel as any).hasDatedAthleteSettings;

          return Promise.all([
            LegacyBrowserStorage.getInstance().set(BrowserStorageType.LOCAL, "userSettings", userSettingsModel), // Update user settings
            LegacyBrowserStorage.getInstance().set(BrowserStorageType.LOCAL, "athlete", athleteModel), // Save new athlete key on local storage
            LegacyBrowserStorage.getInstance().rm(BrowserStorageType.LOCAL, "datedAthleteSettings"), // datedAthleteSettings are now stored in athlete storage
          ]);
        })
        .then(() => {
          return LegacyBrowserStorage.getInstance().get(BrowserStorageType.LOCAL, "syncedActivities");
        })
        .then((syncedActivities: SyncedActivityModel[]) => {
          // Rename athleteModel to athleteSnapshot for each activity
          _.forEach(syncedActivities, (activity: SyncedActivityModel) => {
            activity.athleteSnapshot = (activity as any).athleteModel;
            delete (activity as any).athleteModel;
          });

          return LegacyBrowserStorage.getInstance().set(BrowserStorageType.LOCAL, "syncedActivities", syncedActivities);
        })
        .catch(error => {
          if (error.message === alreadyMigratedMessage) {
            console.log(alreadyMigratedMessage);
          } else {
            console.error(error);
          }

          return Promise.resolve();
        })
        .then(() => {
          // Add ids to yearProgressPresets
          return LegacyBrowserStorage.getInstance()
            .get(BrowserStorageType.LOCAL, "yearProgressPresets")
            .then((yearProgressPresets: object[]) => {
              yearProgressPresets = _.map(yearProgressPresets, preset => {
                (preset as YearToDateProgressPresetModel).id = Identifier.generate();
                return preset;
              });

              return LegacyBrowserStorage.getInstance().set(
                BrowserStorageType.LOCAL,
                "yearProgressPresets",
                yearProgressPresets
              );
            });
        });
    } else {
      console.log("Skip migrate to 6.11.0");
    }

    return promise;
  }

  protected migrate_to_6_11_1(): Promise<void> {
    let promise: Promise<void> = Promise.resolve();

    if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "6.11.1")) {
      console.log("Migrate to 6.11.1");

      promise = LegacyBrowserStorage.getInstance()
        .get<AthleteModel>(BrowserStorageType.LOCAL, "athlete")
        .then(athleteModel => {
          if (athleteModel.datedAthleteSettings && athleteModel.datedAthleteSettings.length > 0) {
            athleteModel.datedAthleteSettings = _.sortBy(
              athleteModel.datedAthleteSettings,
              (model: DatedAthleteSettingsModel) => {
                const sortOnDate: Date = _.isNull(model.since) ? new Date(0) : new Date(model.since);
                return sortOnDate.getTime() * -1;
              }
            );

            if (_.last(athleteModel.datedAthleteSettings).since !== null) {
              _.last(athleteModel.datedAthleteSettings).since = null; // Set forever settings
              return LegacyBrowserStorage.getInstance().set(BrowserStorageType.LOCAL, "athlete", athleteModel);
            } else {
              return Promise.resolve();
            }
          }
        });
    } else {
      console.log("Skip migrate to 6.11.1");
    }

    return promise;
  }

  protected migrate_to_6_14_0(): Promise<void> {
    let promise: Promise<void> = Promise.resolve();

    if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "6.14.0")) {
      console.log("Migrate to 6.14.0");

      promise = LegacyBrowserStorage.getInstance()
        .get<UserSettingsModel>(BrowserStorageType.LOCAL, "userSettings")
        .then((userSettingsModel: UserSettingsModel) => {
          delete (userSettingsModel as any).displayReliveCCLink;
          return LegacyBrowserStorage.getInstance().set<UserSettingsModel>(
            BrowserStorageType.LOCAL,
            "userSettings",
            userSettingsModel
          );
        });
    } else {
      console.log("Skip migrate to 6.14.0");
    }

    return promise;
  }

  protected migrate_to_6_15_0(): Promise<void> {
    let promise: Promise<void> = Promise.resolve();
    if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "6.15.0")) {
      console.log("Migrate to 6.15.0");

      promise = LegacyBrowserStorage.getInstance()
        .get<number>(BrowserStorageType.LOCAL, "lastSyncDateTime")
        .then((lastSyncDateTime: number) => {
          if (!lastSyncDateTime) {
            console.log("Skip migrate to 6.15.0");
            return Promise.resolve();
          }
          return LegacyBrowserStorage.getInstance().set<number>(
            BrowserStorageType.LOCAL,
            "syncDateTime",
            lastSyncDateTime
          );
        })
        .then(() => {
          return LegacyBrowserStorage.getInstance().rm<number>(BrowserStorageType.LOCAL, "lastSyncDateTime");
        });
    } else {
      console.log("Skip migrate to 6.15.0");
    }

    return promise;
  }

  protected migrate_to_6_15_1(): Promise<void> {
    let promise: Promise<void> = Promise.resolve();
    if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "6.15.1")) {
      console.log("Migrate to 6.15.1");

      promise = LegacyBrowserStorage.getInstance()
        .get<number>(BrowserStorageType.LOCAL, "lastSyncDateTime")
        .then((lastSyncDateTime: number) => {
          if (!lastSyncDateTime) {
            console.log("Skip migrate to 6.15.1");
            return Promise.resolve();
          }
          return LegacyBrowserStorage.getInstance().set<number>(
            BrowserStorageType.LOCAL,
            "syncDateTime",
            lastSyncDateTime
          );
        })
        .then(() => {
          return LegacyBrowserStorage.getInstance().rm<number>(BrowserStorageType.LOCAL, "lastSyncDateTime");
        });
    } else {
      console.log("Skip migrate to 6.15.1");
    }

    return promise;
  }

  protected migrate_to_6_16_2(): Promise<void> {
    let promise: Promise<void> = Promise.resolve();
    if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "6.16.2")) {
      console.log("Migrate to 6.16.2");

      promise = LegacyBrowserStorage.getInstance()
        .get<UserSettingsModel>(BrowserStorageType.LOCAL, "userSettings")
        .then((userSettingsModel: ExtensionUserSettingsModel) => {
          userSettingsModel.displaySegmentTimeComparisonToKOM = false;
          userSettingsModel.displaySegmentTimeComparisonToPR = false;
          userSettingsModel.displaySegmentTimeComparisonToCurrentYearPR = false;
          userSettingsModel.displaySegmentTimeComparisonPosition = false;
          return LegacyBrowserStorage.getInstance().set<UserSettingsModel>(
            BrowserStorageType.LOCAL,
            "userSettings",
            userSettingsModel
          );
        });
    } else {
      console.log("Skip migrate to 6.16.2");
    }

    return promise;
  }

  protected migrate_to_7_0_0_6(): Promise<void> {
    if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "7.0.0-6")) {
      console.log("Migrate to 7.0.0-6");

      return new Promise<void>((resolve, reject) => {
        chrome.storage.local.get(null, (oldDatabase: any) => {
          const error = chrome.runtime.lastError;

          if (error) {
            reject(error.message);
          } else {
            const newDatabase = new Migration7x0x0x6().perform(oldDatabase);

            chrome.storage.local.set(newDatabase, () => {
              if (error) {
                reject(error.message);
              } else {
                resolve();
              }
            });
          }
        });
      });
    }

    console.log("Skip migrate to 7.0.0-6");
    return Promise.resolve();
  }

  protected handleUpdate(): Promise<void> {
    console.log("Updated from " + this.previousVersion + " to " + this.currentVersion);

    return this.migrate_to_5_1_1()
      .then(() => {
        return this.migrate_to_5_11_0();
      })
      .then(() => {
        return this.migrate_to_6_1_2();
      })
      .then(() => {
        return this.migrate_to_6_4_0();
      })
      .then(() => {
        return this.migrate_to_6_5_0();
      })
      .then(() => {
        return this.migrate_to_6_6_0();
      })
      .then(() => {
        return this.migrate_to_6_7_0();
      })
      .then(() => {
        return this.migrate_to_6_8_1();
      })
      .then(() => {
        return this.migrate_to_6_9_0();
      })
      .then(() => {
        return this.migrate_to_6_10_0();
      })
      .then(() => {
        return this.migrate_to_6_11_0();
      })
      .then(() => {
        return this.migrate_to_6_11_1();
      })
      .then(() => {
        return this.migrate_to_6_14_0();
      })
      .then(() => {
        return this.migrate_to_6_15_0();
      })
      .then(() => {
        return this.migrate_to_6_15_1();
      })
      .then(() => {
        return this.migrate_to_6_16_2();
      })
      .then(() => {
        return this.migrate_to_7_0_0_6();
      })
      .catch(error => console.error(error));
  }
}

const installer = new Installer();
installer.listen();
