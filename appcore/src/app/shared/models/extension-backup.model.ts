import { SyncedActivityModel } from "@elevate/shared/models/sync/synced-activity.model";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";
import { SyncDateTime } from "@elevate/shared/models/sync/sync-date-time.model";

export class ExtensionBackupModel {
  constructor(
    public readonly syncDateTime: SyncDateTime,
    public readonly syncedActivities: SyncedActivityModel[],
    public readonly pluginVersion: string,
    public readonly athleteModel: AthleteModel
  ) {}
}
