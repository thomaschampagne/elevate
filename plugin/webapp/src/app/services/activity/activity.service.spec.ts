import { TestBed } from '@angular/core/testing';
import { ActivityService, IDayActivity, IFitnessReadyActivity } from './activity.service';
import { ISyncActivityComputed } from "../../../../../common/scripts/interfaces/ISync";
import { TEST_ACTIVITIES } from "../../../fixtures/activities";
import { ActivityDao } from "../../dao/activity/activity.dao";
import * as _ from "lodash";
import moment = require("moment");

describe('ActivityService', () => {

	let activityService: ActivityService = null;

	let _TEST_ACTIVITIES_: ISyncActivityComputed[] = null;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [ActivityService, ActivityDao]
		});

		_TEST_ACTIVITIES_ = _.cloneDeep(TEST_ACTIVITIES);

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
			.and.returnValue(Promise.resolve(_TEST_ACTIVITIES_));

		// When
		const promise: Promise<ISyncActivityComputed[]> = activityService.fetch();

		// Then
		promise.then((result: ISyncActivityComputed[]) => {

			expect(result).not.toBeNull();
			expect(result.length).toEqual(_TEST_ACTIVITIES_.length);
			expect(result).toEqual(_TEST_ACTIVITIES_);
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
			.and.returnValue(Promise.resolve(_TEST_ACTIVITIES_));

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
			.and.returnValue(Promise.resolve(_TEST_ACTIVITIES_));

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
			.and.returnValue(Promise.resolve(_TEST_ACTIVITIES_));

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
			.and.returnValue(Promise.resolve(_TEST_ACTIVITIES_));

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

	it('should filter fitness ready activities proper TRIMP, PSS and SwimSS', (done: Function) => {

		// Given
		const powerMeterEnable = true;
		const cyclingFtp = 150;
		const swimEnable = true;
		const swimFtp = 31;

		spyOn(activityService.activityDao, 'fetch').and.returnValue(Promise.resolve(_TEST_ACTIVITIES_));

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

	it('should provide athlete daily activity with rest and active days', (done: Function) => {

		// Given
		const powerMeterEnable = true;
		const cyclingFtp = 150;
		const swimEnable = true;
		const swimFtp = 31;
		const todayDate = "2015-12-01 12:00";
		const rideId = 343080886;

		const expectedDailyActivityLength = 346;
		const expectedPreviewDays = 14;
		const expectedFirstDay = "Sun Jan 04 2015 00:00:00 GMT+0100 (Romance Standard Time)";
		const expectedLastRealDay = "Tue Dec 01 2015 00:00:00 GMT+0100 (Romance Standard Time)";
		const expectedLastPreviewDay = "Tue Dec 15 2015 00:00:00 GMT+0100 (Romance Standard Time)";
		const expectedRideDate = "Fri Jul 10 2015 00:00:00 GMT+0200 (Romance Daylight Time)";

		const fetchDaoSpy = spyOn(activityService.activityDao, 'fetch').and.returnValue(Promise.resolve(_TEST_ACTIVITIES_));
		const getMomentSpy = spyOn(activityService, "getTodayMoment").and.returnValue(moment(todayDate, "YYYY-MM-DD hh:mm"));

		// When
		const promise: Promise<IDayActivity[]> = activityService.getDailyActivity(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		// Then
		promise.then((dailyActivity: IDayActivity[]) => {

			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
			expect(getMomentSpy).toHaveBeenCalled();
			expect(dailyActivity).not.toBeNull();

			// Test real & preview days
			expect(dailyActivity.length).toEqual(expectedDailyActivityLength);

			const previewDailyActivity = _.filter(dailyActivity, (dayActivity: IDayActivity) => {
				return dayActivity.previewDay == true;
			});
			expect(previewDailyActivity.length).toEqual(expectedPreviewDays);

			const realDailyActivity = _.filter(dailyActivity, (dayActivity: IDayActivity) => {
				return dayActivity.previewDay == false;
			});
			expect(realDailyActivity.length).toEqual(expectedDailyActivityLength - expectedPreviewDays);

			// Test dates
			expect(_.first(dailyActivity).date.toString()).toEqual(expectedFirstDay);
			expect(_.last(realDailyActivity).date.toString()).toEqual(expectedLastRealDay);
			expect(_.last(previewDailyActivity).date.toString()).toEqual(expectedLastPreviewDay);
			expect(_.last(dailyActivity).date.toString()).toEqual(expectedLastPreviewDay);
			expect(_.find(dailyActivity, {ids: [rideId]}).date.toString()).toEqual(expectedRideDate);

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});
	});
});
