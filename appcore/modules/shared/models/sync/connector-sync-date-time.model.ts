import { ConnectorType } from "../../sync/connectors";
import { SyncDateTime } from "./sync-date-time.model";

export class ConnectorSyncDateTime extends SyncDateTime {
  constructor(public readonly connectorType: ConnectorType, syncDateTime: number) {
    super(syncDateTime);
  }
}
