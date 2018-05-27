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

	expect(isBetween).toBeTruthy("Expected '" + expectValue + "' not between min: '"
		+ (lowerOk) + "' and max: '" + (higherOk) + "'.\r\n=> Lower: " + lowerOk + " <= expected: " + expectValue + " <= higher: " + higherOk);

};

describe("ActivityComputer Cycling Power", () => {

	const activityType = "Ride";
	const isTrainer = false;
	const isActivityAuthor = true;
	const bounds: number[] = null;
	const returnZones = false;
	const userSettingsMock: UserSettingsModel = _.cloneDeep(require("../../fixtures/userSettings/2470979.json"));// Thomas C user settings
	const statsMap: ActivityStatsMapModel = {
		distance: -1,
		averageSpeed: -1,
		avgPower: -1,
		elevation: -1
	};

	let TOLERANCE = 25;

	it("should compute REAL power data as ESTIMATED of activity 1109968202 (IM Canada Bike)", (done: Function) => {

		/**
		 * Power stream is actually from real power sensor. We just said it's estimated to test to test the smoothing.
		 */

		// Given
		const hasPowerMeter = false;
		const pssTolerance = 40;
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
		expectBetween(_.floor(result.powerData.powerStressScore), 261, pssTolerance);

		done();

	});

	it("should compute ESTIMATED power data of activity 187311473 (Aug MTS Done, Chamrousse, Brouillard..)", (done: Function) => {

		/**
		 * Equivalent to activity 1599443850 which contains garmin smoothed elevation (https://connect.garmin.com/modern/activity/578359544)
		 */
			// Given
		const hasPowerMeter = false;
		const stream: ActivityStreamsModel = _.cloneDeep(require("../../fixtures/activities/187311473/stream.json"));
		stream.watts = stream.watts_calc; // because powerMeter is false
		userSettingsMock.userFTP = 250; // ~FTP in August 2014 (Thomas Champagne)
		userSettingsMock.userMaxHr = 205; // in August 2014 (Thomas Champagne)
		userSettingsMock.userRestHr = 55; // in August 2014 (Thomas Champagne)

		// When
		const activityComputer: ActivityComputer = new ActivityComputer(activityType, isTrainer, userSettingsMock, userSettingsMock.userWeight,
			isActivityAuthor, hasPowerMeter, statsMap, stream, bounds, returnZones);
		const result: AnalysisDataModel = activityComputer.compute();

		// Then
		expectBetween(_.floor(result.powerData.avgWatts), 164, TOLERANCE);
		expectBetween(_.floor(result.powerData.lowerQuartileWatts), 30, TOLERANCE);
		expectBetween(_.floor(result.powerData.medianWatts), 123, TOLERANCE);
		expectBetween(_.floor(result.powerData.upperQuartileWatts), 314, TOLERANCE);
		expectBetween(_.floor(result.powerData.weightedPower), 249, TOLERANCE);
		expectBetween(_.floor(result.powerData.best20min), 258, TOLERANCE);
		// expectBetween(_.floor(result.powerData.powerStressScore), 261, pssTolerance);
		expectBetween(_.floor(result.powerData.powerStressScore), result.heartRateData.HRSS, TOLERANCE); // PSS should equals ~HRSS

		done();

	});

	it("should compute ESTIMATED power data of activity 343080886 (Alpe d'Huez)", (done: Function) => {

		// Given
		const hasPowerMeter = false;
		const stream: ActivityStreamsModel = _.cloneDeep(require("../../fixtures/activities/343080886/stream.json"));
		stream.watts = stream.watts_calc; // because powerMeter is false
		userSettingsMock.userFTP = 250; // ~FTP in July 2015 (Thomas Champagne)
		userSettingsMock.userMaxHr = 200; // in July 2015 (Thomas Champagne)
		userSettingsMock.userRestHr = 60; // in July 2015 (Thomas Champagne)

		// When
		const activityComputer: ActivityComputer = new ActivityComputer(activityType, isTrainer, userSettingsMock, userSettingsMock.userWeight,
			isActivityAuthor, hasPowerMeter, statsMap, stream, bounds, returnZones);
		const result: AnalysisDataModel = activityComputer.compute();

		// Then
		expectBetween(_.floor(result.powerData.avgWatts), 175, TOLERANCE);
		expectBetween(_.floor(result.powerData.lowerQuartileWatts), 0, TOLERANCE);
		expectBetween(_.floor(result.powerData.medianWatts), 146, TOLERANCE);
		expectBetween(_.floor(result.powerData.upperQuartileWatts), 238, TOLERANCE);
		expectBetween(_.floor(result.powerData.weightedPower), 203, TOLERANCE);
		expectBetween(_.floor(result.powerData.best20min), 253, TOLERANCE);
		expectBetween(_.floor(result.powerData.powerStressScore), result.heartRateData.HRSS, 50); // PSS should equals ~HRSS
		// expectBetween(_.floor(result.powerData.powerStressScore), 261, pssTolerance);

		done();

	});

});

