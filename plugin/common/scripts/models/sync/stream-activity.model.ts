import { StravaActivityModel } from "./strava-activity.model";

export class StreamActivityModel extends StravaActivityModel {
	public stream: any;
	public hasPowerMeter: boolean;
}
