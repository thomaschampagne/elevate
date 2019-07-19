import { TestBed } from "@angular/core/testing";
import { LastSyncDateTimeDao } from "../../../dao/sync/last-sync-date-time.dao";
import { TEST_SYNCED_ACTIVITIES } from "../../../../../shared-fixtures/activities-2015.fixture";
import { SyncState } from "../sync-state.enum";
import { SyncedBackupModel } from "../synced-backup.model";
import { AthleteModel, AthleteSettingsModel, DatedAthleteSettingsModel } from "@elevate/shared/models";
import { CoreModule } from "../../../../core/core.module";
import { SharedModule } from "../../../shared.module";
import * as _ from "lodash";
import { VERSIONS_PROVIDER } from "../../versions/versions-provider.interface";
import { MockedVersionsProvider } from "../../versions/impl/mock/mocked-versions-provider";
import { SyncService } from "../sync.service";
import { ChromeSyncService } from "./chrome-sync.service";

describe("ChromeSyncService", () => {

	const installedVersion = "2.0.0";
	let athleteModel: AthleteModel;
	let chromeSyncService: ChromeSyncService;
	let lastSyncDateTimeDao: LastSyncDateTimeDao;

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
		lastSyncDateTimeDao = TestBed.get(LastSyncDateTimeDao);

		spyOn(window, "open").and.stub(); // Avoid opening window in tests

		done();

	});

	it("should be created", (done: Function) => {
		expect(chromeSyncService).toBeTruthy();
		done();
	});

	it("should get last sync date time", (done: Function) => {

		// Given
		const expectedLastSyncDateTime = 666;
		spyOn(lastSyncDateTimeDao, "fetch").and.returnValue(Promise.resolve(expectedLastSyncDateTime));

		// When
		const promise: Promise<number> = chromeSyncService.getLastSyncDateTime();

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

	it("should get last sync date time", (done: Function) => {

		// Given
		const expectedLastSyncDateTime = 666;
		spyOn(lastSyncDateTimeDao, "fetch").and.returnValue(Promise.resolve(expectedLastSyncDateTime));

		// When
		const promise: Promise<number> = chromeSyncService.getLastSyncDateTime();

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

		spyOn(chromeSyncService.lastSyncDateTimeDao, "save").and.returnValue(Promise.resolve(expectedLastSyncDateTime));

		// When
		const promise: Promise<number> = chromeSyncService.saveLastSyncDateTime(expectedLastSyncDateTime);

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
		const lastSyncDateDaoClearSpy = spyOn(chromeSyncService.lastSyncDateTimeDao, "clear");
		lastSyncDateDaoClearSpy.and.returnValue(Promise.resolve());

		// When
		const promise: Promise<void> = chromeSyncService.clearLastSyncTime();

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

		athleteModel.datedAthleteSettings = expectedPeriodAthleteSettings;

		spyOn(chromeSyncService.lastSyncDateTimeDao, "fetch").and.returnValue(lastSyncDateTime);
		spyOn(chromeSyncService.activityService, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));
		spyOn(chromeSyncService.athleteService, "fetch").and.returnValue(Promise.resolve(athleteModel));

		// When
		const promise: Promise<SyncedBackupModel> = chromeSyncService.prepareForExport();

		// Then
		promise.then((syncedBackupModel: SyncedBackupModel) => {

			expect(syncedBackupModel).not.toBeNull();
			expect(syncedBackupModel.pluginVersion).toEqual(installedVersion);
			expect(syncedBackupModel.lastSyncDateTime).toEqual(lastSyncDateTime);
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
		const lastSyncDateTime = 99;

		spyOn(chromeSyncService.lastSyncDateTimeDao, "fetch").and.returnValue(lastSyncDateTime);
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
		spyOn(chromeSyncService.lastSyncDateTimeDao, "fetch").and.returnValue(null);
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
		const lastSyncDateTime = 99;
		const importedBackupVersion = "1.0.0";
		const compatibleBackupVersionThreshold = "1.0.0";
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, null, 190, null, null, 75)),
			new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, null, null, 150, null, null, 76)),
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, null, 110, null, null, 78)),
			new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, null, 110, null, null, 78)),
		];

		athleteModel.datedAthleteSettings = datedAthleteSettingsModels;

		spyOn(chromeSyncService, "getCompatibleBackupVersionThreshold").and.returnValue(compatibleBackupVersionThreshold);


		const importedSyncedBackupModel: SyncedBackupModel = {
			syncedActivities: TEST_SYNCED_ACTIVITIES,
			athleteModel: athleteModel,
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: importedBackupVersion
		};

		spyOn(chromeSyncService.lastSyncDateTimeDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.lastSyncDateTime));
		spyOn(chromeSyncService.activityService, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncedActivities));
		spyOn(chromeSyncService.athleteService, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.athleteModel));

		spyOn(chromeSyncService.lastSyncDateTimeDao, "clear").and.returnValue(Promise.resolve());
		spyOn(chromeSyncService.activityService, "clear").and.returnValue(Promise.resolve());

		const spyClearSyncedData = spyOn(chromeSyncService, "clearSyncedData").and.callThrough();
		const spyClearLocalStorage = spyOn(chromeSyncService.userSettingsService, "clearLocalStorageOnNextLoad").and.returnValue(Promise.resolve());

		// When
		const promise: Promise<SyncedBackupModel> = chromeSyncService.import(importedSyncedBackupModel);

		// Then
		promise.then((syncedBackupModel: SyncedBackupModel) => {

			expect(spyClearSyncedData).toHaveBeenCalledTimes(1);
			expect(spyClearLocalStorage).toHaveBeenCalledTimes(1);

			expect(syncedBackupModel).not.toBeNull();
			expect(syncedBackupModel.pluginVersion).toEqual(importedSyncedBackupModel.pluginVersion);
			expect(syncedBackupModel.lastSyncDateTime).toEqual(importedSyncedBackupModel.lastSyncDateTime);
			expect(syncedBackupModel.syncedActivities).toEqual(importedSyncedBackupModel.syncedActivities);
			expect(syncedBackupModel.athleteModel).toEqual(importedSyncedBackupModel.athleteModel);
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

	});

	it("should import athlete activities with a 1.5.1 backup and 1.2.3 compatible backup " +
		"version threshold (athleteModel empty)", (done: Function) => {

		// Given
		const lastSyncDateTime = 99;
		const importedBackupVersion = "1.5.1";
		const compatibleBackupVersionThreshold = "1.2.3";
		spyOn(chromeSyncService, "getCompatibleBackupVersionThreshold").and.returnValue(compatibleBackupVersionThreshold);

		athleteModel = null;

		const importedSyncedBackupModel: SyncedBackupModel = {
			syncedActivities: TEST_SYNCED_ACTIVITIES,
			athleteModel: athleteModel,
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: importedBackupVersion
		};

		spyOn(chromeSyncService.lastSyncDateTimeDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.lastSyncDateTime));
		spyOn(chromeSyncService.activityService, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncedActivities));

		spyOn(chromeSyncService.lastSyncDateTimeDao, "clear").and.returnValue(Promise.resolve());
		spyOn(chromeSyncService.activityService, "clear").and.returnValue(Promise.resolve());

		const spyClearSyncedData = spyOn(chromeSyncService, "clearSyncedData").and.callThrough();
		const spyResetDatedAthleteSettings = spyOn(chromeSyncService.athleteService, "resetSettings").and.stub();
		const spySaveDatedAthleteSettings = spyOn(chromeSyncService.athleteService, "save")
			.and.returnValue(Promise.resolve(importedSyncedBackupModel.athleteModel));

		const spyClearLocalStorage = spyOn(chromeSyncService.userSettingsService, "clearLocalStorageOnNextLoad").and.returnValue(Promise.resolve());

		// When
		const promise: Promise<SyncedBackupModel> = chromeSyncService.import(importedSyncedBackupModel);
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
		spyOn(chromeSyncService, "getCompatibleBackupVersionThreshold").and.returnValue(compatibleBackupVersionThreshold);
		const expectedErrorMessage = "Imported backup version " + importedBackupVersion
			+ " is not compatible with current installed version " + installedVersion + ".";

		athleteModel.datedAthleteSettings = [];

		const importedSyncedBackupModel: SyncedBackupModel = {
			syncedActivities: TEST_SYNCED_ACTIVITIES,
			athleteModel: athleteModel,
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: importedBackupVersion
		};

		spyOn(chromeSyncService.lastSyncDateTimeDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.lastSyncDateTime));
		spyOn(chromeSyncService.activityService, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncedActivities));

		// When
		const promise: Promise<SyncedBackupModel> = chromeSyncService.import(importedSyncedBackupModel);

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

		athleteModel.datedAthleteSettings = [];

		const importedSyncedBackupModel: SyncedBackupModel = {
			syncedActivities: TEST_SYNCED_ACTIVITIES,
			athleteModel: athleteModel,
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: null
		};

		spyOn(chromeSyncService.lastSyncDateTimeDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.lastSyncDateTime));
		spyOn(chromeSyncService.activityService, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncedActivities));

		// When
		const promise: Promise<SyncedBackupModel> = chromeSyncService.import(importedSyncedBackupModel);

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

		spyOn(chromeSyncService.lastSyncDateTimeDao, "save").and.returnValue(Promise.resolve(syncedBackupModelPartial.lastSyncDateTime));
		spyOn(chromeSyncService.activityService, "save").and.returnValue(Promise.resolve(syncedBackupModelPartial.syncedActivities));

		// When
		const promise: Promise<SyncedBackupModel> = chromeSyncService.import(syncedBackupModelPartial as SyncedBackupModel);

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

		athleteModel.datedAthleteSettings = [];

		const importedSyncedBackupModel: SyncedBackupModel = {
			syncedActivities: null,
			athleteModel: athleteModel,
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: importedBackupVersion
		};

		spyOn(chromeSyncService.lastSyncDateTimeDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.lastSyncDateTime));
		spyOn(chromeSyncService.activityService, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncedActivities));

		// When
		const promise: Promise<SyncedBackupModel> = chromeSyncService.import(importedSyncedBackupModel);

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

		spyOn(chromeSyncService.lastSyncDateTimeDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModelPartial.lastSyncDateTime));

		// When
		const promise: Promise<SyncedBackupModel> = chromeSyncService.import(importedSyncedBackupModelPartial as SyncedBackupModel);

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

		athleteModel.datedAthleteSettings = [];

		const importedSyncedBackupModel: SyncedBackupModel = {
			syncedActivities: [],
			athleteModel: athleteModel,
			lastSyncDateTime: lastSyncDateTime,
			pluginVersion: importedBackupVersion
		};

		spyOn(chromeSyncService.lastSyncDateTimeDao, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.lastSyncDateTime));
		spyOn(chromeSyncService.activityService, "save").and.returnValue(Promise.resolve(importedSyncedBackupModel.syncedActivities));

		// When
		const promise: Promise<SyncedBackupModel> = chromeSyncService.import(importedSyncedBackupModel);

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
		spyOn(chromeSyncService.lastSyncDateTimeDao, "clear").and.returnValue(Promise.resolve());
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
		spyOn(chromeSyncService.lastSyncDateTimeDao, "clear").and.returnValue(Promise.resolve());
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
		spyOn(chromeSyncService.lastSyncDateTimeDao, "fetch").and.returnValue(Promise.resolve(null));
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
		spyOn(chromeSyncService.lastSyncDateTimeDao, "fetch").and.returnValue(Promise.resolve(null));
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
		const lastSyncDateTime = 9999;
		spyOn(chromeSyncService.lastSyncDateTimeDao, "fetch").and.returnValue(Promise.resolve(lastSyncDateTime));
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
		const lastSyncDateTime = 9999;
		spyOn(chromeSyncService.lastSyncDateTimeDao, "fetch").and.returnValue(Promise.resolve(lastSyncDateTime));
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
