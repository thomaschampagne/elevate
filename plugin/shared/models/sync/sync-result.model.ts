import { SyncedActivityModel } from "./synced-activity.model";
import { ActivitiesChangesModel } from "../../../core/scripts/synchronizer/activities-changes.model";

export class SyncResultModel {
	public globalHistoryChanges: ActivitiesChangesModel;
	public computedActivities: SyncedActivityModel[];
	public lastSyncDateTime: number;
}
