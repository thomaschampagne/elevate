import { ConnectorType } from "../../sync/connectors";

export class ConnectorSyncDateTime {

	public static readonly ID_FIELD: string = "connectorType";

	public connectorType: ConnectorType;
	public dateTime: number;

	constructor(connectorType: ConnectorType, dateTime: number = Date.now()) {
		this.connectorType = connectorType;
		this.dateTime = dateTime;
	}
}
