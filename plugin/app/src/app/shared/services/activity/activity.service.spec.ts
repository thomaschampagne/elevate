import { TestBed } from "@angular/core/testing";
import { ActivityService } from "./activity.service";
import { TEST_SYNCED_ACTIVITIES } from "../../../../shared-fixtures/activities-2015.fixture";
import { ActivityDao } from "../../dao/activity/activity.dao";
import * as _ from "lodash";
import { SyncedActivityModel } from "../../../../../../shared/models/sync/synced-activity.model";

describe("ActivityService", () => {

	let activityService: ActivityService = null;

	let _TEST_SYNCED_ACTIVITIES_: SyncedActivityModel[] = null;

	beforeEach((done: Function) => {

		TestBed.configureTestingModule({
			providers: [ActivityService, ActivityDao]
		});

		_TEST_SYNCED_ACTIVITIES_ = _.cloneDeep(TEST_SYNCED_ACTIVITIES);

		// Retrieve injected service
		activityService = TestBed.get(ActivityService);

		done();
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

	it("should save SyncedActivityModels", (done: Function) => {

		// Given
		const syncedActivityModelsToSave = _TEST_SYNCED_ACTIVITIES_;
		const saveDaoSpy = spyOn(activityService.activityDao, "save")
			.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<SyncedActivityModel[]> = activityService.save(syncedActivityModelsToSave);

		// Then
		promise.then((result: SyncedActivityModel[]) => {

			expect(result).not.toBeNull();
			expect(result.length).toEqual(_TEST_SYNCED_ACTIVITIES_.length);
			expect(result).toEqual(_TEST_SYNCED_ACTIVITIES_);
			expect(saveDaoSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});
	});

	it("should clear SyncedActivityModels", (done: Function) => {

		// Given
		const removeDaoSpy = spyOn(activityService.activityDao, "clear")
			.and.returnValue(Promise.resolve(null));

		// When
		const promise: Promise<SyncedActivityModel[]> = activityService.clear();

		// Then
		promise.then((result: SyncedActivityModel[]) => {

			expect(result).toBeNull();
			expect(removeDaoSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});
	});

	it("should remove SyncedActivityModel by strava activity ids", (done: Function) => {

		// Given
		const activitiesToDelete = [
			302537043, // Chamrousse 1750
			296692980, // Fondo 100
		];

		const expectedExistingActivity = 353633586; // Venon PR 01

		spyOn(activityService.activityDao, "removeByIds")
			.and.returnValue(Promise.resolve(_.filter(_TEST_SYNCED_ACTIVITIES_, (syncedActivityModel: SyncedActivityModel) => {
			return (_.indexOf(activitiesToDelete, syncedActivityModel.id) === -1);
		})));

		// When
		const promise: Promise<SyncedActivityModel[]> = activityService.removeByIds(activitiesToDelete);

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
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});
	});
});
