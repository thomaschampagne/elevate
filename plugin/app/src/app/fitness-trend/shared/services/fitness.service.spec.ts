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
import { FitnessTrendConfigModel } from "../models/fitness-trend-config.model";

function createFakeSyncedActivityModel(id: number, name: string, type: string, dateStr: string, avgHr: number, avgWatts: number, hasPowerMeter?: boolean, avgPace?: number) {

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
			hasPowerMeter: (_.isBoolean(hasPowerMeter)) ? hasPowerMeter : true,
			lowerQuartileWatts: avgWatts / 4,
			medianWatts: avgWatts / 2,
			powerStressScore: avgWatts * 3,
			powerStressScorePerHour: avgWatts * 3,
			powerZones: null,
			punchFactor: avgWatts * 4,
			upperQuartileWatts: (avgWatts / 4) * 3,
			variabilityIndex: 1,
			weightedPower: avgWatts,
			best20min: avgWatts * 1.5,
			weightedWattsPerKg: avgWatts * 1.25 / 70,
		};

		fakeActivity.hasPowerMeter = (_.isBoolean(hasPowerMeter)) ? hasPowerMeter : true;
	}

	if (_.isNumber(avgPace)) {
		fakeActivity.extendedStats.paceData = {
			avgPace: avgPace * 100,
			best20min: avgPace * 150,
			lowerQuartilePace: null,
			medianPace: null,
			upperQuartilePace: null,
			variancePace: null,
			genuineGradeAdjustedAvgPace: avgPace,
			paceZones: null,
			gradeAdjustedPaceZones: null
		};
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
		runningFtp: 300,
		swimFtp: 31,
	};

	let fitnessUserSettingsModel: FitnessUserSettingsModel;
	let fitnessTrendConfigModel: FitnessTrendConfigModel;
	let powerMeterEnable;
	let swimEnable;

	let _TEST_SYNCED_ACTIVITIES_: SyncedActivityModel[] = null;
	let fitnessService: FitnessService = null;
	let activityService: ActivityService = null;

	let getTodayMomentSpy = null;

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
		fitnessTrendConfigModel = {
			heartRateImpulseMode: HeartRateImpulseMode.HRSS,
			initializedFitnessTrendModel: {
				atl: null,
				ctl: null
			},
			allowEstimatedPowerStressScore: false,
			allowEstimatedRunningStressScore: false,
			ignoreBeforeDate: null
		};

		// Enable PSS and SSS by default
		powerMeterEnable = true;
		swimEnable = true;

		getTodayMomentSpy = spyOn(fitnessService, "getTodayMoment");
		getTodayMomentSpy.and.returnValue(moment(todayDate, momentDatePattern));

		done();
	});

	it("should be created", (done: Function) => {
		expect(fitnessService).toBeTruthy();
		done();
	});

	describe("manage lthr preferences", () => {

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
	});

	describe("compute stress scores", () => {

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

		// Compute Running Stress Score (RSS)
		it("should compute RSS", (done: Function) => {

			// Given
			const expectedStressScore = 100;
			const movingTime = 3600; // 1 hours
			const gradeAdjustedPace = 300; // 300sec or 00:05:00/dist.
			const runningThresholdPace = 300; // 300sec or 00:05:00/dist.

			// When
			const runningStressScore = fitnessService.computeRunningStressScore(movingTime, gradeAdjustedPace, runningThresholdPace);

			// Then
			expect(Math.floor(runningStressScore)).toEqual(expectedStressScore);
			done();
		});
	});

	describe("prepare fitness activities", () => {

		it("should prepare fitness activities w/ PM=OFF & SWIM=OFF & HR_Mode=TRIMP", (done: Function) => {

			// Given
			const expectedFitnessPreparedActivitiesLength = 138;
			const expectedTrimpScoredActivitiesLength = 90;
			const expectedPowerScoredActivitiesLength = 0;
			const expectedSwimScoredActivitiesLength = 0;

			fitnessTrendConfigModel.heartRateImpulseMode = HeartRateImpulseMode.TRIMP;
			powerMeterEnable = false;
			swimEnable = false;

			const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
				.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

			// When
			const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
				fitnessTrendConfigModel,
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

			fitnessTrendConfigModel.heartRateImpulseMode = HeartRateImpulseMode.TRIMP;
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
				fitnessTrendConfigModel, powerMeterEnable, swimEnable);

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
				fitnessTrendConfigModel, powerMeterEnable, swimEnable);

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
				fitnessTrendConfigModel, powerMeterEnable, swimEnable);

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
				fitnessTrendConfigModel, powerMeterEnable, swimEnable);

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
				fitnessTrendConfigModel, powerMeterEnable, swimEnable);

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
				fitnessTrendConfigModel, powerMeterEnable, swimEnable);

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
				fitnessTrendConfigModel, powerMeterEnable, swimEnable);

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
				fitnessTrendConfigModel, powerMeterEnable, swimEnable);

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

		it("should prepare fitness activities w/ PM=ON & SWIM=ON & HR_Mode=HRSS & Est.PSS=ON & Est.RSS=ON", (done: Function) => {

			// Given
			fitnessTrendConfigModel.allowEstimatedPowerStressScore = true;
			fitnessTrendConfigModel.allowEstimatedRunningStressScore = true;
			const skipActivityTypes = null;
			const expectedFitnessPreparedActivitiesLength = 8;
			const expectedTrimpScoredActivitiesLength = 3;
			const expectedPowerScoredActivitiesLength = 3;
			const expectedRunningScoredActivitiesLength = 4;
			const expectedSwimScoredActivitiesLength = 1;

			const syncedActivityModels: SyncedActivityModel[] = [];
			syncedActivityModels.push(createFakeSyncedActivityModel(1,
				"Power Ride", // PSS Scored
				"Ride",
				"2018-01-01",
				null,
				250));

			syncedActivityModels.push(createFakeSyncedActivityModel(2,
				"HR Ride", // HR Scored + Est PSS Scored
				"Ride",
				"2018-01-15",
				190,
				150,
				false));

			syncedActivityModels.push(createFakeSyncedActivityModel(3,
				"No sensor Ride", // PSS Scored (estimated)
				"Ride",
				"2018-01-30",
				null,
				150,
				false));

			syncedActivityModels.push(createFakeSyncedActivityModel(4,
				"HR Run", // HR Scored + Est RSS scored
				"Run",
				"2018-02-02",
				175,
				null,
				false,
				300));

			syncedActivityModels.push(createFakeSyncedActivityModel(5,
				"HR Run", // HR Scored + Est RSS scored
				"Run",
				"2018-02-03",
				182,
				null,
				false,
				300));

			syncedActivityModels.push(createFakeSyncedActivityModel(6,
				"No sensor Run", // RSS Scored
				"Run",
				"2018-02-08",
				null,
				null,
				false,
				300));

			syncedActivityModels.push(createFakeSyncedActivityModel(7,
				"No sensor Run 2", // RSS Scored
				"Run",
				"2018-02-08",
				null,
				null,
				false,
				300));

			syncedActivityModels.push(createFakeSyncedActivityModel(8,
				"Swimming", // SSS Scored
				"Swim",
				"2018-02-09",
				null,
				null));

			const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
				.and.returnValue(Promise.resolve(syncedActivityModels));

			// When
			const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
				fitnessTrendConfigModel, powerMeterEnable, swimEnable, skipActivityTypes);

			// Then
			promise.then((result: FitnessPreparedActivityModel[]) => {

				expect(result).not.toBeNull();
				expect(result.length).toEqual(expectedFitnessPreparedActivitiesLength);

				const heartRateStressScoredActivities = _.filter(result, "heartRateStressScore");
				const powerScoredActivities = _.filter(result, "powerStressScore");
				const runningScoredActivities = _.filter(result, "runningStressScore");
				const swimScored = _.filter(result, "swimStressScore");

				expect(heartRateStressScoredActivities.length).toEqual(expectedTrimpScoredActivitiesLength);
				expect(powerScoredActivities.length).toEqual(expectedPowerScoredActivitiesLength);
				expect(runningScoredActivities.length).toEqual(expectedRunningScoredActivitiesLength);
				expect(swimScored.length).toEqual(expectedSwimScoredActivitiesLength);

				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should prepare fitness activities w/ PM=ON & SWIM=ON & HR_Mode=HRSS & Est.PSS=OFF & Est.RSS=OFF", (done: Function) => {

			// Given
			fitnessTrendConfigModel.allowEstimatedPowerStressScore = false;
			fitnessTrendConfigModel.allowEstimatedRunningStressScore = false;
			const expectedFitnessPreparedActivitiesLength = 8;
			const expectedTrimpScoredActivitiesLength = 3;
			const expectedPowerScoredActivitiesLength = 1;
			const expectedRunningScoredActivitiesLength = 0;
			const expectedSwimScoredActivitiesLength = 1;
			const skipActivityTypes = null;

			const syncedActivityModels: SyncedActivityModel[] = [];
			syncedActivityModels.push(createFakeSyncedActivityModel(1,
				"Power Ride", // PSS Scored
				"Ride",
				"2018-01-01",
				null,
				250));

			syncedActivityModels.push(createFakeSyncedActivityModel(2,
				"HR Ride", // HR Scored
				"Ride",
				"2018-01-15",
				190,
				150,
				false));

			syncedActivityModels.push(createFakeSyncedActivityModel(3,
				"No sensor Ride", // PSS Scored (estimated)
				"Ride",
				"2018-01-30",
				null,
				150,
				false));

			syncedActivityModels.push(createFakeSyncedActivityModel(4,
				"HR Run", // HR Scored
				"Run",
				"2018-02-02",
				175,
				null,
				false,
				300));

			syncedActivityModels.push(createFakeSyncedActivityModel(5,
				"HR Run", // HR Scored
				"Run",
				"2018-02-03",
				182,
				null,
				false,
				300));

			syncedActivityModels.push(createFakeSyncedActivityModel(6,
				"No sensor Run", // RSS Scored
				"Run",
				"2018-02-08",
				null,
				null,
				false,
				300));

			syncedActivityModels.push(createFakeSyncedActivityModel(7,
				"No sensor Run 2", // RSS Scored
				"Run",
				"2018-02-08",
				null,
				null,
				false,
				300));

			syncedActivityModels.push(createFakeSyncedActivityModel(8,
				"Swimming", // SSS Scored
				"Swim",
				"2018-02-09",
				null,
				null));

			const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
				.and.returnValue(Promise.resolve(syncedActivityModels));

			// When
			const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
				fitnessTrendConfigModel, powerMeterEnable, swimEnable, skipActivityTypes);

			// Then
			promise.then((result: FitnessPreparedActivityModel[]) => {

				expect(result).not.toBeNull();
				expect(result.length).toEqual(expectedFitnessPreparedActivitiesLength);

				const heartRateStressScoredActivities = _.filter(result, "heartRateStressScore");
				const powerScoredActivities = _.filter(result, "powerStressScore");
				const runningScoredActivities = _.filter(result, "runningStressScore");
				const swimScored = _.filter(result, "swimStressScore");

				expect(heartRateStressScoredActivities.length).toEqual(expectedTrimpScoredActivitiesLength);
				expect(powerScoredActivities.length).toEqual(expectedPowerScoredActivitiesLength);
				expect(runningScoredActivities.length).toEqual(expectedRunningScoredActivitiesLength);
				expect(swimScored.length).toEqual(expectedSwimScoredActivitiesLength);

				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should prepare fitness activities w/ PM=OFF & SWIM=ON & HR_Mode=HRSS & Est.PSS=ON & Est.RSS=ON", (done: Function) => {

			// Given
			fitnessTrendConfigModel.allowEstimatedPowerStressScore = true;
			fitnessTrendConfigModel.allowEstimatedRunningStressScore = true;
			const expectedFitnessPreparedActivitiesLength = 8;
			const expectedTrimpScoredActivitiesLength = 3;
			const expectedPowerScoredActivitiesLength = 0;
			const expectedRunningScoredActivitiesLength = 4;
			const expectedSwimScoredActivitiesLength = 1;
			const skipActivityTypes = null;
			powerMeterEnable = false;

			const syncedActivityModels: SyncedActivityModel[] = [];
			syncedActivityModels.push(createFakeSyncedActivityModel(1,
				"Power Ride", // PSS Scored
				"Ride",
				"2018-01-01",
				null,
				250));

			syncedActivityModels.push(createFakeSyncedActivityModel(2,
				"HR Ride", // HR Scored
				"Ride",
				"2018-01-15",
				190,
				150,
				false));

			syncedActivityModels.push(createFakeSyncedActivityModel(3,
				"No sensor Ride", // PSS Scored (estimated)
				"Ride",
				"2018-01-30",
				null,
				150,
				false));

			syncedActivityModels.push(createFakeSyncedActivityModel(4,
				"HR Run", // HR Scored + Est RSS scored
				"Run",
				"2018-02-02",
				175,
				null,
				false,
				300));

			syncedActivityModels.push(createFakeSyncedActivityModel(5,
				"HR Run", // HR Scored + Est RSS scored
				"Run",
				"2018-02-03",
				182,
				null,
				false,
				300));

			syncedActivityModels.push(createFakeSyncedActivityModel(6,
				"No sensor Run", // RSS Scored
				"Run",
				"2018-02-08",
				null,
				null,
				false,
				300));

			syncedActivityModels.push(createFakeSyncedActivityModel(7,
				"No sensor Run 2", // RSS Scored
				"Run",
				"2018-02-08",
				null,
				null,
				false,
				300));

			syncedActivityModels.push(createFakeSyncedActivityModel(8,
				"Swimming", // SSS Scored
				"Swim",
				"2018-02-09",
				null,
				null));

			const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
				.and.returnValue(Promise.resolve(syncedActivityModels));

			// When
			const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
				fitnessTrendConfigModel, powerMeterEnable, swimEnable, skipActivityTypes);

			// Then
			promise.then((result: FitnessPreparedActivityModel[]) => {

				expect(result).not.toBeNull();
				expect(result.length).toEqual(expectedFitnessPreparedActivitiesLength);

				const heartRateStressScoredActivities = _.filter(result, "heartRateStressScore");
				const powerScoredActivities = _.filter(result, "powerStressScore");
				const runningScoredActivities = _.filter(result, "runningStressScore");
				const swimScored = _.filter(result, "swimStressScore");

				expect(heartRateStressScoredActivities.length).toEqual(expectedTrimpScoredActivitiesLength);
				expect(powerScoredActivities.length).toEqual(expectedPowerScoredActivitiesLength);
				expect(runningScoredActivities.length).toEqual(expectedRunningScoredActivitiesLength);
				expect(swimScored.length).toEqual(expectedSwimScoredActivitiesLength);

				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should prepare fitness activities w/ PM=OFF & SWIM=OFF & HR_Mode=HRSS & Est.PSS=ON & Est.RSS=ON", (done: Function) => {

			// Given
			fitnessTrendConfigModel.allowEstimatedPowerStressScore = true;
			fitnessTrendConfigModel.allowEstimatedRunningStressScore = true;
			const expectedFitnessPreparedActivitiesLength = 8;
			const expectedTrimpScoredActivitiesLength = 3;
			const expectedPowerScoredActivitiesLength = 0;
			const expectedRunningScoredActivitiesLength = 4;
			const expectedSwimScoredActivitiesLength = 0;
			const skipActivityTypes = null;
			powerMeterEnable = false;
			swimEnable = false;

			const syncedActivityModels: SyncedActivityModel[] = [];
			syncedActivityModels.push(createFakeSyncedActivityModel(1,
				"Power Ride", // PSS Scored
				"Ride",
				"2018-01-01",
				null,
				250));

			syncedActivityModels.push(createFakeSyncedActivityModel(2,
				"HR Ride", // HR Scored + Est PSS Scored
				"Ride",
				"2018-01-15",
				190,
				150,
				false));

			syncedActivityModels.push(createFakeSyncedActivityModel(3,
				"No sensor Ride", // PSS Scored (estimated)
				"Ride",
				"2018-01-30",
				null,
				150,
				false));

			syncedActivityModels.push(createFakeSyncedActivityModel(4,
				"HR Run", // HR Scored + Est RSS scored
				"Run",
				"2018-02-02",
				175,
				null,
				false,
				300));

			syncedActivityModels.push(createFakeSyncedActivityModel(5,
				"HR Run", // HR Scored + Est RSS scored
				"Run",
				"2018-02-03",
				182,
				null,
				false,
				300));

			syncedActivityModels.push(createFakeSyncedActivityModel(6,
				"No sensor Run", // RSS Scored
				"Run",
				"2018-02-08",
				null,
				null,
				false,
				300));

			syncedActivityModels.push(createFakeSyncedActivityModel(7,
				"No sensor Run 2", // RSS Scored
				"Run",
				"2018-02-08",
				null,
				null,
				false,
				300));

			syncedActivityModels.push(createFakeSyncedActivityModel(8,
				"Swimming", // SSS Scored
				"Swim",
				"2018-02-09",
				null,
				null));

			const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
				.and.returnValue(Promise.resolve(syncedActivityModels));

			// When
			const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
				fitnessTrendConfigModel, powerMeterEnable, swimEnable, skipActivityTypes);

			// Then
			promise.then((result: FitnessPreparedActivityModel[]) => {

				expect(result).not.toBeNull();
				expect(result.length).toEqual(expectedFitnessPreparedActivitiesLength);

				const heartRateStressScoredActivities = _.filter(result, "heartRateStressScore");
				const powerScoredActivities = _.filter(result, "powerStressScore");
				const runningScoredActivities = _.filter(result, "runningStressScore");
				const swimScored = _.filter(result, "swimStressScore");

				expect(heartRateStressScoredActivities.length).toEqual(expectedTrimpScoredActivitiesLength);
				expect(powerScoredActivities.length).toEqual(expectedPowerScoredActivitiesLength);
				expect(runningScoredActivities.length).toEqual(expectedRunningScoredActivitiesLength);
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

			fitnessTrendConfigModel.heartRateImpulseMode = HeartRateImpulseMode.TRIMP;
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
				fitnessTrendConfigModel, powerMeterEnable, swimEnable, skipActivitiesTypes);

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
				fitnessTrendConfigModel, powerMeterEnable, swimEnable, skipActivitiesTypes);

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

		it("should ignore activities before a user defined date", (done: Function) => {

			// Given
			const activityShouldExistsId = 284737783;
			const expectedFitnessPreparedActivitiesLength = 118;
			const ignoreActivitiesBefore = "2015-04-13";
			fitnessTrendConfigModel.ignoreBeforeDate = moment(ignoreActivitiesBefore, "YYYY-MM-DD").startOf("day");

			const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
				.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

			// When
			const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
				fitnessTrendConfigModel, powerMeterEnable, swimEnable);

			// Then
			promise.then((result: FitnessPreparedActivityModel[]) => {

				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
				expect(result).not.toBeNull();
				expect(result.length).toEqual(expectedFitnessPreparedActivitiesLength);

				const firstActivity = _.first(result);
				expect(firstActivity).not.toBeNull();
				expect(firstActivity.id).toEqual(activityShouldExistsId);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should reject prepare fitness activities w/ PM=ON & SWIM=OFF & HR_Mode=TRIMP", (done: Function) => {

			// Given
			const expectedErrorMessage = "'Power Stress Score' calculation method cannot work with 'TRIMP (Training Impulse)' calculation method.";

			fitnessTrendConfigModel.heartRateImpulseMode = HeartRateImpulseMode.TRIMP;
			swimEnable = false;

			spyOn(activityService.activityDao, "fetch").and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

			// When
			const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
				fitnessTrendConfigModel, powerMeterEnable, swimEnable);

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
			fitnessTrendConfigModel.heartRateImpulseMode = HeartRateImpulseMode.TRIMP;
			powerMeterEnable = false;

			spyOn(activityService.activityDao, "fetch")
				.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

			// When
			const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
				fitnessTrendConfigModel, powerMeterEnable, swimEnable);

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
				fitnessTrendConfigModel, powerMeterEnable, swimEnable);

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

		it("should reject prepare fitness WITHOUT HR/POWERED/SWIM activities w/ PM=OFF & SWIM=OFF & HR_Mode=HRSS", (done: Function) => {

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
				fitnessTrendConfigModel, powerMeterEnable, swimEnable);

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

		it("should reject prepare fitness activities w/ PM=OFF & SWIM=OFF & HR_Mode=HRSS & Est.PSS=OFF & Est.RSS=OFF", (done: Function) => {

			// Given
			const skipActivityTypes = null;
			fitnessTrendConfigModel.allowEstimatedPowerStressScore = false;
			fitnessTrendConfigModel.allowEstimatedRunningStressScore = false;
			powerMeterEnable = false;
			swimEnable = false;

			const syncedActivityModels: SyncedActivityModel[] = [];
			syncedActivityModels.push(createFakeSyncedActivityModel(1,
				"Power Ride", // PSS Scored
				"Ride",
				"2018-01-01",
				null,
				250));

			syncedActivityModels.push(createFakeSyncedActivityModel(2,
				"No sensor Ride", // PSS Scored (estimated)
				"Ride",
				"2018-01-30",
				null,
				150,
				false));

			syncedActivityModels.push(createFakeSyncedActivityModel(3,
				"No sensor Run", // RSS Scored
				"Run",
				"2018-02-08",
				null,
				null,
				false,
				300));

			syncedActivityModels.push(createFakeSyncedActivityModel(4,
				"No sensor Run 2", // RSS Scored
				"Run",
				"2018-02-08",
				null,
				null,
				false,
				300));

			syncedActivityModels.push(createFakeSyncedActivityModel(5,
				"Swimming", // SSS Scored
				"Swim",
				"2018-02-09",
				null,
				null));

			spyOn(activityService.activityDao, "fetch")
				.and.returnValue(Promise.resolve(syncedActivityModels));

			// When
			const promise: Promise<FitnessPreparedActivityModel[]> = fitnessService.prepare(fitnessUserSettingsModel,
				fitnessTrendConfigModel, powerMeterEnable, swimEnable, skipActivityTypes);

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
	});

	describe("generate daily activities", () => {

		it("should generate athlete daily activities w/ PM=ON & SWIM=ON & HR_Mode=HRSS", (done: Function) => {

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
				fitnessTrendConfigModel, powerMeterEnable, swimEnable);

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

		it("should generate athlete daily activities w/ PM=ON & SWIM=OFF & HR_Mode=HRSS", (done: Function) => {

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
				fitnessTrendConfigModel, powerMeterEnable, swimEnable);

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

		it("should generate athlete daily activities w/ PM=ON & SWIM=ON & HR_Mode=HRSS & Est.PSS=ON & Est.RSS=ON", (done: Function) => {

			// Given
			getTodayMomentSpy.and.returnValue(moment("2018-02-15 12:00", momentDatePattern));
			fitnessTrendConfigModel.allowEstimatedPowerStressScore = true;
			fitnessTrendConfigModel.allowEstimatedRunningStressScore = true;
			const skipActivityTypes = null;
			const expectedDailyActivityLength = 61;
			const expectedPreviewDays = 14;
			const expectedFirstDay = moment("2017-12-31", "YYYY-MM-DD").toDate().getTime();
			const expectedLastRealDay = moment("2018-02-15", "YYYY-MM-DD").toDate().getTime();
			const expectedLastPreviewDay = moment("2018-03-01", "YYYY-MM-DD").toDate().getTime();

			const syncedActivityModels: SyncedActivityModel[] = [];

			syncedActivityModels.push(createFakeSyncedActivityModel(0,
				"Power Ride + HR", // PSS Scored + HRSS Scored
				"Ride",
				"2018-01-01",
				190,
				150));

			syncedActivityModels.push(createFakeSyncedActivityModel(1,
				"Power Ride", // PSS Scored
				"Ride",
				"2018-01-02",
				null,
				150));

			syncedActivityModels.push(createFakeSyncedActivityModel(2,
				"HR Ride", // HR Scored
				"Ride",
				"2018-01-15",
				190,
				150,
				false));

			syncedActivityModels.push(createFakeSyncedActivityModel(3,
				"No sensor Ride 2", // PSS Scored (estimated)
				"Ride",
				"2018-01-30",
				null,
				150,
				false));

			syncedActivityModels.push(createFakeSyncedActivityModel(4,
				"HR Run", // HR Scored + Est RSS scored
				"Run",
				"2018-02-02",
				190,
				null,
				false,
				300));

			syncedActivityModels.push(createFakeSyncedActivityModel(5,
				"HR Run 2",  // HR Scored + Est RSS scored
				"Run",
				"2018-02-03",
				190,
				null,
				false,
				300));

			syncedActivityModels.push(createFakeSyncedActivityModel(6,
				"No sensor Run", // HR Scored + Est RSS scored
				"Run",
				"2018-02-07",
				null,
				null,
				false,
				300));

			syncedActivityModels.push(createFakeSyncedActivityModel(7,
				"No sensor Run 2", // HR Scored + Est RSS scored
				"Run",
				"2018-02-08",
				null,
				null,
				false,
				300));

			syncedActivityModels.push(createFakeSyncedActivityModel(8,
				"Swimming", // SSS Scored
				"Swim",
				"2018-02-09",
				null,
				null));

			// ... Grouped activities 2018-02-12; Final SS => 545
			syncedActivityModels.push(createFakeSyncedActivityModel(9,
				"HR Run 3", // HR Scored + Est RSS scored
				"Run",
				"2018-02-12",
				190, // => HRSS: 272 (priority)
				null,
				false,
				300)); // => RSS: 100

			syncedActivityModels.push(createFakeSyncedActivityModel(10,
				"HR + Est power Ride", // HR + PSS Scored (estimated)
				"Ride",
				"2018-02-12",
				190, // => HRSS: 272 (priority)
				150, false)); // => Est PSS: 100

			// ... Grouped activities 2018-02-13; Final SS => 372
			syncedActivityModels.push(createFakeSyncedActivityModel(11,
				"HR Run 4", // HR Scored + Est RSS scored
				"Run",
				"2018-02-13",
				190, // => HRSS: 272 (priority)
				null,
				false,
				300));  // => RSS: 100

			syncedActivityModels.push(createFakeSyncedActivityModel(12,
				"No sensor Run 3", // Est RSS scored
				"Run",
				"2018-02-13",
				null, // => NO HRSS
				null,
				false,
				300)); // => RSS: 100 (priority)

			// ... Grouped activities 2018-02-14; Final SS => 100 + 272 * 2 + 419 => 1064
			syncedActivityModels.push(createFakeSyncedActivityModel(13,
				"Power Ride", // PSS Scored
				"Ride",
				"2018-02-14",
				null,
				150)); // => PSS: 100 (priority)

			syncedActivityModels.push(createFakeSyncedActivityModel(14,
				"HR + Est power Ride", // HR + PSS Scored (estimated)
				"Ride",
				"2018-02-14",
				190, // => HRSS: 272 (priority)
				150, false)); // => Est PSS: 100

			syncedActivityModels.push(createFakeSyncedActivityModel(15,
				"HR Run 4", // HR Scored + Est RSS scored
				"Run",
				"2018-02-14",
				190, // => HRSS: 272 (priority)
				null,
				false,
				300));  // => RSS: 100

			const swimActivity = createFakeSyncedActivityModel(16,
				"Swimming", // SSS Scored
				"Swim",
				"2018-02-14",
				null,
				null);
			swimActivity.distance_raw = 3000; // SSS => 419 (priority)
			syncedActivityModels.push(swimActivity);

			const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
				.and.returnValue(Promise.resolve(syncedActivityModels));

			// When
			const promise: Promise<DayStressModel[]> = fitnessService.generateDailyStress(fitnessUserSettingsModel,
				fitnessTrendConfigModel, powerMeterEnable, swimEnable, skipActivityTypes);

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

				// Test stress scores
				let activity: DayStressModel;

				activity = _.find(dailyActivity, {ids: [0]});
				expect(_.floor(activity.powerStressScore)).toEqual(100);
				expect(_.floor(activity.heartRateStressScore)).toEqual(272);
				expect(_.floor(activity.finalStressScore)).toEqual(100);
				expect(activity.runningStressScore).toBeNull();
				expect(activity.swimStressScore).toBeNull();

				activity = _.find(dailyActivity, {ids: [1]});
				expect(_.floor(activity.powerStressScore)).toEqual(100);
				expect(_.floor(activity.finalStressScore)).toEqual(100);
				expect(activity.heartRateStressScore).toBeNull();
				expect(activity.runningStressScore).toBeNull();
				expect(activity.swimStressScore).toBeNull();

				activity = _.find(dailyActivity, {ids: [2]});
				expect(_.floor(activity.powerStressScore)).toEqual(100);
				expect(_.floor(activity.heartRateStressScore)).toEqual(272);
				expect(_.floor(activity.finalStressScore)).toEqual(272);
				expect(activity.runningStressScore).toBeNull();
				expect(activity.swimStressScore).toBeNull();

				activity = _.find(dailyActivity, {ids: [3]});
				expect(_.floor(activity.powerStressScore)).toEqual(100);
				expect(_.floor(activity.finalStressScore)).toEqual(100);
				expect(activity.heartRateStressScore).toBeNull();
				expect(activity.runningStressScore).toBeNull();
				expect(activity.swimStressScore).toBeNull();

				activity = _.find(dailyActivity, {ids: [4]});
				expect(_.floor(activity.runningStressScore)).toEqual(100);
				expect(_.floor(activity.heartRateStressScore)).toEqual(272);
				expect(_.floor(activity.finalStressScore)).toEqual(272);
				expect(activity.powerStressScore).toBeNull();
				expect(activity.swimStressScore).toBeNull();

				activity = _.find(dailyActivity, {ids: [6]});
				expect(_.floor(activity.runningStressScore)).toEqual(100);
				expect(_.floor(activity.finalStressScore)).toEqual(100);
				expect(activity.heartRateStressScore).toBeNull();
				expect(activity.powerStressScore).toBeNull();
				expect(activity.swimStressScore).toBeNull();

				activity = _.find(dailyActivity, {ids: [7]});
				expect(_.floor(activity.runningStressScore)).toEqual(100);
				expect(_.floor(activity.finalStressScore)).toEqual(100);

				activity = _.find(dailyActivity, {ids: [8]});
				expect(_.isNumber(activity.swimStressScore)).toBeTruthy();
				expect(_.isNumber(activity.finalStressScore)).toBeTruthy();

				activity = _.find(dailyActivity, {ids: [9, 10]});
				// console.log(activity);
				expect(_.floor(activity.heartRateStressScore)).toEqual(545);
				expect(_.floor(activity.powerStressScore)).toEqual(100);
				expect(_.floor(activity.runningStressScore)).toEqual(100);
				expect(_.floor(activity.finalStressScore)).toEqual(545);

				activity = _.find(dailyActivity, {ids: [11, 12]});
				expect(_.floor(activity.heartRateStressScore)).toEqual(272);
				expect(_.floor(activity.runningStressScore)).toEqual(200);
				expect(_.floor(activity.finalStressScore)).toEqual(372);
				// expect(_.floor(activity.powerStressScore)).toEqual(100);

				activity = _.find(dailyActivity, {ids: [13, 14, 15, 16]});
				expect(_.floor(activity.heartRateStressScore)).toEqual(545);
				expect(_.floor(activity.powerStressScore)).toEqual(200);
				expect(_.floor(activity.runningStressScore)).toEqual(100);
				expect(_.floor(activity.swimStressScore)).toEqual(419);
				expect(_.floor(activity.finalStressScore)).toEqual(1065);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should reject generate athlete daily activities without hr or power based activities & HR_Mode=HRSS", (done: Function) => {

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
				fitnessTrendConfigModel, powerMeterEnable, swimEnable);

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

	});

	describe("compute fitness trend", () => {

		it("should compute fitness trend w/ HR_Mode=TRIMP", (done: Function) => {

			// Given
			fitnessTrendConfigModel.heartRateImpulseMode = HeartRateImpulseMode.TRIMP;
			powerMeterEnable = null;
			swimEnable = null;
			const expectedLength = 346;

			const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
				.and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

			// When
			const promise: Promise<DayFitnessTrendModel[]> = fitnessService.computeTrend(fitnessUserSettingsModel,
				fitnessTrendConfigModel, powerMeterEnable, swimEnable);

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
				fitnessTrendConfigModel, powerMeterEnable, swimEnable);

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
				fitnessTrendConfigModel, powerMeterEnable, swimEnable, skipActivitiesTypes);

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

		it("should compute fitness trend w/ Est.PSS=ON & Est.RSS=ON", (done: Function) => {

			// Given
			fitnessTrendConfigModel.allowEstimatedPowerStressScore = true;
			fitnessTrendConfigModel.allowEstimatedRunningStressScore = true;
			const expectedLength = 346;
			const skipActivitiesTypes = null;
			const syncedActivityModels = _TEST_SYNCED_ACTIVITIES_;

			// Add some fakes no sensor activities
			const expectedRideName = "No sensor Ride";
			syncedActivityModels.push(createFakeSyncedActivityModel(1,
				expectedRideName, // PSS Scored (estimated)
				"Ride",
				"2015-08-15",
				null,
				150,
				false));

			const expectedRunName = "No sensor Run";
			syncedActivityModels.push(createFakeSyncedActivityModel(2,
				expectedRunName, // RSS Scored
				"Run",
				"2015-09-15",
				null,
				null,
				false,
				300));

			const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
				.and.returnValue(Promise.resolve(syncedActivityModels));

			// When
			const promise: Promise<DayFitnessTrendModel[]> = fitnessService.computeTrend(fitnessUserSettingsModel,
				fitnessTrendConfigModel, powerMeterEnable, swimEnable, skipActivitiesTypes);

			// Then
			promise.then((fitnessTrend: DayFitnessTrendModel[]) => {

				expect(fitnessTrend).not.toBeNull();

				expect(fitnessTrend.length).toEqual(expectedLength);
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

				let dayTrend: DayFitnessTrendModel;

				dayTrend = _.find(fitnessTrend, {ids: [1]});
				expect(dayTrend).not.toBeNull();
				expect(dayTrend.activitiesName[0]).toEqual(expectedRideName);
				expect(dayTrend.powerStressScore).toEqual(100);
				expect(dayTrend.finalStressScore).toEqual(100);

				dayTrend = _.find(fitnessTrend, {ids: [2]});
				expect(dayTrend).not.toBeNull();
				expect(dayTrend.activitiesName[0]).toEqual(expectedRunName);
				expect(dayTrend.runningStressScore).toEqual(100);
				expect(dayTrend.finalStressScore).toEqual(100);

				// Test stress scores
				dayTrend = _.find(fitnessTrend, {ids: [429628737]});
				expect(_.floor(dayTrend.powerStressScore, 3)).toEqual(112.749);

				dayTrend = _.find(fitnessTrend, {ids: [332833796]});
				expect(_.floor(dayTrend.heartRateStressScore, 3)).toEqual(137.647);
				expect(dayTrend.trainingImpulseScore).toBeNull();

				dayTrend = _.find(fitnessTrend, {ids: [873446053]});
				expect(_.floor(dayTrend.swimStressScore, 3)).toEqual(242.818);

				dayTrend = _.find(fitnessTrend, {ids: [294909522]});
				expect(_.floor(dayTrend.heartRateStressScore, 3)).toEqual(101.385);
				expect(dayTrend.trainingImpulseScore).toBeNull();

				dayTrend = _.find(fitnessTrend, {ids: [873446053, 294909522]});
				expect(_.floor(dayTrend.finalStressScore, 3)).toEqual(344.203);

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
			fitnessTrendConfigModel.initializedFitnessTrendModel = {
				atl: 100,
				ctl: 50
			};

			const promise: Promise<DayFitnessTrendModel[]> = fitnessService.computeTrend(fitnessUserSettingsModel,
				fitnessTrendConfigModel, powerMeterEnable, swimEnable, null);

			// Then
			promise.then((fitnessTrend: DayFitnessTrendModel[]) => {

				expect(fitnessTrend).not.toBeNull();
				expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

				const firstDay = _.first(fitnessTrend);
				expect(firstDay.ctl).toEqual(fitnessTrendConfigModel.initializedFitnessTrendModel.ctl);
				expect(firstDay.atl).toEqual(fitnessTrendConfigModel.initializedFitnessTrendModel.atl);
				expect(firstDay.tsb).toEqual(fitnessTrendConfigModel.initializedFitnessTrendModel.ctl - fitnessTrendConfigModel.initializedFitnessTrendModel.atl);

				const secondDay = fitnessTrend[1];
				expect(secondDay.ctl).toBeGreaterThan(fitnessTrendConfigModel.initializedFitnessTrendModel.ctl);
				expect(secondDay.atl).toBeGreaterThan(fitnessTrendConfigModel.initializedFitnessTrendModel.atl);
				expect(secondDay.tsb).toBeLessThan(fitnessTrendConfigModel.initializedFitnessTrendModel.ctl - fitnessTrendConfigModel.initializedFitnessTrendModel.atl);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});
	});

});
