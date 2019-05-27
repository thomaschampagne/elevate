import { SyncEventType } from "./sync-event-type";
import { ConnectorType } from "../connectors";
import { SyncEvent } from "./sync.event";
import { SyncedActivityModel } from "../../models/sync";

export class ActivitySyncEvent extends SyncEvent {

	public activity: SyncedActivityModel;
	public isNew: boolean;

	constructor(fromConnectorType: ConnectorType, description: string, activity: SyncedActivityModel, isNew: boolean) {
		super(SyncEventType.ACTIVITY, fromConnectorType, description);
		this.activity = activity;
		this.isNew = isNew;
	}
}
