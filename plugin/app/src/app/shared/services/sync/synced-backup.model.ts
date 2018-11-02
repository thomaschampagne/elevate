import { DatedAthleteSettingsModel, SyncedActivityModel } from "@elevate/shared/models";

export class SyncedBackupModel {
	public lastSyncDateTime: number;
	public syncedActivities: SyncedActivityModel[];
	public pluginVersion: string;
	public datedAthleteSettings: DatedAthleteSettingsModel[];
}
