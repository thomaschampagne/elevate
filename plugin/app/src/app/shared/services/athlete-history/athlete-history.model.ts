import { SyncedActivityModel } from "../../../../../../shared/models/sync/synced-activity.model";

export class AthleteHistoryModel {
	public lastSyncDateTime: number;
	public computedActivities: SyncedActivityModel[];
	public pluginVersion: string;
}

/*
TODO

export class AthleteHistoryModel { // TODO Rename?!
	public lastSyncDateTime: number;
	public syncedActivities: SyncedActivityModel[];
	public versionInstalled: {
		on: number;
		version: string;
	}
}
 */
