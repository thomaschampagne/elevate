import { SyncedActivityModel } from "./synced-activity.model";
import { ActivitiesChangesModel } from "../../../core/scripts/models/sync/activities-changes.model";

export class SyncResultModel {
	public activitiesChangesModel: ActivitiesChangesModel;
	public syncedActivities: SyncedActivityModel[];
	public lastSyncDateTime: number;
}
