import { AthleteProfileModel } from "../athlete-profile.model";
import { SyncedActivityModel } from "./synced-activity.model";
import { HistoryChangesModel } from "../../../scripts/synchronizer/history-changes.model";

export class SyncResultModel {
	public globalHistoryChanges: HistoryChangesModel;
	public computedActivities: SyncedActivityModel[];
	public lastSyncDateTime: number;
	public syncWithAthleteProfile: AthleteProfileModel;
}
