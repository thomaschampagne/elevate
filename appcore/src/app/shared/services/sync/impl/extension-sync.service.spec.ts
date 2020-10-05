import { ExtensionSyncService } from "./extension-sync.service";
import { SyncDateTimeDao } from "../../../dao/sync/sync-date-time.dao";
import { TestBed } from "@angular/core/testing";
import { AthleteModel, AthleteSettingsModel, DatedAthleteSettingsModel } from "@elevate/shared/models";
import { SyncService } from "../sync.service";
import { ExtensionDumpModel } from "../../../models/dumps/extension-dump.model";
import { SharedModule } from "../../../shared.module";
import { SyncState } from "../sync-state.enum";
import { MockedVersionsProvider } from "../../versions/impl/mock/mocked-versions-provider";
import { TEST_SYNCED_ACTIVITIES } from "../../../../../shared-fixtures/activities-2015.fixture";
import { VERSIONS_PROVIDER } from "../../versions/versions-provider.interface";
import { DumpModel } from "../../../models/dumps/dump.model";
import { CoreModule } from "../../../../core/core.module";
import _ from "lodash";
import { SyncDateTime } from "@elevate/shared/models/sync/sync-date-time.model";
import { DataStore } from "../../../data-store/data-store";
import { TestingDataStore } from "../../../data-store/testing-datastore.service";

describe("ExtensionSyncService", () => {
    const installedVersion = "2.0.0";
    let athleteModel: AthleteModel;
    let extensionSyncService: ExtensionSyncService;
    let syncDateTimeDao: SyncDateTimeDao;

    beforeEach(done => {
        const mockedVersionsProvider: MockedVersionsProvider = new MockedVersionsProvider();

        TestBed.configureTestingModule({
            imports: [CoreModule, SharedModule],
            providers: [
                { provide: SyncService, useClass: ExtensionSyncService },
                { provide: VERSIONS_PROVIDER, useValue: mockedVersionsProvider },
                { provide: DataStore, useClass: TestingDataStore },
            ],
        });

        athleteModel = _.cloneDeep(AthleteModel.DEFAULT_MODEL);

        extensionSyncService = TestBed.inject(ExtensionSyncService);
        syncDateTimeDao = TestBed.inject(SyncDateTimeDao);

        spyOn(window, "open").and.stub(); // Avoid opening window in tests

        done();
    });

    it("should be created", done => {
        expect(extensionSyncService).toBeTruthy();
        done();
    });

    it("should get last sync date time", done => {
        // Given
        const expectedSyncDateTime = new SyncDateTime(666);
        spyOn(syncDateTimeDao, "findOne").and.returnValue(Promise.resolve(expectedSyncDateTime));

        // When
        const promise: Promise<SyncDateTime> = extensionSyncService.getSyncDateTime();

        // Then
        promise.then(
            (syncDateTime: SyncDateTime) => {
                expect(syncDateTime).not.toBeNull();
                expect(syncDateTime).toEqual(expectedSyncDateTime);
                done();
            },
            error => {
                expect(error).toBeNull();
                done();
            }
        );
    });

    it("should get last sync date time", done => {
        // Given
        const expectedSyncDateTime = new SyncDateTime(666);
        spyOn(syncDateTimeDao, "findOne").and.returnValue(Promise.resolve(expectedSyncDateTime));

        // When
        const promise: Promise<SyncDateTime> = extensionSyncService.getSyncDateTime();

        // Then
        promise.then(
            (syncDateTime: SyncDateTime) => {
                expect(syncDateTime).not.toBeNull();
                expect(syncDateTime).toEqual(expectedSyncDateTime);
                done();
            },
            error => {
                expect(error).toBeNull();
                done();
            }
        );
    });

    it("should save last sync date time (for activities import)", done => {
        // Given
        const expectedSyncDateTime = new SyncDateTime(9999);

        spyOn(extensionSyncService.syncDateTimeDao, "put").and.returnValue(Promise.resolve(expectedSyncDateTime));

        // When
        const promise: Promise<SyncDateTime> = extensionSyncService.updateSyncDateTime(expectedSyncDateTime);

        // Then
        promise.then(
            (syncDateTime: SyncDateTime) => {
                expect(syncDateTime).not.toBeNull();
                expect(syncDateTime).toEqual(expectedSyncDateTime);
                done();
            },
            error => {
                expect(error).toBeNull();
                done();
            }
        );
    });

    it("should remove last sync date time (for activities clear)", done => {
        // Given
        const syncDateDaoClearSpy = spyOn(extensionSyncService.syncDateTimeDao, "clear");
        syncDateDaoClearSpy.and.returnValue(Promise.resolve());

        // When
        const promise: Promise<void> = extensionSyncService.clearSyncTime();

        // Then
        promise.then(
            () => {
                expect(syncDateDaoClearSpy).toHaveBeenCalledTimes(1);
                done();
            },
            error => {
                expect(error).toBeNull();
                expect(false).toBeTruthy("Whoops! I should not be here!");
                done();
            }
        );
    });

    it("should prepare export athlete activities", done => {
        // Given
        const syncDateTime = new SyncDateTime(99);

        const expectedPeriodAthleteSettings: DatedAthleteSettingsModel[] = [
            new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, null, 190, null, null, 75)),
            new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, null, null, 150, null, null, 76)),
            new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, null, 110, null, null, 78)),
            new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, null, 110, null, null, 78)),
        ];

        athleteModel.datedAthleteSettings = expectedPeriodAthleteSettings;

        spyOn(extensionSyncService.syncDateTimeDao, "findOne").and.returnValue(Promise.resolve(syncDateTime));
        spyOn(extensionSyncService.activityService, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));
        spyOn(extensionSyncService.athleteService, "fetch").and.returnValue(Promise.resolve(athleteModel));

        // When
        const promise: Promise<DumpModel> = extensionSyncService.prepareForExport();

        // Then
        promise.then(
            (syncedBackupModel: ExtensionDumpModel) => {
                expect(syncedBackupModel).not.toBeNull();
                expect(syncedBackupModel.pluginVersion).toEqual(installedVersion);
                expect(syncedBackupModel.syncDateTime).toEqual(syncDateTime);
                expect(syncedBackupModel.syncedActivities).toEqual(TEST_SYNCED_ACTIVITIES);
                expect(syncedBackupModel.athleteModel).toEqual(athleteModel);
                done();
            },
            error => {
                expect(error).toBeNull();
                done();
            }
        );
    });

    it("should export athlete activities", done => {
        // Given
        const syncDateTime = new SyncDateTime(99);

        spyOn(extensionSyncService.syncDateTimeDao, "findOne").and.returnValue(Promise.resolve(syncDateTime));
        spyOn(extensionSyncService.activityService, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));
        spyOn(extensionSyncService.athleteService, "fetch").and.returnValue(
            Promise.resolve(AthleteModel.DEFAULT_MODEL)
        );

        const prepareForExportSpy = spyOn(extensionSyncService, "prepareForExport").and.callThrough();
        const saveAsSpy = spyOn(extensionSyncService, "saveAs").and.stub();

        // When
        const promise: Promise<{ filename: string; size: number }> = extensionSyncService.export();

        // Then
        promise.then(
            () => {
                expect(prepareForExportSpy).toHaveBeenCalledTimes(1);
                expect(saveAsSpy).toHaveBeenCalledTimes(1);
                done();
            },
            error => {
                expect(error).toBeNull();
                done();
            }
        );
    });

    it("should not export athlete activities without last sync date", done => {
        // Given
        spyOn(extensionSyncService.syncDateTimeDao, "findOne").and.returnValue(null);
        spyOn(extensionSyncService.activityService, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));
        spyOn(extensionSyncService.athleteService, "fetch").and.returnValue(
            Promise.resolve(AthleteModel.DEFAULT_MODEL)
        );

        const prepareForExportSpy = spyOn(extensionSyncService, "prepareForExport").and.callThrough();
        const saveAsSpy = spyOn(extensionSyncService, "saveAs").and.stub();

        // When
        const promise: Promise<any> = extensionSyncService.export();

        // Then
        promise.then(
            () => {
                expect(prepareForExportSpy).toHaveBeenCalledTimes(1);
                expect(saveAsSpy).toHaveBeenCalledTimes(0);
                expect(false).toBeTruthy("Whoops! I should not be here!");
                done();
            },
            error => {
                expect(error).toEqual("Cannot export. No last synchronization date found.");
                done();
            }
        );
    });

    it("should import athlete activities with a 1.0.0 backup and 1.0.0 compatible backup version threshold (with datedAthleteSettings)", done => {
        // Given
        const syncDateTime = new SyncDateTime(99);
        const importedBackupVersion = "1.0.0";
        const compatibleBackupVersionThreshold = "1.0.0";
        athleteModel.datedAthleteSettings = [
            new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, null, 190, null, null, 75)),
            new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, null, null, 150, null, null, 76)),
            new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, null, 110, null, null, 78)),
            new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, null, 110, null, null, 78)),
        ];

        spyOn(extensionSyncService, "getCompatibleBackupVersionThreshold").and.returnValue(
            compatibleBackupVersionThreshold
        );

        const importedSyncedBackupModel: ExtensionDumpModel = {
            syncedActivities: TEST_SYNCED_ACTIVITIES,
            athleteModel: athleteModel,
            syncDateTime: syncDateTime,
            pluginVersion: importedBackupVersion,
        };

        const getPackageVersionSpy = spyOn(extensionSyncService.versionsProvider, "getPackageVersion").and.returnValue(
            Promise.resolve(importedBackupVersion)
        );
        const syncDateTimeSaveSpy = spyOn(extensionSyncService.syncDateTimeDao, "put").and.returnValue(
            Promise.resolve(importedSyncedBackupModel.syncDateTime)
        );
        const activityServiceSaveSpy = spyOn(extensionSyncService.activityService, "insertMany").and.returnValue(
            Promise.resolve()
        );
        const athleteServiceInsertSpy = spyOn(extensionSyncService.athleteService, "validateInsert").and.returnValue(
            Promise.resolve(importedSyncedBackupModel.athleteModel)
        );
        const syncDateTimeClearSpy = spyOn(extensionSyncService.syncDateTimeDao, "clear").and.returnValue(
            Promise.resolve()
        );
        const activityServiceClearSpy = spyOn(extensionSyncService.activityService, "clear").and.returnValue(
            Promise.resolve()
        );
        const streamServiceClearSpy = spyOn(extensionSyncService.streamsService, "clear").and.returnValue(
            Promise.resolve()
        );
        const spyClearLocalStorage = spyOn(
            extensionSyncService.userSettingsService,
            "clearLocalStorageOnNextLoad"
        ).and.returnValue(Promise.resolve());

        // When
        const promise: Promise<void> = extensionSyncService.import(importedSyncedBackupModel);

        // Then
        promise.then(
            () => {
                expect(getPackageVersionSpy).toHaveBeenCalledTimes(1);
                expect(syncDateTimeSaveSpy).toHaveBeenCalledTimes(1);
                expect(activityServiceSaveSpy).toHaveBeenCalledTimes(1);
                expect(athleteServiceInsertSpy).toHaveBeenCalledTimes(1);
                expect(syncDateTimeClearSpy).toHaveBeenCalledTimes(1);
                expect(activityServiceClearSpy).toHaveBeenCalledTimes(1);
                expect(streamServiceClearSpy).toHaveBeenCalledTimes(1);
                expect(spyClearLocalStorage).toHaveBeenCalledTimes(1);

                done();
            },
            error => {
                expect(error).toBeNull();
                done();
            }
        );
    });

    it("should import athlete activities with a 1.5.1 backup and 1.2.3 compatible backup version threshold (athleteModel empty)", done => {
        // Given
        const syncDateTime = new SyncDateTime(99);
        const importedBackupVersion = "1.5.1";
        const compatibleBackupVersionThreshold = "1.2.3";
        spyOn(extensionSyncService, "getCompatibleBackupVersionThreshold").and.returnValue(
            compatibleBackupVersionThreshold
        );

        athleteModel = null;

        const importedSyncedBackupModel: ExtensionDumpModel = {
            syncedActivities: TEST_SYNCED_ACTIVITIES,
            athleteModel: athleteModel,
            syncDateTime: syncDateTime,
            pluginVersion: importedBackupVersion,
        };

        const syncDateTimeSaveSpy = spyOn(extensionSyncService.syncDateTimeDao, "put").and.returnValue(
            Promise.resolve(importedSyncedBackupModel.syncDateTime)
        );
        const activityServiceSaveSpy = spyOn(extensionSyncService.activityService, "insertMany").and.returnValue(
            Promise.resolve()
        );
        const syncDateTimeClearSpy = spyOn(extensionSyncService.syncDateTimeDao, "clear").and.returnValue(
            Promise.resolve()
        );
        const activityServiceClearSpy = spyOn(extensionSyncService.activityService, "clear").and.returnValue(
            Promise.resolve()
        );
        const athleteServiceSaveSpy = spyOn(extensionSyncService.athleteService, "clear").and.returnValue(
            Promise.resolve()
        );
        const streamServiceClearSpy = spyOn(extensionSyncService.streamsService, "clear").and.returnValue(
            Promise.resolve()
        );

        const spyResetDatedAthleteSettings = spyOn(
            extensionSyncService.athleteService,
            "resetSettings"
        ).and.returnValue(Promise.resolve(AthleteModel.DEFAULT_MODEL.datedAthleteSettings));
        const spySaveDatedAthleteSettings = spyOn(extensionSyncService.athleteService, "update").and.returnValue(
            Promise.resolve(importedSyncedBackupModel.athleteModel)
        );

        const spyClearLocalStorage = spyOn(
            extensionSyncService.userSettingsService,
            "clearLocalStorageOnNextLoad"
        ).and.returnValue(Promise.resolve());

        // When
        const promise: Promise<void> = extensionSyncService.import(importedSyncedBackupModel);

        // Then
        promise.then(
            () => {
                expect(spyResetDatedAthleteSettings).toHaveBeenCalledTimes(1);
                expect(spySaveDatedAthleteSettings).not.toHaveBeenCalled();
                expect(activityServiceClearSpy).toHaveBeenCalledTimes(1);
                expect(streamServiceClearSpy).toHaveBeenCalledTimes(1);
                expect(spyClearLocalStorage).toHaveBeenCalledTimes(1);

                expect(syncDateTimeSaveSpy).toHaveBeenCalledTimes(1);
                expect(activityServiceSaveSpy).toHaveBeenCalledTimes(1);
                expect(athleteServiceSaveSpy).toHaveBeenCalledTimes(1);
                expect(syncDateTimeClearSpy).toHaveBeenCalledTimes(1);
                done();
            },
            error => {
                expect(error).toBeNull();
                done();
            }
        );
    });

    it("should not import athlete activities with a 1.4.7 backup and 1.5.0 compatible backup version threshold", done => {
        // Given
        const syncDateTime = new SyncDateTime(99);
        const importedBackupVersion = "1.4.7";
        const compatibleBackupVersionThreshold = "1.5.0";
        spyOn(extensionSyncService, "getCompatibleBackupVersionThreshold").and.returnValue(
            compatibleBackupVersionThreshold
        );
        const expectedErrorMessage =
            "Imported backup version " +
            importedBackupVersion +
            " is not compatible with current installed version " +
            installedVersion +
            ".";

        athleteModel.datedAthleteSettings = [];

        const importedSyncedBackupModel: ExtensionDumpModel = {
            syncedActivities: TEST_SYNCED_ACTIVITIES,
            athleteModel: athleteModel,
            syncDateTime: syncDateTime,
            pluginVersion: importedBackupVersion,
        };

        spyOn(extensionSyncService.syncDateTimeDao, "put").and.returnValue(
            Promise.resolve(importedSyncedBackupModel.syncDateTime)
        );
        spyOn(extensionSyncService.activityService, "insertMany").and.returnValue(Promise.resolve());

        // When
        const promise: Promise<void> = extensionSyncService.import(importedSyncedBackupModel);

        // Then
        promise.then(
            () => {
                expect(false).toBeTruthy("Whoops! I should not be here!");
                done();
            },
            error => {
                expect(error).not.toBeNull();
                expect(error).toEqual(expectedErrorMessage);
                done();
            }
        );
    });

    it("should not import athlete activities with no version provided (=null)", done => {
        // Given
        const syncDateTime = new SyncDateTime(99);
        const expectedErrorMessage =
            "Plugin version is not defined in provided backup file. Try to perform a clean full re-sync.";

        athleteModel.datedAthleteSettings = [];

        const importedSyncedBackupModel: ExtensionDumpModel = {
            syncedActivities: TEST_SYNCED_ACTIVITIES,
            athleteModel: athleteModel,
            syncDateTime: syncDateTime,
            pluginVersion: null,
        };

        spyOn(extensionSyncService.syncDateTimeDao, "put").and.returnValue(
            Promise.resolve(importedSyncedBackupModel.syncDateTime)
        );
        spyOn(extensionSyncService.activityService, "insertMany").and.returnValue(Promise.resolve());

        // When
        const promise: Promise<void> = extensionSyncService.import(importedSyncedBackupModel);

        // Then
        promise.then(
            () => {
                expect(false).toBeTruthy("Whoops! I should not be here!");
                done();
            },
            error => {
                expect(error).toEqual(expectedErrorMessage);
                done();
            }
        );
    });

    it("should not import athlete activities with no version provided (missing key)", done => {
        // Given
        const syncDateTime = new SyncDateTime(99);
        const expectedErrorMessage =
            "Plugin version is not defined in provided backup file. Try to perform a clean full re-sync.";

        const syncedBackupModelPartial: Partial<ExtensionDumpModel> = {
            syncedActivities: TEST_SYNCED_ACTIVITIES,
            syncDateTime: syncDateTime,
        };

        spyOn(extensionSyncService.syncDateTimeDao, "put").and.returnValue(
            Promise.resolve(syncedBackupModelPartial.syncDateTime)
        );
        spyOn(extensionSyncService.activityService, "insertMany").and.returnValue(Promise.resolve());

        // When
        const promise: Promise<void> = extensionSyncService.import(syncedBackupModelPartial as ExtensionDumpModel);

        // Then
        promise.then(
            () => {
                expect(false).toBeTruthy("Whoops! I should not be here!");
                done();
            },
            error => {
                expect(error).toEqual(expectedErrorMessage);
                done();
            }
        );
    });

    it("should not import athlete activities with synced activities empty (=null)", done => {
        // Given
        const syncDateTime = new SyncDateTime(99);
        const importedBackupVersion = "1.0.0";
        const expectedErrorMessage =
            "Activities are not defined or empty in provided backup file. Try to perform a clean full re-sync.";

        athleteModel.datedAthleteSettings = [];

        const importedSyncedBackupModel: ExtensionDumpModel = {
            syncedActivities: null,
            athleteModel: athleteModel,
            syncDateTime: syncDateTime,
            pluginVersion: importedBackupVersion,
        };

        spyOn(extensionSyncService.syncDateTimeDao, "put").and.returnValue(
            Promise.resolve(importedSyncedBackupModel.syncDateTime)
        );
        spyOn(extensionSyncService.activityService, "insertMany").and.returnValue(Promise.resolve());

        // When
        const promise: Promise<void> = extensionSyncService.import(importedSyncedBackupModel);

        // Then
        promise.then(
            () => {
                expect(false).toBeTruthy("Whoops! I should not be here!");
                done();
            },
            error => {
                expect(error).toEqual(expectedErrorMessage);
                done();
            }
        );
    });

    it("should not import athlete activities with synced activities empty (missing key)", done => {
        // Given
        const syncDateTime = new SyncDateTime(99);
        const importedBackupVersion = "1.0.0";
        const expectedErrorMessage =
            "Activities are not defined or empty in provided backup file. Try to perform a clean full re-sync.";

        const importedSyncedBackupModelPartial: Partial<ExtensionDumpModel> = {
            syncDateTime: syncDateTime,
            pluginVersion: importedBackupVersion,
        };

        spyOn(extensionSyncService.syncDateTimeDao, "put").and.returnValue(
            Promise.resolve(importedSyncedBackupModelPartial.syncDateTime)
        );

        // When
        const promise: Promise<void> = extensionSyncService.import(
            importedSyncedBackupModelPartial as ExtensionDumpModel
        );

        // Then
        promise.then(
            () => {
                expect(false).toBeTruthy("Whoops! I should not be here!");
                done();
            },
            error => {
                expect(error).toEqual(expectedErrorMessage);
                done();
            }
        );
    });

    it("should not import athlete activities with synced activities empty (length == 0)", done => {
        // Given
        const syncDateTime = new SyncDateTime(99);
        const importedBackupVersion = "1.0.0";
        const expectedErrorMessage =
            "Activities are not defined or empty in provided backup file. Try to perform a clean full re-sync.";

        athleteModel.datedAthleteSettings = [];

        const importedSyncedBackupModel: ExtensionDumpModel = {
            syncedActivities: [],
            athleteModel: athleteModel,
            syncDateTime: syncDateTime,
            pluginVersion: importedBackupVersion,
        };

        spyOn(extensionSyncService.syncDateTimeDao, "put").and.returnValue(
            Promise.resolve(importedSyncedBackupModel.syncDateTime)
        );
        spyOn(extensionSyncService.activityService, "insertMany").and.returnValue(Promise.resolve());

        // When
        const promise: Promise<void> = extensionSyncService.import(importedSyncedBackupModel);

        // Then
        promise.then(
            () => {
                expect(false).toBeTruthy("Whoops! I should not be here!");
                done();
            },
            error => {
                expect(error).toEqual(expectedErrorMessage);
                done();
            }
        );
    });

    it("should remove athlete activities", done => {
        // Given
        const syncDateTimeDaoSpy = spyOn(extensionSyncService.syncDateTimeDao, "clear").and.returnValue(
            Promise.resolve()
        );
        const activityServiceSpy = spyOn(extensionSyncService.activityService, "clear").and.returnValue(
            Promise.resolve()
        );
        const streamsServiceSpy = spyOn(extensionSyncService.streamsService, "clear").and.returnValue(
            Promise.resolve()
        );
        const saveDataStoreSpy = spyOn(extensionSyncService.dataStore, "saveDataStore").and.returnValue(
            Promise.resolve()
        );

        // When
        const promise: Promise<void> = extensionSyncService.clearSyncedActivities();

        // Then
        promise.then(
            () => {
                expect(saveDataStoreSpy).toHaveBeenCalledTimes(1);
                expect(syncDateTimeDaoSpy).toHaveBeenCalledTimes(1);
                expect(activityServiceSpy).toHaveBeenCalledTimes(1);
                expect(streamsServiceSpy).toHaveBeenCalledTimes(1);
                done();
            },
            error => {
                expect(error).toBeNull();
                done();
            }
        );
    });

    it("should reject on remove activities failure (remove not deleted)", done => {
        // Given
        spyOn(extensionSyncService.syncDateTimeDao, "clear").and.returnValue(Promise.resolve());
        spyOn(extensionSyncService.activityService, "clear").and.returnValue(
            Promise.reject("Houston we have a problem")
        );

        // When
        const promise: Promise<void> = extensionSyncService.clearSyncedActivities();

        // Then
        promise.then(
            () => {
                expect(false).toBeTruthy("Whoops! I should not be here!");
                done();
            },
            error => {
                expect(error).toEqual(
                    "Athlete synced data has not been cleared totally. Some properties cannot be deleted. " +
                        "You may need to uninstall/install the software."
                );
                done();
            }
        );
    });

    it("should provide NOT_SYNCED state", done => {
        // Given
        const expectedState = SyncState.NOT_SYNCED;
        spyOn(extensionSyncService.syncDateTimeDao, "findOne").and.returnValue(Promise.resolve(null));
        spyOn(extensionSyncService.activityService, "count").and.returnValue(Promise.resolve(null));

        // When
        const promise: Promise<SyncState> = extensionSyncService.getSyncState();

        // Then
        promise.then((syncState: SyncState) => {
            expect(syncState).toEqual(expectedState);
            done();
        });
    });

    it("should provide PARTIALLY_SYNCED state", done => {
        // Given
        const expectedState = SyncState.PARTIALLY_SYNCED;
        spyOn(extensionSyncService.syncDateTimeDao, "findOne").and.returnValue(Promise.resolve(null));
        spyOn(extensionSyncService.activityService, "count").and.returnValue(
            Promise.resolve(TEST_SYNCED_ACTIVITIES.length)
        );

        // When
        const promise: Promise<SyncState> = extensionSyncService.getSyncState();

        // Then
        promise.then((syncState: SyncState) => {
            expect(syncState).toEqual(expectedState);
            done();
        });
    });

    it("should provide SYNCED state (1)", done => {
        // Given
        const expectedState = SyncState.SYNCED;
        const syncDateTime = new SyncDateTime(9999);
        spyOn(extensionSyncService.syncDateTimeDao, "findOne").and.returnValue(Promise.resolve(syncDateTime));
        spyOn(extensionSyncService.activityService, "count").and.returnValue(
            Promise.resolve(TEST_SYNCED_ACTIVITIES.length)
        );

        // When
        const promise: Promise<SyncState> = extensionSyncService.getSyncState();

        // Then
        promise.then((syncState: SyncState) => {
            expect(syncState).toEqual(expectedState);
            done();
        });
    });

    it("should provide SYNCED state (2)", done => {
        // Given
        const expectedState = SyncState.SYNCED;
        const syncDateTime = new SyncDateTime(9999);
        spyOn(extensionSyncService.syncDateTimeDao, "findOne").and.returnValue(Promise.resolve(syncDateTime));
        spyOn(extensionSyncService.activityService, "count").and.returnValue(Promise.resolve(0));

        // When
        const promise: Promise<SyncState> = extensionSyncService.getSyncState();

        // Then
        promise.then((syncState: SyncState) => {
            expect(syncState).toEqual(expectedState);
            done();
        });
    });
});
