import * as moment from "moment";
import * as _ from "lodash";
import { TestBed } from "@angular/core/testing";
import { FitnessService } from "./fitness.service";
import { SyncedActivityModel } from "../../../../../../common/scripts/models/Sync";
import { ActivityService } from "../../../shared/services/activity/activity.service";
import { ActivityDao } from "../../../shared/dao/activity/activity.dao";
import { TEST_SYNCED_ACTIVITIES } from "../../../../shared-fixtures/activities-2015.fixture";
import { FitnessPreparedActivityModel } from "../models/fitness-prepared-activity.model";
import { DayFitnessTrendModel } from "../models/day-fitness-trend.model";
import { DayStressModel } from "../models/day-stress.model";
import { PeriodModel } from "../models/period.model";

function createFakeSyncedActivityModel(id: number, name: string, type: string, dateStr: string, avgWatts: number) {

	const fakeActivity = new SyncedActivityModel();
	fakeActivity.id = id;
	fakeActivity.name = name;
	fakeActivity.type = type;
	fakeActivity.display_type = type;
	fakeActivity.start_time = moment(dateStr, "YYYY-MM-DD").toISOString();
	fakeActivity.distance_raw = 30000;
	fakeActivity.moving_time_raw = 3600;
	fakeActivity.elapsed_time_raw = 3600;
	fakeActivity.elevation_gain_raw = 0;
	fakeActivity.extendedStats = {
		moveRatio: 1,
		cadenceData: null,
		elevationData: null,
		gradeData: null,
		heartRateData: null,
		paceData: null,
		speedData: null,
		toughnessScore: null,
		powerData: null
	};

	fakeActivity.hasPowerMeter = false;

	// If power given?
	if (_.isNumber(avgWatts)) {
		fakeActivity.extendedStats.powerData = {
			avgWatts: avgWatts,
			avgWattsPerKg: avgWatts / 70,
			hasPowerMeter: true,
			lowerQuartileWatts: avgWatts / 4,
			medianWatts: avgWatts / 2,
			powerStressScore: null,
			powerStressScorePerHour: null,
			powerZones: null,
			punchFactor: null,
			upperQuartileWatts: (avgWatts / 4) * 3,
			variabilityIndex: 1,
			weightedPower: avgWatts * 1.25,
			weightedWattsPerKg: avgWatts * 1.25 / 70,
		};
		fakeActivity.hasPowerMeter = true;
	}

	return fakeActivity;
}

describe("FitnessService", () => {

	let powerMeterEnable;
	let cyclingFtp;
	let swimEnable;
	let swimFtp;

	const todayDate = "2015-12-01 12:00";
	const momentDatePattern = "YYYY-MM-DD hh:mm";

	let _TEST_SYNCED_ACTIVITIES_: SyncedActivityModel[] = null;
	let fitnessService: FitnessService = null;
	let activityService: ActivityService = null;

	beforeEach(() => {

		TestBed.configureTestingModule({
			providers: [FitnessService, ActivityService, ActivityDao]
		});

		_TEST_SYNCED_ACTIVITIES_ = _.cloneDeep(TEST_SYNCED_ACTIVITIES);

		// Retrieve injected service
		fitnessService = TestBed.get(FitnessService);
		activityService = TestBed.get(ActivityService);

		powerMeterEnable = true;
		cyclingFtp = 150;
		swimEnable = true;
		swimFtp = 31;

		spyOn(fitnessService, "getTodayMoment").and.returnValue(moment(todayDate, momentDatePattern));

	});

	it("should be created", (done: Function) => {
		expect(fitnessService).toBeTruthy();
		done();
	});

	it("should prepare fitness activities w/ with PM=OFF & SWIM=OFF", (done: Function) => {

		// Given
		const expectedFitnessPreparedActivitiesLength = 138;
		const expectedTrimpScoredActivitiesLength = 90;
		const expectedPowerScoredActivitiesLength = 0;
		const expectedSwimScoredActivitiesLength = 0;

		powerMeterEnable = false;
		cyclingFtp = null;
		swimEnable = false;
		swimFtp = null;

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService
			.prepare(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		// Then
		promise.then((result: FitnessPreparedActivityModel[]) => {

			expect(result).not.toBeNull();
			expect(result.length).toEqual(expectedFitnessPreparedActivitiesLength);

			const trimpScoredActivities = _.filter(result, "trainingImpulseScore");
			const powerScoredActivities = _.filter(result, "powerStressScore");
			const swimScored = _.filter(result, "swimStressScore");

			expect(trimpScoredActivities.length).toEqual(expectedTrimpScoredActivitiesLength);
			expect(powerScoredActivities.length).toEqual(expectedPowerScoredActivitiesLength);
			expect(swimScored.length).toEqual(expectedSwimScoredActivitiesLength);

			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it("should prepare fitness activities w/ with PM=ON & SWIM=OFF", (done: Function) => {

		// Given
		const expectedFitnessPreparedActivitiesLength = 138;
		const expectedTrimpScoredActivitiesLength = 90;
		const expectedPowerScoredActivitiesLength = 6;
		const expectedSwimScoredActivitiesLength = 0;

		powerMeterEnable = true;
		cyclingFtp = 150;
		swimEnable = false;
		swimFtp = null;

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		// Then
		promise.then((result: FitnessPreparedActivityModel[]) => {

			expect(result).not.toBeNull();
			expect(result.length).toEqual(expectedFitnessPreparedActivitiesLength);

			const trimpScoredActivities = _.filter(result, "trainingImpulseScore");
			const powerScoredActivities = _.filter(result, "powerStressScore");
			const swimScored = _.filter(result, "swimStressScore");

			expect(trimpScoredActivities.length).toEqual(expectedTrimpScoredActivitiesLength);
			expect(powerScoredActivities.length).toEqual(expectedPowerScoredActivitiesLength);
			expect(swimScored.length).toEqual(expectedSwimScoredActivitiesLength);

			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it("should prepare fitness activities w/ PM=OFF & SWIM=ON", (done: Function) => {

		// Given
		const expectedFitnessPreparedActivitiesLength = 138;
		const expectedTrimpScoredActivitiesLength = 90;
		const expectedPowerScoredActivitiesLength = 0;
		const expectedSwimScoredActivitiesLength = 2;

		powerMeterEnable = false;
		cyclingFtp = null;
		swimEnable = true;
		swimFtp = 31;

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		// Then
		promise.then((result: FitnessPreparedActivityModel[]) => {

			expect(result).not.toBeNull();
			expect(result.length).toEqual(expectedFitnessPreparedActivitiesLength);

			const trimpScoredActivities = _.filter(result, "trainingImpulseScore");
			const powerScoredActivities = _.filter(result, "powerStressScore");
			const swimScored = _.filter(result, "swimStressScore");

			expect(trimpScoredActivities.length).toEqual(expectedTrimpScoredActivitiesLength);
			expect(powerScoredActivities.length).toEqual(expectedPowerScoredActivitiesLength);
			expect(swimScored.length).toEqual(expectedSwimScoredActivitiesLength);

			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it("should prepare fitness activities w/ PM=ON & SWIM=ON", (done: Function) => {

		// Given
		// const expectedFitnessPreparedActivitiesLength = 93;
		const expectedFitnessPreparedActivitiesLength = 138;
		const expectedTrimpScoredActivitiesLength = 90;
		const expectedPowerScoredActivitiesLength = 6;
		const expectedSwimScoredActivitiesLength = 2;

		powerMeterEnable = true;
		cyclingFtp = 150;
		swimEnable = true;
		swimFtp = 31;

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		// Then
		promise.then((result: FitnessPreparedActivityModel[]) => {

			expect(result).not.toBeNull();
			expect(result.length).toEqual(expectedFitnessPreparedActivitiesLength);

			const trimpScoredActivities = _.filter(result, "trainingImpulseScore");
			const powerScoredActivities = _.filter(result, "powerStressScore");
			const swimScored = _.filter(result, "swimStressScore");

			expect(trimpScoredActivities.length).toEqual(expectedTrimpScoredActivitiesLength);
			expect(powerScoredActivities.length).toEqual(expectedPowerScoredActivitiesLength);
			expect(swimScored.length).toEqual(expectedSwimScoredActivitiesLength);

			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it("should prepare fitness activities with proper TRIMP, PSS and SwimSS", (done: Function) => {

		// Given
		powerMeterEnable = true;
		cyclingFtp = 150;
		swimEnable = true;
		swimFtp = 31;

		spyOn(activityService.activityDao, "fetch").and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		// Then
		promise.then((result: FitnessPreparedActivityModel[]) => {

			expect(result).not.toBeNull();
			let activity: FitnessPreparedActivityModel;

			activity = _.find(result, {id: 429628737});
			expect(activity.powerStressScore.toFixed(3)).toEqual("112.749");

			activity = _.find(result, {id: 332833796});
			expect(activity.trainingImpulseScore.toFixed(3)).toEqual("191.715");

			activity = _.find(result, {id: 873446053});
			expect(activity.swimStressScore.toFixed(3)).toEqual("242.818");

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it("should prepare fitness activities w/ with PM=OFF & SWIM=OFF (History has only powered activities)", (done: Function) => {

		// Given
		const expectedFitnessPreparedActivitiesLength = 3;
		const expectedTrimpScoredActivitiesLength = 0;
		const expectedPowerScoredActivitiesLength = 0;
		const expectedSwimScoredActivitiesLength = 0;

		powerMeterEnable = false;
		cyclingFtp = null;
		swimEnable = false;
		swimFtp = null;

		const syncedActivityModels: SyncedActivityModel[] = [];
		syncedActivityModels.push(createFakeSyncedActivityModel(1,
			"SuperPoweredRide 01",
			"Ride",
			"2018-01-01",
			250));

		syncedActivityModels.push(createFakeSyncedActivityModel(2,
			"SuperPoweredRide 02",
			"Ride",
			"2018-01-15",
			275));

		syncedActivityModels.push(createFakeSyncedActivityModel(3,
			"SuperPoweredRide 03",
			"Ride",
			"2018-01-30",
			190));

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(syncedActivityModels));

		// When
		const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService
			.prepare(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		// Then
		promise.then((result: FitnessPreparedActivityModel[]) => {

			expect(result).not.toBeNull();
			expect(result.length).toEqual(expectedFitnessPreparedActivitiesLength);

			const trimpScoredActivities = _.filter(result, "trainingImpulseScore");
			const powerScoredActivities = _.filter(result, "powerStressScore");
			const swimScored = _.filter(result, "swimStressScore");

			expect(trimpScoredActivities.length).toEqual(expectedTrimpScoredActivitiesLength);
			expect(powerScoredActivities.length).toEqual(expectedPowerScoredActivitiesLength);
			expect(swimScored.length).toEqual(expectedSwimScoredActivitiesLength);

			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});
	});

	it("should provide athlete daily activity", (done: Function) => {

		// Given
		const rideId = 343080886;

		const expectedDailyActivityLength = 346;
		const expectedPreviewDays = 14;
		const expectedFirstDay = moment("2015-01-04", "YYYY-MM-DD").toDate().getTime();
		const expectedLastRealDay = moment("2015-12-01", "YYYY-MM-DD").toDate().getTime();
		const expectedLastPreviewDay = moment("2015-12-15", "YYYY-MM-DD").toDate().getTime();
		const expectedRideDate = moment("2015-07-10", "YYYY-MM-DD").toDate().getTime();

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<DayStressModel[]> = fitnessService.generateDailyStress(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		// Then
		promise.then((dailyActivity: DayStressModel[]) => {

			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
			expect(dailyActivity).not.toBeNull();

			// Test real & preview days
			expect(dailyActivity.length).toEqual(expectedDailyActivityLength);

			const previewDailyActivity = _.filter(dailyActivity, (dayActivity: DayStressModel) => {
				return dayActivity.previewDay === true;
			});
			expect(previewDailyActivity.length).toEqual(expectedPreviewDays);

			const realDailyActivity = _.filter(dailyActivity, (dayActivity: DayStressModel) => {
				return dayActivity.previewDay === false;
			});
			expect(realDailyActivity.length).toEqual(expectedDailyActivityLength - expectedPreviewDays);

			// Test dates
			expect(_.first(dailyActivity).date.getTime()).toEqual(expectedFirstDay);
			expect(_.last(realDailyActivity).date.getTime()).toEqual(expectedLastRealDay);
			expect(_.last(previewDailyActivity).date.getTime()).toEqual(expectedLastPreviewDay);
			expect(_.last(dailyActivity).date.getTime()).toEqual(expectedLastPreviewDay);
			expect(_.find(dailyActivity, {ids: [rideId]}).date.getTime()).toEqual(expectedRideDate);

			// Test stress scores
			let activity: DayStressModel;

			activity = _.find(dailyActivity, {ids: [429628737]});
			expect(activity.powerStressScore.toFixed(3)).toEqual("112.749");

			activity = _.find(dailyActivity, {ids: [332833796]});
			expect(activity.trainingImpulseScore.toFixed(3)).toEqual("191.715");

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

	it("should compute fitness trend", (done: Function) => {

		// Given
		const expectedLength = 346;

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<DayFitnessTrendModel[]> = fitnessService.computeTrend(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		// Then
		promise.then((fitnessTrend: DayFitnessTrendModel[]) => {

			expect(fitnessTrend).not.toBeNull();

			expect(fitnessTrend.length).toEqual(expectedLength);
			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

			// Test training load
			const lastRealDay = _.last(_.filter(fitnessTrend, (dayFitnessTrend: DayFitnessTrendModel) => {
				return dayFitnessTrend.previewDay === false;
			}));
			expect(lastRealDay.atl.toFixed(5)).toEqual("13.74548");
			expect(lastRealDay.ctl.toFixed(5)).toEqual("47.19952");
			expect(lastRealDay.tsb.toFixed(5)).toEqual("33.45404");

			const lastPreviewDay = _.last(fitnessTrend);
			expect(lastPreviewDay.atl.toFixed(5)).toEqual("1.86025");
			expect(lastPreviewDay.ctl.toFixed(5)).toEqual("33.81994");
			expect(lastPreviewDay.tsb.toFixed(5)).toEqual("31.95969");

			// Test stress scores
			let activity: DayFitnessTrendModel;

			activity = _.find(fitnessTrend, {ids: [429628737]});
			expect(activity.powerStressScore.toFixed(3)).toEqual("112.749");

			activity = _.find(fitnessTrend, {ids: [332833796]});
			expect(activity.trainingImpulseScore.toFixed(3)).toEqual("191.715");

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

	it("should convert -7 days date based period \"from/to\" to \"start/end\" fitness trends indexes", (done: Function) => {


		// Given
		spyOn(activityService.activityDao, "fetch").and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		const period: PeriodModel = {
			from: moment(todayDate, momentDatePattern).subtract(7, "days").toDate(), // Nov 24 2015
			to: null // Indicate we use "Last period of TIME"
		};

		const promise: Promise<DayFitnessTrendModel[]> = fitnessService.computeTrend(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		promise.then((fitnessTrend: DayFitnessTrendModel[]) => {

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

	it("should convert -6 weeks date based period \"from/to\" to \"start/end\" fitness trends indexes", (done: Function) => {

		// Given
		spyOn(activityService.activityDao, "fetch").and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		const period: PeriodModel = {
			from: moment(todayDate, momentDatePattern).subtract(6, "weeks").toDate(), // (= Oct 20 2015)
			to: null // Indicate we use "Last period of TIME"
		};

		const promise: Promise<DayFitnessTrendModel[]> = fitnessService.computeTrend(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		promise.then((fitnessTrend: DayFitnessTrendModel[]) => {

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

	it("should convert date based period \"from/to\" to \"start/end\" fitness trends indexes", (done: Function) => {

		// Given
		spyOn(activityService.activityDao, "fetch").and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		const period: PeriodModel = {
			from: moment("2015-07-01", DayFitnessTrendModel.DATE_FORMAT).startOf("day").toDate(),
			to: moment("2015-09-30", DayFitnessTrendModel.DATE_FORMAT).startOf("day").toDate(),
		};

		const promise: Promise<DayFitnessTrendModel[]> = fitnessService.computeTrend(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		promise.then((fitnessTrend: DayFitnessTrendModel[]) => {


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

	it("should failed when find indexes of \"from > to\" date", (done: Function) => {

		// Given
		spyOn(activityService.activityDao, "fetch").and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		const period: PeriodModel = {
			from: moment("2015-06-01", DayFitnessTrendModel.DATE_FORMAT).toDate(),
			to: moment("2015-05-01", DayFitnessTrendModel.DATE_FORMAT).toDate()
		};

		const promise: Promise<DayFitnessTrendModel[]> = fitnessService.computeTrend(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		// When, Then
		promise.then((fitnessTrend: DayFitnessTrendModel[]) => {

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

	it("should failed when find index of FROM which do not exists ", (done: Function) => {

		// Given
		spyOn(activityService.activityDao, "fetch").and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		const period: PeriodModel = {
			from: moment("2014-06-01", DayFitnessTrendModel.DATE_FORMAT).toDate(), // Fake
			to: moment("2015-05-01", DayFitnessTrendModel.DATE_FORMAT).toDate()
		};

		const promise: Promise<DayFitnessTrendModel[]> = fitnessService.computeTrend(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		// When, Then
		promise.then((fitnessTrend: DayFitnessTrendModel[]) => {

			let error = null;
			try {
				fitnessService.indexesOf(period, fitnessTrend);
			} catch (e) {
				error = e;
			}

			expect(error).not.toBeNull();
			expect(error).toBe("No start activity index found for this FROM date");
			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it("should failed when find index of TO which do not exists ", (done: Function) => {

		// Given
		spyOn(activityService.activityDao, "fetch").and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		const period: PeriodModel = {
			from: moment("2015-06-01", DayFitnessTrendModel.DATE_FORMAT).toDate(),
			to: moment("2018-05-01", DayFitnessTrendModel.DATE_FORMAT).toDate() // Fake
		};

		const promise: Promise<DayFitnessTrendModel[]> = fitnessService.computeTrend(powerMeterEnable, cyclingFtp, swimEnable, swimFtp);

		// When, Then
		promise.then((fitnessTrend: DayFitnessTrendModel[]) => {

			let error = null;
			try {
				fitnessService.indexesOf(period, fitnessTrend);
			} catch (e) {
				error = e;
			}

			expect(error).not.toBeNull();
			expect(error).toBe("No end activity index found for this TO date");
			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

});
