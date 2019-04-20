import { SyncEventType } from "./sync-event-type";
import { BaseConnector } from "../../../../../desktop/src/connectors/base.connector";

export class SyncEvent {

	public type: SyncEventType;
	public fromConnector: BaseConnector;
	public description: string;
}
