import { SyncEventType } from "./sync-event-type";
import { ConnectorType } from "../connectors";
import { SyncEvent } from "./sync.event";

export class StartedSyncEvent extends SyncEvent {
	constructor(fromConnectorType: ConnectorType, description: string = null) {
		super(SyncEventType.STARTED, fromConnectorType, description);
	}
}
