import { TestBed } from '@angular/core/testing';

import { FitnessService, IDayFitnessTrend, IDayStress } from './fitness.service';
import * as _ from "lodash";
import { TEST_SYNCED_ACTIVITIES } from "../../../fixtures/activities";
import { ActivityService, IFitnessReadyActivity } from "../activity/activity.service";
import { ActivityDao } from "../../dao/activity/activity.dao";
import moment = require("moment");


describe('FitnessService', () => {

	const powerMeterEnable = true;
	const cyclingFtp = 150;
	const swimEnable = true;
	const swimFtp = 31;

	let _TEST_FITNESS_READY_ACTIVITIES_: IFitnessReadyActivity[] = null;
	let fitnessService: FitnessService = null;
	let activityService: ActivityService = null;

	const provideFitnessReadyTestData = (powerMeterEnable: boolean,
										 cyclingFtp: number,
										 swimEnable: boolean,
										 swimFtp: number): Promise<IFitnessReadyActivity[]> => {
		spyOn(activityService.activityDao, 'fetch').and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));
		return activityService.filterFitnessReady(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);
	};

	beforeEach((done: Function) => {

		TestBed.configureTestingModule({
			providers: [FitnessService, ActivityService, ActivityDao]
		});

		// Retrieve injected service
		fitnessService = TestBed.get(FitnessService);
		activityService = TestBed.get(ActivityService);

		provideFitnessReadyTestData(powerMeterEnable, cyclingFtp, swimEnable, swimFtp)
			.then((fitnessReadyActivities: IFitnessReadyActivity[]) => {
				_TEST_FITNESS_READY_ACTIVITIES_ = fitnessReadyActivities;
			});

		done();
	});

	it('should be created', (done: Function) => {
		expect(fitnessService).toBeTruthy();
		done();
	});

	it('should provide athlete daily activity with rest and active days', (done: Function) => {

		// Given
		const fakeTodayDate = "2015-12-01 12:00";
		const rideId = 343080886;

		const expectedDailyActivityLength = 346;
		const expectedPreviewDays = 14;
		const expectedFirstDay = "Sun Jan 04 2015 00:00:00 GMT+0100 (Romance Standard Time)";
		const expectedLastRealDay = "Tue Dec 01 2015 00:00:00 GMT+0100 (Romance Standard Time)";
		const expectedLastPreviewDay = "Tue Dec 15 2015 00:00:00 GMT+0100 (Romance Standard Time)";
		const expectedRideDate = "Fri Jul 10 2015 00:00:00 GMT+0200 (Romance Daylight Time)";

		const filterFitnessReadySpy = spyOn(activityService, 'filterFitnessReady')
			.and.returnValue(Promise.resolve(_TEST_FITNESS_READY_ACTIVITIES_));

		const getMomentSpy = spyOn(fitnessService, "getTodayMoment").and.returnValue(moment(fakeTodayDate, "YYYY-MM-DD hh:mm"));

		// When
		const promise: Promise<IDayStress[]> = fitnessService.generateDailyStress(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		// Then
		promise.then((dailyActivity: IDayStress[]) => {

			expect(filterFitnessReadySpy).toHaveBeenCalledTimes(1);
			expect(getMomentSpy).toHaveBeenCalled();
			expect(dailyActivity).not.toBeNull();

			// Test real & preview days
			expect(dailyActivity.length).toEqual(expectedDailyActivityLength);

			const previewDailyActivity = _.filter(dailyActivity, (dayActivity: IDayStress) => {
				return dayActivity.previewDay == true;
			});
			expect(previewDailyActivity.length).toEqual(expectedPreviewDays);

			const realDailyActivity = _.filter(dailyActivity, (dayActivity: IDayStress) => {
				return dayActivity.previewDay == false;
			});
			expect(realDailyActivity.length).toEqual(expectedDailyActivityLength - expectedPreviewDays);

			// Test dates
			expect(_.first(dailyActivity).date.toString()).toEqual(expectedFirstDay);
			expect(_.last(realDailyActivity).date.toString()).toEqual(expectedLastRealDay);
			expect(_.last(previewDailyActivity).date.toString()).toEqual(expectedLastPreviewDay);
			expect(_.last(dailyActivity).date.toString()).toEqual(expectedLastPreviewDay);
			expect(_.find(dailyActivity, {ids: [rideId]}).date.toString()).toEqual(expectedRideDate);

			// Test stress scores
			let activity: IDayStress;

			activity = _.find(dailyActivity, {ids: [429628737]});
			expect(activity.powerStressScore.toFixed(3)).toEqual("112.749");

			activity = _.find(dailyActivity, {ids: [332833796]});
			expect(activity.trimpScore.toFixed(3)).toEqual("191.715");

			activity = _.find(dailyActivity, {ids: [873446053]});
			expect(activity.swimStressScore.toFixed(3)).toEqual("242.818");

			activity = _.find(dailyActivity, {ids: [873446053, 294909522]});
			expect(activity.finalStressScore.toFixed(3)).toEqual("384.027");

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});
	});

	it('should compute fitness trend', (done: Function) => {

		// Given
		const fakeTodayDate = "2015-12-01 12:00";
		const filterFitnessReadySpy = spyOn(activityService, 'filterFitnessReady')
			.and.returnValue(Promise.resolve(_TEST_FITNESS_READY_ACTIVITIES_));

		const getMomentSpy = spyOn(fitnessService, "getTodayMoment").and.returnValue(moment(fakeTodayDate, "YYYY-MM-DD hh:mm"));

		// When
		const promise: Promise<IDayFitnessTrend[]> = fitnessService.computeTrend(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		// Then
		promise.then((fitnessTrend: IDayFitnessTrend[]) => {

			expect(fitnessTrend).not.toBeNull();
			expect(getMomentSpy).toHaveBeenCalled();
			expect(filterFitnessReadySpy).toHaveBeenCalledTimes(1);

			// Test training load
			const lastRealDay = _.last(_.filter(fitnessTrend, (dayFitnessTrend: IDayFitnessTrend) => {
				return dayFitnessTrend.previewDay == false;
			}));
			expect(lastRealDay.atl.toFixed(5)).toEqual("13.74548");
			expect(lastRealDay.ctl.toFixed(5)).toEqual("47.19952");
			expect(lastRealDay.tsb.toFixed(5)).toEqual("33.45404");

			const lastPreviewDay = _.last(fitnessTrend);
			expect(lastPreviewDay.atl.toFixed(5)).toEqual("1.86025");
			expect(lastPreviewDay.ctl.toFixed(5)).toEqual("33.81994");
			expect(lastPreviewDay.tsb.toFixed(5)).toEqual("31.95969");

			// Test stress scores
			let activity: IDayFitnessTrend;

			activity = _.find(fitnessTrend, {ids: [429628737]});
			expect(activity.powerStressScore.toFixed(3)).toEqual("112.749");

			activity = _.find(fitnessTrend, {ids: [332833796]});
			expect(activity.trimpScore.toFixed(3)).toEqual("191.715");

			activity = _.find(fitnessTrend, {ids: [873446053]});
			expect(activity.swimStressScore.toFixed(3)).toEqual("242.818");

			activity = _.find(fitnessTrend, {ids: [873446053, 294909522]});
			expect(activity.finalStressScore.toFixed(3)).toEqual("384.027");

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});
});
