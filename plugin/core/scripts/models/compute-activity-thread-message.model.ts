import { ActivityStatsMapModel, ActivityStreamsModel, AthleteModel, UserSettingsModel } from "@elevate/shared/models";
import { AppResourcesModel } from "./app-resources.model";

export class ComputeActivityThreadMessageModel {
	public activityType: string;
	public supportsGap: boolean;
	public isTrainer: boolean;
	public appResources: AppResourcesModel;
	public userSettings: UserSettingsModel;
	public isActivityAuthor: boolean;
	public athleteModel: AthleteModel;
	public hasPowerMeter: boolean;
	public activityStatsMap: ActivityStatsMapModel;
	public activityStream: ActivityStreamsModel;
	public bounds: number[];
	public returnZones: boolean;
}
