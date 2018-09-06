import { SyncedActivityModel } from "./synced-activity.model";
import { ActivitiesChangesModel } from "../../../models/sync/activities-changes.model";

export class SyncResultModel {
	public activitiesChangesModel: ActivitiesChangesModel;
	public syncedActivities: SyncedActivityModel[];
	public lastSyncDateTime: number;
}
