import { Injectable } from "@angular/core";
import { SyncService } from "../../sync.service";
import { DumpModel } from "../../../../models/dumps/dump.model";
import { SyncState } from "../../sync-state.enum";
import { NotImplementedException } from "@elevate/shared/exceptions";

@Injectable()
export class MockSyncService extends SyncService<any> {

	public sync(fastSync: boolean, forceSync: boolean): Promise<void> {
		return null;
	}

	public stop(): Promise<void> {
		throw new Error("MockSyncService do not support stop");
	}

	public clearSyncTime(): Promise<void> {
		return null;
	}

	public export(): Promise<{ filename: string; size: number }> {
		return null;
	}

	public getSyncDateTime(): Promise<number> {
		return null;
	}

	public saveSyncDateTime(value: number): Promise<number> {
		return null;
	}

	public import(importedBackupModel: DumpModel): Promise<void> {
		return null;
	}

	public getSyncState(): Promise<SyncState> {
		return null;
	}

	public getCompatibleBackupVersionThreshold(): string {
		throw new NotImplementedException("MockSyncService.getCompatibleBackupVersionThreshold() to be implemented");
	}
}

