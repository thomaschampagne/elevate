import { StravaActivityModel } from "./strava-activity.model";
import { AthleteSnapshot } from "@elevate/shared/models/athlete/athlete-snapshot.model";

export class StreamActivityModel extends StravaActivityModel {
  public stream: any;
  public hasPowerMeter: boolean;
  public athleteSnapshot: AthleteSnapshot;
}
