import { SyncedActivityModel } from "../../../../../../shared/models/sync/synced-activity.model";
import { PeriodicAthleteSettingsModel } from "../../../../../../shared/models/athlete-settings/periodic-athlete-settings.model";

export class SyncedBackupModel {
	public lastSyncDateTime: number;
	public syncedActivities: SyncedActivityModel[];
	public pluginVersion: string;
	public periodicAthleteSettings: PeriodicAthleteSettingsModel[];
}
