import { DumpModel } from "./dump.model";
import { SyncedActivityModel } from "@elevate/shared/models/sync/synced-activity.model";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";

export class ExtensionDumpModel extends DumpModel {

	public syncDateTime: number;
	public syncedActivities: SyncedActivityModel[];
	public pluginVersion: string;
	public athleteModel: AthleteModel;

	constructor(syncDateTime: number, syncedActivities: SyncedActivityModel[], pluginVersion: string, athleteModel: AthleteModel) {
		super();
		this.syncDateTime = syncDateTime;
		this.syncedActivities = syncedActivities;
		this.pluginVersion = pluginVersion;
		this.athleteModel = athleteModel;
	}
}
