import { ExtensionSyncService } from "./extension-sync.service";
import { SyncDateTimeDao } from "../../../dao/sync/sync-date-time.dao";
import { TestBed } from "@angular/core/testing";
import { AthleteModel, AthleteSettingsModel, DatedAthleteSettingsModel } from "@elevate/shared/models";
import { SyncService } from "../sync.service";
import { SharedModule } from "../../../shared.module";
import { SyncState } from "../sync-state.enum";
import { MockedVersionsProvider } from "../../versions/impl/mock/mocked-versions-provider";
import { TEST_SYNCED_ACTIVITIES } from "../../../../../shared-fixtures/activities-2015.fixture";
import { CoreModule } from "../../../../core/core.module";
import _ from "lodash";
import { SyncDateTime } from "@elevate/shared/models/sync/sync-date-time.model";
import { DataStore } from "../../../data-store/data-store";
import { TestingDataStore } from "../../../data-store/testing-datastore.service";
import { VersionsProvider } from "../../versions/versions-provider";
import { TargetModule } from "../../../modules/target/extension-target.module";
import { TargetBootModule } from "../../../../boot/extension-boot.module";
import { ChromiumService } from "../../../../extension/chromium.service";
import { LoggerService } from "../../logging/logger.service";
import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { ExtensionBackupModel } from "../../../models/extension-backup.model";

@Injectable()
class ChromiumServiceMock extends ChromiumService {
  public pluginId: string;
  public externalMessages$: Subject<string>;

  constructor(logger: LoggerService) {
    super(logger);
  }

  public getCurrentTab(): Promise<chrome.tabs.Tab> {
    return Promise.resolve(null);
  }

  public getTabs(): typeof chrome.tabs {
    return {
      getCurrent: () => {},
      onRemoved: {
        addListener: () => {}
      }
    } as any;
  }

  public createTab(url: string): Promise<chrome.tabs.Tab> {
    return super.createTab(url);
  }

  public getBrowserPluginId(): string {
    return null;
  }

  public getBrowserExternalMessages(): chrome.runtime.ExtensionMessageEvent {
    return {
      addListener(): void {}
    } as any;
  }
}

describe("ExtensionSyncService", () => {
  const installedVersion = "2.0.0";
  let athleteModel: AthleteModel;
  let extensionSyncService: ExtensionSyncService;
  let syncDateTimeDao: SyncDateTimeDao;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetBootModule, TargetModule],
      providers: [
        { provide: SyncService, useClass: ExtensionSyncService },
        { provide: VersionsProvider, useClass: MockedVersionsProvider },
        { provide: DataStore, useClass: TestingDataStore },
        { provide: ChromiumService, useClass: ChromiumServiceMock }
      ]
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
        throw new Error("Whoops! I should not be here!");
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
      new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, null, 110, null, null, 78))
    ];

    athleteModel.datedAthleteSettings = expectedPeriodAthleteSettings;

    spyOn(extensionSyncService.syncDateTimeDao, "findOne").and.returnValue(Promise.resolve(syncDateTime));
    spyOn(extensionSyncService.activityService, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));
    spyOn(extensionSyncService.athleteService, "fetch").and.returnValue(Promise.resolve(athleteModel));

    // When
    const promise: Promise<ExtensionBackupModel> = extensionSyncService.prepareForExport();

    // Then
    promise.then(
      (extensionBackupModel: ExtensionBackupModel) => {
        expect(extensionBackupModel).not.toBeNull();
        expect(extensionBackupModel.pluginVersion).toEqual(installedVersion);
        expect(extensionBackupModel.syncDateTime).toEqual(syncDateTime);
        expect(extensionBackupModel.syncedActivities).toEqual(TEST_SYNCED_ACTIVITIES);
        expect(extensionBackupModel.athleteModel).toEqual(athleteModel);
        done();
      },
      error => {
        expect(error).toBeNull();
        done();
      }
    );
  });

  it("should backup athlete activities", done => {
    // Given
    const syncDateTime = new SyncDateTime(99);

    spyOn(extensionSyncService.syncDateTimeDao, "findOne").and.returnValue(Promise.resolve(syncDateTime));
    spyOn(extensionSyncService.activityService, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));
    spyOn(extensionSyncService.athleteService, "fetch").and.returnValue(Promise.resolve(AthleteModel.DEFAULT_MODEL));

    const prepareForExportSpy = spyOn(extensionSyncService, "prepareForExport").and.callThrough();
    const saveAsSpy = spyOn(extensionSyncService, "saveAs").and.stub();

    // When
    const promise: Promise<{ filename: string; size: number }> = extensionSyncService.backup();

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
    spyOn(extensionSyncService.athleteService, "fetch").and.returnValue(Promise.resolve(AthleteModel.DEFAULT_MODEL));

    const prepareForExportSpy = spyOn(extensionSyncService, "prepareForExport").and.callThrough();
    const saveAsSpy = spyOn(extensionSyncService, "saveAs").and.stub();

    // When
    const promise: Promise<any> = extensionSyncService.backup();

    // Then
    promise.then(
      () => {
        expect(prepareForExportSpy).toHaveBeenCalledTimes(1);
        expect(saveAsSpy).toHaveBeenCalledTimes(0);
        throw new Error("Whoops! I should not be here!");
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
      new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, null, 110, null, null, 78))
    ];

    spyOn(DataStore, "getMinBackupVersion").and.returnValue(compatibleBackupVersionThreshold);

    const extensionBackupModel: ExtensionBackupModel = {
      syncedActivities: TEST_SYNCED_ACTIVITIES,
      athleteModel: athleteModel,
      syncDateTime: syncDateTime,
      pluginVersion: importedBackupVersion
    };

    const getPackageVersionSpy = spyOn(extensionSyncService.versionsProvider, "getPackageVersion").and.returnValue(
      importedBackupVersion
    );
    const syncDateTimeSaveSpy = spyOn(extensionSyncService.syncDateTimeDao, "put").and.returnValue(
      Promise.resolve(extensionBackupModel.syncDateTime)
    );
    const activityServiceSaveSpy = spyOn(extensionSyncService.activityService, "insertMany").and.returnValue(
      Promise.resolve()
    );
    const athleteServiceInsertSpy = spyOn(extensionSyncService.athleteService, "validateInsert").and.returnValue(
      Promise.resolve(extensionBackupModel.athleteModel)
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
    const promise: Promise<void> = extensionSyncService.restore(extensionBackupModel);

    // Then
    promise.then(
      () => {
        expect(getPackageVersionSpy).toHaveBeenCalledTimes(0);
        expect(syncDateTimeSaveSpy).toHaveBeenCalledTimes(1);
        expect(activityServiceSaveSpy).toHaveBeenCalledTimes(1);
        expect(athleteServiceInsertSpy).toHaveBeenCalledTimes(1);
        expect(syncDateTimeClearSpy).toHaveBeenCalledTimes(1);
        expect(activityServiceClearSpy).toHaveBeenCalledTimes(1);
        expect(streamServiceClearSpy).toHaveBeenCalledTimes(1);
        expect(spyClearLocalStorage).toHaveBeenCalled();

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
    spyOn(DataStore, "getMinBackupVersion").and.returnValue(compatibleBackupVersionThreshold);

    athleteModel = null;

    const extensionBackupModel: ExtensionBackupModel = {
      syncedActivities: TEST_SYNCED_ACTIVITIES,
      athleteModel: athleteModel,
      syncDateTime: syncDateTime,
      pluginVersion: importedBackupVersion
    };

    const syncDateTimeSaveSpy = spyOn(extensionSyncService.syncDateTimeDao, "put").and.returnValue(
      Promise.resolve(extensionBackupModel.syncDateTime)
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

    const spyResetDatedAthleteSettings = spyOn(extensionSyncService.athleteService, "resetSettings").and.returnValue(
      Promise.resolve(AthleteModel.DEFAULT_MODEL.datedAthleteSettings)
    );
    const spySaveDatedAthleteSettings = spyOn(extensionSyncService.athleteService, "update").and.returnValue(
      Promise.resolve(extensionBackupModel.athleteModel)
    );

    const spyClearLocalStorage = spyOn(
      extensionSyncService.userSettingsService,
      "clearLocalStorageOnNextLoad"
    ).and.returnValue(Promise.resolve());

    // When
    const promise: Promise<void> = extensionSyncService.restore(extensionBackupModel);

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
    spyOn(DataStore, "getMinBackupVersion").and.returnValue(compatibleBackupVersionThreshold);
    const expectedErrorMessage =
      "Imported backup version " + importedBackupVersion + " is not compatible with current installed version.";

    athleteModel.datedAthleteSettings = [];

    const extensionBackupModel: ExtensionBackupModel = {
      syncedActivities: TEST_SYNCED_ACTIVITIES,
      athleteModel: athleteModel,
      syncDateTime: syncDateTime,
      pluginVersion: importedBackupVersion
    };

    spyOn(extensionSyncService.syncDateTimeDao, "put").and.returnValue(
      Promise.resolve(extensionBackupModel.syncDateTime)
    );
    spyOn(extensionSyncService.activityService, "insertMany").and.returnValue(Promise.resolve());

    // When
    const promise: Promise<void> = extensionSyncService.restore(extensionBackupModel);

    // Then
    promise.then(
      () => {
        throw new Error("Whoops! I should not be here!");
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

    const extensionBackupModel: ExtensionBackupModel = {
      syncedActivities: TEST_SYNCED_ACTIVITIES,
      athleteModel: athleteModel,
      syncDateTime: syncDateTime,
      pluginVersion: null
    };

    spyOn(extensionSyncService.syncDateTimeDao, "put").and.returnValue(
      Promise.resolve(extensionBackupModel.syncDateTime)
    );
    spyOn(extensionSyncService.activityService, "insertMany").and.returnValue(Promise.resolve());

    // When
    const promise: Promise<void> = extensionSyncService.restore(extensionBackupModel);

    // Then
    promise.then(
      () => {
        throw new Error("Whoops! I should not be here!");
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

    const syncedBackupModelPartial: Partial<ExtensionBackupModel> = {
      syncedActivities: TEST_SYNCED_ACTIVITIES,
      syncDateTime: syncDateTime
    };

    spyOn(extensionSyncService.syncDateTimeDao, "put").and.returnValue(
      Promise.resolve(syncedBackupModelPartial.syncDateTime)
    );
    spyOn(extensionSyncService.activityService, "insertMany").and.returnValue(Promise.resolve());

    // When
    const promise: Promise<void> = extensionSyncService.restore(syncedBackupModelPartial as ExtensionBackupModel);

    // Then
    promise.then(
      () => {
        throw new Error("Whoops! I should not be here!");
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

    const extensionBackupModel: ExtensionBackupModel = {
      syncedActivities: null,
      athleteModel: athleteModel,
      syncDateTime: syncDateTime,
      pluginVersion: importedBackupVersion
    };

    spyOn(extensionSyncService.syncDateTimeDao, "put").and.returnValue(
      Promise.resolve(extensionBackupModel.syncDateTime)
    );
    spyOn(extensionSyncService.activityService, "insertMany").and.returnValue(Promise.resolve());

    // When
    const promise: Promise<void> = extensionSyncService.restore(extensionBackupModel);

    // Then
    promise.then(
      () => {
        throw new Error("Whoops! I should not be here!");
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

    const extensionBackupModelPartial: Partial<ExtensionBackupModel> = {
      syncDateTime: syncDateTime,
      pluginVersion: importedBackupVersion
    };

    spyOn(extensionSyncService.syncDateTimeDao, "put").and.returnValue(
      Promise.resolve(extensionBackupModelPartial.syncDateTime)
    );

    // When
    const promise: Promise<void> = extensionSyncService.restore(extensionBackupModelPartial as ExtensionBackupModel);

    // Then
    promise.then(
      () => {
        throw new Error("Whoops! I should not be here!");
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

    const extensionBackupModel: ExtensionBackupModel = {
      syncedActivities: [],
      athleteModel: athleteModel,
      syncDateTime: syncDateTime,
      pluginVersion: importedBackupVersion
    };

    spyOn(extensionSyncService.syncDateTimeDao, "put").and.returnValue(
      Promise.resolve(extensionBackupModel.syncDateTime)
    );
    spyOn(extensionSyncService.activityService, "insertMany").and.returnValue(Promise.resolve());

    // When
    const promise: Promise<void> = extensionSyncService.restore(extensionBackupModel);

    // Then
    promise.then(
      () => {
        throw new Error("Whoops! I should not be here!");
      },
      error => {
        expect(error).toEqual(expectedErrorMessage);
        done();
      }
    );
  });

  it("should remove athlete activities", done => {
    // Given
    const syncDateTimeDaoSpy = spyOn(extensionSyncService.syncDateTimeDao, "clear").and.returnValue(Promise.resolve());
    const activityServiceSpy = spyOn(extensionSyncService.activityService, "clear").and.returnValue(Promise.resolve());
    const streamsServiceSpy = spyOn(extensionSyncService.streamsService, "clear").and.returnValue(Promise.resolve());
    const saveDataStoreSpy = spyOn(extensionSyncService.dataStore, "persist").and.returnValue(Promise.resolve());

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
    spyOn(extensionSyncService.activityService, "clear").and.returnValue(Promise.reject("Houston we have a problem"));

    // When
    const promise: Promise<void> = extensionSyncService.clearSyncedActivities();

    // Then
    promise.then(
      () => {
        throw new Error("Whoops! I should not be here!");
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
