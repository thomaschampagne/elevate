import {
	ActivitySourceDataModel,
	ActivityStreamsModel,
	AnalysisDataModel,
	AthleteSettingsModel,
	AthleteSnapshotModel,
	Gender,
	UserSettings,
} from "@elevate/shared/models";
import { ActivityComputer } from "../../../scripts/processors/activity-computer";
import * as _ from "lodash";
import UserSettingsModel = UserSettings.UserSettingsModel;

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
	const isOwner = true;
	const bounds: number[] = null;
	const returnZones = false;
	const userSettingsMock: UserSettingsModel = _.cloneDeep(require("../../fixtures/user-settings/2470979.json")); // Thomas C user settings
	const athleteSnapshot = new AthleteSnapshotModel(Gender.MEN, new AthleteSettingsModel(200, 45, null, 240, null, null, 71.9));
	const activitySourceData: ActivitySourceDataModel = {
		movingTime: -1,
		elevation: -1,
		distance: -1
	};

	let TOLERANCE;

	beforeEach(() => {
		TOLERANCE = 5;
	});

	it("should compute REAL power data as ESTIMATED of activity 1109968202 (IM Canada Bike)", (done: Function) => {

		// Power stream is actually from real power sensor. We just said it's estimated to test to test the smoothing.

		// Given
		const hasPowerMeter = true;
		const stream: ActivityStreamsModel = _.cloneDeep(require("../../fixtures/activities/1109968202/stream.json"));
		athleteSnapshot.athleteSettings.cyclingFtp = 288; // ~FTP in July 2017 (Christophe B)

		// When
		const activityComputer: ActivityComputer = new ActivityComputer(activityType, isTrainer, userSettingsMock, athleteSnapshot,
			isOwner, hasPowerMeter, activitySourceData, stream, bounds, returnZones);
		const result: AnalysisDataModel = activityComputer.compute();

		// Then
		expectBetween(result.powerData.avgWatts, 180, TOLERANCE);
		expectBetween(_.floor(result.powerData.weightedPower), 193, TOLERANCE);
		expectBetween(_.floor(result.powerData.best20min), 223, TOLERANCE);

		done();
	});

	it("should compute REAL power data as ESTIMATED of activity 1302129959 (20-minute FTP test. First time ever!, result not bad!)", (done: Function) => {

		// Given
		const hasPowerMeter = true;
		const stream: ActivityStreamsModel = _.cloneDeep(require("../../fixtures/activities/1302129959/stream.json"));
		athleteSnapshot.athleteSettings.cyclingFtp = 380; // ~FTP in December 2017 (Jasper Verkuijl)

		// When
		const activityComputer: ActivityComputer = new ActivityComputer(activityType, isTrainer, userSettingsMock, athleteSnapshot,
			isOwner, hasPowerMeter, activitySourceData, stream, bounds, returnZones);
		const result: AnalysisDataModel = activityComputer.compute();

		// Then
		expectBetween(result.powerData.avgWatts, 208, TOLERANCE);
		expectBetween(_.floor(result.powerData.weightedPower), 265, TOLERANCE);
		expectBetween(_.floor(result.powerData.best20min), 380, TOLERANCE);

		done();

	});

	it("should compute ESTIMATED power data of activity 343080886 (Alpe d'Huez)", (done: Function) => {

		// Given
		const hasPowerMeter = false;
		const stream: ActivityStreamsModel = _.cloneDeep(require("../../fixtures/activities/343080886/stream.json"));
		stream.watts = stream.watts_calc; // because powerMeter is false
		athleteSnapshot.athleteSettings.cyclingFtp = 260; // ~FTP in July 2015 (Thomas Champagne)
		athleteSnapshot.athleteSettings.maxHr = 205; // in July 2015 (Thomas Champagne)
		athleteSnapshot.athleteSettings.restHr = 55; // in July 2015 (Thomas Champagne)

		// When
		const activityComputer: ActivityComputer = new ActivityComputer(activityType, isTrainer, userSettingsMock, athleteSnapshot,
			isOwner, hasPowerMeter, activitySourceData, stream, bounds, returnZones);
		const result: AnalysisDataModel = activityComputer.compute();

		// Then
		expectBetween(_.floor(result.powerData.avgWatts), 175, TOLERANCE);
		expectBetween(_.floor(result.powerData.best20min), 253, TOLERANCE);

		done();
	});

	it("should compute ESTIMATED power data of activity 600329531 (Sheep Ride)", (done: Function) => {

		// Given
		const hasPowerMeter = false;
		const stream: ActivityStreamsModel = _.cloneDeep(require("../../fixtures/activities/600329531/stream.json"));
		stream.watts = stream.watts_calc; // because powerMeter is false
		athleteSnapshot.athleteSettings.cyclingFtp = 239; // ~FTP in July 2016 (Thomas Champagne)

		// When
		const activityComputer: ActivityComputer = new ActivityComputer(activityType, isTrainer, userSettingsMock, athleteSnapshot,
			isOwner, hasPowerMeter, activitySourceData, stream, bounds, returnZones);
		const result: AnalysisDataModel = activityComputer.compute();

		// Then
		expectBetween(_.floor(result.powerData.avgWatts), 178, TOLERANCE);
		expectBetween(_.floor(result.powerData.best20min), 224, TOLERANCE);

		done();

	});

	it("should compute ESTIMATED power data of activity 597999523 (4 Seigneurs x Vik + Murianette x Philippe)", (done: Function) => {

		// Given
		const hasPowerMeter = false;
		const stream: ActivityStreamsModel = _.cloneDeep(require("../../fixtures/activities/597999523/stream.json"));
		stream.watts = stream.watts_calc; // because powerMeter is false

		// When
		const activityComputer: ActivityComputer = new ActivityComputer(activityType, isTrainer, userSettingsMock, athleteSnapshot,
			isOwner, hasPowerMeter, activitySourceData, stream, bounds, returnZones);
		const result: AnalysisDataModel = activityComputer.compute();

		// Then
		expectBetween(_.floor(result.powerData.avgWatts), 142, TOLERANCE);
		expect(result.powerData.weightedPower > _.floor(result.powerData.avgWatts)).toBeTruthy();
		expect(result.powerData.best20min > _.floor(result.powerData.avgWatts)).toBeTruthy();

		done();

	});

	it("should compute ESTIMATED power data of activity 1610385844 (#ComeBack - 10 / 43km / 96min / 142HrSS)", (done: Function) => {

		// Given
		const hasPowerMeter = false;
		const stream: ActivityStreamsModel = _.cloneDeep(require("../../fixtures/activities/1610385844/stream.json"));
		stream.watts = stream.watts_calc; // because powerMeter is false
		athleteSnapshot.athleteSettings.cyclingFtp = 130; // ~FTP in May 2018 (Thomas Champagne)

		// When
		const activityComputer: ActivityComputer = new ActivityComputer(activityType, isTrainer, userSettingsMock, athleteSnapshot,
			isOwner, hasPowerMeter, activitySourceData, stream, bounds, returnZones);
		const result: AnalysisDataModel = activityComputer.compute();

		// Then
		expectBetween(_.floor(result.powerData.avgWatts), 118, TOLERANCE);
		expectBetween(_.floor(result.powerData.best20min), 145, TOLERANCE);

		done();

	});

	it("should compute ESTIMATED power data of activity 1811220111 (Brötchen suchen im Hanftal, echte 632Hm)", (done: Function) => {

		// Given
		const hasPowerMeter = false;
		const stream: ActivityStreamsModel = _.cloneDeep(require("../../fixtures/activities/1811220111/stream.json"));
		stream.watts = stream.watts_calc; // because powerMeter is false

		// When
		const activityComputer: ActivityComputer = new ActivityComputer(activityType, isTrainer, userSettingsMock, athleteSnapshot,
			isOwner, hasPowerMeter, activitySourceData, stream, bounds, returnZones);
		const result: AnalysisDataModel = activityComputer.compute();

		// Then
		expectBetween(_.floor(result.powerData.avgWatts), 200, TOLERANCE);
		expect(result.powerData.weightedPower > _.floor(result.powerData.avgWatts)).toBeTruthy();
		expect(result.powerData.best20min > _.floor(result.powerData.avgWatts)).toBeTruthy();

		done();

	});

	it("should compute ESTIMATED power data of activity 1817318910", (done: Function) => {

		// Given
		const hasPowerMeter = false;
		const stream: ActivityStreamsModel = _.cloneDeep(require("../../fixtures/activities/1817318910/stream.json"));
		stream.watts = stream.watts_calc; // because powerMeter is false

		// When
		const activityComputer: ActivityComputer = new ActivityComputer(activityType, isTrainer, userSettingsMock, athleteSnapshot,
			isOwner, hasPowerMeter, activitySourceData, stream, bounds, returnZones);
		const result: AnalysisDataModel = activityComputer.compute();

		// Then
		expectBetween(_.floor(result.powerData.avgWatts), 134, TOLERANCE);
		expect(result.powerData.weightedPower > _.floor(result.powerData.avgWatts)).toBeTruthy();

		done();

	});

});

