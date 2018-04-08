import { ActivityStatsMapModel, StreamsModel } from "../../../common/scripts/models/ActivityData";
import { UserSettingsModel } from "../../../common/scripts/models/user-settings/user-settings.model";
import { IAppResources } from "./IAppResources";

export interface IComputeActivityThreadMessage {
	activityType: string;
	isTrainer: boolean;
	appResources: IAppResources;
	userSettings: UserSettingsModel;
	isActivityAuthor: boolean;
	athleteWeight: number;
	hasPowerMeter: boolean;
	activityStatsMap: ActivityStatsMapModel;
	activityStream: StreamsModel;
	bounds: number[];
	returnZones: boolean;
	systemJsConfig: SystemJSLoader.Config;
}
