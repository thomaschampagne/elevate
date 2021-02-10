import { ActivitySourceDataModel, AthleteSnapshotModel, Streams, UserSettings } from "@elevate/shared/models";
import { AppResourcesModel } from "./app-resources.model";
import { ElevateSport } from "@elevate/shared/enums";
import ExtensionUserSettingsModel = UserSettings.ExtensionUserSettingsModel;

export class ComputeActivityThreadMessageModel {
  public activityType: ElevateSport;
  public supportsGap: boolean; // TODO Should be moved in ActivitySourceDataModel?!
  public isTrainer: boolean; // TODO Should be moved in ActivitySourceDataModel?!
  public appResources: AppResourcesModel;
  public userSettings: ExtensionUserSettingsModel;
  public isOwner: boolean; // TODO Should be moved in ActivitySourceDataModel?!
  public athleteSnapshot: AthleteSnapshotModel;
  public hasPowerMeter: boolean; // TODO Should be moved in ActivitySourceDataModel?!
  public activitySourceData: ActivitySourceDataModel;
  public streams: Streams;
  public bounds: number[];
  public returnZones: boolean;
}
