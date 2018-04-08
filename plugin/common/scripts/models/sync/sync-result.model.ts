import { AthleteProfileModel } from "../athlete-profile.model";
import { HistoryChangesModel } from "../../../../core/scripts/synchronizer/history-changes.model";
import { SyncedActivityModel } from "./synced-activity.model";

export class SyncResultModel {
	public globalHistoryChanges: HistoryChangesModel;
	public computedActivities: SyncedActivityModel[];
	public lastSyncDateTime: number;
	public syncWithAthleteProfile: AthleteProfileModel;
}
