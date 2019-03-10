import {
	AthleteModel,
	AthleteSettingsModel,
	DatedAthleteSettingsModel,
	Gender,
	SyncedActivityModel,
	UserLactateThresholdModel,
	UserSettingsModel,
	UserZonesModel
} from "@elevate/shared/models";
import { Helper } from "./helper";
import * as semver from "semver";
import * as _ from "lodash";
import { BrowserStorage } from "./browser-storage";
import { Constant } from "@elevate/shared/constants";
import { userSettingsData } from "@elevate/shared/data";
import { YearToDateProgressPresetModel } from "../../app/src/app/year-progress/shared/models/year-to-date-progress-preset.model";
import { ProgressMode } from "../../app/src/app/year-progress/shared/enums/progress-mode.enum";
import { BrowserStorageType } from "./models/browser-storage-type.enum";

class Installer {

	public previousVersion: string;
	public currentVersion: string;

	public listen() {

		chrome.runtime.onInstalled.addListener((details) => {
			if (details.reason === "install") {
				this.handleInstall(); // Pop in tab application and plugin page
			} else if (details.reason === "update") {

				this.currentVersion = chrome.runtime.getManifest().version;
				this.previousVersion = details.previousVersion;

				this.handleUpdate().then(() => {

					// Check and display sync & local storage after update
					return Promise.all([
						BrowserStorage.getInstance().get(BrowserStorageType.SYNC),
						BrowserStorage.getInstance().get(BrowserStorageType.LOCAL)
					]);

				}).then((result: any[]) => {

					console.log("Migration finished!");
					console.log("Synced data: ", result[0]);
					console.log("Local data: ", result[1]);

				}).catch((error) => {
					console.error(error);
				});
			}
		});
	}

	protected isPreviousVersionLowerThanOrEqualsTo(oldVersion: string, upgradingVersion: string): boolean {
		return semver.gte(upgradingVersion, oldVersion);
	}

	protected handleInstall() {

		chrome.tabs.create({
			url: Constant.LANDING_PAGE_URL,
		}, (tab: chrome.tabs.Tab) => {
			console.log("First install. Display website new tab:", tab);
			chrome.tabs.create({
				url: chrome.extension.getURL(Constant.APP_ROOT_URL),
			}, (tab: chrome.tabs.Tab) => {
				console.log("First install. Display settings:", tab);
			});
		});
	}

	/**
	 * Summary: Clear local history if coming from version under 5.1.1
	 * @returns {Promise<void>}
	 */
	protected migrate_to_5_1_1(): Promise<void> {

		let promise = Promise.resolve();

		//  v <= v5.1.1 ?: Clear local history if coming from version under 5.1.1
		if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "5.1.1")) {

			console.log("Migrate to 5.1.1");

			promise = BrowserStorage.getInstance().rm(BrowserStorageType.LOCAL, "computedActivities")
				.then(() => {
					return BrowserStorage.getInstance().rm(BrowserStorageType.LOCAL, "lastSyncDateTime");
				}).then(() => {
					console.log("Local History cleared");
					return Promise.resolve();
				}).catch((error: Error) => {
					return Promise.reject(error);
				});
		} else {
			console.log("Skip migrate to 5.1.1");
		}

		return promise;
	}

	/**
	 * Summary: Move & convert userHrrZones to generic heartrate zones. Remove enableAlphaFitnessTrend
	 * @returns {Promise<void>}
	 */
	protected migrate_to_5_11_0(): Promise<void> {

		let promise = Promise.resolve();

		if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "5.11.0")) {

			console.log("Migrate to 5.11.0");

			promise = BrowserStorage.getInstance().rm(BrowserStorageType.SYNC, ["enableAlphaFitnessTrend"]).then(() => {

				return BrowserStorage.getInstance().get(BrowserStorageType.SYNC);

			}).then((currentUserSavedSettings: any) => {

				const oldUserHrrZones = currentUserSavedSettings.userHrrZones; // Get user current zones

				if (oldUserHrrZones) {

					if (oldUserHrrZones.length > 0) { // If user has zones
						const newHeartRateZones: any = [];
						for (let i = 0; i < oldUserHrrZones.length; i++) {
							const hrrZone: any = oldUserHrrZones[i];
							newHeartRateZones.push({
								from: Helper.heartrateFromHeartRateReserve(hrrZone.fromHrr, currentUserSavedSettings.userMaxHr, currentUserSavedSettings.userRestHr),
								to: Helper.heartrateFromHeartRateReserve(hrrZone.toHrr, currentUserSavedSettings.userMaxHr, currentUserSavedSettings.userRestHr),
							});
						}

						if (!currentUserSavedSettings.zones) {
							currentUserSavedSettings.zones = {};
						}

						currentUserSavedSettings.zones.heartRate = newHeartRateZones;
						return BrowserStorage.getInstance().set(BrowserStorageType.SYNC, null, currentUserSavedSettings).then(() => {
							return BrowserStorage.getInstance().rm(BrowserStorageType.SYNC, ["userHrrZones"]);
						});

					} else {  // Key exists
						return BrowserStorage.getInstance().rm(BrowserStorageType.SYNC, ["userHrrZones"]);
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
	 * @returns {Promise<void>}
	 */
	protected migrate_to_6_1_2(): Promise<void> {

		let promise = Promise.resolve();

		// v <= v6.1.2 ?: Removing syncWithAthleteProfile local storage object & rename computedActivities to syncedActivities
		if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "6.1.2")) {

			console.log("Migrate to 6.1.2");

			promise = BrowserStorage.getInstance().rm(BrowserStorageType.LOCAL, ["syncWithAthleteProfile"]).then(() => {

				return BrowserStorage.getInstance().get<SyncedActivityModel[]>(BrowserStorageType.LOCAL, "computedActivities").then((computedActivities: SyncedActivityModel[]) => {

					if (computedActivities) {
						return BrowserStorage.getInstance().set(BrowserStorageType.LOCAL, "syncedActivities", computedActivities).then(() => {
							return BrowserStorage.getInstance().rm(BrowserStorageType.LOCAL, ["computedActivities"]);
						});
					} else {
						return Promise.resolve();
					}
				}).then(() => {
					return BrowserStorage.getInstance().rm(BrowserStorageType.SYNC, ["autoSyncMinutes"]);
				});

			});

		} else {
			console.log("Skip migrate to 6.1.2");
		}

		return promise;
	}

	/**
	 * Summary: Removing synced displayMotivationScore
	 * @returns {Promise<void>}
	 */
	protected migrate_to_6_4_0(): Promise<void> {

		let promise = Promise.resolve();

		if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "6.4.0")) {
			console.log("Migrate to 6.4.0");
			promise = BrowserStorage.getInstance().rm(BrowserStorageType.SYNC, ["displayMotivationScore"]);
		} else {
			console.log("Skip migrate to 6.4.0");
		}

		return promise;
	}

	/**
	 * Summary: Migrate old user synced athletes setting to athleteSnapshot. Remove old user synced athletes setting.
	 * Create datedAthleteSettings into local storage
	 * @returns {Promise<void>}
	 */
	protected migrate_to_6_5_0(): Promise<void> {

		let promise = Promise.resolve();

		if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "6.5.0")) {

			console.log("Migrate to 6.5.0");

			promise = BrowserStorage.getInstance().get(BrowserStorageType.SYNC).then((userSettingsModel: any) => {

				if (userSettingsModel.userGender) {
					const userGender = (userSettingsModel.userGender === "men") ? Gender.MEN : Gender.WOMEN;

					const athleteModel = new AthleteModel(userGender, <any>new AthleteSettingsModel(
						(_.isNumber(userSettingsModel.userMaxHr)) ? userSettingsModel.userMaxHr : null,
						(_.isNumber(userSettingsModel.userRestHr)) ? userSettingsModel.userRestHr : null,
						(!_.isEmpty(userSettingsModel.userLTHR)) ? userSettingsModel.userLTHR : UserLactateThresholdModel.DEFAULT_MODEL,
						(_.isNumber(userSettingsModel.userFTP)) ? userSettingsModel.userFTP : null,
						(_.isNumber(userSettingsModel.userRunningFTP)) ? userSettingsModel.userRunningFTP : null,
						(_.isNumber(userSettingsModel.userSwimFTP)) ? userSettingsModel.userSwimFTP : null,
						(_.isNumber(userSettingsModel.userWeight)) ? userSettingsModel.userWeight : null
					));

					// Create new athlete model structure and apply change in sync settings
					return BrowserStorage.getInstance().set(BrowserStorageType.SYNC, "athleteModel", athleteModel);
				} else {
					return Promise.resolve();
				}

			}).then(() => {
				// Remove deprecated old user settings
				return BrowserStorage.getInstance().rm(BrowserStorageType.SYNC, ["userGender", "userMaxHr", "userRestHr", "userLTHR", "userFTP", "userRunningFTP", "userSwimFTP", "userWeight"]);

			}).then(() => {
				return BrowserStorage.getInstance().rm(BrowserStorageType.LOCAL, "profileConfigured");
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
			promise = BrowserStorage.getInstance().get(BrowserStorageType.SYNC).then((userSettingsModel: any) => {

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

					promiseMigrate = BrowserStorage.getInstance().set(BrowserStorageType.SYNC, "zones", userZonesModel);

				} catch (err) {
					console.warn(err);
					promiseMigrate = BrowserStorage.getInstance().set(BrowserStorageType.SYNC, "zones", userSettingsData.zones); // Reset to default
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

			promise = BrowserStorage.getInstance().get<DatedAthleteSettingsModel[]>(BrowserStorageType.LOCAL, "datedAthleteSettings")
				.then((localDatedAthleteSettingsModels: DatedAthleteSettingsModel[]) => {

					if (_.isEmpty(localDatedAthleteSettingsModels)) {

						return BrowserStorage.getInstance().get(BrowserStorageType.SYNC).then((userSettingsModel: any) => {

							const athleteSettings = (userSettingsModel && userSettingsModel.athleteModel && userSettingsModel.athleteModel.athleteSettings)
								? userSettingsModel.athleteModel.athleteSettings : AthleteSettingsModel.DEFAULT_MODEL;

							const datedAthleteSettings: DatedAthleteSettingsModel[] = [
								new DatedAthleteSettingsModel(DatedAthleteSettingsModel.DEFAULT_SINCE, athleteSettings),
								new DatedAthleteSettingsModel(null, athleteSettings)
							];

							return BrowserStorage.getInstance().set(BrowserStorageType.LOCAL, "datedAthleteSettings", datedAthleteSettings).then(() => {
								return BrowserStorage.getInstance().set(BrowserStorageType.SYNC, "hasDatedAthleteSettings", true);
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

			let userSettingsModel: UserSettingsModel;

			// Move all user settings content inside specific key
			promise = BrowserStorage.getInstance().get(BrowserStorageType.SYNC).then((settings: UserSettingsModel) => {

				const hasUserSettingsKey = !_.isEmpty((<any>settings).userSettings);

				if (hasUserSettingsKey) {
					return Promise.resolve();
				} else {

					userSettingsModel = settings;

					delete (userSettingsModel as any).bestSplitsConfiguration; // Remove best split config from user settings

					return BrowserStorage.getInstance().clear(BrowserStorageType.SYNC).then(() => {
						return BrowserStorage.getInstance().set(BrowserStorageType.SYNC, "userSettings", userSettingsModel);
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

			let userSettingsModel: UserSettingsModel;

			// Move all user settings content inside specific key
			promise = BrowserStorage.getInstance().get(BrowserStorageType.SYNC, "userSettings").then((settings: UserSettingsModel) => {

				const hasOldYearProgressTargets = _.isNumber((<any>settings).targetsYearRide) || _.isNumber((<any>settings).targetsYearRun);

				if (hasOldYearProgressTargets) {
					userSettingsModel = settings;
					delete (userSettingsModel as any).targetsYearRide;
					delete (userSettingsModel as any).targetsYearRun;
					return BrowserStorage.getInstance().set(BrowserStorageType.SYNC, "userSettings", userSettingsModel);
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
			promise = BrowserStorage.getInstance().get(BrowserStorageType.LOCAL, "yearProgressPresets").then((oldPresetModels: YearToDateProgressPresetModel[]) => {

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
					return BrowserStorage.getInstance().set(BrowserStorageType.LOCAL, "yearProgressPresets", migratedPresets);
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

		let promise: Promise<void>;

		if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "6.11.0")) {

			console.log("Migrate to 6.11.0");

			const alreadyMigratedMessage = "Abort 6.11.0 migration. Already migrated";

			// Move all user settings from sync to local
			promise = Promise.all([
				BrowserStorage.getInstance().get(BrowserStorageType.SYNC, "userSettings"),
				BrowserStorage.getInstance().get(BrowserStorageType.LOCAL)

			]).then(result => {

				if (!result[0]) {
					throw Error(alreadyMigratedMessage);
				}

				const userSettingsModel: UserSettingsModel = <UserSettingsModel>result[0];
				const localBrowserStorage: any = <any>result[1] || <any>{};

				localBrowserStorage["userSettings"] = userSettingsModel;

				return BrowserStorage.getInstance().set(BrowserStorageType.LOCAL, null, localBrowserStorage); // Update local storage

			}).then(() => {
				return BrowserStorage.getInstance().rm(BrowserStorageType.SYNC, "userSettings"); // Remove userSettings from sync
			}).then(() => {

				return Promise.all([
					BrowserStorage.getInstance().get(BrowserStorageType.LOCAL, "userSettings"), // Get userSettings from local now
					BrowserStorage.getInstance().get(BrowserStorageType.LOCAL, "datedAthleteSettings")
				]);

			}).then(result => {

				const userSettingsModel: UserSettingsModel = <UserSettingsModel>result[0];
				const datedAthleteSettings: DatedAthleteSettingsModel[] = <DatedAthleteSettingsModel[]>result[1];

				// Create new athlete storage local
				const athleteModel: AthleteModel = (<any>userSettingsModel).athleteModel;
				const isSingleAthleteSettingsMode = (<any>userSettingsModel).hasDatedAthleteSettings === false;

				if (isSingleAthleteSettingsMode) {

					const athleteSettings: AthleteSettingsModel = (athleteModel && (<any>athleteModel).athleteSettings) ? (<any>athleteModel).athleteSettings : AthleteSettingsModel.DEFAULT_MODEL;

					athleteModel.datedAthleteSettings = [
						new DatedAthleteSettingsModel(DatedAthleteSettingsModel.DEFAULT_SINCE, athleteSettings),
						new DatedAthleteSettingsModel(null, athleteSettings)
					];

				} else if (athleteModel) {
					athleteModel.datedAthleteSettings = datedAthleteSettings;
				}

				// Remove deprecated keys
				delete (<any>athleteModel).athleteSettings;
				delete (<any>userSettingsModel).athleteModel;
				delete (<any>userSettingsModel).hasDatedAthleteSettings;

				return Promise.all([
					BrowserStorage.getInstance().set(BrowserStorageType.LOCAL, "userSettings", userSettingsModel), // Update user settings
					BrowserStorage.getInstance().set(BrowserStorageType.LOCAL, "athlete", athleteModel), // Save new athlete key on local storage
					BrowserStorage.getInstance().rm(BrowserStorageType.LOCAL, "datedAthleteSettings"), // datedAthleteSettings are now stored in athlete storage
				]);

			}).then(() => {
				return BrowserStorage.getInstance().get(BrowserStorageType.LOCAL, "syncedActivities");
			}).then((syncedActivities: SyncedActivityModel[]) => {

				// Rename athleteModel to athleteSnapshot for each activity
				_.forEach(syncedActivities, (activity: SyncedActivityModel) => {
					activity.athleteSnapshot = (<any>activity).athleteModel;
					delete (<any>activity).athleteModel;
				});

				return BrowserStorage.getInstance().set(BrowserStorageType.LOCAL, "syncedActivities", syncedActivities);
			}).catch(error => {

				if (error.message === alreadyMigratedMessage) {
					console.log(alreadyMigratedMessage);
				} else {
					console.error(error);
				}

				promise = Promise.resolve();

			});

		} else {

			console.log("Skip migrate to 6.11.0");

			promise = Promise.resolve();
		}

		return promise;
	}

	protected handleUpdate(): Promise<void> {

		console.log("Updated from " + this.previousVersion + " to " + this.currentVersion);
		console.debug("UserSettings on update", userSettingsData);

		return this.migrate_to_5_1_1().then(() => {
			return this.migrate_to_5_11_0();
		}).then(() => {
			return this.migrate_to_6_1_2();
		}).then(() => {
			return this.migrate_to_6_4_0();
		}).then(() => {
			return this.migrate_to_6_5_0();
		}).then(() => {
			return this.migrate_to_6_6_0();
		}).then(() => {
			return this.migrate_to_6_7_0();
		}).then(() => {
			return this.migrate_to_6_8_1();
		}).then(() => {
			return this.migrate_to_6_9_0();
		}).then(() => {
			return this.migrate_to_6_10_0();
		}).then(() => {
			return this.migrate_to_6_11_0();
		}).catch(error => console.error(error));

	}

}

const installer = new Installer();
installer.listen();










