import { ConnectorType } from "../../sync/connectors";
import { SyncDateTime } from "./sync-date-time.model";

export class ConnectorSyncDateTime extends SyncDateTime {
    public connectorType: ConnectorType;

    constructor(connectorType: ConnectorType, syncDateTime: number) {
        super(syncDateTime);
        this.connectorType = connectorType;
    }
}
