import { TestBed } from "@angular/core/testing";
import { ActivityService } from "./activity.service";
import { SyncedActivityModel } from "../../../../../../common/scripts/models/Sync";
import { TEST_SYNCED_ACTIVITIES } from "../../../../shared-fixtures/activities-2015.fixture";
import { ActivityDao } from "../../dao/activity/activity.dao";
import * as _ from "lodash";

describe("ActivityService", () => {

	let activityService: ActivityService = null;

	let _TEST_SYNCED_ACTIVITIES_: SyncedActivityModel[] = null;

	beforeEach(() => {

		TestBed.configureTestingModule({
			providers: [ActivityService, ActivityDao]
		});

		_TEST_SYNCED_ACTIVITIES_ = _.cloneDeep(TEST_SYNCED_ACTIVITIES);

		// Retrieve injected service
		activityService = TestBed.get(ActivityService);

	});

	it("should be created", (done: Function) => {
		expect(activityService).toBeTruthy();
		done();
	});

	it("should fetch activities", (done: Function) => {

		// Given
		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<SyncedActivityModel[]> = activityService.fetch();

		// Then
		promise.then((result: SyncedActivityModel[]) => {

			expect(result).not.toBeNull();
			expect(result.length).toEqual(_TEST_SYNCED_ACTIVITIES_.length);
			expect(result).toEqual(_TEST_SYNCED_ACTIVITIES_);
			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});
});
