import { SyncDateTime } from "./sync-date-time.model";
import { ConnectorType } from "../../sync/connectors/connector-type.enum";

export class ConnectorSyncDateTime extends SyncDateTime {
  constructor(public readonly connectorType: ConnectorType, syncDateTime: number) {
    super(syncDateTime);
  }
}
