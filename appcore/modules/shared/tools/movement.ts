import { Constant } from "../constants/constant";

export class Movement {
  /**
   * Converts kph to seconds/km
   */
  public static speedToPace(kph: number): number | null {
    return Number.isFinite(kph) && kph > 0 ? Constant.SEC_HOUR_FACTOR / kph : null;
  }

  /**
   * Converts seconds/km to kph
   */
  public static paceToSpeed(pace: number): number | null {
    return Number.isFinite(pace) && pace > 0 ? Constant.SEC_HOUR_FACTOR / pace : null;
  }

  /**
   * Converts kph to seconds/100m
   */
  public static speedToSwimPace(kph: number): number {
    // Convert kph to m/s
    const mps = kph / Constant.MPS_KPH_FACTOR;

    // then to s/100m
    return mps > 0 ? 100 / mps : null;
  }
}
