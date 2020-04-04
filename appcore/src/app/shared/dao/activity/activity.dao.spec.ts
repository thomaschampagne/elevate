import { TestBed } from "@angular/core/testing";
import { ActivityDao } from "./activity.dao";
import * as _ from "lodash";
import { TEST_SYNCED_ACTIVITIES } from "../../../../shared-fixtures/activities-2015.fixture";
import { SyncedActivityModel } from "@elevate/shared/models";
import { DataStore } from "../../data-store/data-store";
import { MockedDataStore } from "../../data-store/impl/mock/mocked-data-store.service";

describe("ActivityDao", () => {

    let activityDao: ActivityDao;

    let _TEST_SYNCED_ACTIVITIES_: SyncedActivityModel[] = null;

    beforeEach(done => {

        _TEST_SYNCED_ACTIVITIES_ = _.cloneDeep(TEST_SYNCED_ACTIVITIES);

        const mockedDataStore: MockedDataStore<SyncedActivityModel> = new MockedDataStore(_TEST_SYNCED_ACTIVITIES_);

        TestBed.configureTestingModule({
            providers: [
                ActivityDao,
                {provide: DataStore, useValue: mockedDataStore}
            ]
        });

        // Retrieve injected service
        activityDao = TestBed.inject(ActivityDao);
        done();
    });

    it("should be created", done => {
        expect(activityDao).toBeTruthy();
        done();
    });
});
