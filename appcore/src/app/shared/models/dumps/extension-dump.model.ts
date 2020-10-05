import { DumpModel } from "./dump.model";
import { SyncedActivityModel } from "@elevate/shared/models/sync/synced-activity.model";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";
import { SyncDateTime } from "@elevate/shared/models/sync/sync-date-time.model";

export class ExtensionDumpModel extends DumpModel {

    public syncDateTime: SyncDateTime;
    public syncedActivities: SyncedActivityModel[];
    public pluginVersion: string;
    public athleteModel: AthleteModel;

    constructor(syncDateTime: SyncDateTime, syncedActivities: SyncedActivityModel[], pluginVersion: string, athleteModel: AthleteModel) {
        super();
        this.syncDateTime = syncDateTime;
        this.syncedActivities = syncedActivities;
        this.pluginVersion = pluginVersion;
        this.athleteModel = athleteModel;
    }
}
