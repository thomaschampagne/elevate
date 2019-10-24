import { Subject } from "rxjs";

export abstract class AppEventsService {
	public onSyncDone: Subject<boolean>;

	protected constructor() {
		this.onSyncDone = new Subject<boolean>();
	}
}
