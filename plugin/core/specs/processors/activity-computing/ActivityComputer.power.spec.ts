import { ActivityStreamsModel } from "../../../../shared/models/activity-data/activity-streams.model";
import { AnalysisDataModel } from "../../../../shared/models/activity-data/analysis-data.model";
import { ActivityComputer } from "../../../scripts/processors/ActivityComputer";
import * as _ from "lodash";
import { UserSettingsModel } from "../../../../shared/models/user-settings/user-settings.model";
import { ActivityStatsMapModel } from "../../../../shared/models/activity-data/activity-stats-map.model";

const expectBetween = (expectValue: number, toEqual: number, tolerance: number) => {

	const lowerOk: number = toEqual - tolerance;
	const higherOk: number = toEqual + tolerance;
	const isBetween = (lowerOk <= expectValue && expectValue <= higherOk);

	expect(isBetween).toBeTruthy("Expected '" + expectValue + "' to equals '" + toEqual + "' is not between min: '"
		+ (lowerOk) + "' and max: '" + (higherOk) + "'.\r\n=> Lower: " + lowerOk + " <= expected: " + expectValue + " <= higher: " + higherOk);

};

describe("ActivityComputer Cycling Power", () => {

	const activityType = "Ride";
	const isTrainer = false;
	const isActivityAuthor = true;
	const bounds: number[] = null;
	const returnZones = false;
	const userSettingsMock: UserSettingsModel = _.cloneDeep(require("../../fixtures/userSettings/2470979.json")); // Thomas C user settings
	const statsMap: ActivityStatsMapModel = {
		distance: -1,
		averageSpeed: -1,
		avgPower: -1,
		elevation: -1
	};

	let TOLERANCE;

	beforeEach(() => {
		TOLERANCE = 25;
	});

	it("should compute REAL power data as ESTIMATED of activity 1109968202 (IM Canada Bike)", (done: Function) => {

		// Power stream is actually from real power sensor. We just said it's estimated to test to test the smoothing.

		// Given
		const hasPowerMeter = false;
		const stream: ActivityStreamsModel = _.cloneDeep(require("../../fixtures/activities/1109968202/stream.json"));
		userSettingsMock.userFTP = 288; // ~FTP in July 2017 (Christophe B)

		// When
		const activityComputer: ActivityComputer = new ActivityComputer(activityType, isTrainer, userSettingsMock, userSettingsMock.userWeight,
			isActivityAuthor, hasPowerMeter, statsMap, stream, bounds, returnZones);
		const result: AnalysisDataModel = activityComputer.compute();

		// Then
		expectBetween(result.powerData.avgWatts, 180, TOLERANCE);
		expectBetween(_.floor(result.powerData.lowerQuartileWatts), 162, TOLERANCE);
		expectBetween(_.floor(result.powerData.medianWatts), 191, TOLERANCE);
		expectBetween(_.floor(result.powerData.upperQuartileWatts), 222, TOLERANCE);
		expectBetween(_.floor(result.powerData.weightedPower), 196, TOLERANCE);
		expectBetween(_.floor(result.powerData.best20min), 223, TOLERANCE);
		expectBetween(_.floor(result.powerData.powerStressScore), 261, TOLERANCE);

		done();
	});

	it("should compute REAL power data as ESTIMATED of activity 1302129959 (20-minute FTP test. First time ever!, result not bad!)", (done: Function) => {

		// Power stream is actually from real power sensor. We just said it's estimated to test to test the smoothing.

		// Given
		const hasPowerMeter = false;
		const stream: ActivityStreamsModel = _.cloneDeep(require("../../fixtures/activities/1302129959/stream.json"));
		userSettingsMock.userFTP = 380; // ~FTP in December 2017 (Jasper Verkuijl)

		// When
		const activityComputer: ActivityComputer = new ActivityComputer(activityType, isTrainer, userSettingsMock, userSettingsMock.userWeight,
			isActivityAuthor, hasPowerMeter, statsMap, stream, bounds, returnZones);
		const result: AnalysisDataModel = activityComputer.compute();

		// Then
		expectBetween(result.powerData.avgWatts, 208, TOLERANCE);
		expectBetween(_.floor(result.powerData.lowerQuartileWatts), 145, TOLERANCE);
		expectBetween(_.floor(result.powerData.medianWatts), 195, TOLERANCE);
		expectBetween(_.floor(result.powerData.upperQuartileWatts), 247, TOLERANCE);
		expectBetween(_.floor(result.powerData.weightedPower), 258, TOLERANCE);
		expectBetween(_.floor(result.powerData.best20min), 380, TOLERANCE);
		expectBetween(_.floor(result.powerData.powerStressScore), 108, TOLERANCE);

		done();

	});

	it("should compute ESTIMATED power data of activity 343080886 (Alpe d'Huez)", (done: Function) => {

		// Given
		const hasPowerMeter = false;
		const stream: ActivityStreamsModel = _.cloneDeep(require("../../fixtures/activities/343080886/stream.json"));
		stream.watts = stream.watts_calc; // because powerMeter is false
		userSettingsMock.userFTP = 223; // ~FTP in July 2015 (Thomas Champagne)
		userSettingsMock.userMaxHr = 205; // in July 2015 (Thomas Champagne)
		userSettingsMock.userRestHr = 55; // in July 2015 (Thomas Champagne)

		// When
		const activityComputer: ActivityComputer = new ActivityComputer(activityType, isTrainer, userSettingsMock, userSettingsMock.userWeight,
			isActivityAuthor, hasPowerMeter, statsMap, stream, bounds, returnZones);
		const result: AnalysisDataModel = activityComputer.compute();

		// Then
		expectBetween(_.floor(result.powerData.avgWatts), 175, TOLERANCE);
		expectBetween(_.floor(result.powerData.lowerQuartileWatts), 0, TOLERANCE);
		expectBetween(_.floor(result.powerData.medianWatts), 146, TOLERANCE);
		expectBetween(_.floor(result.powerData.upperQuartileWatts), 238, 45);
		expectBetween(_.floor(result.powerData.best20min), 253, TOLERANCE);
		expectBetween(_.floor(result.powerData.powerStressScore), _.floor(result.heartRateData.HRSS), TOLERANCE); // PSS should equals ~HRSS

		done();
	});

	it("should compute ESTIMATED power data of activity 600329531 (Sheep Ride)", (done: Function) => {

		// Given
		const hasPowerMeter = false;
		const stream: ActivityStreamsModel = _.cloneDeep(require("../../fixtures/activities/600329531/stream.json"));
		stream.watts = stream.watts_calc; // because powerMeter is false
		userSettingsMock.userFTP = 239; // ~FTP in July 2016 (Thomas Champagne)
		userSettingsMock.userMaxHr = 205; // in July 2016 (Thomas Champagne)
		userSettingsMock.userRestHr = 55; // in July 2016 (Thomas Champagne)

		// When
		const activityComputer: ActivityComputer = new ActivityComputer(activityType, isTrainer, userSettingsMock, userSettingsMock.userWeight,
			isActivityAuthor, hasPowerMeter, statsMap, stream, bounds, returnZones);
		const result: AnalysisDataModel = activityComputer.compute();

		// Then
		expectBetween(_.floor(result.powerData.avgWatts), 178, TOLERANCE);
		expectBetween(_.floor(result.powerData.lowerQuartileWatts), 38, TOLERANCE);
		expectBetween(_.floor(result.powerData.medianWatts), 168, TOLERANCE);
		expectBetween(_.floor(result.powerData.upperQuartileWatts), 238, TOLERANCE);
		expectBetween(_.floor(result.powerData.best20min), 224, TOLERANCE);
		expectBetween(_.floor(result.powerData.powerStressScore), _.floor(result.heartRateData.HRSS), TOLERANCE); // PSS should equals ~HRSS

		done();

	});

	it("should compute ESTIMATED power data of activity 597999523 (4 Seigneurs x Vik + Murianette x Philippe)", (done: Function) => {

		// Given
		const hasPowerMeter = false;
		const stream: ActivityStreamsModel = _.cloneDeep(require("../../fixtures/activities/597999523/stream.json"));
		stream.watts = stream.watts_calc; // because powerMeter is false
		userSettingsMock.userFTP = 239; // ~FTP in July 2016 (Thomas Champagne)
		userSettingsMock.userMaxHr = 205; // in July 2016 (Thomas Champagne)
		userSettingsMock.userRestHr = 55; // in July 2016 (Thomas Champagne)

		// When
		const activityComputer: ActivityComputer = new ActivityComputer(activityType, isTrainer, userSettingsMock, userSettingsMock.userWeight,
			isActivityAuthor, hasPowerMeter, statsMap, stream, bounds, returnZones);
		const result: AnalysisDataModel = activityComputer.compute();

		// Then
		expectBetween(_.floor(result.powerData.avgWatts), 142, TOLERANCE);
		expectBetween(_.floor(result.powerData.lowerQuartileWatts), 0, TOLERANCE);
		expectBetween(_.floor(result.powerData.medianWatts), 119, TOLERANCE);
		expectBetween(_.floor(result.powerData.upperQuartileWatts), 185, TOLERANCE);
		expectBetween(_.floor(result.powerData.best20min), 200, TOLERANCE);
		expectBetween(_.floor(result.powerData.powerStressScore), _.floor(result.heartRateData.HRSS), TOLERANCE); // PSS should equals ~HRSS

		done();

	});

	it("should compute ESTIMATED power data of activity 1610385844 (#ComeBack - 10 / 43km / 96min / 142HrSS)", (done: Function) => {

		// Given
		const hasPowerMeter = false;
		const stream: ActivityStreamsModel = _.cloneDeep(require("../../fixtures/activities/1610385844/stream.json"));
		stream.watts = stream.watts_calc; // because powerMeter is false
		userSettingsMock.userFTP = 130; // ~FTP in May 2018 (Thomas Champagne)
		userSettingsMock.userMaxHr = 190; // in May 2018 (Thomas Champagne)
		userSettingsMock.userRestHr = 55; // in May 2018 (Thomas Champagne)

		// When
		const activityComputer: ActivityComputer = new ActivityComputer(activityType, isTrainer, userSettingsMock, userSettingsMock.userWeight,
			isActivityAuthor, hasPowerMeter, statsMap, stream, bounds, returnZones);
		const result: AnalysisDataModel = activityComputer.compute();

		// Then
		expectBetween(_.floor(result.powerData.avgWatts), 118, TOLERANCE);
		expectBetween(_.floor(result.powerData.lowerQuartileWatts), 62, TOLERANCE);
		expectBetween(_.floor(result.powerData.medianWatts), 113, TOLERANCE);
		expectBetween(_.floor(result.powerData.upperQuartileWatts), 161, TOLERANCE);
		expectBetween(_.floor(result.powerData.best20min), 145, TOLERANCE);
		expectBetween(_.floor(result.powerData.powerStressScore), _.floor(result.heartRateData.HRSS), TOLERANCE); // PSS should equals ~HRSS

		done();

	});

});

