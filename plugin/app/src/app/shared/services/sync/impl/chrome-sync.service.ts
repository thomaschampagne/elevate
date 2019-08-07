import { Inject, Injectable } from "@angular/core";
import { LastSyncDateTimeDao } from "../../../dao/sync/last-sync-date-time.dao";
import { VERSIONS_PROVIDER, VersionsProvider } from "../../versions/versions-provider.interface";
import { ActivityService } from "../../activity/activity.service";
import { AthleteService } from "../../athlete/athlete.service";
import { UserSettingsService } from "../../user-settings/user-settings.service";
import { LoggerService } from "../../logging/logger.service";
import { SyncedActivityModel } from "@elevate/shared/models/sync/synced-activity.model";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";
import * as _ from "lodash";
import * as moment from "moment";
import { SyncService } from "../sync.service";
import { environment } from "../../../../../environments/environment";
import * as semver from "semver";
import { SyncState } from "../sync-state.enum";
import { ExtensionDumpModel } from "../../../models/dumps/extension-dump.model";
import { DumpModel } from "../../../models/dumps/dump.model";

@Injectable()
export class ChromeSyncService extends SyncService<number> {

	public static readonly SYNC_URL_BASE: string = "https://www.strava.com/dashboard";
	public static readonly SYNC_WINDOW_WIDTH: number = 690;
	public static readonly SYNC_WINDOW_HEIGHT: number = 720;

	constructor(@Inject(VERSIONS_PROVIDER) public versionsProvider: VersionsProvider,
				public activityService: ActivityService,
				public athleteService: AthleteService,
				public userSettingsService: UserSettingsService,
				public logger: LoggerService,
				public lastSyncDateTimeDao: LastSyncDateTimeDao) {
		super(versionsProvider, activityService, athleteService, userSettingsService, logger);
	}

	public sync(fastSync: boolean, forceSync: boolean): Promise<void> {

		this.getCurrentTab((tab: chrome.tabs.Tab) => {
			const params = "?elevateSync=true&fastSync=" + fastSync + "&forceSync=" + forceSync + "&sourceTabId=" + tab.id;

			const features = "width=" + ChromeSyncService.SYNC_WINDOW_WIDTH +
				", height=" + ChromeSyncService.SYNC_WINDOW_HEIGHT + ", location=0";

			window.open(ChromeSyncService.SYNC_URL_BASE + params, "_blank", features);
		});
		return Promise.reject("ChromeSyncService::sync() do not provide " +
			"subscription data (events, error, complete). ChromeSyncService::sync() acts as method returning void.");
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
	 * @returns {Promise<SyncState>}
	 */
	public getSyncState(): Promise<SyncState> {

		return Promise.all([

			this.getLastSyncDateTime(),
			this.activityService.fetch()

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


	public stop(): Promise<void> {
		throw new Error("ChromeSyncService do not support sync stop");
	}

	/**
	 *
	 * @returns {Promise<{filename: string; size: number}>}
	 */
	public export(): Promise<{ filename: string, size: number }> {

		return this.prepareForExport().then((backupModel: ExtensionDumpModel) => {

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
	 * @returns {Promise<DumpModel>}
	 */
	public prepareForExport(): Promise<DumpModel> {

		return Promise.all([

			this.lastSyncDateTimeDao.fetch(),
			this.activityService.fetch(),
			this.athleteService.fetch(),
			this.versionsProvider.getInstalledAppVersion()

		]).then((result: Object[]) => {

			const lastSyncDateTime: number = result[0] as number;
			const syncedActivityModels: SyncedActivityModel[] = result[1] as SyncedActivityModel[];
			const athleteModel: AthleteModel = result[2] as AthleteModel;
			const appVersion: string = result[3] as string;

			if (!_.isNumber(lastSyncDateTime)) {
				return Promise.reject("Cannot export. No last synchronization date found.");
			}

			const backupModel: DumpModel = {
				lastSyncDateTime: lastSyncDateTime,
				syncedActivities: syncedActivityModels,
				athleteModel: athleteModel,
				pluginVersion: appVersion
			};

			return Promise.resolve(backupModel);
		});
	}

	/**
	 *
	 * @param {DumpModel} importedBackupModel
	 * @returns {Promise<DumpModel>}
	 */
	public import(importedBackupModel: ExtensionDumpModel): Promise<void> {

		if (_.isEmpty(importedBackupModel.syncedActivities)) {
			return Promise.reject("Activities are not defined or empty in provided backup file. Try to perform a clean full re-sync.");
		}

		if (_.isEmpty(importedBackupModel.pluginVersion)) {
			return Promise.reject("Plugin version is not defined in provided backup file. Try to perform a clean full re-sync.");
		}

		return this.versionsProvider.getInstalledAppVersion().then(appVersion => {

			if (environment.skipRestoreSyncedBackupCheck) {
				return Promise.resolve();
			}

			// Check if imported backup is compatible with current code
			if (semver.lt(importedBackupModel.pluginVersion, this.getCompatibleBackupVersionThreshold())) {
				return Promise.reject("Imported backup version " + importedBackupModel.pluginVersion
					+ " is not compatible with current installed version " + appVersion + ".");
			} else {
				return Promise.resolve();
			}

		}).then(() => {

			return this.clearSyncedData();

		}).then(() => {

			let promiseImportDatedAthleteSettings;

			// If no dated athlete settings provided in backup then reset dated athlete settings
			if (_.isEmpty(importedBackupModel.athleteModel)) {
				promiseImportDatedAthleteSettings = this.athleteService.resetSettings();
			} else {
				promiseImportDatedAthleteSettings = this.athleteService.save(importedBackupModel.athleteModel);
			}

			return Promise.all([
				this.saveLastSyncDateTime(importedBackupModel.lastSyncDateTime),
				this.activityService.save(importedBackupModel.syncedActivities),
				promiseImportDatedAthleteSettings,
				this.userSettingsService.clearLocalStorageOnNextLoad()
			]);

		}).then(() => {
			return Promise.resolve();
		});
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
	public saveLastSyncDateTime(value: number): Promise<number> {
		return (<Promise<number>> this.lastSyncDateTimeDao.save(value));
	}

	/**
	 *
	 * @returns {Promise<number>}
	 */
	public clearLastSyncTime(): Promise<void> {
		return this.lastSyncDateTimeDao.clear();
	}
}
