import _ from "lodash";
import { InconsistentParametersException } from "../../exceptions/inconsistent-parameters.exception";

export class RunningPowerEstimator {
  /**
   * Create Running Power stream estimation
   * Inspired from https://blog.stryd.com/2020/01/10/how-to-calculate-your-race-time-from-your-target-power/
   * Since models define Time = (1.04 * meters) / (TargetPower / massInKg)
   * Then: Watts = 1.04 * massInKg * meterPerSeconds
   * We use grade adjusted speed to handle power while climbing or during downhills
   * @returns Array of running power
   */
  public static createRunningPowerEstimationStream(athleteWeight: number, gradeAdjustedSpeedArray: number[]): number[] {
    if (!_.isNumber(athleteWeight)) {
      throw new InconsistentParametersException("athleteWeight required as number");
    }

    return gradeAdjustedSpeedArray.map(gradeAdjSpeed => 1.04 * athleteWeight * gradeAdjSpeed);
  }
}
