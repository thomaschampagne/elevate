import { TestBed } from "@angular/core/testing";

import { ActivityDao } from "./activity.dao";

import * as _ from "lodash";
import { SyncedActivityModel } from "../../../../../../common/scripts/models/Sync";
import { TEST_SYNCED_ACTIVITIES } from "../../../../shared-fixtures/activities-2015.fixture";

describe("ActivityDao", () => {

	let activityDao: ActivityDao;

	let testActivities: SyncedActivityModel[] = null;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [ActivityDao]
		});

		testActivities = _.cloneDeep(TEST_SYNCED_ACTIVITIES);

		// Retrieve injected service
		activityDao = TestBed.get(ActivityDao);
	});

	it("should be created", (done: Function) => {
		expect(activityDao).toBeTruthy();
		done();
	});


	it("should fetch SyncedActivityModels", (done: Function) => {

		// Given
		const chromeStorageSyncLocalSpy = spyOn(activityDao, "chromeStorageLocal").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback({computedActivities: TEST_SYNCED_ACTIVITIES});
			}
		});

		// When
		const promise: Promise<SyncedActivityModel[]> = activityDao.fetch();

		// Then
		promise.then((result: SyncedActivityModel[]) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(TEST_SYNCED_ACTIVITIES);
			expect(result.length).toEqual(TEST_SYNCED_ACTIVITIES.length);
			expect(chromeStorageSyncLocalSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should fetch empty SyncedActivityModels", (done: Function) => {

		// Given
		const chromeStorageSyncLocalSpy = spyOn(activityDao, "chromeStorageLocal").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback({computedActivities: null});
			}
		});

		const expected = [];

		// When
		const promise: Promise<SyncedActivityModel[]> = activityDao.fetch();

		// Then
		promise.then((result: SyncedActivityModel[]) => {

			expect(result).not.toBeNull();

			expect(result).toEqual(expected);
			expect(chromeStorageSyncLocalSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

});
