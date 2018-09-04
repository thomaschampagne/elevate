import { StravaActivityModel } from "./strava-activity.model";
import { AthleteModel } from "../athlete.model";

export class StreamActivityModel extends StravaActivityModel {
	public stream: any;
	public hasPowerMeter: boolean;
	public athleteModel: AthleteModel;
}
