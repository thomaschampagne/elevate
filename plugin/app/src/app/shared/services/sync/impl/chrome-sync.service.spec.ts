import { TestBed } from "@angular/core/testing";
import { SyncDateTimeDao } from "../../../dao/sync/sync-date-time-dao.service";
import { TEST_SYNCED_ACTIVITIES } from "../../../../../shared-fixtures/activities-2015.fixture";
import { SyncState } from "../sync-state.enum";
import { AthleteModel, AthleteSettingsModel, DatedAthleteSettingsModel } from "@elevate/shared/models";
import { CoreModule } from "../../../../core/core.module";
import { SharedModule } from "../../../shared.module";
import * as _ from "lodash";
import { VERSIONS_PROVIDER } from "../../versions/versions-provider.interface";
import { MockedVersionsProvider } from "../../versions/impl/mock/mocked-versions-provider";
import { SyncService } from "../sync.service";
import { ChromeSyncService } from "./chrome-sync.service";
import { DumpModel } from "../../../models/dumps/dump.model";
import { ExtensionDumpModel } from "../../../models/dumps/extension-dump.model";

describe("ChromeSyncService", () => {

	const installedVersion = "2.0.0";
	let athleteModel: AthleteModel;
	let chromeSyncService: ChromeSyncService;
	let syncDateTimeDao: SyncDateTimeDao;

	beforeEach((done: Function) => {

		const mockedVersionsProvider: MockedVersionsProvider = new MockedVersionsProvider();

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			],
			providers: [
				{provide: SyncService, useClass: ChromeSyncService},
				{provide: VERSIONS_PROVIDER, useValue: mockedVersionsProvider}
			]
		});

		athleteModel = _.cloneDeep(AthleteModel.DEFAULT_MODEL);

		chromeSyncService = TestBed.get(SyncService);
		syncDateTimeDao = TestBed.get(SyncDateTimeDao);

		spyOn(window, "open").and.stub(); // Avoid opening window in tests

		done();

	});

	it("should be created", (done: Function) => {
		expect(chromeSyncService).toBeTruthy();
		done();
	});

	it("should get last sync date time", (done: Function) => {

		// Given
		const expectedSyncDateTime = 666;
		spyOn(syncDateTimeDao, "fetch").and.returnValue(Promise.resolve(expectedSyncDateTime));

		// When
		const promise: Promise<number> = chromeSyncService.getSyncDateTime();

		// Then
		promise.then((syncDateTime: number) => {

			expect(syncDateTime).not.toBeNull();
			expect(syncDateTime).toEqual(expectedSyncDateTime);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should get last sync date time", (done: Function) => {

		// Given
		const expectedSyncDateTime = 666;
		spyOn(syncDateTimeDao, "fetch").and.returnValue(Promise.resolve(expectedSyncDateTime));

		// When
		const promise: Promise<number> = chromeSyncService.getSyncDateTime();

		// Then
		promise.then((syncDateTime: number) => {

			expect(syncDateTime).not.toBeNull();
			expect(syncDateTime).toEqual(expectedSyncDateTime);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should save last sync date time (for activities import)", (done: Function) => {

		// Given
		const expectedSyncDateTime = 9999;

		spyOn(chromeSyncService.syncDateTimeDao, "save").and.returnValue(Promise.resolve(expectedSyncDateTime));

		// When
		const promise: Promise<number> = chromeSyncService.saveSyncDateTime(expectedSyncDateTime);

		// Then
		promise.then((syncDateTime: number) => {

			expect(syncDateTime).not.toBeNull();
			expect(syncDateTime).toEqual(expectedSyncDateTime);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should remove last sync date time (for activities clear)", (done: Function) => {

		// Given
		const lastSyncDateDaoClearSpy = spyOn(chromeSyncService.syncDateTimeDao, "clear");
		lastSyncDateDaoClearSpy.and.returnValue(Promise.resolve());

		// When
		const promise: Promise<void> = chromeSyncService.clearSyncTime();

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
		const syncDateTime = 99;

		const expectedPeriodAthleteSettings: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, null, 190, null, null, 75)),
			new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, null, null, 150, null, null, 76)),
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, null, 110, null, null, 78)),
			new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, null, 110, null, null, 78)),
		];

		athleteModel.datedAthleteSettings = expectedPeriodAthleteSettings;

		spyOn(chromeSyncService.syncDateTimeDao, "fetch").and.returnValue(syncDateTime);
		spyOn(chromeSyncService.activityService, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));
		spyOn(chromeSyncService.athleteService, "fetch").and.returnValue(Promise.resolve(athleteModel));

		// When
		const promise: Promise<DumpModel> = chromeSyncService.prepareForExport();

		// Then
		promise.then((syncedBackupModel: ExtensionDumpModel) => {

			expect(syncedBackupModel).not.toBeNull();
			expect(syncedBackupModel.pluginVersion).toEqual(installedVersion);
			expect(syncedBackupModel.syncDateTime).toEqual(syncDateTime);
			expect(syncedBackupModel.syncedActivities).toEqual(TEST_SYNCED_ACTIVITIES);
			expect(syncedBackupModel.athleteModel).toEqual(athleteModel);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should export athlete activities", (done: Function) => {

		// Given
		const syncDateTime = 99;

		spyOn(chromeSyncService.syncDateTimeDao, "fetch").and.returnValue(syncDateTime);
		spyOn(chromeSyncService.activityService, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));
		spyOn(chromeSyncService.athleteService, "fetch").and.returnValue(Promise.resolve([]));

		const prepareForExportSpy = spyOn(chromeSyncService, "prepareForExport").and.callThrough();
		const saveAsSpy = spyOn(chromeSyncService, "saveAs").and.stub();

		// When
		const promise: Promise<{ filename: string, size: number }> = chromeSyncService.export();

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
		spyOn(chromeSyncService.syncDateTimeDao, "fetch").and.returnValue(null);
		spyOn(chromeSyncService.activityService, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));
		spyOn(chromeSyncService.athleteService, "fetch").and.returnValue(Promise.resolve([]));


		const prepareForExportSpy = spyOn(chromeSyncService, "prepareForExport").and.callThrough();
		const saveAsSpy = spyOn(chromeSyncService, "saveAs").and.stub();

		// When
		const promise: Promise<any> = chromeSyncService.export();

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

	it("should import athlete activities with a 1.0.0 backup and 1.0.0 compatible backup version threshold " +
		"(with datedAthleteSettings)", (done: Function) => {

		// Given
		const syncDateTime = 99;
		const importedBackupVersion = "1.0.0";
		const compatibleBackupVersionThreshold = "1.0.0";
		athleteModel.datedAthleteSettings = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, null, 190, null, null, 75)),
			new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, null, null, 150, null, null, 76)),
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, null, 110, null, null, 78)),
			new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, null, 110, null, null, 78)),
		];

		spyOn(chromeSyncService, "getCompatibleBackupVersionThreshold").and.returnValue(compatibleBackupVersionThreshold);

		const importedSyncedBackupModel: ExtensionDumpModel = {
			syncedActivities: TEST_SYNCED_ACTIVITIES,
			athleteModel: athleteModel,
			syncDateTime: syncDateTime,
			pluginVersion: importedBackupVersion
		};

		const syncDateTimeSaveSpy = spyOn(chromeSyncService.syncDateTimeDao, "save")
			.and.returnValue(Promise.resolve(importedSyncedBackupModel.syncDateTime));
		const activityServiceSaveSpy = spyOn(chromeSyncService.activityService, "save")
			.and.returnValue(Promise.resolve(importedSyncedBackupModel.syncedActivities));
		const athleteServiceSaveSpy = spyOn(chromeSyncService.athleteService, "save")
			.and.returnValue(Promise.resolve(importedSyncedBackupModel.athleteModel));
		const syncDateTimeClearSpy = spyOn(chromeSyncService.syncDateTimeDao, "clear")
			.and.returnValue(Promise.resolve());
		const activityServiceClearSpy = spyOn(chromeSyncService.activityService, "clear")
			.and.returnValue(Promise.resolve());
		const spyClearSyncedData = spyOn(chromeSyncService, "clearSyncedData").and.callThrough();
		const spyClearLocalStorage = spyOn(chromeSyncService.userSettingsService, "clearLocalStorageOnNextLoad")
			.and.returnValue(Promise.resolve());

		// When
		const promise: Promise<void> = chromeSyncService.import(importedSyncedBackupModel);

		// Then
		promise.then(() => {

			expect(syncDateTimeSaveSpy).toHaveBeenCalledTimes(1);
			expect(activityServiceSaveSpy).toHaveBeenCalledTimes(1);
			expect(athleteServiceSaveSpy).toHaveBeenCalledTimes(1);
			expect(syncDateTimeClearSpy).toHaveBeenCalledTimes(1);
			expect(activityServiceClearSpy).toHaveBeenCalledTimes(1);
			expect(spyClearSyncedData).toHaveBeenCalledTimes(1);
			expect(spyClearLocalStorage).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should import athlete activities with a 1.5.1 backup and 1.2.3 compatible backup " +
		"version threshold (athleteModel empty)", (done: Function) => {

		// Given
		const syncDateTime = 99;
		const importedBackupVersion = "1.5.1";
		const compatibleBackupVersionThreshold = "1.2.3";
		spyOn(chromeSyncService, "getCompatibleBackupVersionThreshold").and.returnValue(compatibleBackupVersionThreshold);

		athleteModel = null;

		const importedSyncedBackupModel: ExtensionDumpModel = {
			syncedActivities: TEST_SYNCED_ACTIVITIES,
			athleteModel: athleteModel,
			syncDateTime: syncDateTime,
			pluginVersion: importedBackupVersion
		};

		const syncDateTimeSaveSpy = spyOn(chromeSyncService.syncDateTimeDao, "save")
			.and.returnValue(Promise.resolve(importedSyncedBackupModel.syncDateTime));
		const activityServiceSaveSpy = spyOn(chromeSyncService.activityService, "save")
			.and.returnValue(Promise.resolve(importedSyncedBackupModel.syncedActivities));
		const syncDateTimeClearSpy = spyOn(chromeSyncService.syncDateTimeDao, "clear")
			.and.returnValue(Promise.resolve());
		const athleteServiceSaveSpy = spyOn(chromeSyncService.activityService, "clear")
			.and.returnValue(Promise.resolve());

		const spyClearSyncedData = spyOn(chromeSyncService, "clearSyncedData").and.callThrough();
		const spyResetDatedAthleteSettings = spyOn(chromeSyncService.athleteService, "resetSettings").and.stub();
		const spySaveDatedAthleteSettings = spyOn(chromeSyncService.athleteService, "save")
			.and.returnValue(Promise.resolve(importedSyncedBackupModel.athleteModel));

		const spyClearLocalStorage = spyOn(chromeSyncService.userSettingsService, "clearLocalStorageOnNextLoad")
			.and.returnValue(Promise.resolve());

		// When
		const promise: Promise<void> = chromeSyncService.import(importedSyncedBackupModel);
		// Then
		promise.then(() => {

			expect(spyResetDatedAthleteSettings).toHaveBeenCalledTimes(1);
			expect(spySaveDatedAthleteSettings).not.toHaveBeenCalled();
			expect(spyClearSyncedData).toHaveBeenCalledTimes(1);
			expect(spyClearLocalStorage).toHaveBeenCalledTimes(1);

			expect(syncDateTimeSaveSpy).toHaveBeenCalledTimes(1);
			expect(activityServiceSaveSpy).toHaveBeenCalledTimes(1);
			expect(athleteServiceSaveSpy).toHaveBeenCalledTimes(1);
			expect(syncDateTimeClearSpy).toHaveBeenCalledTimes(1);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should not import athlete activities with a 1.4.7 backup and 1.5.0 compatible backup version threshold", (done: Function) => {

		// Given
		const syncDateTime = 99;
		const importedBackupVersion = "1.4.7";
		const compatibleBackupVersionThreshold = "1.5.0";
		spyOn(chromeSyncService, "getCompatibleBackupVersionThreshold").and.returnValue(compatibleBackupVersionThreshold);
		const expectedErrorMessage = "Imported backup version " + importedBackupVersion
			+ " is not compatible with current installed version " + installedVersion + ".";

		athleteModel.datedAthleteSettings = [];

		const importedSyncedBackupModel: ExtensionDumpModel = {
			syncedActivities: TEST_SYNCED_ACTIVITIES,
			athleteModel: athleteModel,
			syncDateTime: syncDateTime,
			pluginVersion: importedBackupVersion
		};

		spyOn(chromeSyncService.syncDateTimeDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncDateTime));
		spyOn(chromeSyncService.activityService, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncedActivities));

		// When
		const promise: Promise<void> = chromeSyncService.import(importedSyncedBackupModel);

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
		const syncDateTime = 99;
		const expectedErrorMessage = "Plugin version is not defined in provided backup file. Try to perform a clean full re-sync.";

		athleteModel.datedAthleteSettings = [];

		const importedSyncedBackupModel: ExtensionDumpModel = {
			syncedActivities: TEST_SYNCED_ACTIVITIES,
			athleteModel: athleteModel,
			syncDateTime: syncDateTime,
			pluginVersion: null
		};

		spyOn(chromeSyncService.syncDateTimeDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncDateTime));
		spyOn(chromeSyncService.activityService, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncedActivities));

		// When
		const promise: Promise<void> = chromeSyncService.import(importedSyncedBackupModel);

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
		const syncDateTime = 99;
		const expectedErrorMessage = "Plugin version is not defined in provided backup file. Try to perform a clean full re-sync.";

		const syncedBackupModelPartial: Partial<ExtensionDumpModel> = {
			syncedActivities: TEST_SYNCED_ACTIVITIES,
			syncDateTime: syncDateTime
		};

		spyOn(chromeSyncService.syncDateTimeDao, "save").and.returnValue(Promise.resolve(syncedBackupModelPartial.syncDateTime));
		spyOn(chromeSyncService.activityService, "save").and.returnValue(Promise.resolve(syncedBackupModelPartial.syncedActivities));

		// When
		const promise: Promise<void> = chromeSyncService.import(syncedBackupModelPartial as ExtensionDumpModel);

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
		const syncDateTime = 99;
		const importedBackupVersion = "1.0.0";
		const expectedErrorMessage = "Activities are not defined or empty in provided backup file. Try to perform a clean full re-sync.";

		athleteModel.datedAthleteSettings = [];

		const importedSyncedBackupModel: ExtensionDumpModel = {
			syncedActivities: null,
			athleteModel: athleteModel,
			syncDateTime: syncDateTime,
			pluginVersion: importedBackupVersion
		};

		spyOn(chromeSyncService.syncDateTimeDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncDateTime));
		spyOn(chromeSyncService.activityService, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncedActivities));

		// When
		const promise: Promise<void> = chromeSyncService.import(importedSyncedBackupModel);

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
		const syncDateTime = 99;
		const importedBackupVersion = "1.0.0";
		const expectedErrorMessage = "Activities are not defined or empty in provided backup file. Try to perform a clean full re-sync.";

		const importedSyncedBackupModelPartial: Partial<ExtensionDumpModel> = {
			syncDateTime: syncDateTime,
			pluginVersion: importedBackupVersion
		};

		spyOn(chromeSyncService.syncDateTimeDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModelPartial.syncDateTime));

		// When
		const promise: Promise<void> = chromeSyncService.import(importedSyncedBackupModelPartial as ExtensionDumpModel);

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
		const syncDateTime = 99;
		const importedBackupVersion = "1.0.0";
		const expectedErrorMessage = "Activities are not defined or empty in provided backup file. Try to perform a clean full re-sync.";

		athleteModel.datedAthleteSettings = [];

		const importedSyncedBackupModel: ExtensionDumpModel = {
			syncedActivities: [],
			athleteModel: athleteModel,
			syncDateTime: syncDateTime,
			pluginVersion: importedBackupVersion
		};

		spyOn(chromeSyncService.syncDateTimeDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncDateTime));
		spyOn(chromeSyncService.activityService, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncedActivities));

		// When
		const promise: Promise<void> = chromeSyncService.import(importedSyncedBackupModel);

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
		spyOn(chromeSyncService.syncDateTimeDao, "clear").and.returnValue(Promise.resolve());
		spyOn(chromeSyncService.activityService, "clear").and.returnValue(Promise.resolve());

		const spyResolve = spyOn(Promise, "resolve").and.callThrough();

		// When
		const promise: Promise<void> = chromeSyncService.clearSyncedData();

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
		spyOn(chromeSyncService.syncDateTimeDao, "clear").and.returnValue(Promise.resolve());
		spyOn(chromeSyncService.activityService, "clear").and.returnValue(Promise.reject("Houston we have a problem"));

		// When
		const promise: Promise<void> = chromeSyncService.clearSyncedData();

		// Then
		promise.then(() => {
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();

		}, error => {
			expect(error).toEqual("Athlete synced data has not been cleared totally. Some properties cannot be deleted. " +
				"You may need to uninstall/install the software.");
			done();
		});

	});

	it("should provide NOT_SYNCED state", (done: Function) => {

		// Given
		const expectedState = SyncState.NOT_SYNCED;
		spyOn(chromeSyncService.syncDateTimeDao, "fetch").and.returnValue(Promise.resolve(null));
		spyOn(chromeSyncService.activityService, "fetch").and.returnValue(Promise.resolve(null));

		// When
		const promise: Promise<SyncState> = chromeSyncService.getSyncState();

		// Then
		promise.then((syncState: SyncState) => {
			expect(syncState).toEqual(expectedState);
			done();
		});
	});

	it("should provide PARTIALLY_SYNCED state", (done: Function) => {

		// Given
		const expectedState = SyncState.PARTIALLY_SYNCED;
		spyOn(chromeSyncService.syncDateTimeDao, "fetch").and.returnValue(Promise.resolve(null));
		spyOn(chromeSyncService.activityService, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));

		// When
		const promise: Promise<SyncState> = chromeSyncService.getSyncState();

		// Then
		promise.then((syncState: SyncState) => {
			expect(syncState).toEqual(expectedState);
			done();
		});
	});

	it("should provide SYNCED state (1)", (done: Function) => {

		// Given
		const expectedState = SyncState.SYNCED;
		const syncDateTime = 9999;
		spyOn(chromeSyncService.syncDateTimeDao, "fetch").and.returnValue(Promise.resolve(syncDateTime));
		spyOn(chromeSyncService.activityService, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));

		// When
		const promise: Promise<SyncState> = chromeSyncService.getSyncState();

		// Then
		promise.then((syncState: SyncState) => {
			expect(syncState).toEqual(expectedState);
			done();
		});
	});

	it("should provide SYNCED state (2)", (done: Function) => {

		// Given
		const expectedState = SyncState.SYNCED;
		const syncDateTime = 9999;
		spyOn(chromeSyncService.syncDateTimeDao, "fetch").and.returnValue(Promise.resolve(syncDateTime));
		spyOn(chromeSyncService.activityService, "fetch").and.returnValue(Promise.resolve(null));

		// When
		const promise: Promise<SyncState> = chromeSyncService.getSyncState();

		// Then
		promise.then((syncState: SyncState) => {
			expect(syncState).toEqual(expectedState);
			done();
		});
	});

});
