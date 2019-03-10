import { StravaActivityModel } from "./strava-activity.model";
import { AthleteSnapshotModel } from "@elevate/shared/models";

export class StreamActivityModel extends StravaActivityModel {
	public stream: any;
	public hasPowerMeter: boolean;
	public athleteSnapshot: AthleteSnapshotModel;
}
