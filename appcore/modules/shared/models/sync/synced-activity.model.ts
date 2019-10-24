import { ActivityStreamsModel, AnalysisDataModel } from "../activity-data";
import { AthleteSnapshotModel } from "../athlete";
import { BareActivityModel } from "./bare-activity.model";
import { ConnectorType } from "../../sync/connectors";

export class SyncedActivityModel extends BareActivityModel {

	public static readonly ID_FIELD: string = "id";

	public streams?: ActivityStreamsModel | string;
	public extendedStats: AnalysisDataModel;
	public athleteSnapshot: AthleteSnapshotModel;
	public sourceConnectorType?: ConnectorType;

}
