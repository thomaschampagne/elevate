import { SyncedActivityModel } from "../../../../../../shared/models/sync/synced-activity.model";

export class SyncedBackupModel {
	public lastSyncDateTime: number;
	public syncedActivities: SyncedActivityModel[];
	public pluginVersion: string;
}
