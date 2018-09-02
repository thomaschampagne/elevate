import { Injectable } from "@angular/core";
import { SyncDao } from "../../dao/sync/sync.dao";
import { ActivityDao } from "../../dao/activity/activity.dao";
import { saveAs } from "file-saver";
import * as moment from "moment";
import * as _ from "lodash";
import { SyncState } from "./sync-state.enum";
import { environment } from "../../../../environments/environment";
import { SyncedActivityModel } from "../../../../../../shared/models/sync/synced-activity.model";
import { SyncedBackupModel } from "./synced-backup.model";
import * as semver from "semver";
import { Constant } from "../../../../../../shared/Constant";
import { PeriodicAthleteSettingsModel } from "../../../../../../shared/models/athlete-settings/periodic-athlete-settings.model";
import { PeriodicAthleteSettingsService } from "../periodic-athlete-settings/periodic-athlete-settings.service";
import { UserSettingsService } from "../user-settings/user-settings.service";

@Injectable()
export class SyncService {

	public static readonly SYNC_URL_BASE: string = "https://www.strava.com/dashboard";
	public static readonly SYNC_WINDOW_WIDTH: number = 700;
	public static readonly SYNC_WINDOW_HEIGHT: number = 675;

	constructor(public syncDao: SyncDao,
				public activityDao: ActivityDao,
				public periodicAthleteSettingsService: PeriodicAthleteSettingsService,
				public userSettingsService: UserSettingsService) {

	}

	/**
	 *
	 * @returns {Promise<number>}
	 */
	public getLastSyncDateTime(): Promise<number> {
		return this.syncDao.getLastSyncDateTime();
	}

	/**
	 *
	 * @param {number} lastSyncDateTime
	 * @returns {Promise<number>}
	 */
	public saveLastSyncDateTime(lastSyncDateTime: number): Promise<number> {
		return this.syncDao.saveLastSyncDateTime(lastSyncDateTime);
	}

	/**
	 *
	 * @returns {Promise<number>}
	 */
	public removeLastSyncDateTime(): Promise<number> {
		return this.syncDao.removeLastSyncDateTime();
	}

	/**
	 *
	 * @param {SyncedBackupModel} importedBackupModel
	 * @returns {Promise<SyncedBackupModel>}
	 */
	public import(importedBackupModel: SyncedBackupModel): Promise<SyncedBackupModel> {

		if (_.isEmpty(importedBackupModel.syncedActivities)) {
			return Promise.reject("Activities are not defined or empty in provided backup file. Try to perform a clean full re-sync.");
		}

		if (_.isEmpty(importedBackupModel.pluginVersion)) {
			return Promise.reject("Plugin version is not defined in provided backup file. Try to perform a clean full re-sync.");
		}

		if (!environment.skipRestoreSyncedBackupCheck) {
			// Check if imported backup is compatible with current code
			if (semver.lt(importedBackupModel.pluginVersion, this.getCompatibleBackupVersionThreshold())) {
				return Promise.reject("Imported backup version " + importedBackupModel.pluginVersion + " is not compatible with current installed version " + this.getAppVersion() + ".");
			}
		}

		return this.clearSyncedData().then(() => {

			let promiseImportPeriodicAthleteSettings;

			// If no periodic athlete settings provided in backup then reset periodic athlete settings
			if (_.isEmpty(importedBackupModel.periodicAthleteSettings)) {
				promiseImportPeriodicAthleteSettings = this.periodicAthleteSettingsService.reset();
			} else {
				promiseImportPeriodicAthleteSettings = this.periodicAthleteSettingsService.save(importedBackupModel.periodicAthleteSettings);
			}

			return Promise.all([
				this.saveLastSyncDateTime(importedBackupModel.lastSyncDateTime),
				this.activityDao.save(importedBackupModel.syncedActivities),
				promiseImportPeriodicAthleteSettings,
				this.userSettingsService.clearLocalStorageOnNextLoad()
			]);

		}).then((result: Object[]) => {

			const lastSyncDateTime: number = result[0] as number;
			const syncedActivityModels: SyncedActivityModel[] = result[1] as SyncedActivityModel[];
			const periodicAthleteSettings: PeriodicAthleteSettingsModel[] = result[2] as PeriodicAthleteSettingsModel[];

			const backupModel: SyncedBackupModel = {
				lastSyncDateTime: lastSyncDateTime,
				syncedActivities: syncedActivityModels,
				periodicAthleteSettings: periodicAthleteSettings,
				pluginVersion: importedBackupModel.pluginVersion
			};

			return Promise.resolve(backupModel);
		});
	}

	/**
	 *
	 * @returns {Promise<{filename: string; size: number}>}
	 */
	public export(): Promise<{ filename: string, size: number }> {

		return this.prepareForExport().then((backupModel: SyncedBackupModel) => {

			const blob = new Blob([JSON.stringify(backupModel)], {type: "application/json; charset=utf-8"});
			const filename = moment().format("Y.M.D-H.mm") + "_v" + backupModel.pluginVersion + ".history.json";
			this.saveAs(blob, filename);
			return Promise.resolve({filename: filename, size: blob.size});

		}, error => {
			return Promise.reject(error);
		});
	}

	/**
	 *
	 * @returns {Promise<SyncedBackupModel>}
	 */
	public prepareForExport(): Promise<SyncedBackupModel> {

		return Promise.all([

			this.syncDao.getLastSyncDateTime(),
			this.activityDao.fetch(),
			this.periodicAthleteSettingsService.fetch()

		]).then((result: Object[]) => {

			const lastSyncDateTime: number = result[0] as number;
			const syncedActivityModels: SyncedActivityModel[] = result[1] as SyncedActivityModel[];
			const periodicAthleteSettings: PeriodicAthleteSettingsModel[] = result[2] as PeriodicAthleteSettingsModel[];

			if (!_.isNumber(lastSyncDateTime)) {
				return Promise.reject("Cannot export. No last synchronization date found.");
			}

			const backupModel: SyncedBackupModel = {
				lastSyncDateTime: lastSyncDateTime,
				syncedActivities: syncedActivityModels,
				periodicAthleteSettings: periodicAthleteSettings,
				pluginVersion: this.getAppVersion()
			};

			return Promise.resolve(backupModel);
		});
	}

	/**
	 *
	 * @returns {Promise<void>}
	 */
	public clearSyncedData(): Promise<void> {

		return Promise.all([

			this.removeLastSyncDateTime(),
			this.activityDao.clear()

		]).then((result: Object[]) => {

			const lastSyncDateTime: number = result[0] as number;
			const syncedActivityModels: SyncedActivityModel[] = result[1] as SyncedActivityModel[];

			if ((!_.isNull(lastSyncDateTime) && _.isNumber(lastSyncDateTime)) ||
				!_.isEmpty(syncedActivityModels)) {
				return Promise.reject("Athlete synced data has not been cleared totally. Some properties cannot be deleted. You may need to uninstall/install the software.");
			}

			return Promise.resolve();
		});
	}

	/**
	 *
	 * @returns {Promise<SyncState>}
	 */
	public getSyncState(): Promise<SyncState> {

		return Promise.all([

			this.getLastSyncDateTime(),
			this.activityDao.fetch()

		]).then((result: Object[]) => {

			const lastSyncDateTime: number = result[0] as number;
			const syncedActivityModels: SyncedActivityModel[] = result[1] as SyncedActivityModel[];

			const hasLastSyncDateTime: boolean = _.isNumber(lastSyncDateTime);
			const hasSyncedActivityModels: boolean = !_.isEmpty(syncedActivityModels);

			let syncState: SyncState;
			if (!hasLastSyncDateTime && !hasSyncedActivityModels) {
				syncState = SyncState.NOT_SYNCED;
			} else if (!hasLastSyncDateTime && hasSyncedActivityModels) {
				syncState = SyncState.PARTIALLY_SYNCED;
			} else {
				syncState = SyncState.SYNCED;
			}

			return Promise.resolve(syncState);
		});
	}

	/**
	 *
	 * @param {boolean} fastSync
	 * @param {boolean} forceSync
	 */
	public sync(fastSync: boolean, forceSync: boolean): void {
		this.getCurrentTab((tab: chrome.tabs.Tab) => {
			const params = "?stravistixSync=true&fastSync=" + fastSync + "&forceSync=" + forceSync + "&sourceTabId=" + tab.id;
			const features = "width=" + SyncService.SYNC_WINDOW_WIDTH + ", height=" + SyncService.SYNC_WINDOW_HEIGHT + ", location=0";
			window.open(SyncService.SYNC_URL_BASE + params, "_blank", features);
		});
	}

	/**
	 *
	 * @param {(tab: chrome.tabs.Tab) => void} callback
	 */
	public getCurrentTab(callback: (tab: chrome.tabs.Tab) => void): void {
		chrome.tabs.getCurrent((tab: chrome.tabs.Tab) => {
			callback(tab);
		});
	}

	/**
	 *
	 * @returns {string}
	 */
	public getAppVersion(): string {
		return chrome.runtime.getManifest().version;
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
