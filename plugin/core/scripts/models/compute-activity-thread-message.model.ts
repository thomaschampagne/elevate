import { ActivityStatsMapModel, ActivityStreamsModel, AthleteModel, UserSettingsModel } from "@elevate/shared/models";
import { AppResourcesModel } from "./app-resources.model";

export class ComputeActivityThreadMessageModel {
	activityType: string;
	supportsGap: boolean;
	isTrainer: boolean;
	appResources: AppResourcesModel;
	userSettings: UserSettingsModel;
	isActivityAuthor: boolean;
	athleteModel: AthleteModel;
	hasPowerMeter: boolean;
	activityStatsMap: ActivityStatsMapModel;
	activityStream: ActivityStreamsModel;
	bounds: number[];
	returnZones: boolean;
}
