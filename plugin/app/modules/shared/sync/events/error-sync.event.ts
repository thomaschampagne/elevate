import { SyncEventType } from "./sync-event-type";
import { ConnectorType } from "../connectors";
import { SyncEvent } from "./sync.event";
import { BareActivityModel } from "../../models/sync";

export class ErrorSyncEvent extends SyncEvent {

	public activity: BareActivityModel;
	public error: Error;

	constructor(fromConnectorType: ConnectorType, description: string, error: Error) {
		super(SyncEventType.ERROR, fromConnectorType, description);
		this.error = error;
	}
}
