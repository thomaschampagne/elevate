import * as moment from "moment";
import * as _ from "lodash";
import { TestBed } from "@angular/core/testing";
import { FitnessService } from "./fitness.service";
import { ActivityService } from "../../../shared/services/activity/activity.service";
import { ActivityDao } from "../../../shared/dao/activity/activity.dao";
import { TEST_SYNCED_ACTIVITIES } from "../../../../shared-fixtures/activities-2015.fixture";
import { FitnessPreparedActivityModel } from "../models/fitness-prepared-activity.model";
import { Gender } from "../../../shared/enums/gender.enum";
import { HeartRateImpulseMode } from "../enums/heart-rate-impulse-mode.enum";
import { FitnessUserSettingsModel } from "../models/fitness-user-settings.model";
import { DayFitnessTrendModel } from "../models/day-fitness-trend.model";
import { DayStressModel } from "../models/day-stress.model";
import { AppError } from "../../../shared/models/app-error.model";
import { SyncedActivityModel } from "../../../../../../shared/models/sync/synced-activity.model";
import { InitializedFitnessTrendModel } from "../models/initialized-fitness-trend.model";

function createFakeSyncedActivityModel(id: number, name: string, type: string, dateStr: string, avgHr: number, avgWatts: number) {

	const fakeActivity = new SyncedActivityModel();
	fakeActivity.id = id;
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

	// If avgHr given? Generate fake stats
	if (_.isNumber(avgHr)) {
		fakeActivity.extendedStats.heartRateData = {
			HRSS: avgHr,
			HRSSPerHour: avgHr / 90,
			TRIMP: avgHr * 2,
			TRIMPPerHour: avgHr / 60,
			best20min: avgHr * 1.5,
			activityHeartRateReserve: avgHr * 0.25,
			activityHeartRateReserveMax: avgHr / 2,
			averageHeartRate: avgHr,
			heartRateZones: null,
			lowerQuartileHeartRate: avgHr / 4,
			maxHeartRate: avgHr * 1.5,
			medianHeartRate: avgHr / 2,
			upperQuartileHeartRate: (avgHr / 4) * 3
		};
	}

	// If power given? Generate fake stats
	if (_.isNumber(avgWatts)) {
		fakeActivity.extendedStats.powerData = {
			avgWatts: avgWatts,
			avgWattsPerKg: avgWatts / 70,
			hasPowerMeter: true,
			lowerQuartileWatts: avgWatts / 4,
			medianWatts: avgWatts / 2,
			powerStressScore: avgWatts * 3,
			powerStressScorePerHour: avgWatts * 3,
			powerZones: null,
			punchFactor: avgWatts * 4,
			upperQuartileWatts: (avgWatts / 4) * 3,
			variabilityIndex: 1,
			weightedPower: avgWatts * 1.25,
			best20min: avgWatts * 1.5,
			bestEightyPercent: avgWatts * 1.2,
			weightedWattsPerKg: avgWatts * 1.25 / 70,
		};
		fakeActivity.hasPowerMeter = true;
	}

	return fakeActivity;
}

describe("FitnessService", () => {

	const todayDate = "2015-12-01 12:00";
	const momentDatePattern = "YYYY-MM-DD hh:mm";

	const FITNESS_USER_SETTINGS_MODEL: FitnessUserSettingsModel = {
		userGender: Gender.MEN,
		userMaxHr: 190,
		userRestHr: 60,
		userLactateThreshold: {
			default: 163,
			cycling: null,
			running: null
		},
		cyclingFtp: 150,
		swimFtp: 31,
	};

	let fitnessUserSettingsModel: FitnessUserSettingsModel;
	let heartRateImpulseMode: HeartRateImpulseMode;
	let powerMeterEnable;
	let swimEnable;

	let _TEST_SYNCED_ACTIVITIES_: SyncedActivityModel[] = null;
	let fitnessService: FitnessService = null;
	let activityService: ActivityService = null;

	beforeEach((done: Function) => {

		TestBed.configureTestingModule({
			providers: [FitnessService, ActivityService, ActivityDao]
		});

		_TEST_SYNCED_ACTIVITIES_ = _.cloneDeep(TEST_SYNCED_ACTIVITIES);

		// Retrieve injected service
		fitnessService = TestBed.get(FitnessService);
		activityService = TestBed.get(ActivityService);

		// Set default fitness users settings
		fitnessUserSettingsModel = _.cloneDeep(FITNESS_USER_SETTINGS_MODEL);
		heartRateImpulseMode = HeartRateImpulseMode.HRSS;

		// Enable PSS and SSS by default
		powerMeterEnable = true;
		swimEnable = true;

		spyOn(fitnessService, "getTodayMoment").and.returnValue(moment(todayDate, momentDatePattern));

		done();
	});

	it("should be created", (done: Function) => {
		expect(fitnessService).toBeTruthy();
		done();
	});

	// Resolve proper LTHR along user prefs and activity type
	it("should resolve LTHR without user LTHR preferences, activityType='Ride'", (done: Function) => {

		// Given
		const activityType = "Ride";
		const expectedLTHR = 170.5;
		fitnessUserSettingsModel.userLactateThreshold = {
			default: null,
			cycling: null,
			running: null
		};

		// When
		const lthr = fitnessService.resolveLTHR(activityType, fitnessUserSettingsModel);

		// Then
		expect(lthr).toEqual(expectedLTHR);
		done();
	});

	it("should resolve LTHR without user LTHR preferences (empty), activityType='Ride'", (done: Function) => {

		// Given
		const activityType = "Ride";
		const expectedLTHR = 170.5;
		fitnessUserSettingsModel.userLactateThreshold = null;

		// When
		const lthr = fitnessService.resolveLTHR(activityType, fitnessUserSettingsModel);

		// Then
		expect(lthr).toEqual(expectedLTHR);
		done();
	});

	it("should resolve LTHR without user LTHR preferences, activityType='Run'", (done: Function) => {

		// Given
		const activityType = "Run";
		const expectedLTHR = 170.5;
		fitnessUserSettingsModel.userLactateThreshold = {
			default: null,
			cycling: null,
			running: null
		};

		// When
		const lthr = fitnessService.resolveLTHR(activityType, fitnessUserSettingsModel);

		// Then
		expect(lthr).toEqual(expectedLTHR);
		done();
	});

	it("should resolve LTHR without user LTHR preferences, activityType='Rowing'", (done: Function) => {

		// Given
		const activityType = "Rowing";
		const expectedLTHR = 163;
		fitnessUserSettingsModel.userLactateThreshold = {
			default: 163,
			cycling: 175,
			running: 185
		};

		// When
		const lthr = fitnessService.resolveLTHR(activityType, fitnessUserSettingsModel);

		// Then
		expect(lthr).toEqual(expectedLTHR);
		done();
	});

	it("should resolve LTHR with user Default LTHR=163, activityType='Ride'", (done: Function) => {

		// Given
		const activityType = "Ride";
		const expectedLTHR = 163;
		fitnessUserSettingsModel.userLactateThreshold = {
			default: 163,
			cycling: null,
			running: null
		};

		// When
		const lthr = fitnessService.resolveLTHR(activityType, fitnessUserSettingsModel);

		// Then
		expect(lthr).toEqual(expectedLTHR);
		done();
	});

	it("should resolve LTHR with user Default LTHR=163, activityType='Run'", (done: Function) => {

		// Given
		const activityType = "Run";
		const expectedLTHR = 163;
		fitnessUserSettingsModel.userLactateThreshold = {
			default: 163,
			cycling: null,
			running: null
		};

		// When
		const lthr = fitnessService.resolveLTHR(activityType, fitnessUserSettingsModel);

		// Then
		expect(lthr).toEqual(expectedLTHR);
		done();
	});

	it("should resolve LTHR with user Default LTHR=163, activityType='Rowing'", (done: Function) => {

		// Given
		const activityType = "Rowing";
		const expectedLTHR = 163;
		fitnessUserSettingsModel.userLactateThreshold = {
			default: 163,
			cycling: null,
			running: null
		};

		// When
		const lthr = fitnessService.resolveLTHR(activityType, fitnessUserSettingsModel);

		// Then
		expect(lthr).toEqual(expectedLTHR);
		done();
	});

	it("should resolve LTHR with user Default LTHR=163, Cycling LTHR=175, activityType='Ride'", (done: Function) => {

		// Given
		const activityType = "Ride";
		const expectedLTHR = 175;
		fitnessUserSettingsModel.userLactateThreshold = {
			default: 163,
			cycling: 175,
			running: null
		};

		// When
		const lthr = fitnessService.resolveLTHR(activityType, fitnessUserSettingsModel);

		// Then
		expect(lthr).toEqual(expectedLTHR);
		done();
	});

	it("should resolve LTHR with user Cycling LTHR=175, activityType='VirtualRide'", (done: Function) => {

		// Given
		const activityType = "VirtualRide";
		const expectedLTHR = 175;
		fitnessUserSettingsModel.userLactateThreshold = {
			default: null,
			cycling: 175,
			running: null
		};

		// When
		const lthr = fitnessService.resolveLTHR(activityType, fitnessUserSettingsModel);

		// Then
		expect(lthr).toEqual(expectedLTHR);
		done();
	});

	it("should resolve LTHR with user Cycling LTHR=175, Running LTHR=185, activityType='EBikeRide'", (done: Function) => {

		// Given
		const activityType = "EBikeRide";
		const expectedLTHR = 175;
		fitnessUserSettingsModel.userLactateThreshold = {
			default: null,
			cycling: 175,
			running: 185
		};

		// When
		const lthr = fitnessService.resolveLTHR(activityType, fitnessUserSettingsModel);

		// Then
		expect(lthr).toEqual(expectedLTHR);
		done();
	});

	it("should resolve LTHR with user Cycling LTHR=175, Running LTHR=185, activityType='Run'", (done: Function) => {

		// Given
		const activityType = "Run";
		const expectedLTHR = 185;
		fitnessUserSettingsModel.userLactateThreshold = {
			default: null,
			cycling: 175,
			running: 185
		};

		// When
		const lthr = fitnessService.resolveLTHR(activityType, fitnessUserSettingsModel);

		// Then
		expect(lthr).toEqual(expectedLTHR);
		done();
	});

	it("should resolve LTHR with user Default LTHR=163, Cycling LTHR=175, Running LTHR=185, activityType='Run'", (done: Function) => {

		// Given
		const activityType = "Run";
		const expectedLTHR = 185;
		fitnessUserSettingsModel.userLactateThreshold = {
			default: 163,
			cycling: 175,
			running: 185
		};

		// When
		const lthr = fitnessService.resolveLTHR(activityType, fitnessUserSettingsModel);

		// Then
		expect(lthr).toEqual(expectedLTHR);
		done();
	});

	it("should resolve LTHR with user Default LTHR=163, Cycling LTHR=175, Running LTHR=185, activityType='Rowing'", (done: Function) => {

		// Given
		const activityType = "Rowing";
		const expectedLTHR = 163;
		fitnessUserSettingsModel.userLactateThreshold = {
			default: 163,
			cycling: 175,
			running: 185
		};

		// When
		const lthr = fitnessService.resolveLTHR(activityType, fitnessUserSettingsModel);

		// Then
		expect(lthr).toEqual(expectedLTHR);
		done();
	});

	// Compute Heart Rate Stress Score (HRSS)
	it("should compute hrSS", (done: Function) => {

		// Given
		const activityTrainingImpulse = 333;
		const expectedStressScore = 239;

		// When
		const heartRateStressScore = fitnessService.computeHeartRateStressScore(fitnessUserSettingsModel.userGender,
			fitnessUserSettingsModel.userMaxHr,
			fitnessUserSettingsModel.userRestHr,
			fitnessUserSettingsModel.userLactateThreshold.default,
			activityTrainingImpulse);

		// Then
		expect(Math.floor(heartRateStressScore)).toEqual(expectedStressScore);
		done();
	});

	it("should compute hrSS without lactate threshold given (has to use Karvonen formula with 85% of HRR)", (done: Function) => {

		// Given
		fitnessUserSettingsModel.userLactateThreshold.default = 170.5;
		const activityTrainingImpulse = 333;
		const expectedStressScore = 199;

		// When
		const heartRateStressScore = fitnessService.computeHeartRateStressScore(fitnessUserSettingsModel.userGender,
			fitnessUserSettingsModel.userMaxHr,
			fitnessUserSettingsModel.userRestHr,
			fitnessUserSettingsModel.userLactateThreshold.default,
			activityTrainingImpulse);

		// Then
		expect(Math.floor(heartRateStressScore)).toEqual(expectedStressScore);

		done();
	});

	// Prepare fitness activities
	it("should prepare fitness activities w/ with PM=OFF & SWIM=OFF & HR_Mode=TRIMP", (done: Function) => {

		// Given
		const expectedFitnessPreparedActivitiesLength = 138;
		const expectedTrimpScoredActivitiesLength = 90;
		const expectedPowerScoredActivitiesLength = 0;
		const expectedSwimScoredActivitiesLength = 0;

		heartRateImpulseMode = HeartRateImpulseMode.TRIMP;
		powerMeterEnable = false;
		swimEnable = false;

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
			heartRateImpulseMode,
			powerMeterEnable,
			swimEnable);

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

	it("should prepare fitness activities (only heart rate based activities) w/ PM=OFF & SWIM=OFF & HR_Mode=TRIMP", (done: Function) => {

		// Given
		const expectedFitnessPreparedActivitiesLength = 3;
		const expectedHeartRateStressScoredActivitiesLength = 0;
		const expectedTrimpScoredActivitiesLength = 3;
		const expectedPowerScoredActivitiesLength = 0;
		const expectedSwimScoredActivitiesLength = 0;

		heartRateImpulseMode = HeartRateImpulseMode.TRIMP;
		powerMeterEnable = false;
		swimEnable = false;

		const syncedActivityModels: SyncedActivityModel[] = [];
		syncedActivityModels.push(createFakeSyncedActivityModel(1,
			"SuperHeartRateRide 01",
			"Ride",
			"2018-01-01",
			150,
			null));

		syncedActivityModels.push(createFakeSyncedActivityModel(2,
			"SuperHeartRateRide 02",
			"Ride",
			"2018-01-15",
			180,
			null));

		syncedActivityModels.push(createFakeSyncedActivityModel(3,
			"SuperHeartRateRide 03",
			"Ride",
			"2018-01-30",
			135,
			null));

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(syncedActivityModels));

		// When
		const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
			heartRateImpulseMode, powerMeterEnable, swimEnable);

		// Then
		promise.then((result: FitnessPreparedActivityModel[]) => {

			expect(result).not.toBeNull();
			expect(result.length).toEqual(expectedFitnessPreparedActivitiesLength);

			const hearRateStressScoredActivities = _.filter(result, "heartRateStressScore");
			const trimpScoredActivities = _.filter(result, "trainingImpulseScore");
			const powerScoredActivities = _.filter(result, "powerStressScore");
			const swimScored = _.filter(result, "swimStressScore");

			expect(hearRateStressScoredActivities.length).toEqual(expectedHeartRateStressScoredActivitiesLength);
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

	it("should prepare fitness activities w/ PM=ON & SWIM=ON & HR_Mode=HRSS", (done: Function) => {

		// Given
		const expectedFitnessPreparedActivitiesLength = 138;
		const expectedHeartRateStressScoredActivitiesLength = 90;
		const expectedPowerScoredActivitiesLength = 6;
		const expectedSwimScoredActivitiesLength = 2;

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));


		// When
		const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
			heartRateImpulseMode, powerMeterEnable, swimEnable);

		// Then
		promise.then((result: FitnessPreparedActivityModel[]) => {

			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
			expect(result).not.toBeNull();
			expect(result.length).toEqual(expectedFitnessPreparedActivitiesLength);

			const hearRateStressScoredActivities = _.filter(result, "heartRateStressScore");
			const powerScoredActivities = _.filter(result, "powerStressScore");
			const swimScored = _.filter(result, "swimStressScore");

			expect(hearRateStressScoredActivities.length).toEqual(expectedHeartRateStressScoredActivitiesLength);
			expect(powerScoredActivities.length).toEqual(expectedPowerScoredActivitiesLength);
			expect(swimScored.length).toEqual(expectedSwimScoredActivitiesLength);


			let activity: FitnessPreparedActivityModel;

			activity = _.find(result, {id: 429628737});
			expect(_.floor(activity.powerStressScore, 3)).toEqual(112.749);

			activity = _.find(result, {id: 332833796});
			expect(_.floor(activity.heartRateStressScore, 3)).toEqual(137.647);
			expect(activity.trainingImpulseScore).toBeUndefined();

			activity = _.find(result, {id: 873446053});
			expect(_.floor(activity.swimStressScore, 3)).toEqual(242.818);

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it("should prepare fitness activities w/ PM=ON & SWIM=OFF & HR_Mode=HRSS", (done: Function) => {

		// Given
		const expectedFitnessPreparedActivitiesLength = 138;
		const expectedHeartRateStressScoredActivitiesLength = 90;
		const expectedTrimpScoredActivitiesLength = 0;
		const expectedPowerScoredActivitiesLength = 6;
		const expectedSwimScoredActivitiesLength = 0;

		swimEnable = false;

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
			heartRateImpulseMode, powerMeterEnable, swimEnable);

		// Then
		promise.then((result: FitnessPreparedActivityModel[]) => {

			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
			expect(result).not.toBeNull();
			expect(result.length).toEqual(expectedFitnessPreparedActivitiesLength);

			const hearRateStressScoredActivities = _.filter(result, "heartRateStressScore");
			const trimpScoredActivities = _.filter(result, "trainingImpulseScore");
			const powerScoredActivities = _.filter(result, "powerStressScore");
			const swimScored = _.filter(result, "swimStressScore");

			expect(hearRateStressScoredActivities.length).toEqual(expectedHeartRateStressScoredActivitiesLength);
			expect(trimpScoredActivities.length).toEqual(expectedTrimpScoredActivitiesLength);
			expect(powerScoredActivities.length).toEqual(expectedPowerScoredActivitiesLength);
			expect(swimScored.length).toEqual(expectedSwimScoredActivitiesLength);


			let activity: FitnessPreparedActivityModel;

			activity = _.find(result, {id: 429628737});
			expect(_.floor(activity.powerStressScore, 3)).toEqual(112.749);

			activity = _.find(result, {id: 332833796});
			expect(_.floor(activity.heartRateStressScore, 3)).toEqual(137.647);
			expect(activity.trainingImpulseScore).toBeUndefined();

			activity = _.find(result, {id: 873446053});
			expect(activity.swimStressScore).toBeUndefined();

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it("should prepare fitness activities w/ PM=OFF & SWIM=ON & HR_Mode=HRSS", (done: Function) => {

		// Given
		const expectedFitnessPreparedActivitiesLength = 138;
		const expectedHeartRateStressScoredActivitiesLength = 90;
		const expectedTrimpScoredActivitiesLength = 0;
		const expectedPowerScoredActivitiesLength = 0;
		const expectedSwimScoredActivitiesLength = 2;

		powerMeterEnable = false;

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
			heartRateImpulseMode, powerMeterEnable, swimEnable);

		// Then
		promise.then((result: FitnessPreparedActivityModel[]) => {

			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
			expect(result).not.toBeNull();
			expect(result.length).toEqual(expectedFitnessPreparedActivitiesLength);

			const hearRateStressScoredActivities = _.filter(result, "heartRateStressScore");
			const trimpScoredActivities = _.filter(result, "trainingImpulseScore");
			const powerScoredActivities = _.filter(result, "powerStressScore");
			const swimScored = _.filter(result, "swimStressScore");

			expect(hearRateStressScoredActivities.length).toEqual(expectedHeartRateStressScoredActivitiesLength);
			expect(trimpScoredActivities.length).toEqual(expectedTrimpScoredActivitiesLength);
			expect(powerScoredActivities.length).toEqual(expectedPowerScoredActivitiesLength);
			expect(swimScored.length).toEqual(expectedSwimScoredActivitiesLength);


			let activity: FitnessPreparedActivityModel;

			activity = _.find(result, {id: 429628737});
			expect(activity.powerStressScore).toBeUndefined();

			activity = _.find(result, {id: 332833796});
			expect(_.floor(activity.heartRateStressScore, 3)).toEqual(137.647);
			expect(activity.trainingImpulseScore).toBeUndefined();

			activity = _.find(result, {id: 873446053});
			expect(_.floor(activity.swimStressScore, 3)).toEqual(242.818);

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it("should prepare fitness activities w/ PM=OFF & SWIM=OFF & HR_Mode=HRSS", (done: Function) => {

		// Given
		const expectedFitnessPreparedActivitiesLength = 138;
		const expectedHeartRateStressScoredActivitiesLength = 90;
		const expectedTrimpScoredActivitiesLength = 0;
		const expectedPowerScoredActivitiesLength = 0;
		const expectedSwimScoredActivitiesLength = 0;

		powerMeterEnable = false;
		swimEnable = false;

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
			heartRateImpulseMode, powerMeterEnable, swimEnable);

		// Then
		promise.then((result: FitnessPreparedActivityModel[]) => {

			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
			expect(result).not.toBeNull();
			expect(result.length).toEqual(expectedFitnessPreparedActivitiesLength);

			const hearRateStressScoredActivities = _.filter(result, "heartRateStressScore");
			const trimpScoredActivities = _.filter(result, "trainingImpulseScore");
			const powerScoredActivities = _.filter(result, "powerStressScore");
			const swimScored = _.filter(result, "swimStressScore");

			expect(hearRateStressScoredActivities.length).toEqual(expectedHeartRateStressScoredActivitiesLength);
			expect(trimpScoredActivities.length).toEqual(expectedTrimpScoredActivitiesLength);
			expect(powerScoredActivities.length).toEqual(expectedPowerScoredActivitiesLength);
			expect(swimScored.length).toEqual(expectedSwimScoredActivitiesLength);


			let activity: FitnessPreparedActivityModel;

			activity = _.find(result, {id: 429628737});
			expect(activity.powerStressScore).toBeUndefined();

			activity = _.find(result, {id: 332833796});
			expect(_.floor(activity.heartRateStressScore, 3)).toEqual(137.647);
			expect(activity.trainingImpulseScore).toBeUndefined();

			activity = _.find(result, {id: 873446053});
			expect(activity.swimStressScore).toBeUndefined();

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});
	});

	it("should prepare fitness activities w/ cyclingFtp=null & swimFtp={a_value} & HR_Mode=HRSS", (done: Function) => {

		// Given
		const expectedFitnessPreparedActivitiesLength = 138;
		const expectedHeartRateStressScoredActivitiesLength = 90;
		const expectedTrimpScoredActivitiesLength = 0;
		const expectedPowerScoredActivitiesLength = 0;
		const expectedSwimScoredActivitiesLength = 2;

		fitnessUserSettingsModel.cyclingFtp = null;

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
			heartRateImpulseMode, powerMeterEnable, swimEnable);

		// Then
		promise.then((result: FitnessPreparedActivityModel[]) => {

			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
			expect(result).not.toBeNull();
			expect(result.length).toEqual(expectedFitnessPreparedActivitiesLength);

			const hearRateStressScoredActivities = _.filter(result, "heartRateStressScore");
			const trimpScoredActivities = _.filter(result, "trainingImpulseScore");
			const powerScoredActivities = _.filter(result, "powerStressScore");
			const swimScored = _.filter(result, "swimStressScore");

			expect(hearRateStressScoredActivities.length).toEqual(expectedHeartRateStressScoredActivitiesLength);
			expect(trimpScoredActivities.length).toEqual(expectedTrimpScoredActivitiesLength);
			expect(powerScoredActivities.length).toEqual(expectedPowerScoredActivitiesLength);
			expect(swimScored.length).toEqual(expectedSwimScoredActivitiesLength);


			let activity: FitnessPreparedActivityModel;

			activity = _.find(result, {id: 429628737});
			expect(activity.powerStressScore).toBeUndefined();

			activity = _.find(result, {id: 332833796});
			expect(_.floor(activity.heartRateStressScore, 3)).toEqual(137.647);
			expect(activity.trainingImpulseScore).toBeUndefined();

			activity = _.find(result, {id: 873446053});
			expect(_.floor(activity.swimStressScore, 3)).toEqual(242.818);

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it("should prepare fitness activities w/ cyclingFtp={a_value} & swimFtp=null & HR_Mode=HRSS", (done: Function) => {

		// Given
		const expectedFitnessPreparedActivitiesLength = 138;
		const expectedHeartRateStressScoredActivitiesLength = 90;
		const expectedTrimpScoredActivitiesLength = 0;
		const expectedPowerScoredActivitiesLength = 6;
		const expectedSwimScoredActivitiesLength = 0;

		fitnessUserSettingsModel.swimFtp = null;

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
			heartRateImpulseMode, powerMeterEnable, swimEnable);

		// Then
		promise.then((result: FitnessPreparedActivityModel[]) => {

			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
			expect(result).not.toBeNull();
			expect(result.length).toEqual(expectedFitnessPreparedActivitiesLength);

			const hearRateStressScoredActivities = _.filter(result, "heartRateStressScore");
			const trimpScoredActivities = _.filter(result, "trainingImpulseScore");
			const powerScoredActivities = _.filter(result, "powerStressScore");
			const swimScored = _.filter(result, "swimStressScore");

			expect(hearRateStressScoredActivities.length).toEqual(expectedHeartRateStressScoredActivitiesLength);
			expect(trimpScoredActivities.length).toEqual(expectedTrimpScoredActivitiesLength);
			expect(powerScoredActivities.length).toEqual(expectedPowerScoredActivitiesLength);
			expect(swimScored.length).toEqual(expectedSwimScoredActivitiesLength);


			let activity: FitnessPreparedActivityModel;

			activity = _.find(result, {id: 429628737});
			expect(_.floor(activity.powerStressScore, 3)).toEqual(112.749);

			activity = _.find(result, {id: 332833796});
			expect(_.floor(activity.heartRateStressScore, 3)).toEqual(137.647);
			expect(activity.trainingImpulseScore).toBeUndefined();

			activity = _.find(result, {id: 873446053});
			expect(activity.swimStressScore).toBeUndefined();

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it("should prepare fitness activities (only power based activities) w/ PM=ON & SWIM=OFF & HR_Mode=HRSS", (done: Function) => {

		// Given
		const expectedFitnessPreparedActivitiesLength = 3;
		const expectedTrimpScoredActivitiesLength = 0;
		const expectedPowerScoredActivitiesLength = 3;
		const expectedSwimScoredActivitiesLength = 0;

		fitnessUserSettingsModel.cyclingFtp = 200;
		swimEnable = false;

		const syncedActivityModels: SyncedActivityModel[] = [];
		syncedActivityModels.push(createFakeSyncedActivityModel(1,
			"SuperPoweredRide 01",
			"Ride",
			"2018-01-01",
			null,
			250));

		syncedActivityModels.push(createFakeSyncedActivityModel(2,
			"SuperPoweredRide 02",
			"Ride",
			"2018-01-15",
			null,
			275));

		syncedActivityModels.push(createFakeSyncedActivityModel(3,
			"SuperPoweredRide 03",
			"Ride",
			"2018-01-30",
			null,
			190));

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(syncedActivityModels));

		// When
		const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
			heartRateImpulseMode, powerMeterEnable, swimEnable);

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

	it("should skip activities types 'Run & 'EBikeRide' on prepare fitness w/ PM=OFF & SWIM=OFF & HR_Mode=TRIMP", (done: Function) => {

		// Given
		const expectedFitnessPreparedActivitiesLength = 2;
		const expectedTrimpScoredActivitiesLength = 2;
		const expectedPowerScoredActivitiesLength = 0;
		const expectedSwimScoredActivitiesLength = 0;

		heartRateImpulseMode = HeartRateImpulseMode.TRIMP;
		powerMeterEnable = false;
		swimEnable = false;

		const skipActivitiesTypes: string[] = ["Run", "EBikeRide"];

		const syncedActivityModels: SyncedActivityModel[] = [];
		syncedActivityModels.push(createFakeSyncedActivityModel(151,
			"SuperHeartRateRide 01",
			"Ride",
			"2018-01-01",
			150,
			null));

		syncedActivityModels.push(createFakeSyncedActivityModel(235,
			"Super E-Bike Ride",
			"EBikeRide",
			"2018-01-15",
			90,
			null));

		syncedActivityModels.push(createFakeSyncedActivityModel(666,
			"SuperHeartRateRide 02",
			"Ride",
			"2018-01-30",
			135,
			null));

		syncedActivityModels.push(createFakeSyncedActivityModel(999,
			"SuperHeartRateRun 01",
			"Run",
			"2018-01-30",
			185,
			null));

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(syncedActivityModels));

		// When
		const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
			heartRateImpulseMode, powerMeterEnable, swimEnable, skipActivitiesTypes);

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

	it("should skip activities types 'Ride & 'Run' on prepare fitness w/ PM=ON & SWIM=OFF & HR_Mode=HRSS", (done: Function) => {

		// Given
		const expectedFitnessPreparedActivitiesLength = 1;
		const expectedHeartRateStressScoredActivitiesLength = 1;
		const expectedPowerScoredActivitiesLength = 1;
		const expectedSwimScoredActivitiesLength = 0;

		fitnessUserSettingsModel.cyclingFtp = 200;
		swimEnable = false;

		const skipActivitiesTypes: string[] = ["Ride", "Run"];

		const syncedActivityModels: SyncedActivityModel[] = [];
		syncedActivityModels.push(createFakeSyncedActivityModel(151,
			"SuperHeartRateRide 01",
			"Ride",
			"2018-01-01",
			150,
			230));

		syncedActivityModels.push(createFakeSyncedActivityModel(235,
			"Super E-Bike Ride",
			"EBikeRide",
			"2018-01-15",
			90,
			210));

		syncedActivityModels.push(createFakeSyncedActivityModel(666,
			"SuperHeartRateRide 02",
			"Ride",
			"2018-01-30",
			135,
			null));

		syncedActivityModels.push(createFakeSyncedActivityModel(999,
			"SuperHeartRateRun 01",
			"Run",
			"2018-01-30",
			185,
			null));

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(syncedActivityModels));

		// When
		const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
			heartRateImpulseMode, powerMeterEnable, swimEnable, skipActivitiesTypes);

		// Then
		promise.then((result: FitnessPreparedActivityModel[]) => {

			expect(result).not.toBeNull();
			expect(result.length).toEqual(expectedFitnessPreparedActivitiesLength);

			const heartRateStressScoredActivities = _.filter(result, "heartRateStressScore");
			const powerScoredActivities = _.filter(result, "powerStressScore");
			const swimScored = _.filter(result, "swimStressScore");

			expect(heartRateStressScoredActivities.length).toEqual(expectedHeartRateStressScoredActivitiesLength);
			expect(powerScoredActivities.length).toEqual(expectedPowerScoredActivitiesLength);

			expect(_.first(heartRateStressScoredActivities).type).toEqual("EBikeRide");
			expect(_.first(heartRateStressScoredActivities).trainingImpulseScore).not.toBeNull();
			expect(_.first(heartRateStressScoredActivities).powerStressScore).not.toBeNull();

			expect(swimScored.length).toEqual(expectedSwimScoredActivitiesLength);
			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});
	});

	it("should reject prepare fitness activities w/ with PM=ON & SWIM=OFF & HR_Mode=TRIMP", (done: Function) => {

		// Given
		const expectedErrorMessage = "'Power Stress Score' calculation method cannot work with 'TRIMP (Training Impulse)' calculation method.";

		heartRateImpulseMode = HeartRateImpulseMode.TRIMP;
		swimEnable = false;

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch").and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
			heartRateImpulseMode, powerMeterEnable, swimEnable);

		// Then
		promise.then((result: FitnessPreparedActivityModel[]) => {

			expect(result).toBeNull();
			done();

		}, (error: AppError) => {
			expect(error).not.toBeNull();
			expect(error.code).toBe(AppError.FT_PSS_USED_WITH_TRIMP_CALC_METHOD);
			expect(error.message).toBe(expectedErrorMessage);
			done();

		});

	});

	it("should reject prepare fitness activities w/ PM=OFF & SWIM=ON & HR_Mode=TRIMP", (done: Function) => {

		// Given
		const expectedErrorMessage = "'Swim Stress Score' calculation method cannot work with 'TRIMP (Training Impulse)' calculation method.";
		heartRateImpulseMode = HeartRateImpulseMode.TRIMP;
		powerMeterEnable = false;

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
			heartRateImpulseMode, powerMeterEnable, swimEnable);

		// Then
		promise.then((result: FitnessPreparedActivityModel[]) => {

			expect(result).toBeNull();
			done();

		}, (error: AppError) => {
			expect(error).not.toBeNull();
			expect(error.code).toBe(AppError.FT_SSS_USED_WITH_TRIMP_CALC_METHOD);
			expect(error.message).toBe(expectedErrorMessage);
			done();

		});

	});

	it("should reject prepare fitness activities (only power based activities) w/ PM=OFF & SWIM=OFF & HR_Mode=HRSS", (done: Function) => {

		// Given
		powerMeterEnable = false;
		swimEnable = false;

		const syncedActivityModels: SyncedActivityModel[] = [];
		syncedActivityModels.push(createFakeSyncedActivityModel(1,
			"SuperPoweredRide 01",
			"Ride",
			"2018-01-01",
			null,
			250));

		syncedActivityModels.push(createFakeSyncedActivityModel(2,
			"SuperPoweredRide 02",
			"Ride",
			"2018-01-15",
			null,
			275));

		syncedActivityModels.push(createFakeSyncedActivityModel(3,
			"SuperPoweredRide 03",
			"Ride",
			"2018-01-30",
			null,
			190));

		spyOn(activityService.activityDao, "fetch").and.returnValue(Promise.resolve(syncedActivityModels));

		// When
		const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
			heartRateImpulseMode, powerMeterEnable, swimEnable);

		// Then
		promise.then((result: FitnessPreparedActivityModel[]) => {

			expect(result).toBeNull();
			done();

		}, (error: AppError) => {
			expect(error).not.toBeNull();
			expect(error.code).toBe(AppError.FT_NO_MINIMUM_REQUIRED_ACTIVITIES);
			expect(error.message).toBe("No activities has minimum required data to generate a fitness trend");
			done();

		});
	});

	it("should reject prepare fitness WITHOUT HR/POWERED/SWIM activities w/ with PM=OFF & SWIM=OFF & HR_Mode=HRSS", (done: Function) => {

		// Given
		powerMeterEnable = false;
		swimEnable = false;

		const syncedActivityModels: SyncedActivityModel[] = [];
		syncedActivityModels.push(createFakeSyncedActivityModel(1,
			"SuperHeartRateRide 01",
			"Ride",
			"2018-01-01",
			null,
			null));

		syncedActivityModels.push(createFakeSyncedActivityModel(2,
			"SuperHeartRateRide 02",
			"Ride",
			"2018-01-15",
			null,
			null));

		syncedActivityModels.push(createFakeSyncedActivityModel(3,
			"SuperHeartRateRide 03",
			"Ride",
			"2018-01-30",
			null,
			null));

		spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(syncedActivityModels));

		// When
		const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
			heartRateImpulseMode, powerMeterEnable, swimEnable);

		// Then
		promise.then((result: FitnessPreparedActivityModel[]) => {

			expect(result).toBeNull();
			done();

		}, (error: AppError) => {
			expect(error).not.toBeNull();
			expect(error.code).toBe(AppError.FT_NO_MINIMUM_REQUIRED_ACTIVITIES);
			expect(error.message).toBe("No activities has minimum required data to generate a fitness trend");
			done();
		});
	});

	// Generate daily activity
	it("should generate athlete daily activity w/ with PM=ON & SWIM=ON & HR_Mode=HRSS", (done: Function) => {

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
		const promise: Promise<DayStressModel[]> = fitnessService.generateDailyStress(fitnessUserSettingsModel,
			heartRateImpulseMode, powerMeterEnable, swimEnable);

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
			expect(_.floor(activity.powerStressScore, 3)).toEqual(112.749);

			activity = _.find(dailyActivity, {ids: [332833796]});
			expect(_.floor(activity.heartRateStressScore, 3)).toEqual(137.647);
			expect(activity.trainingImpulseScore).toBeNull();

			activity = _.find(dailyActivity, {ids: [873446053]});
			expect(_.floor(activity.swimStressScore, 3)).toEqual(242.818);

			activity = _.find(dailyActivity, {ids: [294909522]});
			expect(_.floor(activity.heartRateStressScore, 3)).toEqual(101.385);

			activity = _.find(dailyActivity, {ids: [873446053, 294909522]});
			expect(_.floor(activity.finalStressScore, 3)).toEqual(344.203);

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});
	});

	it("should generate athlete daily activity w/ with PM=ON & SWIM=OFF & HR_Mode=HRSS", (done: Function) => {

		// Given
		swimEnable = false;
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
		const promise: Promise<DayStressModel[]> = fitnessService.generateDailyStress(fitnessUserSettingsModel,
			heartRateImpulseMode, powerMeterEnable, swimEnable);

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
			expect(_.floor(activity.powerStressScore, 3)).toEqual(112.749);

			activity = _.find(dailyActivity, {ids: [332833796]});
			expect(_.floor(activity.heartRateStressScore, 3)).toEqual(137.647);
			expect(activity.trainingImpulseScore).toBeNull();

			activity = _.find(dailyActivity, {ids: [873446053]});
			expect(activity.swimStressScore).toBeNull();

			activity = _.find(dailyActivity, {ids: [294909522]});
			expect(_.floor(activity.heartRateStressScore, 3)).toEqual(101.385);

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});
	});

	it("should reject generate athlete daily activity without hr or power based activities & HR_Mode=HRSS", (done: Function) => {

		// Given
		const syncedActivityModels: SyncedActivityModel[] = [];
		syncedActivityModels.push(createFakeSyncedActivityModel(1,
			"SuperHeartRateRide 01",
			"Ride",
			"2018-01-01",
			null,
			null));

		syncedActivityModels.push(createFakeSyncedActivityModel(2,
			"SuperHeartRateRide 02",
			"Ride",
			"2018-01-15",
			null,
			null));

		syncedActivityModels.push(createFakeSyncedActivityModel(3,
			"SuperHeartRateRide 03",
			"Ride",
			"2018-01-30",
			null,
			null));

		spyOn(activityService.activityDao, "fetch").and.returnValue(Promise.resolve(syncedActivityModels));

		const promise: Promise<DayStressModel[]> = fitnessService.generateDailyStress(fitnessUserSettingsModel,
			heartRateImpulseMode, powerMeterEnable, swimEnable);

		// Then
		promise.then((dailyActivity: DayStressModel[]) => {
			expect(dailyActivity).toBeNull();
			done();

		}, (error: AppError) => {
			expect(error).not.toBeNull();
			expect(error.code).toBe(AppError.FT_NO_MINIMUM_REQUIRED_ACTIVITIES);
			expect(error.message).toBe("No activities has minimum required data to generate a fitness trend");
			done();
		});

	});

	// Compute fitness
	it("should compute fitness trend w/ HR_Mode=TRIMP", (done: Function) => {

		// Given
		heartRateImpulseMode = HeartRateImpulseMode.TRIMP;
		powerMeterEnable = null;
		swimEnable = null;
		const expectedLength = 346;

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<DayFitnessTrendModel[]> = fitnessService.computeTrend(fitnessUserSettingsModel,
			heartRateImpulseMode, powerMeterEnable, swimEnable);

		// Then
		promise.then((fitnessTrend: DayFitnessTrendModel[]) => {

			expect(fitnessTrend).not.toBeNull();

			expect(fitnessTrend.length).toEqual(expectedLength);
			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

			// Test training load
			const lastRealDay = _.last(_.filter(fitnessTrend, (dayFitnessTrend: DayFitnessTrendModel) => {
				return dayFitnessTrend.previewDay === false;
			}));
			expect(_.floor(lastRealDay.atl, 3)).toEqual(13.119);
			expect(_.floor(lastRealDay.ctl, 3)).toEqual(46.322);
			expect(_.floor(lastRealDay.tsb, 3)).toEqual(33.202);

			const lastPreviewDay = _.last(fitnessTrend);
			expect(_.floor(lastPreviewDay.atl, 3)).toEqual(1.775);
			expect(_.floor(lastPreviewDay.ctl, 3)).toEqual(33.191);
			expect(_.floor(lastPreviewDay.tsb, 3)).toEqual(31.415);

			// Test stress scores
			let activity: DayFitnessTrendModel;

			activity = _.find(fitnessTrend, {ids: [332833796]});
			expect(_.floor(activity.trainingImpulseScore, 3)).toEqual(191.715);
			expect(activity.heartRateStressScore).toBeNull();

			activity = _.find(fitnessTrend, {ids: [429628737]});
			expect(activity.powerStressScore).toBeNull(); // No PSS because of TRIMP activated

			activity = _.find(fitnessTrend, {ids: [873446053]});
			expect(activity.swimStressScore).toBeNull(); // No SwimSS because of TRIMP activated

			activity = _.find(fitnessTrend, {ids: [294909522]});
			expect(_.floor(activity.trainingImpulseScore, 3)).toEqual(141.208);
			expect(activity.heartRateStressScore).toBeNull();

			activity = _.find(fitnessTrend, {ids: [873446053, 294909522]});
			expect(_.floor(activity.finalStressScore, 3)).toEqual(141.208);

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it("should compute fitness trend w/ HR_Mode=HRSS", (done: Function) => {

		// Given
		const expectedLength = 346;

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

		// When
		const promise: Promise<DayFitnessTrendModel[]> = fitnessService.computeTrend(fitnessUserSettingsModel,
			heartRateImpulseMode, powerMeterEnable, swimEnable);

		// Then
		promise.then((fitnessTrend: DayFitnessTrendModel[]) => {

			expect(fitnessTrend).not.toBeNull();

			expect(fitnessTrend.length).toEqual(expectedLength);
			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

			// Test training load
			const lastRealDay = _.last(_.filter(fitnessTrend, (dayFitnessTrend: DayFitnessTrendModel) => {
				return dayFitnessTrend.previewDay === false;
			}));
			expect(_.floor(lastRealDay.atl, 3)).toEqual(11.020);
			expect(_.floor(lastRealDay.ctl, 3)).toEqual(36.366);
			expect(_.floor(lastRealDay.tsb, 3)).toEqual(25.346);

			const lastPreviewDay = _.last(fitnessTrend);
			expect(_.floor(lastPreviewDay.atl, 3)).toEqual(1.491);
			expect(_.floor(lastPreviewDay.ctl, 3)).toEqual(26.057);
			expect(_.floor(lastPreviewDay.tsb, 3)).toEqual(24.566);

			// Test stress scores
			let activity: DayFitnessTrendModel;

			activity = _.find(fitnessTrend, {ids: [429628737]});
			expect(_.floor(activity.powerStressScore, 3)).toEqual(112.749);

			activity = _.find(fitnessTrend, {ids: [332833796]});
			expect(_.floor(activity.heartRateStressScore, 3)).toEqual(137.647);
			expect(activity.trainingImpulseScore).toBeNull();

			activity = _.find(fitnessTrend, {ids: [873446053]});
			expect(_.floor(activity.swimStressScore, 3)).toEqual(242.818);

			activity = _.find(fitnessTrend, {ids: [294909522]});
			expect(_.floor(activity.heartRateStressScore, 3)).toEqual(101.385);
			expect(activity.trainingImpulseScore).toBeNull();

			activity = _.find(fitnessTrend, {ids: [873446053, 294909522]});
			expect(_.floor(activity.finalStressScore, 3)).toEqual(344.203);

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it("should skip 'EBikeRide' while computing fitness trend & HR_Mode=HRSS", (done: Function) => {

		// Given
		const expectedLength = 346;
		const skipActivitiesTypes: string[] = ["EBikeRide"];
		const syncedActivityModels = _TEST_SYNCED_ACTIVITIES_;

		// Add some fakes EBikeRides
		syncedActivityModels.push(createFakeSyncedActivityModel(1,
			"Super E-Bike Ride 01",
			"EBikeRide",
			"2015-08-15",
			150,
			null));

		syncedActivityModels.push(createFakeSyncedActivityModel(2,
			"Super E-Bike Ride 02",
			"EBikeRide",
			"2015-09-15",
			159,
			null));

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(syncedActivityModels));

		// When
		const promise: Promise<DayFitnessTrendModel[]> = fitnessService.computeTrend(fitnessUserSettingsModel,
			heartRateImpulseMode, powerMeterEnable, swimEnable, skipActivitiesTypes);

		// Then
		promise.then((fitnessTrend: DayFitnessTrendModel[]) => {

			expect(fitnessTrend).not.toBeNull();

			expect(fitnessTrend.length).toEqual(expectedLength);
			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

			const eBikeRideActivities = _.filter(fitnessTrend, (dayFitnessTrendModel: DayFitnessTrendModel) => {
				return (_.indexOf(dayFitnessTrendModel.types, "EBikeRide") !== -1);
			});

			expect(eBikeRideActivities.length).toEqual(0);

			// Test training load
			const lastRealDay = _.last(_.filter(fitnessTrend, (dayFitnessTrend: DayFitnessTrendModel) => {
				return dayFitnessTrend.previewDay === false;
			}));
			expect(_.floor(lastRealDay.atl, 3)).toEqual(11.020);
			expect(_.floor(lastRealDay.ctl, 3)).toEqual(36.366);
			expect(_.floor(lastRealDay.tsb, 3)).toEqual(25.346);

			const lastPreviewDay = _.last(fitnessTrend);
			expect(_.floor(lastPreviewDay.atl, 3)).toEqual(1.491);
			expect(_.floor(lastPreviewDay.ctl, 3)).toEqual(26.057);
			expect(_.floor(lastPreviewDay.tsb, 3)).toEqual(24.566);

			// Test stress scores
			let activity: DayFitnessTrendModel;

			activity = _.find(fitnessTrend, {ids: [429628737]});
			expect(_.floor(activity.powerStressScore, 3)).toEqual(112.749);

			activity = _.find(fitnessTrend, {ids: [332833796]});
			expect(_.floor(activity.heartRateStressScore, 3)).toEqual(137.647);
			expect(activity.trainingImpulseScore).toBeNull();

			activity = _.find(fitnessTrend, {ids: [873446053]});
			expect(_.floor(activity.swimStressScore, 3)).toEqual(242.818);

			activity = _.find(fitnessTrend, {ids: [294909522]});
			expect(_.floor(activity.heartRateStressScore, 3)).toEqual(101.385);
			expect(activity.trainingImpulseScore).toBeNull();

			activity = _.find(fitnessTrend, {ids: [873446053, 294909522]});
			expect(_.floor(activity.finalStressScore, 3)).toEqual(344.203);

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it("should compute fitness trend with initial fitness and fatigue value", (done: Function) => {

		// Given
		const syncedActivityModels = [];

		// Add some fakes EBikeRides
		syncedActivityModels.push(createFakeSyncedActivityModel(1,
			"Super Bike Ride 01",
			"Ride",
			"2015-11-15",
			150,
			null));

		syncedActivityModels.push(createFakeSyncedActivityModel(2,
			"Super Bike Ride 02",
			"Ride",
			"2015-11-20",
			150,
			null));

		const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
			.and.returnValue(Promise.resolve(syncedActivityModels));


		// When
		const initializedFitnessTrendModel: InitializedFitnessTrendModel = {
			atl: 100,
			ctl: 50
		};

		const promise: Promise<DayFitnessTrendModel[]> = fitnessService.computeTrend(fitnessUserSettingsModel,
			heartRateImpulseMode, powerMeterEnable, swimEnable, null, initializedFitnessTrendModel);

		// Then
		promise.then((fitnessTrend: DayFitnessTrendModel[]) => {

			expect(fitnessTrend).not.toBeNull();
			expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

			const firstDay = _.first(fitnessTrend);
			expect(firstDay.ctl).toEqual(initializedFitnessTrendModel.ctl);
			expect(firstDay.atl).toEqual(initializedFitnessTrendModel.atl);
			expect(firstDay.tsb).toEqual(initializedFitnessTrendModel.ctl - initializedFitnessTrendModel.atl);

			const secondDay = fitnessTrend[1];
			expect(secondDay.ctl).toBeGreaterThan(initializedFitnessTrendModel.ctl);
			expect(secondDay.atl).toBeGreaterThan(initializedFitnessTrendModel.atl);
			expect(secondDay.tsb).toBeLessThan(initializedFitnessTrendModel.ctl - initializedFitnessTrendModel.atl);

			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

});
