import { UserSettingsModel } from "../../../common/scripts/models/user-settings/user-settings.model";
import { IAppResources } from "./IAppResources";
import { ActivityStatsMapModel } from "../../../common/scripts/models/activity-data/activity-stats-map.model";
import { ActivityStreamsModel } from "../../../common/scripts/models/activity-data/activity-streams.model";

export interface IComputeActivityThreadMessage {
	activityType: string;
	isTrainer: boolean;
	appResources: IAppResources;
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
