import { TestBed } from "@angular/core/testing";
import { SyncDateTimeDao } from "../../dao/sync/sync-date-time.dao";
import { AthleteModel } from "@elevate/shared/models";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";
import _ from "lodash";
import { VERSIONS_PROVIDER } from "../versions/versions-provider.interface";
import { MockedVersionsProvider } from "../versions/impl/mock/mocked-versions-provider";
import { SyncService } from "./sync.service";
import { MockSyncService } from "./impl/mock/mock-sync.service";
import { DataStore } from "../../data-store/data-store";
import { TestingDataStore } from "../../data-store/testing-datastore.service";

describe("SyncService", () => {
  let athleteModel: AthleteModel;
  let syncService: SyncService<any>;
  let syncDateTimeDao: SyncDateTimeDao;

  beforeEach(done => {
    const mockedVersionsProvider: MockedVersionsProvider = new MockedVersionsProvider();

    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule],
      providers: [
        { provide: SyncService, useClass: MockSyncService },
        { provide: VERSIONS_PROVIDER, useValue: mockedVersionsProvider },
        { provide: DataStore, useClass: TestingDataStore },
      ],
    });

    athleteModel = _.cloneDeep(AthleteModel.DEFAULT_MODEL);

    syncService = TestBed.inject(SyncService);
    syncDateTimeDao = TestBed.inject(SyncDateTimeDao);

    spyOn(window, "open").and.stub(); // Avoid opening window in tests

    done();
  });

  it("should be created", done => {
    expect(syncService).toBeTruthy();
    done();
  });
});
