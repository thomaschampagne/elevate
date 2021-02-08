import { Gzip } from "../../tools";

// tslint:disable:variable-name
export class ActivityStreamsModel {
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

  public static deflate(activityStreamsModel: ActivityStreamsModel): string {
    return Gzip.pack64(activityStreamsModel);
  }

  public static inflate(inflatedStream: string): ActivityStreamsModel {
    return Gzip.unpack64(inflatedStream);
  }
}
