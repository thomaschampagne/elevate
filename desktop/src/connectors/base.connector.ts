import { Subject } from "rxjs";
import { ConnectorType, SyncEvent } from "@elevate/shared/sync";

export abstract class BaseConnector {

	public type: ConnectorType;
	public priority: number;
	public enabled: boolean;

	public abstract sync(): Subject<SyncEvent>;

	protected constructor(type: ConnectorType, priority: number, enabled: boolean) {
		this.type = type;
		this.priority = priority;
		this.enabled = enabled;
	}
}
