import { ActivitySourceDataModel, ActivityStreamsModel, AthleteSnapshotModel, UserSettingsModel } from "@elevate/shared/models";
import { AppResourcesModel } from "./app-resources.model";

export class ComputeActivityThreadMessageModel {
	public activityType: string;
	public supportsGap: boolean; // TODO Should be moved in ActivitySourceDataModel?!
	public isTrainer: boolean; // TODO Should be moved in ActivitySourceDataModel?!
	public appResources: AppResourcesModel;
	public userSettings: UserSettingsModel;
	public isOwner: boolean; // TODO Should be moved in ActivitySourceDataModel?!
	public athleteSnapshot: AthleteSnapshotModel;
	public hasPowerMeter: boolean; // TODO Should be moved in ActivitySourceDataModel?!
	public activitySourceData: ActivitySourceDataModel;
	public activityStream: ActivityStreamsModel;
	public bounds: number[];
	public returnZones: boolean;
}
