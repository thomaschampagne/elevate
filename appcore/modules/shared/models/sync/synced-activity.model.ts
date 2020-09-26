// tslint:disable:variable-name
import { AnalysisDataModel } from "../activity-data";
import { AthleteSnapshotModel } from "../athlete";
import { BareActivityModel } from "./bare-activity.model";
import { ElevateSport } from "../../enums";
import { ConnectorType } from "../../sync";

interface Extras {
  strava_activity_id?: number;
  fs_activity_location?: { path: string };
}

export class SyncedActivityModel extends BareActivityModel {
  public start_timestamp: number;
  public extendedStats: AnalysisDataModel;
  public athleteSnapshot: AthleteSnapshotModel;
  public sourceConnectorType: ConnectorType;
  public latLngCenter?: number[];
  public hash?: string;
  public settingsLack?: boolean;
  public extras?: Extras = {};

  public static isPaced(activityType: ElevateSport): boolean {
    return SyncedActivityModel.isRun(activityType) || SyncedActivityModel.isSwim(activityType);
  }

  public static isRide(activityType: ElevateSport, allowElectric = false): boolean {
    return (
      activityType === ElevateSport.Ride ||
      activityType === ElevateSport.VirtualRide ||
      (activityType === ElevateSport.EBikeRide && allowElectric)
    );
  }

  public static isRun(activityType: ElevateSport): boolean {
    return activityType === ElevateSport.Run || activityType === ElevateSport.VirtualRun;
  }

  public static isSwim(activityType: ElevateSport): boolean {
    return activityType === ElevateSport.Swim;
  }
}
