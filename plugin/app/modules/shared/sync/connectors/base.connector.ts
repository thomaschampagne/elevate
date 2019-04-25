import { Subject } from "rxjs";
import { SyncEvent } from "../events";

export abstract class BaseConnector {

	public name: string;
	public priority: number;
	public enabled: boolean;

	public abstract sync(): Subject<SyncEvent>;

	protected constructor(name: string, priority: number, enabled: boolean) {
		this.name = name;
		this.priority = priority;
		this.enabled = enabled;
	}
}
