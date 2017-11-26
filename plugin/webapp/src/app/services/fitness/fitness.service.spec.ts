import * as moment from "moment";
import * as _ from "lodash";
import { TestBed } from '@angular/core/testing';
import { FitnessService, IDayFitnessTrend, IDayStress, IPeriod } from './fitness.service';
import { TEST_SYNCED_ACTIVITIES } from "../../../fixtures/activities";
import { ActivityService, IFitnessReadyActivity } from "../activity/activity.service";
import { ActivityDao } from "../../dao/activity/activity.dao";

describe('FitnessService', () => {

	const powerMeterEnable = true;
	const cyclingFtp = 150;
	const swimEnable = true;
	const swimFtp = 31;

	const todayDate = "2015-12-01 12:00";
	const momentDatePattern = "YYYY-MM-DD hh:mm";

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

		spyOn(fitnessService, "getTodayMoment").and.returnValue(moment(todayDate, momentDatePattern));

		provideFitnessReadyTestData(powerMeterEnable, cyclingFtp, swimEnable, swimFtp)
			.then((fitnessReadyActivities: IFitnessReadyActivity[]) => {
				_TEST_FITNESS_READY_ACTIVITIES_ = fitnessReadyActivities;
				done();
			});
	});

	it('should be created', (done: Function) => {
		expect(fitnessService).toBeTruthy();
		done();
	});

	it('should provide athlete daily activity with rest and active days', (done: Function) => {

		// Given
		const rideId = 343080886;

		const expectedDailyActivityLength = 346;
		const expectedPreviewDays = 14;
		const expectedFirstDay = "Sun Jan 04 2015 00:00:00 GMT+0100 (Romance Standard Time)";
		const expectedLastRealDay = "Tue Dec 01 2015 00:00:00 GMT+0100 (Romance Standard Time)";
		const expectedLastPreviewDay = "Tue Dec 15 2015 00:00:00 GMT+0100 (Romance Standard Time)";
		const expectedRideDate = "Fri Jul 10 2015 00:00:00 GMT+0200 (Romance Daylight Time)";

		const filterFitnessReadySpy = spyOn(activityService, 'filterFitnessReady')
			.and.returnValue(Promise.resolve(_TEST_FITNESS_READY_ACTIVITIES_));

		// When
		const promise: Promise<IDayStress[]> = fitnessService.generateDailyStress(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		// Then
		promise.then((dailyActivity: IDayStress[]) => {

			expect(filterFitnessReadySpy).toHaveBeenCalledTimes(1);
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
		const expectedLength = 346;
		const filterFitnessReadySpy = spyOn(activityService, 'filterFitnessReady')
			.and.returnValue(Promise.resolve(_TEST_FITNESS_READY_ACTIVITIES_));

		// When
		const promise: Promise<IDayFitnessTrend[]> = fitnessService.computeTrend(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		// Then
		promise.then((fitnessTrend: IDayFitnessTrend[]) => {

			expect(fitnessTrend).not.toBeNull();

			expect(fitnessTrend.length).toEqual(expectedLength);
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

	it('should convert -7 days date based period "from/to" to "start/end" fitness trends indexes', (done: Function) => {


		// Given
		spyOn(activityService, 'filterFitnessReady').and.returnValue(Promise.resolve(_TEST_FITNESS_READY_ACTIVITIES_));

		const period: IPeriod = {
			from: moment(todayDate, momentDatePattern).subtract(7, "days").toDate(), // Nov 24 2015
			to: null // Indicate we use "Last period of TIME"
		};

		const promise: Promise<IDayFitnessTrend[]> = fitnessService.computeTrend(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		promise.then((fitnessTrend: IDayFitnessTrend[]) => {

			// When
			const indexes: { start: number; end: number } = fitnessService.indexesOf(period, fitnessTrend);

			// Then
			expect(indexes).not.toBeNull();
			expect(indexes.start).toEqual(324); // Should be Nov 24 2015
			expect(indexes.end).toEqual(345); // Last preview day index
			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it('should convert -6 weeks date based period "from/to" to "start/end" fitness trends indexes', (done: Function) => {

		// Given
		spyOn(activityService, 'filterFitnessReady').and.returnValue(Promise.resolve(_TEST_FITNESS_READY_ACTIVITIES_));

		const period: IPeriod = {
			from: moment(todayDate, momentDatePattern).subtract(6, "weeks").toDate(), // (= Oct 20 2015)
			to: null // Indicate we use "Last period of TIME"
		};

		const promise: Promise<IDayFitnessTrend[]> = fitnessService.computeTrend(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		promise.then((fitnessTrend: IDayFitnessTrend[]) => {

			// When
			const indexes: { start: number; end: number } = fitnessService.indexesOf(period, fitnessTrend);

			// Then
			expect(indexes.start).toEqual(289); // Should be Oct 20 2015 index
			expect(indexes.end).toEqual(345); // Last preview day index

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});
	});

	it('should convert date based period "from/to" to "start/end" fitness trends indexes', (done: Function) => {

		// Given
		spyOn(activityService, 'filterFitnessReady').and.returnValue(Promise.resolve(_TEST_FITNESS_READY_ACTIVITIES_));

		const period: IPeriod = {
			from: moment("2015-07-01", "YYYY-MM-DD").startOf("day").toDate(),
			to: moment("2015-09-30", "YYYY-MM-DD").startOf("day").toDate(),
		};

		const promise: Promise<IDayFitnessTrend[]> = fitnessService.computeTrend(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		promise.then((fitnessTrend: IDayFitnessTrend[]) => {


			// When
			const indexes: { start: number; end: number } = fitnessService.indexesOf(period, fitnessTrend);

			// Then
			expect(indexes).not.toBeNull();
			expect(indexes.start).toEqual(178);
			expect(indexes.end).toEqual(269);

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it('should failed when find indexes of "from > to" date', (done: Function) => {

		// Given
		spyOn(activityService, 'filterFitnessReady').and.returnValue(Promise.resolve(_TEST_FITNESS_READY_ACTIVITIES_));

		const period: IPeriod = {
			from: moment("2015-06-01", "YYYY-MM-DD").toDate(),
			to: moment("2015-05-01", "YYYY-MM-DD").toDate()
		};

		const promise: Promise<IDayFitnessTrend[]> = fitnessService.computeTrend(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		// When, Then
		promise.then((fitnessTrend: IDayFitnessTrend[]) => {

			let error = null;
			try {
				fitnessService.indexesOf(period, fitnessTrend);
			} catch (e) {
				error = e;
			}

			expect(error).not.toBeNull();
			expect(error).toBe("FROM cannot be upper than TO date");
			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});
});
