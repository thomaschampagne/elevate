export class Movement {
  /**
   * Converts kph to seconds/km
   */
  public static speedToPace(kph: number): number | null {
    return Number.isFinite(kph) && kph > 0 ? (1 / kph) * 3600 : null;
  }

  /**
   * Converts kph to seconds/100m
   */
  public static speedToSwimPace(kph: number): number {
    // Convert kph to m/s
    const mps = kph / 3.6;

    // then to s/100m
    return mps > 0 ? 100 / mps : null;
  }
}
