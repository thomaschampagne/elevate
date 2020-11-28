import { SyncEventType } from "./sync-event-type";
import { SyncEvent } from "./sync.event";
import { ConnectorType } from "../connectors";

export class GenericSyncEvent extends SyncEvent {
  constructor(fromConnectorType: ConnectorType, description: string = null) {
    super(SyncEventType.GENERIC, fromConnectorType, description);
  }
}
