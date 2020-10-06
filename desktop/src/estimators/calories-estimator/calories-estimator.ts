import * as _ from "lodash";
import { ElevateSport } from "@elevate/shared/enums";

/**
 * Based on https://www.omnicalculator.com/sports/calories-burned#how-to-calculate-calories-burned
 */
export class CaloriesEstimator {
  /**
   * Note: "MET" stands for "Metabolic Equivalent of a Task"
   */
  private static readonly MET_SPORT_MAP: { sportType: ElevateSport; value: number }[] = [
    { sportType: ElevateSport.Ride, value: 9.5 },
    { sportType: ElevateSport.VirtualRide, value: 9.5 },
    { sportType: ElevateSport.Run, value: 9.8 },
    { sportType: ElevateSport.VirtualRun, value: 9.8 },
    { sportType: ElevateSport.Swim, value: 8 },
    { sportType: ElevateSport.Rowing, value: 4.64 },
    { sportType: ElevateSport.Hike, value: 6 },
    { sportType: ElevateSport.Football, value: 7 },
    { sportType: ElevateSport.AlpineSki, value: 7 },
    { sportType: ElevateSport.Snowboard, value: 7 },
    { sportType: ElevateSport.WeightTraining, value: 3 },
    { sportType: ElevateSport.Climbing, value: 8 },
  ];

  public static calc(sportType: ElevateSport, movingTime: number, weight: number): number {
    if (!(movingTime > 0) || !(weight > 0)) {
      return null;
    }

    const metFound = _.find(CaloriesEstimator.MET_SPORT_MAP, { sportType: sportType });
    return metFound ? _.floor((movingTime * metFound.value * 3.5 * weight) / (200 * 60), 1) : null;
  }
}
