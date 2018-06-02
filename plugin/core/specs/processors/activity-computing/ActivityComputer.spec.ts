import { UserSettingsModel } from "../../../../shared/models/user-settings/user-settings.model";
import { AnalysisDataModel } from "../../../../shared/models/activity-data/analysis-data.model";
import { ActivityStreamsModel } from "../../../../shared/models/activity-data/activity-streams.model";
import { ActivityStatsMapModel } from "../../../../shared/models/activity-data/activity-stats-map.model";
import { ActivityComputer } from "../../../scripts/processors/ActivityComputer";

describe("ActivityComputer", () => {

	// Cycling
	it("should compute correctly \"Bon rythme ! 33 KPH !\" @ https://www.strava.com/activities/723224273", (done: Function) => {

		const powerMeter = false;

		const userSettingsMock: UserSettingsModel = require("../../fixtures/userSettings/2470979.json");
		const stream: ActivityStreamsModel = require("../../fixtures/activities/723224273/stream.json");
		const statsMap: ActivityStatsMapModel = require("../../fixtures/activities/723224273/statsMap.json");

		stream.watts = stream.watts_calc; // because powerMeter is false

		const isActivityAuthor = true;
		const activityComputer: ActivityComputer = new ActivityComputer("Ride", powerMeter, userSettingsMock, userSettingsMock.userWeight,
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
		expect(result.powerData.avgWatts.toString()).toMatch(/^192.45/);
		expect(result.powerData.avgWattsPerKg.toString()).toMatch(/^2.67/);
		expect(result.powerData.weightedPower.toString()).toMatch(/^225.30/);
		expect(result.powerData.variabilityIndex.toString()).toMatch(/^1.17/);
		expect(result.powerData.punchFactor.toString()).toMatch(/^0.93/);
		expect(result.powerData.weightedWattsPerKg.toString()).toMatch(/^3.13/);
		expect(result.powerData.lowerQuartileWatts.toString()).toMatch(/^82/);
		expect(result.powerData.medianWatts.toString()).toMatch(/^189/);
		expect(result.powerData.upperQuartileWatts.toString()).toMatch(/^282/);

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

});

