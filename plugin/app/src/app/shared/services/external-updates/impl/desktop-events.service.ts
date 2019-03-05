import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { AppEventsService } from "../app-events-service";
import { SyncResultModel } from "@elevate/shared/models";

@Injectable()
export class DesktopEventsService extends AppEventsService {
	public onSyncDone: Subject<SyncResultModel>;

	constructor() {
		super();
		this.onSyncDone = new Subject<SyncResultModel>();
	}
}
