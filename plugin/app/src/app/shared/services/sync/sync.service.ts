import { Injectable } from "@angular/core";
import { LastSyncDateTimeDao } from "../../dao/sync/last-sync-date-time.dao";
import { ActivityDao } from "../../dao/activity/activity.dao";
import { saveAs } from "file-saver";
import * as moment from "moment";
import * as _ from "lodash";
import { SyncState } from "./sync-state.enum";
import { environment } from "../../../../environments/environment";
import { DatedAthleteSettingsModel, SyncedActivityModel } from "@elevate/shared/models";
import { SyncedBackupModel } from "./synced-backup.model";
import * as semver from "semver";
import { DatedAthleteSettingsService } from "../dated-athlete-settings/dated-athlete-settings.service";
import { UserSettingsService } from "../user-settings/user-settings.service";
import { Constant } from "@elevate/shared/constants";

@Injectable()
export class SyncService {

	public static readonly SYNC_URL_BASE: string = "https://www.strava.com/dashboard";
	public static readonly SYNC_WINDOW_WIDTH: number = 700;
	public static readonly SYNC_WINDOW_HEIGHT: number = 700;

	constructor(public lastSyncDateTimeDao: LastSyncDateTimeDao,
				public activityDao: ActivityDao,
				public datedAthleteSettingsService: DatedAthleteSettingsService,
				public userSettingsService: UserSettingsService) {

	}

	/**
	 *
	 * @returns {Promise<number>}
	 */
	public getLastSyncDateTime(): Promise<number> {
		return (<Promise<number>> this.lastSyncDateTimeDao.fetch());
	}

	/**
	 *
	 * @param {number} value
	 * @returns {Promise<number>}
	 */
	public saveLastSyncTime(value: number): Promise<number> {
		return (<Promise<number>> this.lastSyncDateTimeDao.save(value));
	}

	/**
	 *
	 * @returns {Promise<number>}
	 */
	public clearLastSyncTime(): Promise<void> {
		return this.lastSyncDateTimeDao.clear();
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

			let promiseImportDatedAthleteSettings;

			// If no dated athlete settings provided in backup then reset dated athlete settings
			if (_.isEmpty(importedBackupModel.datedAthleteSettings)) {
				promiseImportDatedAthleteSettings = this.datedAthleteSettingsService.reset();
			} else {
				promiseImportDatedAthleteSettings = this.datedAthleteSettingsService.save(importedBackupModel.datedAthleteSettings);
			}

			return Promise.all([
				this.saveLastSyncTime(importedBackupModel.lastSyncDateTime),
				this.activityDao.save(importedBackupModel.syncedActivities),
				promiseImportDatedAthleteSettings,
				this.userSettingsService.clearLocalStorageOnNextLoad()
			]);

		}).then((result: Object[]) => {

			const lastSyncDateTime: number = result[0] as number;
			const syncedActivityModels: SyncedActivityModel[] = result[1] as SyncedActivityModel[];
			const datedAthleteSettings: DatedAthleteSettingsModel[] = result[2] as DatedAthleteSettingsModel[];

			const backupModel: SyncedBackupModel = {
				lastSyncDateTime: lastSyncDateTime,
				syncedActivities: syncedActivityModels,
				datedAthleteSettings: datedAthleteSettings,
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

			this.lastSyncDateTimeDao.fetch(),
			this.activityDao.fetch(),
			this.datedAthleteSettingsService.fetch()

		]).then((result: Object[]) => {

			const lastSyncDateTime: number = result[0] as number;
			const syncedActivityModels: SyncedActivityModel[] = result[1] as SyncedActivityModel[];
			const datedAthleteSettings: DatedAthleteSettingsModel[] = result[2] as DatedAthleteSettingsModel[];

			if (!_.isNumber(lastSyncDateTime)) {
				return Promise.reject("Cannot export. No last synchronization date found.");
			}

			const backupModel: SyncedBackupModel = {
				lastSyncDateTime: lastSyncDateTime,
				syncedActivities: syncedActivityModels,
				datedAthleteSettings: datedAthleteSettings,
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
			this.clearLastSyncTime(),
			this.activityDao.clear()
		]).then(() => {
			return Promise.resolve();
		}).catch(error => {
			console.error(error);
			return Promise.reject("Athlete synced data has not been cleared totally. Some properties cannot be deleted. You may need to uninstall/install the software.");
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
	public sync(fastSync: boolean, forceSync: boolean): void { // TODO abstract method?
		this.getCurrentTab((tab: chrome.tabs.Tab) => { // TODO chrome.* should be not directly used, Inject a specific chrome implementation here
			const params = "?elevateSync=true&fastSync=" + fastSync + "&forceSync=" + forceSync + "&sourceTabId=" + tab.id;
			const features = "width=" + SyncService.SYNC_WINDOW_WIDTH + ", height=" + SyncService.SYNC_WINDOW_HEIGHT + ", location=0";
			window.open(SyncService.SYNC_URL_BASE + params, "_blank", features);
		});
	}

	/**
	 *
	 * @param {(tab: chrome.tabs.Tab) => void} callback
	 */
	public getCurrentTab(callback: (tab: chrome.tabs.Tab) => void): void {
		chrome.tabs.getCurrent((tab: chrome.tabs.Tab) => { // TODO chrome.* should be not directly used
			callback(tab);
		});
	}

	/**
	 *
	 * @returns {string}
	 */
	public getAppVersion(): string { // TODO Inject a specific chrome implementation here to getAppVersion or use Root Package.json
		return chrome.runtime.getManifest().version; // TODO chrome.* should be not directly used
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
