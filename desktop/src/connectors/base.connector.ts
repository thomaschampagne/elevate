import { Subject } from "rxjs";
import { SyncEvent } from "@elevate/shared/events";

export abstract class BaseConnector {

	public name: string;
	public priority: number;
	public enabled: number;

	public abstract sync(): Subject<SyncEvent>;
}
