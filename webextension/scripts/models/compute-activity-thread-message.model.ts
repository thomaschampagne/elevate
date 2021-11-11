import { AppResourcesModel } from "./app-resources.model";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { ActivityEssentials } from "@elevate/shared/models/activity-data/activity-essentials.model";
import { AthleteSnapshot } from "@elevate/shared/models/athlete/athlete-snapshot.model";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import ExtensionUserSettings = UserSettings.ExtensionUserSettings;

export class ComputeActivityThreadMessageModel {
  public activityType: ElevateSport;
  public supportsGap: boolean;
  public isTrainer: boolean;
  public appResources: AppResourcesModel;
  public userSettings: ExtensionUserSettings;
  public isOwner: boolean;
  public athleteSnapshot: AthleteSnapshot;
  public hasPowerMeter: boolean;
  public activityEssentials: ActivityEssentials;
  public streams: Streams;
  public bounds: number[];
  public returnPeaks: boolean;
  public returnZones: boolean;
}
