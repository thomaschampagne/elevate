import _ from "lodash";
import { ElevateSport } from "@elevate/shared/enums";

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

  public static calc(sportType: ElevateSport, movingTime: number, weight: number): number {
    if (!(movingTime > 0) || !(weight > 0)) {
      return null;
    }

    const metValue = CaloriesEstimator.MET_SPORT_MAP.get(sportType) || CaloriesEstimator.MET_DEFAULT;
    return _.round((movingTime * metValue * 3.5 * weight) / (200 * 60), 1);
  }
}
