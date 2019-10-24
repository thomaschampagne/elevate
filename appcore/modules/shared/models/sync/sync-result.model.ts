import { SyncedActivityModel } from "./synced-activity.model";
import { ActivitiesChangesModel } from "./activities-changes.model";

export class SyncResultModel {
	public activitiesChangesModel: ActivitiesChangesModel;
	public syncedActivities: SyncedActivityModel[];
	public syncDateTime: number;
}
