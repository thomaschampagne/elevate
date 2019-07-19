import { SyncEventType } from "./sync-event-type";
import { ConnectorType } from "../connectors";
import { SyncEvent } from "./sync.event";

export class GenericSyncEvent extends SyncEvent {
	constructor(fromConnectorType: ConnectorType, description: string = null) {
		super(SyncEventType.GENERIC, fromConnectorType, description);
	}
}
