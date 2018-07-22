import { SyncedActivityModel } from "../../../../../../shared/models/sync/synced-activity.model";
import * as moment from "moment";
import * as _ from "lodash";


export class FakeSyncedActivityHelper {

	public static create(id: number, name: string, type: string, dateStr: string, avgHr: number, avgWatts: number, hasPowerMeter?: boolean, avgPace?: number): SyncedActivityModel {

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
				bestEightyPercent: avgWatts,
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
				gradeAdjustedPaceZones: null,
				runningStressScore: null,
				runningStressScorePerHour: null,
			};
		}
		return fakeActivity;
	}
}
