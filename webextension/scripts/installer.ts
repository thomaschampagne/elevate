import { Helper } from "./helper";
import semver from "semver";
import _ from "lodash";
import { LegacyBrowserStorage } from "./legacy-browser-storage";
import { BrowserStorageType } from "./models/browser-storage-type.enum";
import { Migration7x0x0x0 } from "./migrations/Migration7x0x0x0";
import { extension } from "@elevate/shared/tools/extension";
import hash from "hash.js";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { Versioning } from "@elevate/shared/tools/versioning";
import { AthleteSettings } from "@elevate/shared/models/athlete/athlete-settings/athlete-settings.model";
import { Identifier } from "@elevate/shared/tools/identifier";
import { Activity, ActivityStats } from "@elevate/shared/models/sync/activity.model";
import { Constant } from "@elevate/shared/constants/constant";
import { UserLactateThreshold } from "@elevate/shared/models/athlete/athlete-settings/user-lactate-threshold.model";
import { ActivityFileType } from "@elevate/shared/sync/connectors/activity-file-type.enum";
import { Gender } from "@elevate/shared/models/athlete/gender.enum";
import { DatedAthleteSettings } from "@elevate/shared/models/athlete/athlete-settings/dated-athlete-settings.model";
import { UserZonesModel } from "@elevate/shared/models/user-settings/user-zones.model";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";
import { AppPackage } from "@elevate/shared/tools/app-package";
import BaseUserSettings = UserSettings.BaseUserSettings;
import ExtensionUserSettings = UserSettings.ExtensionUserSettings;

export class Installer {
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
              LegacyBrowserStorage.getInstance().get(BrowserStorageType.LOCAL)
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
        url: AppPackage.getElevateWebSite()
      },
      (tab: chrome.tabs.Tab) => {
        console.log("First install. Display website new tab:", tab);
        chrome.tabs.create(
          {
            url: chrome.runtime.getURL(Constant.APP_ROOT_URL)
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
                  )
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
            .get<any[]>(BrowserStorageType.LOCAL, "computedActivities")
            .then((computedActivities: any[]) => {
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
        .then((userSettings: any) => {
          if (userSettings.userGender) {
            const userGender = userSettings.userGender === "men" ? Gender.MEN : Gender.WOMEN;

            const athleteModel = new AthleteModel(
              userGender,
              new AthleteSettings(
                _.isNumber(userSettings.userMaxHr) ? userSettings.userMaxHr : null,
                _.isNumber(userSettings.userRestHr) ? userSettings.userRestHr : null,
                !_.isEmpty(userSettings.userLTHR) ? userSettings.userLTHR : UserLactateThreshold.DEFAULT_MODEL,
                _.isNumber(userSettings.userFTP) ? userSettings.userFTP : null,
                _.isNumber(userSettings.userRunningFTP) ? userSettings.userRunningFTP : null,
                _.isNumber(userSettings.userSwimFTP) ? userSettings.userSwimFTP : null,
                _.isNumber(userSettings.userWeight) ? userSettings.userWeight : null
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
            "userWeight"
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
        .then((userSettings: any) => {
          const userZonesModel = userSettings.zones;

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
              ExtensionUserSettings.DEFAULT_MODEL.zones
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
        .get<DatedAthleteSettings[]>(BrowserStorageType.LOCAL, "datedAthleteSettings")
        .then((localDatedAthleteSettings: DatedAthleteSettings[]) => {
          if (_.isEmpty(localDatedAthleteSettings)) {
            return LegacyBrowserStorage.getInstance()
              .get(BrowserStorageType.SYNC)
              .then((userSettings: any) => {
                const athleteSettings =
                  userSettings && userSettings.athleteModel && userSettings.athleteModel.athleteSettings
                    ? userSettings.athleteModel.athleteSettings
                    : AthleteSettings.DEFAULT_MODEL;

                const datedAthleteSettings: DatedAthleteSettings[] = [
                  new DatedAthleteSettings(DatedAthleteSettings.DEFAULT_SINCE, athleteSettings),
                  new DatedAthleteSettings(null, athleteSettings)
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

      let userSettings: ExtensionUserSettings;

      // Move all user settings content inside specific key
      promise = LegacyBrowserStorage.getInstance()
        .get(BrowserStorageType.SYNC)
        .then((settings: ExtensionUserSettings) => {
          const hasUserSettingsKey = !_.isEmpty((settings as any).userSettings);

          if (hasUserSettingsKey) {
            return Promise.resolve();
          } else {
            userSettings = settings;

            delete (userSettings as any).bestSplitsConfiguration; // Remove best split config from user settings

            return LegacyBrowserStorage.getInstance()
              .clear(BrowserStorageType.SYNC)
              .then(() => {
                return LegacyBrowserStorage.getInstance().set(BrowserStorageType.SYNC, "userSettings", userSettings);
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

      let userSettings: ExtensionUserSettings;

      // Move all user settings content inside specific key
      promise = LegacyBrowserStorage.getInstance()
        .get(BrowserStorageType.SYNC, "userSettings")
        .then((settings: ExtensionUserSettings) => {
          const hasOldYearProgressTargets =
            _.isNumber((settings as any).targetsYearRide) || _.isNumber((settings as any).targetsYearRun);

          if (hasOldYearProgressTargets) {
            userSettings = settings;
            delete (userSettings as any).targetsYearRide;
            delete (userSettings as any).targetsYearRun;
            return LegacyBrowserStorage.getInstance().set(BrowserStorageType.SYNC, "userSettings", userSettings);
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
        .then((oldPresetModels: any[]) => {
          const migratedPresets: any[] = [];

          let hasUpgradedPresets = false;
          _.forEach(oldPresetModels, (presetModel: any /*YearToDateProgressPresetModel*/) => {
            if (_.isUndefined(presetModel.mode)) {
              presetModel.mode = 0;
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
        LegacyBrowserStorage.getInstance().get(BrowserStorageType.LOCAL)
      ])
        .then(result => {
          if (!result[0]) {
            throw Error(alreadyMigratedMessage);
          }

          const userSettings: ExtensionUserSettings = result[0] as ExtensionUserSettings;
          const localBrowserStorage: any = (result[1] as any) || ({} as any);

          localBrowserStorage.userSettings = userSettings;

          return LegacyBrowserStorage.getInstance().set(BrowserStorageType.LOCAL, null, localBrowserStorage); // Update local storage
        })
        .then(() => {
          return LegacyBrowserStorage.getInstance().rm(BrowserStorageType.SYNC, "userSettings"); // Remove userSettings from sync
        })
        .then(() => {
          return Promise.all([
            LegacyBrowserStorage.getInstance().get(BrowserStorageType.LOCAL, "userSettings"), // Get userSettings from local now
            LegacyBrowserStorage.getInstance().get(BrowserStorageType.LOCAL, "datedAthleteSettings")
          ]);
        })
        .then(result => {
          const userSettings: ExtensionUserSettings = result[0] as ExtensionUserSettings;
          const datedAthleteSettings: DatedAthleteSettings[] = result[1] as DatedAthleteSettings[];

          // Create new athlete storage local
          const athleteModel: AthleteModel = (userSettings as any).athleteModel;
          const isSingleAthleteSettingsMode = (userSettings as any).hasDatedAthleteSettings === false;

          if (isSingleAthleteSettingsMode) {
            const athleteSettings: AthleteSettings =
              athleteModel && (athleteModel as any).athleteSettings
                ? (athleteModel as any).athleteSettings
                : AthleteSettings.DEFAULT_MODEL;

            athleteModel.datedAthleteSettings = [
              new DatedAthleteSettings(DatedAthleteSettings.DEFAULT_SINCE, athleteSettings),
              new DatedAthleteSettings(null, athleteSettings)
            ];
          } else if (athleteModel) {
            athleteModel.datedAthleteSettings = datedAthleteSettings;
          }

          // Remove deprecated keys
          delete (athleteModel as any).athleteSettings;
          delete (userSettings as any).athleteModel;
          delete (userSettings as any).hasDatedAthleteSettings;

          return Promise.all([
            LegacyBrowserStorage.getInstance().set(BrowserStorageType.LOCAL, "userSettings", userSettings), // Update user settings
            LegacyBrowserStorage.getInstance().set(BrowserStorageType.LOCAL, "athlete", athleteModel), // Save new athlete key on local storage
            LegacyBrowserStorage.getInstance().rm(BrowserStorageType.LOCAL, "datedAthleteSettings") // datedAthleteSettings are now stored in athlete storage
          ]);
        })
        .then(() => {
          return LegacyBrowserStorage.getInstance().get(BrowserStorageType.LOCAL, "syncedActivities");
        })
        .then((syncedActivities: any[]) => {
          // Rename athleteModel to athleteSnapshot for each activity
          _.forEach(syncedActivities, (activity: any) => {
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
                (preset as any).id = Identifier.generate();
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
              (model: DatedAthleteSettings) => {
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
        .get<BaseUserSettings>(BrowserStorageType.LOCAL, "userSettings")
        .then((userSettings: BaseUserSettings) => {
          delete (userSettings as any).displayReliveCCLink;
          return LegacyBrowserStorage.getInstance().set<BaseUserSettings>(
            BrowserStorageType.LOCAL,
            "userSettings",
            userSettings
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
        .get<BaseUserSettings>(BrowserStorageType.LOCAL, "userSettings")
        .then((userSettings: ExtensionUserSettings) => {
          userSettings.displaySegmentTimeComparisonToKOM = false;
          userSettings.displaySegmentTimeComparisonToPR = false;
          userSettings.displaySegmentTimeComparisonToCurrentYearPR = false;
          userSettings.displaySegmentTimeComparisonPosition = false;
          return LegacyBrowserStorage.getInstance().set<BaseUserSettings>(
            BrowserStorageType.LOCAL,
            "userSettings",
            userSettings
          );
        });
    } else {
      console.log("Skip migrate to 6.16.2");
    }

    return promise;
  }

  protected migrate_to_7_0_0_0(): Promise<void> {
    if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "7.0.0-0")) {
      console.log("Migrate to 7.0.0-0");

      // Convert old database structure to new one
      return new Promise<void>((resolve, reject) => {
        chrome.storage.local.get(null, (oldDatabase: any) => {
          const error = chrome.runtime.lastError;

          if (error) {
            reject(error.message);
          } else {
            try {
              const newDatabase = new Migration7x0x0x0().perform(oldDatabase);

              chrome.storage.local.set(newDatabase, () => {
                if (error) {
                  reject(error.message);
                } else {
                  resolve();
                }
              });
            } catch (err) {
              if (err.message === "NOT_AN_OLD_DATABASE") {
                console.log("Skip migrate to 7.0.0-0");
                resolve();
              } else {
                reject(err);
              }
            }
          }
        });
      })
        .then(() => {
          // Add new fields to athlete model
          return new Promise<void>(resolve => {
            chrome.storage.local.get(null, result => {
              if (result && result.athlete && result.athlete.data && result.athlete.data[0]) {
                const athlete = result.athlete.data[0];
                if (athlete) {
                  athlete.firstName = null;
                  athlete.lastName = null;
                  athlete.birthYear = null;
                  athlete.practiceLevel = null;
                  athlete.sports = [];

                  result.athlete.data[0] = athlete;

                  // Update
                  chrome.storage.local.set(result, () => resolve());
                } else {
                  resolve();
                }
              } else {
                resolve();
              }
            });
          });
        })
        .then(() => {
          // Move/replace cadence percentage fields & calories.
          return new Promise<void>(resolve => {
            chrome.storage.local.get(null, result => {
              if (
                result &&
                result.syncedActivities &&
                result.syncedActivities.data &&
                result.syncedActivities.data.length > 0
              ) {
                for (const activity of result.syncedActivities.data) {
                  if (Number.isFinite(activity.extendedStats?.cadenceData?.cadencePercentageMoving)) {
                    activity.extendedStats.cadenceData.cadenceActivePercentage =
                      activity.extendedStats.cadenceData.cadencePercentageMoving;
                    delete activity.extendedStats.cadenceData.cadencePercentageMoving;
                  }

                  if (Number.isFinite(activity.extendedStats?.cadenceData?.cadenceTimeMoving)) {
                    activity.extendedStats.cadenceData.cadenceActiveTime =
                      activity.extendedStats.cadenceData.cadenceTimeMoving;
                    delete activity.extendedStats.cadenceData.cadenceTimeMoving;
                  }

                  if (Number.isFinite(activity.extendedStats?.cadenceData?.averageCadenceMoving)) {
                    activity.extendedStats.cadenceData.averageActiveCadence =
                      activity.extendedStats.cadenceData.averageCadenceMoving;
                    delete activity.extendedStats.cadenceData.averageCadenceMoving;
                  }

                  if (
                    Number.isFinite(activity.calories) &&
                    activity.calories > 0 &&
                    Number.isFinite(activity.elapsed_time_raw) &&
                    activity.elapsed_time_raw > 0 &&
                    activity.extendedStats
                  ) {
                    activity.extendedStats.calories = activity.calories;
                    activity.extendedStats.caloriesPerHour =
                      (activity.extendedStats.calories / activity.elapsed_time_raw) * 3600;
                    delete activity.calories;
                  }
                }

                // Update
                chrome.storage.local.set(result, () => resolve());
              } else {
                resolve();
              }
            });
          });
        })
        .then(() => {
          // Change grade data factors
          return new Promise<void>(resolve => {
            chrome.storage.local.get(null, result => {
              if (
                result &&
                result.syncedActivities &&
                result.syncedActivities.data &&
                result.syncedActivities.data.length > 0
              ) {
                for (const activity of result.syncedActivities.data) {
                  if (activity.extendedStats?.gradeData?.upFlatDownDistanceData) {
                    if (Number.isFinite(activity.extendedStats.gradeData.upFlatDownDistanceData.up)) {
                      activity.extendedStats.gradeData.upFlatDownDistanceData.up =
                        activity.extendedStats.gradeData.upFlatDownDistanceData.up * 1000;
                    }

                    if (Number.isFinite(activity.extendedStats.gradeData.upFlatDownDistanceData.flat)) {
                      activity.extendedStats.gradeData.upFlatDownDistanceData.flat =
                        activity.extendedStats.gradeData.upFlatDownDistanceData.flat * 1000;
                    }

                    if (Number.isFinite(activity.extendedStats.gradeData.upFlatDownDistanceData.down)) {
                      activity.extendedStats.gradeData.upFlatDownDistanceData.down =
                        activity.extendedStats.gradeData.upFlatDownDistanceData.down * 1000;
                    }
                  }
                }
                // Update
                chrome.storage.local.set(result, () => resolve());
              } else {
                resolve();
              }
            });
          });
        })
        .then(() => {
          // Migrate to new activity model format
          return new Promise<void>(resolve => {
            chrome.storage.local.get(null, result => {
              if (result?.syncedActivities) {
                // Copy old collection to new one
                result.activities = result.syncedActivities;
                result.activities.name = "activities";

                if (result.activities?.binaryIndices?.start_time) {
                  result.activities.binaryIndices.startTime = result.activities.binaryIndices.start_time;
                  result.activities.binaryIndices.startTime.name = "startTime";
                  delete result.activities.binaryIndices.start_time;
                }

                // Test if old activities are available
                if (result?.syncedActivities?.data?.length > 0) {
                  if (result.activities.data.length) {
                    // Migrate old activities to the new model
                    result.activities.data = result.activities.data.map(oldActivity => {
                      return this.convertLegacyActivityToNewModel(oldActivity);
                    });
                  }
                }

                // Delete old collection
                delete result.syncedActivities;

                // Clear old DB and save with new DB
                chrome.storage.local.clear(() => {
                  // Then update
                  chrome.storage.local.set(result, () => resolve());
                });
              } else {
                resolve();
              }
            });
          });
        });
    }

    console.log("Skip migrate to 7.0.0-0");
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
        return this.migrate_to_7_0_0_0();
      })
      .catch(error => console.error(error));
  }

  /**
   * Converts legacy activity model to new the one
   */
  private convertLegacyActivityToNewModel(legacyActivity: any): Activity {
    const startTimestamp = Math.floor(new Date(legacyActivity?.start_time || 0).getTime() / 1000);
    const endTimestamp = startTimestamp + (legacyActivity?.elapsed_time_raw || 0);

    const activity: Activity = {
      id: legacyActivity?.id,
      name: legacyActivity?.name || null,
      type: legacyActivity?.type || null,
      startTime: legacyActivity?.start_time,
      endTime: new Date(endTimestamp * 1000).toISOString(),
      startTimestamp: startTimestamp,
      endTimestamp: endTimestamp,
      hasPowerMeter: legacyActivity?.hasPowerMeter,
      trainer: legacyActivity?.trainer || false,
      commute: legacyActivity?.commute || false,
      srcStats: {} as ActivityStats,
      stats: {} as ActivityStats,
      laps: null,
      athleteSnapshot: legacyActivity?.athleteSnapshot || null,
      connector: legacyActivity?.sourceConnectorType || null,
      latLngCenter: legacyActivity?.latLngCenter || null,
      hash: legacyActivity?.hash || null,
      settingsLack: legacyActivity?.settingsLack || null,
      creationTime: new Date().toISOString(),
      lastEditTime: new Date().toISOString(),
      device: null,
      autoDetectedType: false,
      manual: null,
      notes: null,
      flags: [],
      extras: {}
    };

    // Handle root stats
    activity.stats = {
      distance: legacyActivity?.distance_raw,
      elevationGain: legacyActivity?.elevation_gain_raw,
      elapsedTime: legacyActivity?.elapsed_time_raw,
      movingTime: legacyActivity?.moving_time_raw,
      pauseTime:
        legacyActivity?.elapsed_time_raw && legacyActivity?.moving_time_raw
          ? legacyActivity?.elapsed_time_raw - legacyActivity?.moving_time_raw
          : 0,
      moveRatio: _.isNumber(legacyActivity?.extendedStats?.moveRatio)
        ? _.round(legacyActivity?.extendedStats?.moveRatio, 2)
        : 1,
      calories: legacyActivity?.extendedStats?.calories,
      caloriesPerHour: legacyActivity?.extendedStats?.caloriesPerHour
    } as ActivityStats;

    // Handle score
    activity.stats.scores = {
      stress: {
        hrss: legacyActivity?.extendedStats?.heartRateData?.HRSS || null,
        hrssPerHour: legacyActivity?.extendedStats?.heartRateData?.HRSSPerHour || null,
        trimp: legacyActivity?.extendedStats?.heartRateData?.TRIMP || null,
        trimpPerHour: legacyActivity?.extendedStats?.heartRateData?.TRIMPPerHour || null,
        rss: legacyActivity?.extendedStats?.paceData?.runningStressScore || null,
        rssPerHour: legacyActivity?.extendedStats?.paceData?.runningStressScorePerHour || null,
        sss: legacyActivity?.extendedStats?.paceData?.swimStressScore || null,
        sssPerHour: legacyActivity?.extendedStats?.paceData?.swimStressScorePerHour || null,
        pss: legacyActivity?.extendedStats?.powerData?.powerStressScore || null,
        pssPerHour: legacyActivity?.extendedStats?.powerData?.powerStressScorePerHour || null
      },
      runningRating: legacyActivity?.extendedStats?.runningPerformanceIndex || null,
      swolf: {
        25: legacyActivity?.extendedStats?.swimSwolf || null,
        50: null
      }
    };

    // Handle speed
    activity.stats.speed = {
      avg: legacyActivity?.extendedStats?.speedData?.genuineAvgSpeed || null,
      max: legacyActivity?.extendedStats?.speedData?.maxSpeed || null,
      best20min: legacyActivity?.extendedStats?.speedData?.best20min || null,
      lowQ: legacyActivity?.extendedStats?.speedData?.lowerQuartileSpeed || null,
      median: legacyActivity?.extendedStats?.speedData?.medianSpeed || null,
      upperQ: legacyActivity?.extendedStats?.speedData?.upperQuartileSpeed || null,
      stdDev: legacyActivity?.extendedStats?.speedData?.standardDeviationSpeed || null,
      zones: legacyActivity?.extendedStats?.speedData?.speedZones || null,
      peaks: legacyActivity?.extendedStats?.speedData?.peaks || null
    };

    // Handle pace
    activity.stats.pace = {
      avg: legacyActivity?.extendedStats?.paceData?.avgPace || null,
      gapAvg: legacyActivity?.extendedStats?.paceData?.genuineGradeAdjustedAvgPace || null,
      max: legacyActivity?.extendedStats?.paceData?.maxPace || null,
      best20min: legacyActivity?.extendedStats?.paceData?.best20min || null,
      lowQ: legacyActivity?.extendedStats?.paceData?.lowerQuartilePace || null,
      median: legacyActivity?.extendedStats?.paceData?.medianPace || null,
      upperQ: legacyActivity?.extendedStats?.paceData?.upperQuartilePace || null,
      stdDev: legacyActivity?.extendedStats?.paceData?.standardDeviationPace || null,
      zones: legacyActivity?.extendedStats?.paceData?.paceZones || null
    };

    // Handle power
    activity.stats.power = {
      avg: legacyActivity?.extendedStats?.powerData?.avgWatts || null,
      avgKg: legacyActivity?.extendedStats?.powerData?.avgWattsPerKg || null,
      weighted: legacyActivity?.extendedStats?.powerData?.weightedPower || null,
      weightedKg: legacyActivity?.extendedStats?.powerData?.weightedWattsPerKg || null,
      max: legacyActivity?.extendedStats?.powerData?.maxPower || null,
      work: null,
      best20min: legacyActivity?.extendedStats?.powerData?.best20min || null,
      variabilityIndex: legacyActivity?.extendedStats?.powerData?.variabilityIndex || null,
      intensityFactor: legacyActivity?.extendedStats?.powerData?.punchFactor || null,
      lowQ: legacyActivity?.extendedStats?.powerData?.lowerQuartileWatts || null,
      median: legacyActivity?.extendedStats?.powerData?.medianWatts || null,
      upperQ: legacyActivity?.extendedStats?.powerData?.upperQuartileWatts || null,
      stdDev: null,
      zones: legacyActivity?.extendedStats?.powerData?.powerZones || null,
      peaks: legacyActivity?.extendedStats?.powerData?.peaks || null
    };

    // Handle heartRate
    activity.stats.heartRate = {
      avg: legacyActivity?.extendedStats?.heartRateData?.averageHeartRate || null,
      max: legacyActivity?.extendedStats?.heartRateData?.maxHeartRate || null,
      avgReserve: legacyActivity?.extendedStats?.heartRateData?.activityHeartRateReserve || null,
      maxReserve: legacyActivity?.extendedStats?.heartRateData?.activityHeartRateReserveMax || null,
      best20min: legacyActivity?.extendedStats?.heartRateData?.best20min || null,
      best60min: legacyActivity?.extendedStats?.heartRateData?.best60min || null,
      lowQ: legacyActivity?.extendedStats?.heartRateData?.lowerQuartileHeartRate || null,
      median: legacyActivity?.extendedStats?.heartRateData?.medianHeartRate || null,
      upperQ: legacyActivity?.extendedStats?.heartRateData?.upperQuartileHeartRate || null,
      stdDev: null,
      zones: legacyActivity?.extendedStats?.heartRateData?.heartRateZones || null,
      peaks: legacyActivity?.extendedStats?.heartRateData?.peaks || null
    };

    // Handle cadence
    activity.stats.cadence = {
      avg: legacyActivity?.extendedStats?.cadenceData?.averageCadence || null,
      max: legacyActivity?.extendedStats?.cadenceData?.maxCadence || null,
      avgActive: legacyActivity?.extendedStats?.cadenceData?.averageActiveCadence || null,
      activeRatio: _.round(legacyActivity?.extendedStats?.cadenceData?.cadenceActivePercentage, 2) / 100 || null,
      activeTime: legacyActivity?.extendedStats?.cadenceData?.cadenceActiveTime || null,
      cycles: legacyActivity?.extendedStats?.cadenceData?.totalOccurrences || null,
      distPerCycle: legacyActivity?.extendedStats?.cadenceData?.averageDistancePerOccurrence || null,
      lowQ: legacyActivity?.extendedStats?.cadenceData?.lowerQuartileCadence || null,
      median: legacyActivity?.extendedStats?.cadenceData?.medianCadence || null,
      upperQ: legacyActivity?.extendedStats?.cadenceData?.upperQuartileCadence || null,
      slope: {
        up: legacyActivity?.extendedStats?.cadenceData?.upFlatDownCadencePaceData?.up || null,
        flat: legacyActivity?.extendedStats?.cadenceData?.upFlatDownCadencePaceData?.flat || null,
        down: legacyActivity?.extendedStats?.cadenceData?.upFlatDownCadencePaceData?.down || null,
        total: legacyActivity?.extendedStats?.cadenceData?.upFlatDownCadencePaceData?.total || null
      },
      stdDev: legacyActivity?.extendedStats?.cadenceData?.standardDeviationCadence || null,
      zones: legacyActivity?.extendedStats?.cadenceData?.cadenceZones || null,
      peaks: legacyActivity?.extendedStats?.cadenceData?.peaks || null
    };

    // Handle grade
    activity.stats.grade = {
      avg: legacyActivity?.extendedStats?.gradeData?.avgGrade || null,
      max: legacyActivity?.extendedStats?.gradeData?.avgMaxGrade || null,
      min: legacyActivity?.extendedStats?.gradeData?.avgMinGrade || null,
      lowQ: legacyActivity?.extendedStats?.gradeData?.lowerQuartileGrade || null,
      median: legacyActivity?.extendedStats?.gradeData?.medianGrade || null,
      upperQ: legacyActivity?.extendedStats?.gradeData?.upperQuartileGrade || null,
      stdDev: null,
      slopeTime: {
        up: legacyActivity?.extendedStats?.gradeData?.upFlatDownInSeconds?.up || null,
        flat: legacyActivity?.extendedStats?.gradeData?.upFlatDownInSeconds?.flat || null,
        down: legacyActivity?.extendedStats?.gradeData?.upFlatDownInSeconds?.down || null,
        total: legacyActivity?.extendedStats?.gradeData?.upFlatDownInSeconds?.total || null
      },
      slopeSpeed: {
        up: legacyActivity?.extendedStats?.gradeData?.upFlatDownMoveData?.up || null,
        flat: legacyActivity?.extendedStats?.gradeData?.upFlatDownMoveData?.flat || null,
        down: legacyActivity?.extendedStats?.gradeData?.upFlatDownMoveData?.down || null,
        total: legacyActivity?.extendedStats?.gradeData?.upFlatDownMoveData?.total || null
      },
      slopePace: {
        up:
          legacyActivity?.extendedStats?.gradeData?.upFlatDownMoveData?.up > 0
            ? Math.round(3600 / legacyActivity?.extendedStats?.gradeData?.upFlatDownMoveData?.up)
            : null,
        flat:
          legacyActivity?.extendedStats?.gradeData?.upFlatDownMoveData?.flat > 0
            ? Math.round(3600 / legacyActivity?.extendedStats?.gradeData?.upFlatDownMoveData?.flat)
            : null,
        down:
          legacyActivity?.extendedStats?.gradeData?.upFlatDownMoveData?.down > 0
            ? Math.round(3600 / legacyActivity?.extendedStats?.gradeData?.upFlatDownMoveData?.down)
            : null,
        total:
          legacyActivity?.extendedStats?.gradeData?.upFlatDownMoveData?.total > 0
            ? Math.round(3600 / legacyActivity?.extendedStats?.gradeData?.upFlatDownMoveData?.total)
            : null
      },
      slopeDistance: {
        up: legacyActivity?.extendedStats?.gradeData?.upFlatDownDistanceData?.up || null,
        flat: legacyActivity?.extendedStats?.gradeData?.upFlatDownDistanceData?.flat || null,
        down: legacyActivity?.extendedStats?.gradeData?.upFlatDownDistanceData?.down || null,
        total: legacyActivity?.extendedStats?.gradeData?.upFlatDownDistanceData?.total || null
      },
      slopeCadence: {
        up: legacyActivity?.extendedStats?.gradeData?.upFlatDownCadencePaceData?.up || null,
        flat: legacyActivity?.extendedStats?.gradeData?.upFlatDownCadencePaceData?.flat || null,
        down: legacyActivity?.extendedStats?.gradeData?.upFlatDownCadencePaceData?.down || null,
        total: legacyActivity?.extendedStats?.gradeData?.upFlatDownCadencePaceData?.total || null
      },

      slopeProfile: (legacyActivity?.extendedStats?.gradeData?.gradeProfile as any) || null,
      zones: legacyActivity?.extendedStats?.gradeData?.gradeZones || null
    };

    // Handle elevation
    activity.stats.elevation = {
      avg: legacyActivity?.extendedStats?.elevationData?.avgElevation || null,
      max: legacyActivity?.extendedStats?.elevationData?.maxElevation || null,
      min: legacyActivity?.extendedStats?.elevationData?.minElevation || null,
      ascent: legacyActivity?.extendedStats?.elevationData?.accumulatedElevationAscent || null,
      descent: legacyActivity?.extendedStats?.elevationData?.accumulatedElevationDescent || null,
      ascentSpeed: legacyActivity?.extendedStats?.elevationData?.ascentSpeed?.avg || null,
      lowQ: legacyActivity?.extendedStats?.elevationData?.lowerQuartileElevation || null,
      median: legacyActivity?.extendedStats?.elevationData?.medianElevation || null,
      upperQ: legacyActivity?.extendedStats?.elevationData?.upperQuartileElevation || null,
      stdDev: null,
      elevationZones: legacyActivity?.extendedStats?.elevationData?.elevationZones || null
    };

    // Handle extras if exists
    if (legacyActivity?.extras?.strava_activity_id) {
      activity.extras = {
        strava: {
          activityId: legacyActivity?.extras?.strava_activity_id
        }
      };
    }

    if (legacyActivity?.extras?.fs_activity_location?.path) {
      activity.extras = {
        file: {
          path: legacyActivity?.extras?.fs_activity_location?.path,
          type: extension(legacyActivity?.extras?.fs_activity_location?.path) as ActivityFileType
        }
      };
    }

    // Handle LOKIJS fields if exists
    if ((legacyActivity as any).$loki) {
      (activity as any).$loki = (legacyActivity as any).$loki;
    }

    if ((legacyActivity as any).meta) {
      (activity as any).meta = (legacyActivity as any).meta;
    }

    // Update hash
    const activityHashPayload = {
      id: activity.id,
      type: activity.type,
      startTime: activity.startTime,
      endTime: activity.endTime,
      hasPowerMeter: activity.hasPowerMeter,
      trainer: activity.trainer,
      distance: _.floor(activity.stats?.distance) || null
    };
    activity.hash = hash.sha256().update(JSON.stringify(activityHashPayload)).digest("hex").slice(0, 24);

    return activity;
  }
}
