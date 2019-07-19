import { SyncEventType } from "./sync-event-type";
import { ConnectorType } from "../connectors";

export abstract class SyncEvent {

	public type: SyncEventType;
	public fromConnectorType: ConnectorType;
	public description: string;

	protected constructor(type: SyncEventType, fromConnectorType: ConnectorType, description: string = null) {
		this.type = type;
		this.fromConnectorType = fromConnectorType;
		this.description = description;
	}
}
