import { Subject } from "rxjs";
import { SyncResultModel } from "@elevate/shared/models";

export abstract class AppEventsService {
	/**
	 *
	 */
	public abstract onSyncDone: Subject<SyncResultModel>;
}
