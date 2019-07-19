import { Inject } from "@angular/core";
import { saveAs } from "file-saver";
import { SyncState } from "./sync-state.enum";
import { SyncedBackupModel } from "./synced-backup.model";
import { AthleteService } from "../athlete/athlete.service";
import { UserSettingsService } from "../user-settings/user-settings.service";
import { Constant } from "@elevate/shared/constants";
import { LoggerService } from "../logging/logger.service";
import { VERSIONS_PROVIDER, VersionsProvider } from "../versions/versions-provider.interface";
import { ActivityService } from "../activity/activity.service";

export abstract class SyncService<T> {

	constructor(@Inject(VERSIONS_PROVIDER) public versionsProvider: VersionsProvider,
				public activityService: ActivityService,
				public athleteService: AthleteService,
				public userSettingsService: UserSettingsService,
				public logger: LoggerService) {
	}

	/**
	 * Promise of sync start
	 * @param fastSync
	 * @param forceSync
	 */
	public abstract sync(fastSync: boolean, forceSync: boolean): Promise<void>;

	public abstract stop(): Promise<void>;

	public abstract getLastSyncDateTime(): Promise<T>;

	public abstract saveLastSyncDateTime(value: T): Promise<T>;

	public abstract clearLastSyncTime(): Promise<void>;

	public abstract getSyncState(): Promise<SyncState>;

	public abstract export(): Promise<{ filename: string, size: number }>;


	// TODO SyncedBackupModel only suits for Extension (Desktop has severals last sync date times...)
	public abstract import(importedBackupModel: SyncedBackupModel): Promise<SyncedBackupModel>;

	/**
	 *
	 * @returns {Promise<void>}
	 */
	public clearSyncedData(): Promise<void> {

		return Promise.all([
			this.clearLastSyncTime(),
			this.activityService.clear()
		]).then(() => {
			return Promise.resolve();
		}).catch(error => {
			this.logger.error(error);
			return Promise.reject("Athlete synced data has not been cleared totally. " +
				"Some properties cannot be deleted. You may need to uninstall/install the software.");
		});
	}

	/**
	 * @returns {string} Backup version threshold at which a "greater or equal" imported backup version is compatible with current code.
	 */
	public getCompatibleBackupVersionThreshold(): string {
		return Constant.COMPATIBLE_BACKUP_VERSION_THRESHOLD;
	}

	/**
	 *
	 * @param {Blob} blob
	 * @param {string} filename
	 */
	public saveAs(blob: Blob, filename: string): void {
		saveAs(blob, filename);
	}
}
