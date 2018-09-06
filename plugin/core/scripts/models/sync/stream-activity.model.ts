import { StravaActivityModel } from "./strava-activity.model";
import { AthleteModel } from "../../../../app/src/app/shared/models/athlete/athlete.model";

export class StreamActivityModel extends StravaActivityModel {
	public stream: any;
	public hasPowerMeter: boolean;
	public athleteModel: AthleteModel;
}
