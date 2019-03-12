import { ActivitySourceDataModel, ActivityStreamsModel, AthleteSnapshotModel, UserSettings, } from "@elevate/shared/models";
import { AppResourcesModel } from "./app-resources.model";
import ExtensionUserSettingsModel = UserSettings.ExtensionUserSettingsModel;

export class ComputeActivityThreadMessageModel {
	public activityType: string;
	public supportsGap: boolean; // TODO Should be moved in ActivitySourceDataModel?!
	public isTrainer: boolean; // TODO Should be moved in ActivitySourceDataModel?!
	public appResources: AppResourcesModel;
	public userSettings: ExtensionUserSettingsModel;
	public isOwner: boolean; // TODO Should be moved in ActivitySourceDataModel?!
	public athleteSnapshot: AthleteSnapshotModel;
	public hasPowerMeter: boolean; // TODO Should be moved in ActivitySourceDataModel?!
	public activitySourceData: ActivitySourceDataModel;
	public activityStream: ActivityStreamsModel;
	public bounds: number[];
	public returnZones: boolean;
}
