import { userSettingsData } from "./shared/user-settings.data";
import { Helper } from "./helper";
import * as semver from "semver";
import { AthleteModel } from "../../app/src/app/shared/models/athlete/athlete.model";
import { Gender } from "../../app/src/app/shared/models/athlete/gender.enum";
import { AthleteSettingsModel } from "../../app/src/app/shared/models/athlete/athlete-settings/athlete-settings.model";
import { UserLactateThresholdModel } from "../../app/src/app/shared/models/athlete/athlete-settings/user-lactate-threshold.model";
import * as _ from "lodash";
import { AppStorage } from "./app-storage";
import { SyncedActivityModel } from "./shared/models/sync/synced-activity.model";
import { AppStorageType } from "./models/storage-type.enum";
import { UserZonesModel } from "./shared/models/user-settings/user-zones.model";
import { Constant } from "./shared/constant";

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
						AppStorage.getInstance().get(AppStorageType.SYNC),
						AppStorage.getInstance().get(AppStorageType.LOCAL)
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

			promise = AppStorage.getInstance().rm(AppStorageType.LOCAL, "computedActivities")
				.then(() => {
					return AppStorage.getInstance().rm(AppStorageType.LOCAL, "lastSyncDateTime")
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

			promise = AppStorage.getInstance().rm(AppStorageType.SYNC, ["enableAlphaFitnessTrend"]).then(() => {

				return AppStorage.getInstance().get(AppStorageType.SYNC);

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
						return AppStorage.getInstance().set(AppStorageType.SYNC, null, currentUserSavedSettings).then(() => {
							return AppStorage.getInstance().rm(AppStorageType.SYNC, ["userHrrZones"]);
						});

					} else {  // Key exists
						return AppStorage.getInstance().rm(AppStorageType.SYNC, ["userHrrZones"]);
					}
				} else {
					return Promise.resolve();
				}

			});

		} else {
			console.log("Skip migrate to 5.11.0");
		}

		return promise;
	};

	/**
	 * Summary: Removing syncWithAthleteProfile local storage object & rename computedActivities to syncedActivities. remove autoSyncMinutes
	 * @returns {Promise<void>}
	 */
	protected migrate_to_6_1_2(): Promise<void> {

		let promise = Promise.resolve();

		// v <= v6.1.2 ?: Removing syncWithAthleteProfile local storage object & rename computedActivities to syncedActivities
		if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "6.1.2")) {

			console.log("Migrate to 6.1.2");

			promise = AppStorage.getInstance().rm(AppStorageType.LOCAL, ["syncWithAthleteProfile"]).then(() => {

				return AppStorage.getInstance().get<SyncedActivityModel[]>(AppStorageType.LOCAL, "computedActivities").then((computedActivities: SyncedActivityModel[]) => {

					if (computedActivities) {
						return AppStorage.getInstance().set(AppStorageType.LOCAL, "syncedActivities", computedActivities).then(() => {
							return AppStorage.getInstance().rm(AppStorageType.LOCAL, ["computedActivities"]);
						});
					} else {
						return Promise.resolve();
					}
				}).then(() => {
					return AppStorage.getInstance().rm(AppStorageType.SYNC, ["autoSyncMinutes"]);
				});

			});

		} else {
			console.log("Skip migrate to 6.1.2");
		}

		return promise;
	};

	/**
	 * Summary: Removing synced displayMotivationScore
	 * @returns {Promise<void>}
	 */
	protected migrate_to_6_4_0(): Promise<void> {

		let promise = Promise.resolve();

		if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "6.4.0")) {
			console.log("Migrate to 6.4.0");
			promise = AppStorage.getInstance().rm(AppStorageType.SYNC, ["displayMotivationScore"]);
		} else {
			console.log("Skip migrate to 6.4.0");
		}

		return promise;
	};

	/**
	 * Summary: Migrate old user synced athletes setting to athleteModel. Remove old user synced athletes setting.
	 * Create datedAthleteSettings into local storage
	 * @returns {Promise<void>}
	 */
	protected migrate_to_6_5_0(): Promise<void> {

		let promise = Promise.resolve();

		if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "6.5.0")) {

			console.log("Migrate to 6.5.0");

			promise = AppStorage.getInstance().get(AppStorageType.SYNC).then((userSettingsModel: any) => {

				if (userSettingsModel.userGender) {
					const userGender = (userSettingsModel.userGender === "men") ? Gender.MEN : Gender.WOMEN;

					const athleteModel = new AthleteModel(userGender, new AthleteSettingsModel(
						(_.isNumber(userSettingsModel.userMaxHr)) ? userSettingsModel.userMaxHr : null,
						(_.isNumber(userSettingsModel.userRestHr)) ? userSettingsModel.userRestHr : null,
						(!_.isEmpty(userSettingsModel.userLTHR)) ? userSettingsModel.userLTHR : UserLactateThresholdModel.DEFAULT_MODEL,
						(_.isNumber(userSettingsModel.userFTP)) ? userSettingsModel.userFTP : null,
						(_.isNumber(userSettingsModel.userRunningFTP)) ? userSettingsModel.userRunningFTP : null,
						(_.isNumber(userSettingsModel.userSwimFTP)) ? userSettingsModel.userSwimFTP : null,
						(_.isNumber(userSettingsModel.userWeight)) ? userSettingsModel.userWeight : null
					));

					// Create new athlete model structure and apply change in sync settings
					return AppStorage.getInstance().set(AppStorageType.SYNC, "athleteModel", athleteModel);
				} else {
					return Promise.resolve();
				}

			}).then(() => {
				// Remove deprecated old user settings
				return AppStorage.getInstance().rm(AppStorageType.SYNC, ["userGender", "userMaxHr", "userRestHr", "userLTHR", "userFTP", "userRunningFTP", "userSwimFTP", "userWeight"]);

			}).then(() => {
				return AppStorage.getInstance().rm(AppStorageType.LOCAL, "profileConfigured");
			});

		} else {
			console.log("Skip migrate to 6.5.0");
		}

		return promise;
	};

	protected migrate_to_6_6_0(): Promise<void> {

		let promise = Promise.resolve();

		if (this.isPreviousVersionLowerThanOrEqualsTo(this.previousVersion, "6.6.0")) {

			console.log("Migrate to 6.6.0");

			// Migrate storage of zones from ZoneModel[] to number[] => less space on storage
			promise = AppStorage.getInstance().get(AppStorageType.SYNC).then((userSettingsModel: any) => {

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

					promiseMigrate = AppStorage.getInstance().set(AppStorageType.SYNC, "zones", userZonesModel);

				} catch (err) {
					console.warn(err);
					promiseMigrate = AppStorage.getInstance().set(AppStorageType.SYNC, "zones", userSettingsData.zones); // Reset to default
				}

				return promiseMigrate;
			});

		} else {
			console.log("Skip migrate to 6.6.0");
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
		}).catch(error => console.error(error));

	}

}

const installer = new Installer();
installer.listen();










