import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";
import { SyncDateTime } from "@elevate/shared/models/sync/sync-date-time.model";
import { Activity } from "@elevate/shared/models/sync/activity.model";

export class ExtensionBackupModel {
  constructor(
    public readonly syncDateTime: SyncDateTime,
    public readonly activities: Activity[],
    public readonly pluginVersion: string,
    public readonly athleteModel: AthleteModel
  ) {}
}
