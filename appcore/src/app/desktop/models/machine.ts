import { NoSqlDoc } from "./nosql-doc";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";
import { RuntimeInfo } from "@elevate/shared/electron/runtime-info";
import { AthleteSnapshot } from "@elevate/shared/models/athlete/athlete-snapshot.model";

export class Machine implements NoSqlDoc {
  public id: string;
  public key: string;
  public readonly latestAthleteSnapshot: AthleteSnapshot;

  constructor(
    athleteMachineId: string,
    athleteMachineKey: string,
    public readonly version: string,
    public readonly runtimeInfo: RuntimeInfo,
    public readonly athlete: AthleteModel,
    public readonly stravaHash: string | null
  ) {
    this.id = athleteMachineId;
    this.key = athleteMachineKey;
    this.latestAthleteSnapshot = AthleteModel.getCurrentAthleteSnapshot(this.athlete);

    // Don't track first and last name
    delete this.athlete.firstName;
    delete this.athlete.lastName;

    // Don't keep all datedAthleteSettings, latestAthleteSnapshot is sufficient
    delete this.athlete.datedAthleteSettings;
  }
}
