import { ActivityStreamsModel, AnalysisDataModel } from "../activity-data";
import { AthleteSnapshotModel } from "../athlete";
import { BareActivityModel } from "./bare-activity.model";
import { ConnectorType } from "../../sync/connectors";

export class SyncedActivityModel extends BareActivityModel {

	public static readonly ID_FIELD: string = "id";
	public static readonly MINIMAL_FIELDS: string[] = ["id", "name", "type", "display_type", "private", "bike_id", "start_time", "end_time", "distance_raw", "short_unit", "moving_time_raw", "elapsed_time_raw", "hasPowerMeter", "trainer", "commute", "elevation_unit", "elevation_gain_raw", "calories", "extendedStats", "athleteSnapshot"];

	public streams?: ActivityStreamsModel | string;
	public extendedStats: AnalysisDataModel;
	public athleteSnapshot: AthleteSnapshotModel;
	public sourceConnectorType?: ConnectorType;

}
