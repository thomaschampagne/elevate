import { userSettings } from "../../shared/UserSettings";
import { Helper } from "./Helper";
import * as semver from "semver";
import { AthleteModel } from "../../shared/models/athlete.model";
import { Gender } from "../../app/src/app/shared/enums/gender.enum";
import { AthleteSettingsModel } from "../../shared/models/athlete-settings/athlete-settings.model";
import { UserLactateThresholdModel } from "../../shared/models/user-settings/user-lactate-threshold.model";
import * as _ from "lodash";


enum BrowserStorage { // TODO Refactor use with StorageManager (duplicate code)
	SYNC = "sync",
	LOCAL = "local"
}

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
					return Promise.all([this.get(BrowserStorage.SYNC, null), this.get(BrowserStorage.LOCAL, null)]);

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

	protected isPreviousVersionLowerThanOrEqualsTo(oldVersion: string, upgradingVersion: string) {
		return semver.gte(upgradingVersion, oldVersion);
	}

	protected handleInstall() {

		chrome.tabs.create({
			url: "http://thomaschampagne.github.io/stravistix/", // TODO Get from config/constants
		}, (tab: chrome.tabs.Tab) => {
			console.log("First install. Display website new tab:", tab);
			chrome.tabs.create({
				url: chrome.extension.getURL("/app/index.html"), // TODO Get from config/constants
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

			promise = this.remove(BrowserStorage.LOCAL, "computedActivities")
				.then(() => {
					return this.remove(BrowserStorage.LOCAL, "lastSyncDateTime")
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

			promise = this.remove(BrowserStorage.SYNC, ["enableAlphaFitnessTrend"]).then(() => {

				return this.get(BrowserStorage.SYNC, null);

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
						return this.set(BrowserStorage.SYNC, null, currentUserSavedSettings).then(() => {
							return this.remove(BrowserStorage.SYNC, ["userHrrZones"]);
						});

					} else {  // Key exists
						return this.remove(BrowserStorage.SYNC, ["userHrrZones"]);
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

			promise = this.remove(BrowserStorage.LOCAL, ["syncWithAthleteProfile"]).then(() => {

				return this.get(BrowserStorage.LOCAL, "computedActivities").then((result: any) => {

					if (result.computedActivities) {
						return this.set(BrowserStorage.LOCAL, "syncedActivities", result.computedActivities).then(() => {
							return this.remove(BrowserStorage.LOCAL, ["computedActivities"]);
						});
					} else {
						return Promise.resolve();
					}
				}).then(() => {
					return this.remove(BrowserStorage.SYNC, ["autoSyncMinutes"]);
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
			promise = this.remove(BrowserStorage.SYNC, ["displayMotivationScore"]);
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

			promise = this.get(BrowserStorage.SYNC, null).then((userSettingsModel: any) => {

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
					return this.set(BrowserStorage.SYNC, "athleteModel", athleteModel);
				} else {
					return Promise.resolve();
				}

			}).then(() => {
				// Remove deprecated old user settings
				return this.remove(BrowserStorage.SYNC, ["userGender", "userMaxHr", "userRestHr", "userLTHR", "userFTP", "userRunningFTP", "userSwimFTP", "userWeight"]);

			}).then(() => {
				return this.remove(BrowserStorage.LOCAL, "profileConfigured");
			});

		} else {
			console.log("Skip migrate to 6.5.0");
		}

		return promise;

	};

	protected handleUpdate(): Promise<void> {

		console.log("Updated from " + this.previousVersion + " to " + this.currentVersion);
		console.debug("UserSettings on update", userSettings);

		return this.migrate_to_5_1_1().then(() => {
			return this.migrate_to_5_11_0();
		}).then(() => {
			return this.migrate_to_6_1_2();
		}).then(() => {
			return this.migrate_to_6_4_0();
		}).then(() => {
			return this.migrate_to_6_5_0();
		});

	}

	public set(storageType: string, key: string, value: any): Promise<void> { // TODO Refactor use with StorageManager (duplicate code)

		return new Promise<void>((resolve: Function, reject: Function) => {

			let object = {};
			if (key) {
				object[key] = value;
			} else {
				object = value
			}

			chrome.storage[storageType].set(object, () => {
				const error = chrome.runtime.lastError;
				if (error) {
					reject(error.message);
				} else {
					resolve();
				}
			});
		});
	};

	public get<T>(storageType: string, key: string): Promise<T> { // TODO Refactor use with StorageManager (duplicate code)
		return new Promise<T>((resolve: Function, reject: Function) => {
			chrome.storage[storageType].get(key, (result: T) => {
				const error = chrome.runtime.lastError;
				if (error) {
					reject(error.message);
				} else {
					resolve(result);
				}
			});
		});
	};

	public remove(storageType: string, key: string | string[]): Promise<void> { // TODO Refactor use with StorageManager (duplicate code)
		return new Promise<void>((resolve: Function, reject: Function) => {
			chrome.storage[storageType].remove(key, () => {
				const error = chrome.runtime.lastError;
				if (error) {
					reject(error.message);
				} else {
					resolve();
				}
			});
		});
	};

}

const installer = new Installer();
installer.listen();










