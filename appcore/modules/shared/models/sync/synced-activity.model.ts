import { AnalysisDataModel } from "../activity-data";
import { AthleteSnapshotModel } from "../athlete";
import { BareActivityModel } from "./bare-activity.model";
import { ConnectorType } from "../../sync/connectors";

interface Extras {
	strava_activity_id?: number;
	fs_activity_location?: { onMachineId: string, path: string };
}

export class SyncedActivityModel extends BareActivityModel {

	public static readonly ID_FIELD: string = "id";

	public start_timestamp: number;
	public extendedStats: AnalysisDataModel;
	public athleteSnapshot: AthleteSnapshotModel;
	public sourceConnectorType: ConnectorType;
	public extras?: Extras = {};

}
