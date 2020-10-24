// tslint:disable:variable-name
import { AnalysisDataModel } from "../activity-data";
import { AthleteSnapshotModel } from "../athlete";
import { BareActivityModel } from "./bare-activity.model";
import { ConnectorType } from "../../sync/connectors";

interface Extras {
  strava_activity_id?: number;
  fs_activity_location?: { path: string };
}

export class SyncedActivityModel extends BareActivityModel {
  public start_timestamp: number;
  public extendedStats: AnalysisDataModel;
  public athleteSnapshot: AthleteSnapshotModel;
  public sourceConnectorType: ConnectorType;
  public settingsLack?: boolean;
  public extras?: Extras = {};
}
