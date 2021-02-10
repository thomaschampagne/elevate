// tslint:disable:variable-name
import LZString from "lz-string";

export class Streams {
  constructor(
    public time: number[] = [],
    public distance: number[] = [],
    public velocity_smooth: number[] = [],
    public altitude: number[] = [],
    public cadence: number[] = [],
    public heartrate: number[] = [],
    public watts: number[] = [],
    public watts_calc: number[] = [],
    public latlng: number[][] = [],
    public grade_smooth: number[] = [],
    public grade_adjusted_speed: number[] = [],
    public temp: number[] = []
  ) {}

  public static deflate(streams: Streams): string {
    return LZString.compress(JSON.stringify(streams));
  }

  public static inflate(deflated: string): Streams {
    return JSON.parse(LZString.decompress(deflated));
  }
}
