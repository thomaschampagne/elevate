import { Injectable } from "@angular/core";
import { SyncService } from "../../sync.service";

@Injectable()
export class MockSyncService extends SyncService {

	public sync(fastSync: boolean, forceSync: boolean): void {
	}
}

