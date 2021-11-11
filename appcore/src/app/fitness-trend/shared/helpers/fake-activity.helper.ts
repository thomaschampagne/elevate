import moment from "moment";
import _ from "lodash";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { AthleteSnapshot } from "@elevate/shared/models/athlete/athlete-snapshot.model";
import { Activity, ActivityStats } from "@elevate/shared/models/sync/activity.model";

export class FakeActivityHelper {
  public static create(
    id: number,
    athleteSnapshot: AthleteSnapshot,
    name: string,
    type: ElevateSport,
    dateStr: string,
    avgHr: number,
    avgWatts: number,
    hasPowerMeter: boolean,
    avgPace?: number
  ): Activity {
    const fakeActivity = new Activity();
    fakeActivity.id = id;
    fakeActivity.athleteSnapshot = athleteSnapshot;
    fakeActivity.name = name;
    fakeActivity.type = type;
    fakeActivity.startTime = moment(dateStr, "YYYY-MM-DD").toISOString();
    fakeActivity.hasPowerMeter = _.isBoolean(hasPowerMeter) ? hasPowerMeter : true;

    fakeActivity.stats = {
      distance: 30000,
      movingTime: 3600,
      elapsedTime: 3600,
      elevationGain: 0,
      moveRatio: 1,
      calories: 1,
      caloriesPerHour: 1,
      scores: {
        runPerfIndex: 25.0,
        stress: {}
      }
    } as ActivityStats;

    // If avgHr given? Generate fake stats
    if (_.isNumber(avgHr)) {
      fakeActivity.stats.heartRate = {
        avg: avgHr,
        max: avgHr,
        avgReserve: avgHr,
        maxReserve: avgHr,
        best20min: avgHr,
        best60min: avgHr,
        lowQ: avgHr,
        median: avgHr,
        upperQ: avgHr,
        stdDev: avgHr,
        zones: null,
        peaks: null
      };

      fakeActivity.stats.scores.stress.hrss = avgHr;
      fakeActivity.stats.scores.stress.hrssPerHour = avgHr;
      fakeActivity.stats.scores.stress.trimp = avgHr;
      fakeActivity.stats.scores.stress.trimpPerHour = avgHr;
    }

    // If power given? Generate fake stats
    if (_.isNumber(avgWatts)) {
      fakeActivity.stats.power = {
        avg: avgWatts,
        avgKg: avgWatts,
        weighted: avgWatts,
        weightedKg: avgWatts,
        max: avgWatts,
        work: avgWatts,
        best20min: avgWatts,
        variabilityIndex: avgWatts,
        intensityFactor: avgWatts,
        lowQ: avgWatts,
        median: avgWatts,
        upperQ: avgWatts,
        stdDev: avgWatts,
        zones: null,
        peaks: null
      };

      fakeActivity.stats.scores.stress.pss = avgWatts;
      fakeActivity.stats.scores.stress.pssPerHour = avgWatts;
    }

    if (_.isNumber(avgPace)) {
      fakeActivity.stats.pace = {
        avg: avgPace,
        gapAvg: avgPace,
        max: avgPace,
        best20min: avgPace,
        lowQ: avgPace,
        median: avgPace,
        upperQ: avgPace,
        stdDev: avgPace,
        zones: null
      };

      fakeActivity.stats.scores.stress.rss = Activity.isRun(type) ? avgPace : null;
      fakeActivity.stats.scores.stress.rssPerHour = Activity.isRun(type) ? avgPace : null;
      fakeActivity.stats.scores.stress.sss = Activity.isSwim(type) ? avgPace : null;
      fakeActivity.stats.scores.stress.sssPerHour = Activity.isSwim(type) ? avgPace : null;
    }
    return fakeActivity;
  }
}
