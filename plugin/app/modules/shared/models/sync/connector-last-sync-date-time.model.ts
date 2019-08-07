import { ConnectorType } from "../../sync/connectors";

export class ConnectorLastSyncDateTime {

	public static readonly ID_FIELD: string = "connectorType";

	public connectorType: ConnectorType;
	public dateTime: number;

	constructor(connectorType: ConnectorType, dateTime: number) {
		this.connectorType = connectorType;
		this.dateTime = dateTime;
	}
}
