import { Inject } from "@angular/core";
import { saveAs } from "file-saver";
import { SyncState } from "./sync-state.enum";
import { AthleteService } from "../athlete/athlete.service";
import { UserSettingsService } from "../user-settings/user-settings.service";
import { LoggerService } from "../logging/logger.service";
import { VERSIONS_PROVIDER, VersionsProvider } from "../versions/versions-provider.interface";
import { ActivityService } from "../activity/activity.service";
import { DumpModel } from "../../models/dumps/dump.model";
import { environment } from "../../../../environments/environment";
import * as semver from "semver";

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

	public abstract getSyncDateTime(): Promise<T>;

	public abstract saveSyncDateTime(value: T): Promise<T>;

	public abstract clearSyncTime(): Promise<void>;

	public abstract getSyncState(): Promise<SyncState>;

	public abstract export(): Promise<{ filename: string, size: number }>;

	public abstract import(dumpModel: DumpModel): Promise<void>;

	public abstract getCompatibleBackupVersionThreshold(): string;

	/**
	 *
	 * @returns {Promise<void>}
	 */
	public clearSyncedData(): Promise<void> {

		return Promise.all([
			this.clearSyncTime(),
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
	 *
	 * @param {Blob} blob
	 * @param {string} filename
	 */
	public saveAs(blob: Blob, filename: string): void {
		saveAs(blob, filename);
	}

	public isDumpCompatible(dumpVersion, compatibleDumpVersionThreshold): Promise<void> {

		if (environment.skipRestoreSyncedBackupCheck) {
			return Promise.resolve();
		}

		return this.versionsProvider.getInstalledAppVersion().then(appVersion => {

			// Check if imported backup is compatible with current code
			if (semver.lt(dumpVersion, compatibleDumpVersionThreshold)) {
				return Promise.reject("Imported backup version " + dumpVersion
					+ " is not compatible with current installed version " + appVersion + ".");
			} else {
				return Promise.resolve();
			}
		});

	}
}
