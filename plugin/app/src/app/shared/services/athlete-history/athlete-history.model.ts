import { AthleteProfileModel } from "../../../../../../common/scripts/models/AthleteProfile";
import { SyncedActivityModel } from "../../../../../../common/scripts/models/Sync";

export class AthleteHistoryModel {
	public syncWithAthleteProfile: AthleteProfileModel;
	public lastSyncDateTime: number;
	public computedActivities: SyncedActivityModel[];
	public pluginVersion: string;
}
