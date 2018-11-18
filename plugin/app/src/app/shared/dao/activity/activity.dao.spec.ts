import { TestBed } from "@angular/core/testing";
import { ActivityDao } from "./activity.dao";
import * as _ from "lodash";
import { TEST_SYNCED_ACTIVITIES } from "../../../../shared-fixtures/activities-2015.fixture";
import { SyncedActivityModel } from "@elevate/shared/models";
import { DataStore } from "../../data-store/data-store";
import { MockedDataStore } from "../../data-store/impl/spec/mocked-data-store.service";

describe("ActivityDao", () => {

	let activityDao: ActivityDao;

	let _TEST_SYNCED_ACTIVITIES_: SyncedActivityModel[] = null;

	beforeEach((done: Function) => {

		_TEST_SYNCED_ACTIVITIES_ = _.cloneDeep(TEST_SYNCED_ACTIVITIES);

		const mockedDataStore: MockedDataStore<SyncedActivityModel> = new MockedDataStore(_TEST_SYNCED_ACTIVITIES_);

		TestBed.configureTestingModule({
			providers: [
				ActivityDao,
				{provide: DataStore, useValue: mockedDataStore}
			]
		});

		// Retrieve injected service
		activityDao = TestBed.get(ActivityDao);
		done();
	});

	it("should be created", (done: Function) => {
		expect(activityDao).toBeTruthy();
		done();
	});

	it("should remove SyncedActivityModel by strava activity ids", (done: Function) => {

		// Given
		const activitiesToDelete = [
			302537043, // Chamrousse 1750
			296692980, // Fondo 100
		];

		const expectedExistingActivity = 353633586; // Venon PR 01

		// When
		const promise: Promise<SyncedActivityModel[]> = activityDao.removeByIds(activitiesToDelete);

		// Then
		promise.then((result: SyncedActivityModel[]) => {

			expect(result.length).toEqual(_TEST_SYNCED_ACTIVITIES_.length - activitiesToDelete.length);

			let activity = _.find(result, {id: activitiesToDelete[0]});
			expect(_.isEmpty(activity)).toBeTruthy();

			activity = _.find(result, {id: activitiesToDelete[1]});
			expect(_.isEmpty(activity)).toBeTruthy();

			activity = _.find(result, {id: expectedExistingActivity});
			expect(_.isEmpty(activity)).toBeFalsy();

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

});
