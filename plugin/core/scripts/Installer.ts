import { userSettings } from "../../shared/UserSettings";
import { Helper } from "./Helper";
import { StorageManager } from "./StorageManager";
import * as semver from "semver";

class Installer {

	public static listen() {

		chrome.runtime.onInstalled.addListener((details) => {
			if (details.reason === "install") {
				this.handleInstall(); // Pop in tab application and plugin page
			} else if (details.reason === "update") {
				this.handleUpdate(details);
			}
		});
	}

	public static isPreviousVersionLowerThanOrEqualsTo(oldVersion: string, upgradingVersion: string) {
		return semver.gte(upgradingVersion, oldVersion);
	}

	protected static handleInstall() {

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

	protected static handleUpdate(details: any) {

		const thisVersion: string = chrome.runtime.getManifest().version;

		console.log("Updated from " + details.previousVersion + " to " + thisVersion);
		console.debug("UserSettings on update", userSettings);

		// v <= v5.1.1 ?: Clear local history if coming from version under 5.1.1
		if (this.isPreviousVersionLowerThanOrEqualsTo(details.previousVersion, "5.1.1")) {
			this.clearSyncCache();
		}

		// v <= v5.11. ?0: Move & convert userHrrZones to generic heartrate zones
		if (this.isPreviousVersionLowerThanOrEqualsTo(details.previousVersion, "5.11.0")) {
			migration_from_version_below_than_5_11_0();
		}

		// v <= v6.1.2 ?: Removing syncWithAthleteProfile local storage object & rename computedActivities to syncedActivities
		if (this.isPreviousVersionLowerThanOrEqualsTo(details.previousVersion, "6.1.2")) {
			migration_from_version_below_than_6_1_2();
		}

	}

	protected static clearSyncCache(): void {

		const storageManagerOnLocal = new StorageManager(); // typeof StorageManager
		storageManagerOnLocal.removeFromStorage(StorageManager.TYPE_LOCAL, "computedActivities", () => {
			storageManagerOnLocal.removeFromStorage(StorageManager.TYPE_LOCAL, "lastSyncDateTime", () => {
				console.log("Local History cleared");
			});
		});
	}
}

Installer.listen();

const migration_from_version_below_than_6_1_2 = function () {

	console.log("Migrate from 6.1.2 or below");

	// Remove syncWithAthleteProfile
	chrome.storage.local.remove(["syncWithAthleteProfile"], () => {

		console.log("syncWithAthleteProfile removed");

		chrome.storage.local.get(["computedActivities"], result => {

			if (result.computedActivities) {

				chrome.storage.local.set({syncedActivities: result.computedActivities}, () => {

					console.log("syncedActivities saved");

					chrome.storage.local.remove(["computedActivities"], () => {

						console.log("computedActivities removed");

					});

				});

			} else {
				console.log("No computedActivities key found");
			}
		});

	});

};

/**
 * Migration from previous version under 5.11.0
 */
const migration_from_version_below_than_5_11_0 = function () {

	const removeDeprecatedHrrZonesKey = function (callback: Function): void {
		chrome.storage.sync.remove(["userHrrZones"], () => {
			callback();
		});
	};

	chrome.storage.sync.get(null, (currentUserSavedSettings: any) => {
		const savedUserHrrZones = currentUserSavedSettings.userHrrZones; // Get user current zones
		if (savedUserHrrZones) {
			if (savedUserHrrZones.length > 0) { // If user has zones
				const newHeartRateZones: any = [];
				for (let i = 0; i < savedUserHrrZones.length; i++) {
					const hrrZone: any = savedUserHrrZones[i];
					newHeartRateZones.push({
						from: Helper.heartrateFromHeartRateReserve(hrrZone.fromHrr, currentUserSavedSettings.userMaxHr, currentUserSavedSettings.userRestHr),
						to: Helper.heartrateFromHeartRateReserve(hrrZone.toHrr, currentUserSavedSettings.userMaxHr, currentUserSavedSettings.userRestHr),
					});
				}

				if (!currentUserSavedSettings.zones) {
					currentUserSavedSettings.zones = {};
				}

				currentUserSavedSettings.zones.heartRate = newHeartRateZones;
				chrome.storage.sync.set(currentUserSavedSettings, () => { // Inject updated zones (inc. new heartrate)
					removeDeprecatedHrrZonesKey(() => { // Remove deprecated hrr zones
						chrome.storage.sync.get(null, (results: any) => { // Show final result
							console.log("Migration to 5.11.0 done");
							console.log("Updated settings: ", results);
						});
					});
				});
			} else {  // Key exists
				removeDeprecatedHrrZonesKey(() => {
					console.log("userHrrZones key removed");
				});
			}
		}
	});
};
