import { inject, TestBed } from "@angular/core/testing";
import { SyncDao } from "../../dao/sync/sync.dao";
import { SyncService } from "./sync.service";
import { ActivityDao } from "../../dao/activity/activity.dao";
import { TEST_SYNCED_ACTIVITIES } from "../../../../shared-fixtures/activities-2015.fixture";
import { SyncState } from "./sync-state.enum";
import { UserSettingsService } from "../user-settings/user-settings.service";
import { UserSettingsDao } from "../../dao/user-settings/user-settings.dao";
import { SyncedBackupModel } from "./synced-backup.model";

describe("SyncService", () => {

	const tabId = 101;
	let syncService: SyncService;
	let syncDao: SyncDao;

	beforeEach(() => {

		TestBed.configureTestingModule({
			providers: [SyncService, SyncDao, ActivityDao, UserSettingsService, UserSettingsDao]
		});

		syncService = TestBed.get(SyncService);
		syncDao = TestBed.get(SyncDao);

		spyOn(syncService, "getCurrentTab").and.callFake((callback: (tab: chrome.tabs.Tab) => void) => {
			const tab: Partial<chrome.tabs.Tab> = {
				id: tabId
			};
			callback(tab as chrome.tabs.Tab);
		});

		spyOn(window, "open").and.stub(); // Avoid opening window in tests

	});

	it("should be created", inject([SyncService], (service: SyncService) => {
		expect(service).toBeTruthy();
	}));

	it("should get last sync date time", (done: Function) => {

		// Given
		const expectedLastSyncDateTime = 666;
		spyOn(syncDao, "getLastSyncDateTime").and.returnValue(Promise.resolve(expectedLastSyncDateTime));

		// When
		const promise: Promise<number> = syncService.getLastSyncDateTime();

		// Then
		promise.then((lastSyncDateTime: number) => {

			expect(lastSyncDateTime).not.toBeNull();
			expect(lastSyncDateTime).toEqual(expectedLastSyncDateTime);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should save last sync date time (for activities import)", (done: Function) => {

		// Given
		const expectedLastSyncDateTime = 9999;

		spyOn(syncService.syncDao, "saveLastSyncDateTime").and.returnValue(Promise.resolve(expectedLastSyncDateTime));

		// When
		const promise: Promise<number> = syncService.saveLastSyncDateTime(expectedLastSyncDateTime);

		// Then
		promise.then((lastSyncDateTime: number) => {

			expect(lastSyncDateTime).not.toBeNull();
			expect(lastSyncDateTime).toEqual(expectedLastSyncDateTime);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});


	});

	it("should remove last sync date time (for activities clear)", (done: Function) => {

		// Given
		spyOn(syncService.syncDao, "removeLastSyncDateTime").and.returnValue(Promise.resolve(null));

		// When
		const promise: Promise<number> = syncService.removeLastSyncDateTime();

		// Then
		promise.then((result: number) => {

			expect(result).toBeNull();
			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it("should prepare export athlete activities", (done: Function) => {

		// Given
		const lastSyncDateTime = 99;
		spyOn(syncService.syncDao, "getLastSyncDateTime").and.returnValue(lastSyncDateTime);
		spyOn(syncService.activityDao, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));

		const version = "1.0.0";
		spyOn(syncService, "getAppVersion").and.returnValue(version);

		// When
		const promise: Promise<SyncedBackupModel> = syncService.prepareForExport();

		// Then
		promise.then((syncedBackupModel: SyncedBackupModel) => {

			expect(syncedBackupModel).not.toBeNull();
			expect(syncedBackupModel.pluginVersion).toEqual(version);
			expect(syncedBackupModel.lastSyncDateTime).toEqual(lastSyncDateTime);
			expect(syncedBackupModel.syncedActivities).toEqual(TEST_SYNCED_ACTIVITIES);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should export athlete activities", (done: Function) => {

		// Given
		const lastSyncDateTime = 99;

		spyOn(syncService.syncDao, "getLastSyncDateTime").and.returnValue(lastSyncDateTime);
		spyOn(syncService.activityDao, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));

		const version = "1.0.0";
		spyOn(syncService, "getAppVersion").and.returnValue(version);

		const prepareForExportSpy = spyOn(syncService, "prepareForExport").and.callThrough();
		const saveAsSpy = spyOn(syncService, "saveAs").and.stub();

		// When
		const promise: Promise<any> = syncService.export();

		// Then
		promise.then(() => {

			expect(prepareForExportSpy).toHaveBeenCalledTimes(1);
			expect(saveAsSpy).toHaveBeenCalledTimes(1);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should not export athlete activities without last sync date", (done: Function) => {

		// Given
		spyOn(syncService.syncDao, "getLastSyncDateTime").and.returnValue(null);
		spyOn(syncService.activityDao, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));

		const version = "1.0.0";
		spyOn(syncService, "getAppVersion").and.returnValue(version);

		const prepareForExportSpy = spyOn(syncService, "prepareForExport").and.callThrough();
		const saveAsSpy = spyOn(syncService, "saveAs").and.stub();

		// When
		const promise: Promise<any> = syncService.export();

		// Then
		promise.then(() => {

			expect(prepareForExportSpy).toHaveBeenCalledTimes(1);
			expect(saveAsSpy).toHaveBeenCalledTimes(0);
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual("Cannot export. No last synchronization date found.");
			done();
		});

	});

	it("should import athlete activities", (done: Function) => {

		// Given
		const lastSyncDateTime = 99;
		const version = "1.0.0";

		const importedSyncedBackupModel: SyncedBackupModel = {
			syncedActivities: TEST_SYNCED_ACTIVITIES,
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: version
		};

		spyOn(syncService.syncDao, "saveLastSyncDateTime").and.returnValue(Promise.resolve(importedSyncedBackupModel.lastSyncDateTime));
		spyOn(syncService.activityDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncedActivities));
		spyOn(syncService, "getAppVersion").and.returnValue(version);

		spyOn(syncService.syncDao, "removeLastSyncDateTime").and.returnValue(Promise.resolve(null));
		spyOn(syncService.activityDao, "clear").and.returnValue(Promise.resolve(null));

		const spy = spyOn(syncService, "clearSyncedData").and.callThrough();

		// When
		const promise: Promise<SyncedBackupModel> = syncService.import(importedSyncedBackupModel);
		// Then
		promise.then((syncedBackupModel: SyncedBackupModel) => {

			expect(spy).toHaveBeenCalledTimes(1);

			expect(syncedBackupModel).not.toBeNull();
			expect(syncedBackupModel.pluginVersion).toEqual(importedSyncedBackupModel.pluginVersion);
			expect(syncedBackupModel.lastSyncDateTime).toEqual(importedSyncedBackupModel.lastSyncDateTime);
			expect(syncedBackupModel.syncedActivities).toEqual(importedSyncedBackupModel.syncedActivities);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should not import athlete activities with mismatch version", (done: Function) => {

		// Given
		const lastSyncDateTime = 99;
		const currentInstalledVersion = "1.0.0";
		const importedVersion = "6.6.6";
		const expectedErrorMessage = "Cannot import activities because of plugin version mismatch. " +
			"The installed plugin version is " + currentInstalledVersion + " and imported backup file is " +
			"for a " + importedVersion + " plugin version. Try perform a clean full sync.";

		const importedSyncedBackupModel: SyncedBackupModel = {
			syncedActivities: TEST_SYNCED_ACTIVITIES,
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: importedVersion
		};

		spyOn(syncService.syncDao, "saveLastSyncDateTime").and.returnValue(Promise.resolve(importedSyncedBackupModel.lastSyncDateTime));
		spyOn(syncService.activityDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncedActivities));
		spyOn(syncService, "getAppVersion").and.returnValue(currentInstalledVersion);

		// When
		const promise: Promise<SyncedBackupModel> = syncService.import(importedSyncedBackupModel);

		// Then
		promise.then(() => {
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual(expectedErrorMessage);
			done();
		});

	});

	it("should not import athlete activities with no version provided (=null)", (done: Function) => {

		// Given
		const lastSyncDateTime = 99;
		const currentInstalledVersion = "1.0.0";
		const expectedErrorMessage = "Plugin version is not defined in provided backup file. Try to perform a clean full re-sync.";

		const importedSyncedBackupModel: SyncedBackupModel = {
			syncedActivities: TEST_SYNCED_ACTIVITIES,
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: null
		};

		spyOn(syncService.syncDao, "saveLastSyncDateTime").and.returnValue(Promise.resolve(importedSyncedBackupModel.lastSyncDateTime));
		spyOn(syncService.activityDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncedActivities));
		spyOn(syncService, "getAppVersion").and.returnValue(currentInstalledVersion);

		// When
		const promise: Promise<SyncedBackupModel> = syncService.import(importedSyncedBackupModel);

		// Then
		promise.then(() => {
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual(expectedErrorMessage);
			done();
		});

	});

	it("should not import athlete activities with no version provided (missing key)", (done: Function) => {

		// Given
		const lastSyncDateTime = 99;
		const currentInstalledVersion = "1.0.0";
		const expectedErrorMessage = "Plugin version is not defined in provided backup file. Try to perform a clean full re-sync.";

		const syncedBackupModelPartial: Partial<SyncedBackupModel> = {
			syncedActivities: TEST_SYNCED_ACTIVITIES,
			lastSyncDateTime: lastSyncDateTime
		};

		spyOn(syncService.syncDao, "saveLastSyncDateTime").and.returnValue(Promise.resolve(syncedBackupModelPartial.lastSyncDateTime));
		spyOn(syncService.activityDao, "save").and.returnValue(Promise.resolve(syncedBackupModelPartial.syncedActivities));
		spyOn(syncService, "getAppVersion").and.returnValue(currentInstalledVersion);

		// When
		const promise: Promise<SyncedBackupModel> = syncService.import(syncedBackupModelPartial as SyncedBackupModel);

		// Then
		promise.then(() => {
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual(expectedErrorMessage);
			done();
		});

	});

	it("should not import athlete activities with synced activities empty (=null)", (done: Function) => {

		// Given
		const lastSyncDateTime = 99;
		const currentInstalledVersion = "1.0.0";
		const importedVersion = "1.0.0";
		const expectedErrorMessage = "Activities are not defined or empty in provided backup file. Try to perform a clean full re-sync.";

		const importedSyncedBackupModel: SyncedBackupModel = {
			syncedActivities: null,
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: importedVersion
		};

		spyOn(syncService.syncDao, "saveLastSyncDateTime").and.returnValue(Promise.resolve(importedSyncedBackupModel.lastSyncDateTime));
		spyOn(syncService.activityDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncedActivities));
		spyOn(syncService, "getAppVersion").and.returnValue(currentInstalledVersion);

		// When
		const promise: Promise<SyncedBackupModel> = syncService.import(importedSyncedBackupModel);

		// Then
		promise.then(() => {
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual(expectedErrorMessage);
			done();
		});


	});

	it("should not import athlete activities with synced activities empty (missing key)", (done: Function) => {

		// Given
		const lastSyncDateTime = 99;
		const currentInstalledVersion = "1.0.0";
		const importedVersion = "1.0.0";
		const expectedErrorMessage = "Activities are not defined or empty in provided backup file. Try to perform a clean full re-sync.";

		const importedSyncedBackupModelPartial: Partial<SyncedBackupModel> = {
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: importedVersion
		};

		spyOn(syncService.syncDao, "saveLastSyncDateTime").and.returnValue(Promise.resolve(importedSyncedBackupModelPartial.lastSyncDateTime));
		spyOn(syncService, "getAppVersion").and.returnValue(currentInstalledVersion);

		// When
		const promise: Promise<SyncedBackupModel> = syncService.import(importedSyncedBackupModelPartial as SyncedBackupModel);

		// Then
		promise.then(() => {
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual(expectedErrorMessage);
			done();
		});

	});

	it("should not import athlete activities with synced activities empty (length == 0)", (done: Function) => {

		// Given
		const lastSyncDateTime = 99;
		const currentInstalledVersion = "1.0.0";
		const importedVersion = "1.0.0";
		const expectedErrorMessage = "Activities are not defined or empty in provided backup file. Try to perform a clean full re-sync.";

		const importedSyncedBackupModel: SyncedBackupModel = {
			syncedActivities: [],
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: importedVersion
		};

		spyOn(syncService.syncDao, "saveLastSyncDateTime").and.returnValue(Promise.resolve(importedSyncedBackupModel.lastSyncDateTime));
		spyOn(syncService.activityDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncedActivities));
		spyOn(syncService, "getAppVersion").and.returnValue(currentInstalledVersion);

		// When
		const promise: Promise<SyncedBackupModel> = syncService.import(importedSyncedBackupModel);

		// Then
		promise.then(() => {
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual(expectedErrorMessage);
			done();
		});

	});

	it("should remove athlete activities", (done: Function) => {

		// Given
		spyOn(syncService.syncDao, "removeLastSyncDateTime").and.returnValue(Promise.resolve(null));
		spyOn(syncService.activityDao, "clear").and.returnValue(Promise.resolve(null));

		// When
		const promise: Promise<void> = syncService.clearSyncedData();

		// Then
		promise.then(() => {
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should reject on remove activities failure (removeLastSyncDateTime not deleted)", (done: Function) => {

		// Given
		spyOn(syncService.syncDao, "removeLastSyncDateTime").and.returnValue(Promise.resolve(99));
		spyOn(syncService.activityDao, "clear").and.returnValue(Promise.resolve(null));

		// When
		const promise: Promise<void> = syncService.clearSyncedData();

		// Then
		promise.then(() => {
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual("Athlete synced data has not been cleared totally. Some properties cannot be deleted. You may need to uninstall/install the software.");
			done();
		});

	});

	it("should open sync window", (done: Function) => {

		// Given
		const forceSync = false;
		const expectedUrl = "https://www.strava.com/dashboard?stravistixSync=true&forceSync=" + forceSync + "&sourceTabId=" + tabId;

		// When
		syncService.sync(forceSync);

		// Then
		expect(syncService.getCurrentTab).toHaveBeenCalled();
		expect(window.open).toHaveBeenCalled();
		expect(window.open).toHaveBeenCalledWith(expectedUrl, jasmine.any(String), jasmine.any(String));

		done();
	});

	it("should provide NOT_SYNCED state", (done: Function) => {

		// Given
		const expectedState = SyncState.NOT_SYNCED;
		spyOn(syncService.syncDao, "getLastSyncDateTime").and.returnValue(Promise.resolve(null));
		spyOn(syncService.activityDao, "fetch").and.returnValue(Promise.resolve(null));

		// When
		const promise: Promise<SyncState> = syncService.getSyncState();

		// Then
		promise.then((syncState: SyncState) => {
			expect(syncState).toEqual(expectedState);
			done();
		});
	});

	it("should provide PARTIALLY_SYNCED state", (done: Function) => {

		// Given
		const expectedState = SyncState.PARTIALLY_SYNCED;
		spyOn(syncService.syncDao, "getLastSyncDateTime").and.returnValue(Promise.resolve(null));
		spyOn(syncService.activityDao, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));

		// When
		const promise: Promise<SyncState> = syncService.getSyncState();

		// Then
		promise.then((syncState: SyncState) => {
			expect(syncState).toEqual(expectedState);
			done();
		});
	});

	it("should provide SYNCED state (1)", (done: Function) => {

		// Given
		const expectedState = SyncState.SYNCED;
		const lastSyncDateTime = 9999;
		spyOn(syncService.syncDao, "getLastSyncDateTime").and.returnValue(Promise.resolve(lastSyncDateTime));
		spyOn(syncService.activityDao, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));

		// When
		const promise: Promise<SyncState> = syncService.getSyncState();

		// Then
		promise.then((syncState: SyncState) => {
			expect(syncState).toEqual(expectedState);
			done();
		});
	});

	it("should provide SYNCED state (2)", (done: Function) => {

		// Given
		const expectedState = SyncState.SYNCED;
		const lastSyncDateTime = 9999;
		spyOn(syncService.syncDao, "getLastSyncDateTime").and.returnValue(Promise.resolve(lastSyncDateTime));
		spyOn(syncService.activityDao, "fetch").and.returnValue(Promise.resolve(null));

		// When
		const promise: Promise<SyncState> = syncService.getSyncState();

		// Then
		promise.then((syncState: SyncState) => {
			expect(syncState).toEqual(expectedState);
			done();
		});
	});

});
