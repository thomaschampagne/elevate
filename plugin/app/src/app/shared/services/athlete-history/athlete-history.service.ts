import { Injectable } from "@angular/core";
import { AthleteHistoryDao } from "../../dao/athlete-history/athlete-history.dao";
import { ActivityDao } from "../../dao/activity/activity.dao";
import { AthleteProfileModel } from "../../../../../../common/scripts/models/AthleteProfile";
import { SyncedActivityModel } from "../../../../../../common/scripts/models/Sync";
import { AthleteHistoryModel } from "./athlete-history.model";
import { saveAs } from "file-saver";
import * as moment from "moment";
import * as _ from "lodash";
import { AthleteHistoryState } from "./athlete-history-state.enum";
import { Subject } from "rxjs/Subject";
import { UserSettingsService } from "../user-settings/user-settings.service";
import { UserSettingsModel } from "../../../../../../common/scripts/models/UserSettings";

@Injectable()
export class AthleteHistoryService {

	public static readonly SYNC_URL_BASE: string = "https://www.strava.com/dashboard";
	public static readonly SYNC_WINDOW_WIDTH: number = 700;
	public static readonly SYNC_WINDOW_HEIGHT: number = 675;

	public localRemoteAthleteProfileSame: Subject<boolean>;

	constructor(public athleteHistoryDao: AthleteHistoryDao,
				public userSettingsService: UserSettingsService,
				public activityDao: ActivityDao) {

		this.localRemoteAthleteProfileSame = new Subject<boolean>();
	}

	/**
	 *
	 * @returns {Promise<AthleteProfileModel>}
	 */
	public getProfile(): Promise<AthleteProfileModel> {
		return this.athleteHistoryDao.getProfile();
	}

	/**
	 *
	 * @param {AthleteProfileModel} athleteProfileModelToSave
	 * @returns {Promise<AthleteProfileModel>}
	 */
	public saveProfile(athleteProfileModelToSave: AthleteProfileModel): Promise<AthleteProfileModel> {
		return this.athleteHistoryDao.saveProfile(athleteProfileModelToSave);
	}

	/**
	 *
	 * @returns {Promise<AthleteProfileModel>}
	 */
	public removeProfile(): Promise<AthleteProfileModel> {
		return this.athleteHistoryDao.removeProfile();
	}

	/**
	 *
	 * @returns {Promise<number>}
	 */
	public getLastSyncDateTime(): Promise<number> {
		return this.athleteHistoryDao.getLastSyncDateTime();
	}

	/**
	 *
	 * @param {number} lastSyncDateTime
	 * @returns {Promise<number>}
	 */
	public saveLastSyncDateTime(lastSyncDateTime: number): Promise<number> {
		return this.athleteHistoryDao.saveLastSyncDateTime(lastSyncDateTime);
	}

	/**
	 *
	 * @returns {Promise<number>}
	 */
	public removeLastSyncDateTime(): Promise<number> {
		return this.athleteHistoryDao.removeLastSyncDateTime();
	}

	/**
	 *
	 * @param {AthleteHistoryModel} athleteHistoryModel
	 * @returns {Promise<AthleteHistoryModel>}
	 */
	public import(athleteHistoryModel: AthleteHistoryModel): Promise<AthleteHistoryModel> {

		const installedVersion = this.getAppVersion();

		if (_.isEmpty(athleteHistoryModel.syncWithAthleteProfile)) {
			return Promise.reject("Athlete profile is not defined in provided backup file. Try to perform a clean full re-sync.");
		}

		if (_.isEmpty(athleteHistoryModel.computedActivities)) {
			return Promise.reject("Activities are not defined or empty in provided backup file. Try to perform a clean full re-sync.");
		}

		if (_.isEmpty(athleteHistoryModel.pluginVersion)) {
			return Promise.reject("Plugin version is not defined in provided backup file. Try to perform a clean full re-sync.");
		}

		if (installedVersion !== athleteHistoryModel.pluginVersion) {
			return Promise.reject("Cannot import history because of plugin version mismatch. " +
				"The installed plugin version is " + installedVersion + " and imported backup file is " +
				"for a " + athleteHistoryModel.pluginVersion + " plugin version. Try perform a clean full sync.");
		}

		return this.remove().then(() => {

			return Promise.all([
				this.saveLastSyncDateTime(athleteHistoryModel.lastSyncDateTime),
				this.saveProfile(athleteHistoryModel.syncWithAthleteProfile),
				this.activityDao.save(athleteHistoryModel.computedActivities)
			]);

		}).then((result: Object[]) => {

			const lastSyncDateTime: number = result[0] as number;
			const athleteProfileModel: AthleteProfileModel = result[1] as AthleteProfileModel;
			const syncedActivityModels: SyncedActivityModel[] = result[2] as SyncedActivityModel[];

			const athleteHistoryModel: AthleteHistoryModel = {
				syncWithAthleteProfile: athleteProfileModel,
				lastSyncDateTime: lastSyncDateTime,
				computedActivities: syncedActivityModels,
				pluginVersion: installedVersion
			};

			return Promise.resolve(athleteHistoryModel);
		});
	}

	/**
	 *
	 * @returns {Promise<any>} File info
	 */
	public export(): Promise<any> {

		return this.prepareForExport().then((athleteHistoryModel: AthleteHistoryModel) => {

			const blob = new Blob([JSON.stringify(athleteHistoryModel)], {type: "application/json; charset=utf-8"});
			const filename = moment().format("Y.M.D-H.mm") + "_v" + athleteHistoryModel.pluginVersion + ".history.json";
			this.saveAs(blob, filename);
			return Promise.resolve({filename: filename, size: blob.size});

		}, error => {

			return Promise.reject(error);
		});
	}

	/**
	 *
	 * @returns {Promise<AthleteHistoryModel>}
	 */
	public prepareForExport(): Promise<AthleteHistoryModel> {

		return Promise.all([

			this.athleteHistoryDao.getLastSyncDateTime(),
			this.athleteHistoryDao.getProfile(),
			this.activityDao.fetch()

		]).then((result: Object[]) => {

			const lastSyncDateTime: number = result[0] as number;
			const athleteProfileModel: AthleteProfileModel = result[1] as AthleteProfileModel;
			const syncedActivityModels: SyncedActivityModel[] = result[2] as SyncedActivityModel[];

			if (!_.isNumber(lastSyncDateTime)) {
				return Promise.reject("Cannot export. No last synchronization date found.");
			}

			if (_.isEmpty(athleteProfileModel)) {
				return Promise.reject("Cannot export. No athlete history profile saved.");
			}

			const athleteHistoryModel: AthleteHistoryModel = {
				syncWithAthleteProfile: athleteProfileModel,
				lastSyncDateTime: lastSyncDateTime,
				computedActivities: syncedActivityModels,
				pluginVersion: this.getAppVersion()
			};

			return Promise.resolve(athleteHistoryModel);
		});
	}

	/**
	 *
	 * @returns {Promise<AthleteHistoryModel>}
	 */
	public remove(): Promise<AthleteHistoryModel> {

		return Promise.all([

			this.removeLastSyncDateTime(),
			this.removeProfile(),
			this.activityDao.remove()

		]).then((result: Object[]) => {

			const lastSyncDateTime: number = result[0] as number;
			const athleteProfileModel: AthleteProfileModel = result[1] as AthleteProfileModel;
			const syncedActivityModels: SyncedActivityModel[] = result[2] as SyncedActivityModel[];

			if ((!_.isNull(lastSyncDateTime) && _.isNumber(lastSyncDateTime)) ||
				!_.isEmpty(athleteProfileModel) ||
				!_.isEmpty(syncedActivityModels)) {
				return Promise.reject("Athlete history has not been deleted totally. Some properties cannot be deleted. You may need to uninstall/install the software.");
			}

			return Promise.resolve(null);
		});
	}

	/**
	 *
	 * @returns {Promise<AthleteHistoryState>}
	 */
	public getSyncState(): Promise<AthleteHistoryState> {

		return Promise.all([

			this.getLastSyncDateTime(),
			this.activityDao.fetch()

		]).then((result: Object[]) => {

			const lastSyncDateTime: number = result[0] as number;
			const syncedActivityModels: SyncedActivityModel[] = result[1] as SyncedActivityModel[];

			const hasLastSyncDateTime: boolean = _.isNumber(lastSyncDateTime);
			const hasSyncedActivityModels: boolean = !_.isEmpty(syncedActivityModels);

			let athleteHistoryState: AthleteHistoryState;
			if (!hasLastSyncDateTime && !hasSyncedActivityModels) {
				athleteHistoryState = AthleteHistoryState.NOT_SYNCED;
			} else if (!hasLastSyncDateTime && hasSyncedActivityModels) {
				athleteHistoryState = AthleteHistoryState.PARTIALLY_SYNCED;
			} else {
				athleteHistoryState = AthleteHistoryState.SYNCED;
			}

			return Promise.resolve(athleteHistoryState);
		});
	}

	/**
	 *
	 * @param {AthleteProfileModel} remoteAthleteProfileModel
	 * @returns {Promise<boolean>}
	 */
	public isLocalRemoteAthleteProfileSame(remoteAthleteProfileModel: AthleteProfileModel): Promise<boolean> {

		return this.getProfile().then((localAthleteProfile: AthleteProfileModel) => {

			if (_.isEmpty(localAthleteProfile)) {
				return Promise.reject("Local athlete history do not exist.");
			}

			let remoteEqualsLocal = true;

			if (remoteAthleteProfileModel.userGender !== localAthleteProfile.userGender ||
				remoteAthleteProfileModel.userMaxHr !== localAthleteProfile.userMaxHr ||
				remoteAthleteProfileModel.userRestHr !== localAthleteProfile.userRestHr ||
				remoteAthleteProfileModel.userFTP !== localAthleteProfile.userFTP ||
				remoteAthleteProfileModel.userWeight !== localAthleteProfile.userWeight) {

				remoteEqualsLocal = false;
			}

			return Promise.resolve(remoteEqualsLocal);
		});
	}

	/**
	 *
	 */
	public checkLocalRemoteAthleteProfileSame(): void {

		this.userSettingsService.fetch().then((userSettings: UserSettingsModel) => {

			const remoteAthleteProfileModel: AthleteProfileModel = new AthleteProfileModel(userSettings.userGender,
				userSettings.userMaxHr,
				userSettings.userRestHr,
				userSettings.userFTP,
				userSettings.userWeight);

			return this.isLocalRemoteAthleteProfileSame(remoteAthleteProfileModel);

		}).then((isSame: boolean) => {
			this.localRemoteAthleteProfileSame.next(isSame);
		}).catch(error => {
			console.warn(error);
		});
	}

	/**
	 *
	 * @param {boolean} forceSync
	 */
	public sync(forceSync: boolean): void {
		this.getCurrentTab((tab: chrome.tabs.Tab) => {
			const params = "?stravistixSync=true&forceSync=" + forceSync + "&sourceTabId=" + tab.id;
			const features = "width=" + AthleteHistoryService.SYNC_WINDOW_WIDTH + ", height=" + AthleteHistoryService.SYNC_WINDOW_HEIGHT + ", location=0";
			window.open(AthleteHistoryService.SYNC_URL_BASE + params, "_blank", features);
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
	 *
	 * @param {Blob} blob
	 * @param {string} filename
	 */
	public saveAs(blob: Blob, filename: string): void {
		saveAs(blob, filename);
	}
}
