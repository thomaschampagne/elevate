import { AthleteProfileModel } from "../../../../../../core/shared/models/athlete-profile.model";
import { SyncedActivityModel } from "../../../../../../core/shared/models/sync/synced-activity.model";

export class AthleteHistoryModel {
	public syncWithAthleteProfile: AthleteProfileModel;
	public lastSyncDateTime: number;
	public computedActivities: SyncedActivityModel[];
	public pluginVersion: string;
}
