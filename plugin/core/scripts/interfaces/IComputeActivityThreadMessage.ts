import { UserSettingsModel } from "../../../shared/models/user-settings/user-settings.model";
import { AppResourcesModel } from "../models/app-resources.model";
import { ActivityStatsMapModel } from "../../../shared/models/activity-data/activity-stats-map.model";
import { ActivityStreamsModel } from "../../../shared/models/activity-data/activity-streams.model";

export interface IComputeActivityThreadMessage { // TODO Export as model
	activityType: string;
	isTrainer: boolean;
	appResources: AppResourcesModel;
	userSettings: UserSettingsModel;
	isActivityAuthor: boolean;
	athleteWeight: number;
	hasPowerMeter: boolean;
	activityStatsMap: ActivityStatsMapModel;
	activityStream: ActivityStreamsModel;
	bounds: number[];
	returnZones: boolean;
	systemJsConfig: SystemJSLoader.Config;
}
