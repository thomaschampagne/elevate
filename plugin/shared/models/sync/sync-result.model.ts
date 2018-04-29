import { SyncedActivityModel } from "./synced-activity.model";
import { HistoryChangesModel } from "../../../core/scripts/synchronizer/history-changes.model";

export class SyncResultModel {
	public globalHistoryChanges: HistoryChangesModel;
	public computedActivities: SyncedActivityModel[];
	public lastSyncDateTime: number;
}
