import { TestBed } from '@angular/core/testing';
import { ActivityService, IFitnessReadyActivity } from './activity.service';
import { ISyncActivityComputed } from "../../../../../common/scripts/interfaces/ISync";
import { TEST_SYNCED_ACTIVITIES } from "../../../fixtures/activities";
import { ActivityDao } from "../../dao/activity/activity.dao";
import * as _ from "lodash";

describe('ActivityService', () => {

	let activityService: ActivityService = null;

	let _TEST_SYNCED_ACTIVITIES_: ISyncActivityComputed[] = null;

	beforeEach(() => {

		TestBed.configureTestingModule({
			providers: [ActivityService, ActivityDao]
		});

		_TEST_SYNCED_ACTIVITIES_ = _.cloneDeep(TEST_SYNCED_ACTIVITIES);

		// Retrieve injected service
		activityService = TestBed.get(ActivityService);

	});

	it('should be created', (done: Function) => {
		expect(activityService).toBeTruthy();
		done();
	});

	it('should fetch activities', (done: Function) => {

		// Given
		const fetchDaoSpy = spyOn(activityService.activityDao, 'fetch')
			.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<ISyncActivityComputed[]> = activityService.fetch();

		// Then
		promise.then((result: ISyncActivityComputed[]) => {

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

	it('should filter fitness ready activities w/ with PM=OFF & SWIM=OFF (Only activities with HR)', (done: Function) => {

		// Given
		const expectedFitnessReadyLength = 90;
		const powerMeterEnable = false;
		const cyclingFtp = null;
		const swimEnable = false;
		const swimFtp = null;

		const fetchDaoSpy = spyOn(activityService.activityDao, 'fetch')
			.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<IFitnessReadyActivity[]> = activityService
			.filterFitnessReady(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		// Then
		promise.then((result: IFitnessReadyActivity[]) => {

			expect(result).not.toBeNull();
			expect(result.length).toEqual(expectedFitnessReadyLength);
			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it('should filter fitness ready activities w/ with PM=ON & SWIM=OFF (Activities with HR and/or with PM)', (done: Function) => {

		// Given
		const expectedFitnessReadyLength = 91;
		const powerMeterEnable = true;
		const cyclingFtp = 150;
		const swimEnable = false;
		const swimFtp = null;

		const fetchDaoSpy = spyOn(activityService.activityDao, 'fetch')
			.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<IFitnessReadyActivity[]> = activityService
			.filterFitnessReady(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		// Then
		promise.then((result: IFitnessReadyActivity[]) => {

			expect(result).not.toBeNull();
			expect(result.length).toEqual(expectedFitnessReadyLength);
			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it('should filter fitness ready activities w/ PM=OFF & SWIM=ON', (done: Function) => {

		// Given
		const expectedFitnessReadyLength = 92;
		const powerMeterEnable = false;
		const cyclingFtp = null;
		const swimEnable = true;
		const swimFtp = 31;

		const fetchDaoSpy = spyOn(activityService.activityDao, 'fetch')
			.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<IFitnessReadyActivity[]> = activityService
			.filterFitnessReady(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		// Then
		promise.then((result: IFitnessReadyActivity[]) => {

			expect(result).not.toBeNull();
			expect(result.length).toEqual(expectedFitnessReadyLength);
			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it('should filter fitness ready activities w/ PM=ON & SWIM=ON', (done: Function) => {

		// Given
		const expectedFitnessReadyLength = 93;
		const powerMeterEnable = true;
		const cyclingFtp = 150;
		const swimEnable = true;
		const swimFtp = 31;

		const fetchDaoSpy = spyOn(activityService.activityDao, 'fetch')
			.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<IFitnessReadyActivity[]> = activityService
			.filterFitnessReady(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		// Then
		promise.then((result: IFitnessReadyActivity[]) => {

			expect(result).not.toBeNull();
			expect(result.length).toEqual(expectedFitnessReadyLength);
			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it('should filter fitness ready activities with proper TRIMP, PSS and SwimSS', (done: Function) => {

		// Given
		const powerMeterEnable = true;
		const cyclingFtp = 150;
		const swimEnable = true;
		const swimFtp = 31;

		spyOn(activityService.activityDao, 'fetch').and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<IFitnessReadyActivity[]> = activityService
			.filterFitnessReady(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		// Then
		promise.then((result: IFitnessReadyActivity[]) => {

			expect(result).not.toBeNull();
			let activity: IFitnessReadyActivity;

			activity = _.find(result, {id: 429628737});
			expect(activity.powerStressScore.toFixed(3)).toEqual("112.749");

			activity = _.find(result, {id: 332833796});
			expect(activity.trimpScore.toFixed(3)).toEqual("191.715");

			activity = _.find(result, {id: 873446053});
			expect(activity.swimStressScore.toFixed(3)).toEqual("242.818");

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

});
