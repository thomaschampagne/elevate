import { inject, TestBed } from "@angular/core/testing";
import { LastSyncDateTimeDao } from "../../dao/sync/last-sync-date-time.dao";
import { SyncService } from "./sync.service";
import { TEST_SYNCED_ACTIVITIES } from "../../../../shared-fixtures/activities-2015.fixture";
import { SyncState } from "./sync-state.enum";
import { SyncedBackupModel } from "./synced-backup.model";
import { AthleteSettingsModel, DatedAthleteSettingsModel } from "@elevate/shared/models";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";

describe("SyncService", () => {

	const tabId = 101;
	const installedVersion = "2.0.0";
	let syncService: SyncService;
	let lastSyncDateTimeDao: LastSyncDateTimeDao;

	beforeEach((done: Function) => {

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			]
		});

		syncService = TestBed.get(SyncService);
		lastSyncDateTimeDao = TestBed.get(LastSyncDateTimeDao);

		spyOn(syncService, "getCurrentTab").and.callFake((callback: (tab: chrome.tabs.Tab) => void) => {
			const tab: Partial<chrome.tabs.Tab> = {
				id: tabId
			};
			callback(tab as chrome.tabs.Tab);
		});

		spyOn(syncService, "getAppVersion").and.returnValue(installedVersion);

		spyOn(window, "open").and.stub(); // Avoid opening window in tests

		done();

	});

	it("should be created", inject([SyncService], (service: SyncService) => {
		expect(service).toBeTruthy();
	}));

	it("should get last sync date time", (done: Function) => {

		// Given
		const expectedLastSyncDateTime = 666;
		spyOn(lastSyncDateTimeDao, "fetch").and.returnValue(Promise.resolve(expectedLastSyncDateTime));

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

		spyOn(syncService.lastSyncDateTimeDao, "save").and.returnValue(Promise.resolve(expectedLastSyncDateTime));

		// When
		const promise: Promise<number> = syncService.saveLastSyncTime(expectedLastSyncDateTime);

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
		const lastSyncDateDaoClearSpy = spyOn(syncService.lastSyncDateTimeDao, "clear");
		lastSyncDateDaoClearSpy.and.returnValue(Promise.resolve());

		// When
		const promise: Promise<void> = syncService.clearLastSyncTime();

		// Then
		promise.then(() => {

			expect(lastSyncDateDaoClearSpy).toHaveBeenCalledTimes(1);
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

		const expectedPeriodAthleteSettings: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, null, 190, null, null, 75)),
			new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, null, null, 150, null, null, 76)),
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, null, 110, null, null, 78)),
			new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, null, 110, null, null, 78)),
		];

		spyOn(syncService.lastSyncDateTimeDao, "fetch").and.returnValue(lastSyncDateTime);
		spyOn(syncService.activityDao, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));
		spyOn(syncService.datedAthleteSettingsService, "fetch").and.returnValue(Promise.resolve(expectedPeriodAthleteSettings));

		// When
		const promise: Promise<SyncedBackupModel> = syncService.prepareForExport();

		// Then
		promise.then((syncedBackupModel: SyncedBackupModel) => {

			expect(syncedBackupModel).not.toBeNull();
			expect(syncedBackupModel.pluginVersion).toEqual(installedVersion);
			expect(syncedBackupModel.lastSyncDateTime).toEqual(lastSyncDateTime);
			expect(syncedBackupModel.syncedActivities).toEqual(TEST_SYNCED_ACTIVITIES);
			expect(syncedBackupModel.datedAthleteSettings).toEqual(expectedPeriodAthleteSettings);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should export athlete activities", (done: Function) => {

		// Given
		const lastSyncDateTime = 99;

		spyOn(syncService.lastSyncDateTimeDao, "fetch").and.returnValue(lastSyncDateTime);
		spyOn(syncService.activityDao, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));
		spyOn(syncService.datedAthleteSettingsService, "fetch").and.returnValue(Promise.resolve([]));

		const prepareForExportSpy = spyOn(syncService, "prepareForExport").and.callThrough();
		const saveAsSpy = spyOn(syncService, "saveAs").and.stub();

		// When
		const promise: Promise<{ filename: string, size: number }> = syncService.export();

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
		spyOn(syncService.lastSyncDateTimeDao, "fetch").and.returnValue(null);
		spyOn(syncService.activityDao, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));
		spyOn(syncService.datedAthleteSettingsService, "fetch").and.returnValue(Promise.resolve([]));


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

	it("should import athlete activities with a 1.0.0 backup and 1.0.0 compatible backup version threshold (with datedAthleteSettings)", (done: Function) => {

		// Given
		const lastSyncDateTime = 99;
		const importedBackupVersion = "1.0.0";
		const compatibleBackupVersionThreshold = "1.0.0";
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, null, 190, null, null, 75)),
			new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, null, null, 150, null, null, 76)),
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, null, 110, null, null, 78)),
			new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, null, 110, null, null, 78)),
		];

		spyOn(syncService, "getCompatibleBackupVersionThreshold").and.returnValue(compatibleBackupVersionThreshold);

		const importedSyncedBackupModel: SyncedBackupModel = {
			syncedActivities: TEST_SYNCED_ACTIVITIES,
			datedAthleteSettings: datedAthleteSettingsModels,
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: importedBackupVersion
		};

		spyOn(syncService.lastSyncDateTimeDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.lastSyncDateTime));
		spyOn(syncService.activityDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncedActivities));
		spyOn(syncService.datedAthleteSettingsService, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.datedAthleteSettings));

		spyOn(syncService.lastSyncDateTimeDao, "clear").and.returnValue(Promise.resolve());
		spyOn(syncService.activityDao, "clear").and.returnValue(Promise.resolve());

		const spyClearSyncedData = spyOn(syncService, "clearSyncedData").and.callThrough();
		const spyClearLocalStorage = spyOn(syncService.userSettingsService, "clearLocalStorageOnNextLoad").and.returnValue(Promise.resolve());

		// When
		const promise: Promise<SyncedBackupModel> = syncService.import(importedSyncedBackupModel);

		// Then
		promise.then((syncedBackupModel: SyncedBackupModel) => {

			expect(spyClearSyncedData).toHaveBeenCalledTimes(1);
			expect(spyClearLocalStorage).toHaveBeenCalledTimes(1);

			expect(syncedBackupModel).not.toBeNull();
			expect(syncedBackupModel.pluginVersion).toEqual(importedSyncedBackupModel.pluginVersion);
			expect(syncedBackupModel.lastSyncDateTime).toEqual(importedSyncedBackupModel.lastSyncDateTime);
			expect(syncedBackupModel.syncedActivities).toEqual(importedSyncedBackupModel.syncedActivities);
			expect(syncedBackupModel.datedAthleteSettings).toEqual(importedSyncedBackupModel.datedAthleteSettings);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should import athlete activities with a 1.5.1 backup and 1.2.3 compatible backup version threshold (datedAthleteSettings empty)", (done: Function) => {

		// Given
		const lastSyncDateTime = 99;
		const importedBackupVersion = "1.5.1";
		const compatibleBackupVersionThreshold = "1.2.3";
		spyOn(syncService, "getCompatibleBackupVersionThreshold").and.returnValue(compatibleBackupVersionThreshold);

		const importedSyncedBackupModel: SyncedBackupModel = {
			syncedActivities: TEST_SYNCED_ACTIVITIES,
			datedAthleteSettings: [],
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: importedBackupVersion
		};

		spyOn(syncService.lastSyncDateTimeDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.lastSyncDateTime));
		spyOn(syncService.activityDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncedActivities));

		spyOn(syncService.lastSyncDateTimeDao, "clear").and.returnValue(Promise.resolve());
		spyOn(syncService.activityDao, "clear").and.returnValue(Promise.resolve());

		const spyClearSyncedData = spyOn(syncService, "clearSyncedData").and.callThrough();
		const spyResetDatedAthleteSettings = spyOn(syncService.datedAthleteSettingsService, "reset").and.stub();
		const spySaveDatedAthleteSettings = spyOn(syncService.datedAthleteSettingsService, "save")
			.and.returnValue(Promise.resolve(importedSyncedBackupModel.datedAthleteSettings));

		const spyClearLocalStorage = spyOn(syncService.userSettingsService, "clearLocalStorageOnNextLoad").and.returnValue(Promise.resolve());

		// When
		const promise: Promise<SyncedBackupModel> = syncService.import(importedSyncedBackupModel);
		// Then
		promise.then((syncedBackupModel: SyncedBackupModel) => {

			expect(spyResetDatedAthleteSettings).toHaveBeenCalledTimes(1);
			expect(spySaveDatedAthleteSettings).not.toHaveBeenCalled();
			expect(spyClearSyncedData).toHaveBeenCalledTimes(1);
			expect(spyClearLocalStorage).toHaveBeenCalledTimes(1);

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

	it("should not import athlete activities with a 1.4.7 backup and 1.5.0 compatible backup version threshold", (done: Function) => {

		// Given
		const lastSyncDateTime = 99;
		const importedBackupVersion = "1.4.7";
		const compatibleBackupVersionThreshold = "1.5.0";
		spyOn(syncService, "getCompatibleBackupVersionThreshold").and.returnValue(compatibleBackupVersionThreshold);
		const expectedErrorMessage = "Imported backup version " + importedBackupVersion + " is not compatible with current installed version " + installedVersion + ".";

		const importedSyncedBackupModel: SyncedBackupModel = {
			syncedActivities: TEST_SYNCED_ACTIVITIES,
			datedAthleteSettings: [],
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: importedBackupVersion
		};

		spyOn(syncService.lastSyncDateTimeDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.lastSyncDateTime));
		spyOn(syncService.activityDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncedActivities));

		// When
		const promise: Promise<SyncedBackupModel> = syncService.import(importedSyncedBackupModel);

		// Then
		promise.then(() => {
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).not.toBeNull();
			expect(error).toEqual(expectedErrorMessage);
			done();
		});

	});

	it("should not import athlete activities with no version provided (=null)", (done: Function) => {

		// Given
		const lastSyncDateTime = 99;
		const expectedErrorMessage = "Plugin version is not defined in provided backup file. Try to perform a clean full re-sync.";

		const importedSyncedBackupModel: SyncedBackupModel = {
			syncedActivities: TEST_SYNCED_ACTIVITIES,
			datedAthleteSettings: [],
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: null
		};

		spyOn(syncService.lastSyncDateTimeDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.lastSyncDateTime));
		spyOn(syncService.activityDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncedActivities));

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
		const expectedErrorMessage = "Plugin version is not defined in provided backup file. Try to perform a clean full re-sync.";

		const syncedBackupModelPartial: Partial<SyncedBackupModel> = {
			syncedActivities: TEST_SYNCED_ACTIVITIES,
			lastSyncDateTime: lastSyncDateTime
		};

		spyOn(syncService.lastSyncDateTimeDao, "save").and.returnValue(Promise.resolve(syncedBackupModelPartial.lastSyncDateTime));
		spyOn(syncService.activityDao, "save").and.returnValue(Promise.resolve(syncedBackupModelPartial.syncedActivities));

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
		const importedBackupVersion = "1.0.0";
		const expectedErrorMessage = "Activities are not defined or empty in provided backup file. Try to perform a clean full re-sync.";

		const importedSyncedBackupModel: SyncedBackupModel = {
			syncedActivities: null,
			datedAthleteSettings: [],
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: importedBackupVersion
		};

		spyOn(syncService.lastSyncDateTimeDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.lastSyncDateTime));
		spyOn(syncService.activityDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncedActivities));

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
		const importedBackupVersion = "1.0.0";
		const expectedErrorMessage = "Activities are not defined or empty in provided backup file. Try to perform a clean full re-sync.";

		const importedSyncedBackupModelPartial: Partial<SyncedBackupModel> = {
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: importedBackupVersion
		};

		spyOn(syncService.lastSyncDateTimeDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModelPartial.lastSyncDateTime));

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
		const importedBackupVersion = "1.0.0";
		const expectedErrorMessage = "Activities are not defined or empty in provided backup file. Try to perform a clean full re-sync.";

		const importedSyncedBackupModel: SyncedBackupModel = {
			syncedActivities: [],
			datedAthleteSettings: [],
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: importedBackupVersion
		};

		spyOn(syncService.lastSyncDateTimeDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.lastSyncDateTime));
		spyOn(syncService.activityDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncedActivities));

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
		spyOn(syncService.lastSyncDateTimeDao, "clear").and.returnValue(Promise.resolve());
		spyOn(syncService.activityDao, "clear").and.returnValue(Promise.resolve());

		const spyResolve = spyOn(Promise, "resolve").and.callThrough();

		// When
		const promise: Promise<void> = syncService.clearSyncedData();

		// Then
		promise.then(() => {
			expect(spyResolve).toHaveBeenCalled();
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should reject on remove activities failure (remove not deleted)", (done: Function) => {

		// Given
		spyOn(syncService.lastSyncDateTimeDao, "clear").and.returnValue(Promise.resolve());
		spyOn(syncService.activityDao, "clear").and.returnValue(Promise.reject("Houston we have a problem"));

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
		const fastSync = false;
		const forceSync = false;
		const expectedUrl = "https://www.strava.com/dashboard?elevateSync=true&fastSync=" + forceSync + "&forceSync=" + forceSync + "&sourceTabId=" + tabId;

		// When
		syncService.sync(fastSync, forceSync);

		// Then
		expect(syncService.getCurrentTab).toHaveBeenCalled();
		expect(window.open).toHaveBeenCalled();
		expect(window.open).toHaveBeenCalledWith(expectedUrl, jasmine.any(String), jasmine.any(String));

		done();
	});

	it("should provide NOT_SYNCED state", (done: Function) => {

		// Given
		const expectedState = SyncState.NOT_SYNCED;
		spyOn(syncService.lastSyncDateTimeDao, "fetch").and.returnValue(Promise.resolve(null));
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
		spyOn(syncService.lastSyncDateTimeDao, "fetch").and.returnValue(Promise.resolve(null));
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
		spyOn(syncService.lastSyncDateTimeDao, "fetch").and.returnValue(Promise.resolve(lastSyncDateTime));
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
		spyOn(syncService.lastSyncDateTimeDao, "fetch").and.returnValue(Promise.resolve(lastSyncDateTime));
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
