import { Injectable } from "@angular/core";
import { SyncService } from "../../sync.service";

@Injectable()
export class MockSyncService extends SyncService {

	public sync(fastSync: boolean, forceSync: boolean): Promise<void> {
		return null;
	}

	public stop(): Promise<void> {
		throw new Error("MockSyncService do not support stop");
	}
}

