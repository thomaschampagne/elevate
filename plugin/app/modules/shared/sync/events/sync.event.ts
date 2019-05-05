import { SyncEventType } from "./sync-event-type";
import { ConnectorType } from "../connectors";

export class SyncEvent {

	public type: SyncEventType;
	public fromConnectorType: ConnectorType;
	public description: string;

	constructor(type: SyncEventType, fromConnectorType: ConnectorType, description: string) {
		this.type = type;
		this.fromConnectorType = fromConnectorType;
		this.description = description;
	}
}
