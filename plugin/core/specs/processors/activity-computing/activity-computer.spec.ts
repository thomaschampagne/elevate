import {
	ActivityStatsMapModel,
	ActivityStreamsModel,
	AnalysisDataModel,
	AthleteModel,
	AthleteSettingsModel,
	Gender,
	UserSettingsModel
} from "@elevate/shared";
import { ActivityComputer } from "../../../scripts/processors/activity-computer";
import { StreamVariationSplit } from "../../../scripts/models/stream-variation-split.model";

describe("ActivityComputer", () => {

	it("should split stream variations (positive and negative) with time and distance", (done: Function) => {

		// Given
		const trackedStream = [10, 12, 15, 20, 10, 5, 2, 10, 15, 5, 5]; // e.g. Elevation
		const timeScale = [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12]; // e.g. Time
		const distanceScale = [1, 9, 13, 20, 26, 30, 34, 38, 42, 46, 50]; // e.g. Distance

		const expectedStreamVariation: StreamVariationSplit[] = [{
			variation: 10,
			time: 3,
			distance: 19
		}, {
			variation: -18,
			time: 4,
			distance: 14
		}, {
			variation: 13,
			time: 2,
			distance: 8
		}, {
			variation: -10,
			time: 2,
			distance: 8
		}];

		// When
		const result = ActivityComputer.streamVariationsSplits(trackedStream, timeScale, distanceScale);

		// Then
		expect(result).toEqual(expectedStreamVariation);

		done();
	});

	// Cycling
	it("should compute correctly \"Bon rythme ! 33 KPH !\" @ https://www.strava.com/activities/723224273", (done: Function) => {

		const powerMeter = false;

		const userSettingsMock: UserSettingsModel = require("../../fixtures/user-settings/2470979.json");
		const stream: ActivityStreamsModel = require("../../fixtures/activities/723224273/stream.json");
		const statsMap: ActivityStatsMapModel = require("../../fixtures/activities/723224273/statsMap.json");
		const athleteModel = new AthleteModel(Gender.MEN, new AthleteSettingsModel(200, 45, null, 240, null, null, 71.9));

		stream.watts = stream.watts_calc; // because powerMeter is false

		const isActivityAuthor = true;
		const activityComputer: ActivityComputer = new ActivityComputer("Ride", powerMeter, userSettingsMock, athleteModel,
			isActivityAuthor, powerMeter, statsMap, stream, null, true);

		const result: AnalysisDataModel = activityComputer.compute();

		expect(result).not.toBeNull();
		expect(result.speedData).not.toBeNull();
		expect(result.cadenceData).not.toBeNull();
		expect(result.heartRateData).not.toBeNull();
		expect(result.powerData).not.toBeNull();
		expect(result.gradeData).not.toBeNull();
		expect(result.elevationData).not.toBeNull();
		expect(result.paceData).not.toBeNull();

		// Test extended stats
		expect(result.moveRatio.toString()).toMatch(/^0.99967362924/);
		expect(result.speedData.genuineAvgSpeed.toString()).toMatch(/^33.0634084231/);
		expect(result.speedData.totalAvgSpeed.toString()).toMatch(/^33.05261749347/);
		expect(result.speedData.avgPace.toString()).toMatch(/^108/);
		expect(result.speedData.lowerQuartileSpeed.toString()).toMatch(/^27.36/);
		expect(result.speedData.medianSpeed.toString()).toMatch(/^33.48000000000/);
		expect(result.speedData.upperQuartileSpeed.toString()).toMatch(/^38.88/);
		expect(result.speedData.varianceSpeed.toString()).toMatch(/^75.007731480/);
		expect(result.speedData.standardDeviationSpeed.toString()).toMatch(/^8.6607004035/);

		expect(result.paceData.avgPace.toString()).toMatch(/^108/);
		expect(result.paceData.lowerQuartilePace.toString()).toMatch(/^131.5789473684/);
		expect(result.paceData.medianPace.toString()).toMatch(/^107.526881720/);
		expect(result.paceData.upperQuartilePace.toString()).toMatch(/^92.592592592/);
		expect(result.paceData.variancePace.toString()).toMatch(/^47.995052362/);

		expect(result.powerData.hasPowerMeter).toEqual(false);
		expect(result.powerData.avgWatts.toString()).toMatch(/^210.68/);
		expect(result.powerData.weightedPower.toString()).toMatch(/^235.59/);

		expect(result.heartRateData.TRIMP.toString()).toMatch(/^228.48086657/);
		expect(result.heartRateData.TRIMPPerHour.toString()).toMatch(/^134.2688736/);
		expect(result.heartRateData.lowerQuartileHeartRate.toString()).toMatch(/^161/);
		expect(result.heartRateData.medianHeartRate.toString()).toMatch(/^167/);
		expect(result.heartRateData.upperQuartileHeartRate.toString()).toMatch(/^174/);
		expect(result.heartRateData.averageHeartRate.toString()).toMatch(/^164.33806725/);
		expect(result.heartRateData.maxHeartRate.toString()).toMatch(/^190/);
		expect(result.heartRateData.activityHeartRateReserve.toString()).toMatch(/^76.9923014/);
		expect(result.heartRateData.activityHeartRateReserveMax.toString()).toMatch(/^93.548387/);

		expect(result.cadenceData.cadencePercentageMoving.toString()).toMatch(/^89.20640104/);
		expect(result.cadenceData.cadenceTimeMoving.toString()).toMatch(/^5463/);
		expect(result.cadenceData.averageCadenceMoving.toString()).toMatch(/^84.1687717/);
		expect(result.cadenceData.standardDeviationCadence.toString()).toMatch(/^15.7/);
		expect(result.cadenceData.totalOccurrences.toString()).toMatch(/^7740.983333/);
		expect(result.cadenceData.lowerQuartileCadence.toString()).toMatch(/^79/);
		expect(result.cadenceData.medianCadence.toString()).toMatch(/^87/);
		expect(result.cadenceData.upperQuartileCadence.toString()).toMatch(/^93/);

		expect(result.gradeData.avgGrade.toString()).toMatch(/^0.016110032/);
		expect(result.gradeData.avgMaxGrade.toString()).toMatch(/^8.82/);
		expect(result.gradeData.avgMinGrade.toString()).toMatch(/^-9.19/);
		expect(result.gradeData.lowerQuartileGrade.toString()).toMatch(/^-1.3/);
		expect(result.gradeData.medianGrade.toString()).toMatch(/^0/);
		expect(result.gradeData.upperQuartileGrade.toString()).toMatch(/^1.5/);
		expect(result.gradeData.gradeProfile.toString()).toMatch(/^HILLY/);
		expect(result.gradeData.upFlatDownInSeconds.up.toString()).toMatch(/^1745/);
		expect(result.gradeData.upFlatDownInSeconds.flat.toString()).toMatch(/^3278/);
		expect(result.gradeData.upFlatDownInSeconds.down.toString()).toMatch(/^1103/);
		expect(result.gradeData.upFlatDownInSeconds.total.toString()).toMatch(/^6126/);
		expect(result.gradeData.upFlatDownMoveData.up.toString()).toMatch(/^26.355300/);
		expect(result.gradeData.upFlatDownMoveData.flat.toString()).toMatch(/^34.563514/);
		expect(result.gradeData.upFlatDownMoveData.down.toString()).toMatch(/^39.249791/);
		expect(result.gradeData.upFlatDownDistanceData.up.toString()).toMatch(/^12.775/);
		expect(result.gradeData.upFlatDownDistanceData.flat.toString()).toMatch(/^31.47199999/);
		expect(result.gradeData.upFlatDownDistanceData.down.toString()).toMatch(/^12.0257/);

		expect(result.elevationData.avgElevation.toString()).toMatch(/^240/);
		expect(result.elevationData.accumulatedElevationAscent.toString()).toMatch(/^389.8135095/);
		expect(result.elevationData.accumulatedElevationDescent.toString()).toMatch(/^374.231952/);
		expect(result.elevationData.lowerQuartileElevation.toString()).toMatch(/^215/);
		expect(result.elevationData.medianElevation.toString()).toMatch(/^231/);
		expect(result.elevationData.upperQuartileElevation.toString()).toMatch(/^245/);

		done();
	});

	describe("compute stress scores", () => {

		let _ATHLETE_MODEL_: AthleteModel;

		beforeEach((done: Function) => {
			_ATHLETE_MODEL_ = new AthleteModel(Gender.MEN, new AthleteSettingsModel(190, 60, {
				default: 163,
				cycling: null,
				running: null
			}, 150, 300, 31, 70));
			done();
		});

		it("should compute hrSS", (done: Function) => {

			// Given
			const activityTrainingImpulse = 333;
			const expectedStressScore = 239;

			// When
			const heartRateStressScore = ActivityComputer.computeHeartRateStressScore(_ATHLETE_MODEL_.gender,
				_ATHLETE_MODEL_.athleteSettings.maxHr,
				_ATHLETE_MODEL_.athleteSettings.restHr,
				_ATHLETE_MODEL_.athleteSettings.lthr.default,
				activityTrainingImpulse);

			// Then
			expect(Math.floor(heartRateStressScore)).toEqual(expectedStressScore);
			done();
		});

		it("should compute hrSS without lactate threshold given (has to use Karvonen formula with 85% of HRR)", (done: Function) => {

			// Given
			_ATHLETE_MODEL_.athleteSettings.lthr.default = 170.5;
			const activityTrainingImpulse = 333;
			const expectedStressScore = 199;

			// When
			const heartRateStressScore = ActivityComputer.computeHeartRateStressScore(_ATHLETE_MODEL_.gender,
				_ATHLETE_MODEL_.athleteSettings.maxHr,
				_ATHLETE_MODEL_.athleteSettings.restHr,
				_ATHLETE_MODEL_.athleteSettings.lthr.default,
				activityTrainingImpulse);

			// Then
			expect(Math.floor(heartRateStressScore)).toEqual(expectedStressScore);

			done();
		});

		// Compute Running Stress Score (RSS)
		it("should compute RSS (1)", (done: Function) => {

			// Given
			const expectedStressScore = 100;
			const movingTime = 3600; // 1 hours
			const gradeAdjustedPace = 300; // 300sec or 00:05:00/dist.
			const runningThresholdPace = 300; // 300sec or 00:05:00/dist.

			// When
			const runningStressScore = ActivityComputer.computeRunningStressScore(movingTime, gradeAdjustedPace, runningThresholdPace);

			// Then
			expect(Math.floor(runningStressScore)).toEqual(expectedStressScore);
			done();
		});

		it("should compute RSS (2)", (done: Function) => {

			// Given
			const expectedStressScore = 100;
			const movingTime = 3600; // 1 hours
			const gradeAdjustedPace = 300; // 300sec or 00:05:00/dist.
			const runningThresholdPace = 600; // 600sec or 00:10:00/dist.

			// When
			const runningStressScore = ActivityComputer.computeRunningStressScore(movingTime, gradeAdjustedPace, runningThresholdPace);

			// Then
			expect(Math.floor(runningStressScore)).toBeGreaterThan(expectedStressScore);
			done();
		});
	});

	describe("manage lthr preferences", () => {

		let _ATHLETE_MODEL_: AthleteModel;

		beforeEach((done: Function) => {
			_ATHLETE_MODEL_ = new AthleteModel(Gender.MEN, new AthleteSettingsModel(190, 60, {
				default: 163,
				cycling: null,
				running: null
			}, 150, 300, 31, 70));
			done();
		});

		it("should resolve LTHR without user LTHR preferences, activityType='Ride'", (done: Function) => {

			// Given
			const activityType = "Ride";
			const expectedLTHR = 170.5;
			_ATHLETE_MODEL_.athleteSettings.lthr = {
				default: null,
				cycling: null,
				running: null
			};

			// When
			const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_.athleteSettings);

			// Then
			expect(lthr).toEqual(expectedLTHR);
			done();
		});

		it("should resolve LTHR without user LTHR preferences (empty), activityType='Ride'", (done: Function) => {

			// Given
			const activityType = "Ride";
			const expectedLTHR = 170.5;
			_ATHLETE_MODEL_.athleteSettings.lthr = null;

			// When
			const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_.athleteSettings);

			// Then
			expect(lthr).toEqual(expectedLTHR);
			done();
		});

		it("should resolve LTHR without user LTHR preferences, activityType='Run'", (done: Function) => {

			// Given
			const activityType = "Run";
			const expectedLTHR = 170.5;
			_ATHLETE_MODEL_.athleteSettings.lthr = {
				default: null,
				cycling: null,
				running: null
			};

			// When
			const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_.athleteSettings);

			// Then
			expect(lthr).toEqual(expectedLTHR);
			done();
		});

		it("should resolve LTHR without user LTHR preferences, activityType='Rowing'", (done: Function) => {

			// Given
			const activityType = "Rowing";
			const expectedLTHR = 163;
			_ATHLETE_MODEL_.athleteSettings.lthr = {
				default: 163,
				cycling: 175,
				running: 185
			};

			// When
			const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_.athleteSettings);

			// Then
			expect(lthr).toEqual(expectedLTHR);
			done();
		});

		it("should resolve LTHR with user Default LTHR=163, activityType='Ride'", (done: Function) => {

			// Given
			const activityType = "Ride";
			const expectedLTHR = 163;
			_ATHLETE_MODEL_.athleteSettings.lthr = {
				default: 163,
				cycling: null,
				running: null
			};

			// When
			const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_.athleteSettings);

			// Then
			expect(lthr).toEqual(expectedLTHR);
			done();
		});

		it("should resolve LTHR with user Default LTHR=163, activityType='Run'", (done: Function) => {

			// Given
			const activityType = "Run";
			const expectedLTHR = 163;
			_ATHLETE_MODEL_.athleteSettings.lthr = {
				default: 163,
				cycling: null,
				running: null
			};

			// When
			const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_.athleteSettings);

			// Then
			expect(lthr).toEqual(expectedLTHR);
			done();
		});

		it("should resolve LTHR with user Default LTHR=163, activityType='Rowing'", (done: Function) => {

			// Given
			const activityType = "Rowing";
			const expectedLTHR = 163;
			_ATHLETE_MODEL_.athleteSettings.lthr = {
				default: 163,
				cycling: null,
				running: null
			};

			// When
			const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_.athleteSettings);

			// Then
			expect(lthr).toEqual(expectedLTHR);
			done();
		});

		it("should resolve LTHR with user Default LTHR=163, Cycling LTHR=175, activityType='Ride'", (done: Function) => {

			// Given
			const activityType = "Ride";
			const expectedLTHR = 175;
			_ATHLETE_MODEL_.athleteSettings.lthr = {
				default: 163,
				cycling: 175,
				running: null
			};

			// When
			const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_.athleteSettings);

			// Then
			expect(lthr).toEqual(expectedLTHR);
			done();
		});

		it("should resolve LTHR with user Cycling LTHR=175, activityType='VirtualRide'", (done: Function) => {

			// Given
			const activityType = "VirtualRide";
			const expectedLTHR = 175;
			_ATHLETE_MODEL_.athleteSettings.lthr = {
				default: null,
				cycling: 175,
				running: null
			};

			// When
			const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_.athleteSettings);

			// Then
			expect(lthr).toEqual(expectedLTHR);
			done();
		});

		it("should resolve LTHR with user Cycling LTHR=175, Running LTHR=185, activityType='EBikeRide'", (done: Function) => {

			// Given
			const activityType = "EBikeRide";
			const expectedLTHR = 175;
			_ATHLETE_MODEL_.athleteSettings.lthr = {
				default: null,
				cycling: 175,
				running: 185
			};

			// When
			const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_.athleteSettings);

			// Then
			expect(lthr).toEqual(expectedLTHR);
			done();
		});

		it("should resolve LTHR with user Cycling LTHR=175, Running LTHR=185, activityType='Run'", (done: Function) => {

			// Given
			const activityType = "Run";
			const expectedLTHR = 185;
			_ATHLETE_MODEL_.athleteSettings.lthr = {
				default: null,
				cycling: 175,
				running: 185
			};

			// When
			const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_.athleteSettings);

			// Then
			expect(lthr).toEqual(expectedLTHR);
			done();
		});

		it("should resolve LTHR with user Default LTHR=163, Cycling LTHR=175, Running LTHR=185, activityType='Run'", (done: Function) => {

			// Given
			const activityType = "Run";
			const expectedLTHR = 185;
			_ATHLETE_MODEL_.athleteSettings.lthr = {
				default: 163,
				cycling: 175,
				running: 185
			};

			// When
			const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_.athleteSettings);

			// Then
			expect(lthr).toEqual(expectedLTHR);
			done();
		});

		it("should resolve LTHR with user Default LTHR=163, Cycling LTHR=175, Running LTHR=185, activityType='Rowing'", (done: Function) => {

			// Given
			const activityType = "Rowing";
			const expectedLTHR = 163;
			_ATHLETE_MODEL_.athleteSettings.lthr = {
				default: 163,
				cycling: 175,
				running: 185
			};

			// When
			const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_.athleteSettings);

			// Then
			expect(lthr).toEqual(expectedLTHR);
			done();
		});
	});

});

