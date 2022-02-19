import { ActivitiesChangesModel } from "./activities-changes.model";
import { Activity } from "./activity.model";

export class SyncResultModel {
  public activitiesChangesModel: ActivitiesChangesModel;
  public activities: Activity[];
  public syncDateTime: number;
}
