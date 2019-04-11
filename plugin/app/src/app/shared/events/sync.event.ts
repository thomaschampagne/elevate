import { BaseConnector } from "../connectors/base.connector";
import { SyncEventType } from "../enums/sync-event-type";

export class SyncEvent {

	public type: SyncEventType;
	public fromConnector: BaseConnector;
	public description: string;
}
