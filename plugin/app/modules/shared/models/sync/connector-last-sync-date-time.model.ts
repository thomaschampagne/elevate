import { ConnectorType } from "../../sync/connectors";

export class ConnectorLastSyncDateTime {

	public static readonly ID_FIELD: string = "connectorType";

	public connectorType: ConnectorType;
	public dateTime: number;

	constructor(connectorType: ConnectorType, dateTime: number = Date.now()) {
		this.connectorType = connectorType;
		this.dateTime = dateTime;
	}

	public updateToNow(): void {
		this.dateTime = Date.now();
	}
}
