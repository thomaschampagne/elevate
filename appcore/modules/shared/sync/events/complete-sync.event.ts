import { SyncEventType } from "./sync-event-type";
import { SyncEvent } from "./sync.event";
import { ConnectorType } from "../connectors/connector-type.enum";

export class CompleteSyncEvent extends SyncEvent {
  constructor(fromConnectorType: ConnectorType, description: string = null) {
    super(SyncEventType.COMPLETE, fromConnectorType, description);
  }
}
