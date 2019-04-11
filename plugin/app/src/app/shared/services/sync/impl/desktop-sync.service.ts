import { Injectable } from "@angular/core";
import { SyncService } from "../sync.service";

@Injectable()
export class DesktopSyncService extends SyncService {

	public sync(fastSync: boolean, forceSync: boolean): void {
		// TODO...
	}
}
