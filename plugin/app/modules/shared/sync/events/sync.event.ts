import { SyncEventType } from "./sync-event-type";
import { BaseConnector } from "../connectors";

export class SyncEvent {

	public type: SyncEventType;
	public fromConnector: BaseConnector;
	public description: string;

	constructor(type: SyncEventType, fromConnector: BaseConnector, description: string) {
		this.type = type;
		this.fromConnector = fromConnector;
		this.description = description;
	}
}
