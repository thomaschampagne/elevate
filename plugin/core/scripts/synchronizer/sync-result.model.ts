import { AthleteProfileModel } from "../../../common/scripts/models/AthleteProfile";
import { SyncedActivityModel } from "../../../common/scripts/models/Sync";
import { HistoryChangesModel } from "./history-changes.model";

export class SyncResultModel {
	public globalHistoryChanges: HistoryChangesModel;
	public computedActivities: SyncedActivityModel[];
	public lastSyncDateTime: number;
	public syncWithAthleteProfile: AthleteProfileModel;
}
