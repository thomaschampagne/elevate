import { Injectable } from "@angular/core";
import { SyncService } from "../../sync.service";
import { SyncedBackupModel } from "../../synced-backup.model";
import { SyncState } from "../../sync-state.enum";

@Injectable()
export class MockSyncService extends SyncService<any> {

	public sync(fastSync: boolean, forceSync: boolean): Promise<void> {
		return null;
	}

	public stop(): Promise<void> {
		throw new Error("MockSyncService do not support stop");
	}

	public clearLastSyncTime(): Promise<void> {
		return null;
	}

	public export(): Promise<{ filename: string; size: number }> {
		return null;
	}

	public getLastSyncDateTime(): Promise<number> {
		return null;
	}

	public saveLastSyncDateTime(value: number): Promise<number> {
		return null;
	}

	public import(importedBackupModel: SyncedBackupModel): Promise<SyncedBackupModel> {
		return null;
	}

	public getSyncState(): Promise<SyncState> {
		return null;
	}
}

