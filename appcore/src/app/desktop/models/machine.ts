import { RuntimeInfo } from "@elevate/shared/electron";
import { AthleteModel, AthleteSnapshotModel } from "@elevate/shared/models";
import { StravaAccount } from "@elevate/shared/sync";
import { NoSqlDoc } from "./nosql-doc";

export class Machine implements NoSqlDoc {
  public id: string;
  public key: string;
  public readonly latestAthleteSnapshot: AthleteSnapshotModel;

  constructor(
    athleteMachineId: string,
    athleteMachineKey: string,
    public readonly version: string,
    public readonly runtimeInfo: RuntimeInfo,
    public readonly athlete: AthleteModel,
    public readonly stravaInfo: StravaAccount = null
  ) {
    this.id = athleteMachineId;
    this.key = athleteMachineKey;
    this.latestAthleteSnapshot = AthleteModel.getCurrentAthleteSnapshot(this.athlete);

    // Don't keep all datedAthleteSettings, latestAthleteSnapshot is sufficient
    delete this.athlete.datedAthleteSettings;
  }
}
