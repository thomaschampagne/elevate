import { userSettings } from "../shared/UserSettings";
import { Helper } from "./Helper";
import { StorageManager } from "./StorageManager";

class InstallUpdateHandler {

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

	public static listen() {

		chrome.runtime.onInstalled.addListener((details) => {
			if (details.reason === "install") {
				this.handleInstall(); // Pop in tab application and plugin page
			} else if (details.reason === "update") {
				this.handleUpdate(details);
			}
		});
	}

	protected static handleUpdate(details: any) {

		const thisVersion: string = chrome.runtime.getManifest().version;

		console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
		console.debug("UserSettings on update", userSettings);

		// Clear local history if coming from version under 5.1.1
		if (Helper.versionCompare("5.1.1", details.previousVersion) === 1) { // TODO Use semver package instead
			this.clearSyncCache();
		}

		// Move & convert userHrrZones to generic heartrate zones
		if (Helper.versionCompare("5.11.0", details.previousVersion) === 1 || true) {
			migration_from_previous_version_under_5_11_0();
		}

	}

	protected static clearSyncCache(): void {

		const storageManagerOnLocal = new StorageManager(); // typeof StorageManager
		storageManagerOnLocal.removeFromStorage(StorageManager.storageLocalType, "computedActivities", () => {
			storageManagerOnLocal.removeFromStorage(StorageManager.storageLocalType, "lastSyncDateTime", () => {
				storageManagerOnLocal.removeFromStorage(StorageManager.storageLocalType, "syncWithAthleteProfile", () => {
					console.log("Local History cleared");
				});
			});
		});
	}
}

InstallUpdateHandler.listen();

/**
 * Migration from previous version under 5.11.0
 */
let migration_from_previous_version_under_5_11_0 = function () {

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
