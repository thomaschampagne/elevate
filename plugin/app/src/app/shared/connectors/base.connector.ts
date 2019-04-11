import { Subject } from "rxjs";
import { SyncEvent } from "../events/sync.event";

export abstract class BaseConnector {

	public name: string;
	public priority: number;
	public enabled: number;

	public abstract sync(): Subject<SyncEvent>;
}
