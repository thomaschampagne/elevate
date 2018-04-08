import { AthleteProfileModel } from "../../../../../../common/scripts/models/AthleteProfile";
import { SyncedActivityModel } from "../../../../../../common/scripts/models/sync/synced-activity.model";

export class AthleteHistoryModel {
	public syncWithAthleteProfile: AthleteProfileModel;
	public lastSyncDateTime: number;
	public computedActivities: SyncedActivityModel[];
	public pluginVersion: string;
}
