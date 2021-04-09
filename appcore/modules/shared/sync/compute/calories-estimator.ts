import _ from "lodash";
import { ElevateSport } from "@elevate/shared/enums";
import { Gender } from "../../models";

/**
 * Based on
 * - https://www.omnicalculator.com/sports/calories-burned#how-to-calculate-calories-burned
 * - https://captaincalculator.com/health/calorie/
 */
export class CaloriesEstimator {
  private static readonly MET_DEFAULT: number = 6;

  /**
   * Note: "MET" stands for "Metabolic Equivalent of a Task"
   */
  private static readonly MET_SPORT_MAP: Map<ElevateSport, number> = new Map<ElevateSport, number>([
    [ElevateSport.Ride, 9.5],
    [ElevateSport.VirtualRide, 9.5],
    [ElevateSport.Run, 9.8],
    [ElevateSport.VirtualRun, 9.8],
    [ElevateSport.Swim, 8],
    [ElevateSport.Rowing, 7],
    [ElevateSport.Hike, 6],
    [ElevateSport.Football, 7],
    [ElevateSport.AlpineSki, 7],
    [ElevateSport.Snowboard, 7],
    [ElevateSport.WeightTraining, 3],
    [ElevateSport.Climbing, 8],
    [ElevateSport.IceSkate, 10],
    [ElevateSport.InlineSkate, 10],
    [ElevateSport.NordicSki, 10]
  ]);

  public static calc(
    sportType: ElevateSport,
    movingTime: number,
    weight: number,
    age: number = null,
    gender: Gender = null,
    avgBpm: number = null
  ): number {
    if (!(movingTime > 0) || !(weight > 0)) {
      return null;
    }

    // Can be calculated from heart-rate data?
    if (age > 0 && gender && avgBpm > 0) {
      return this.calcFromHr(movingTime, weight, age, gender, avgBpm);
    }

    const metValue = CaloriesEstimator.MET_SPORT_MAP.get(sportType) || CaloriesEstimator.MET_DEFAULT;
    return _.round((movingTime * metValue * 3.5 * weight) / (200 * 60), 1);
  }

  private static calcFromHr(
    movingTime: number,
    weight: number,
    age: number = null,
    gender: Gender = null,
    avgBpm: number = null
  ): number {
    const constantAge = gender === Gender.MEN ? 0.2017 : 0.074;
    const constantWeight = gender === Gender.MEN ? 0.1988 : 0.1263;
    const constantBmp = gender === Gender.MEN ? 0.6309 : 0.4472;
    const constantFull = gender === Gender.MEN ? 55.0969 : 20.4022;

    const minutes = movingTime / 60;

    // Compute calories
    let result;
    if (gender === Gender.MEN) {
      result = ((-constantFull + constantBmp * avgBpm + constantWeight * weight + constantAge * age) / 4.184) * minutes;
    } else {
      result = ((age * constantAge - weight * constantWeight + avgBpm * constantBmp - constantFull) * minutes) / 4.184;
    }

    return _.round(result, 1);
  }
}
