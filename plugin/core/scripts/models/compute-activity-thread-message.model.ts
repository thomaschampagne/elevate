import { UserSettingsModel } from "../../../shared/models/user-settings/user-settings.model";
import { AppResourcesModel } from "./app-resources.model";
import { ActivityStatsMapModel } from "./activity-data/activity-stats-map.model";
import { ActivityStreamsModel } from "./activity-data/activity-streams.model";
import { AthleteModel } from "../../../app/src/app/shared/models/athlete/athlete.model";

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
