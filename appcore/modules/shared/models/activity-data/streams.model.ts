import LZString from "lz-string";

export class Streams {
  public time: number[];
  public distance: number[];
  public velocity_smooth: number[];
  public altitude: number[];
  public cadence: number[];
  public heartrate: number[];
  public watts: number[];
  // Legacy strava watts calc stream (
  // Also used to debug the calculated watts against real power w/ "DEBUG_EST_VS_REAL_WATTS" LS key
  public watts_calc: number[];
  public latlng: number[][];
  public grade_smooth: number[];
  public grade_adjusted_speed: number[];
  public grade_adjusted_distance: number[];
  public ascent_speed: number[];
  public temp: number[];

  public static deflate(streams: Streams): string {
    return LZString.compressToBase64(JSON.stringify(streams));
  }

  public static inflate(deflated: string): Streams {
    return JSON.parse(LZString.decompressFromBase64(deflated));
  }
}
