import { Injectable } from '@angular/core';
import { AthleteHistoryDao } from "../../dao/athlete-history/athlete-history.dao";
import { ActivityDao } from "../../dao/activity/activity.dao";
import { AthleteProfileModel } from "../../../../../../common/scripts/models/AthleteProfile";
import { SyncedActivityModel } from "../../../../../../common/scripts/models/Sync";
import { AthleteHistoryModel } from "./athlete-history.model";
import { saveAs } from "file-saver";
import * as moment from "moment";
import * as _ from "lodash";

@Injectable()
export class AthleteHistoryService {

	public static readonly SYNC_URL_BASE: string = "https://www.strava.com/dashboard";
	public static readonly SYNC_WINDOW_WIDTH: number = 700;
	public static readonly SYNC_WINDOW_HEIGHT: number = 675;

	constructor(public athleteHistoryDao: AthleteHistoryDao,
				public activityDao: ActivityDao) {
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

		if (installedVersion !== athleteHistoryModel.pluginVersion) {
			return Promise.reject("Cannot import history because of plugin version mismatch. " +
				"The installed plugin version is " + installedVersion + " and imported backup file is " +
				"for a " + athleteHistoryModel.pluginVersion + " plugin version. Try perform a clean full sync.");
		}

		return Promise.all([

			this.saveLastSyncDateTime(athleteHistoryModel.lastSyncDateTime),
			this.saveProfile(athleteHistoryModel.syncWithAthleteProfile),
			this.activityDao.save(athleteHistoryModel.computedActivities)

		]).then((result: Object[]) => {

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
	 * @param {() => void} done
	 */
	public export(done?: () => void): void {

		this.prepareForExport().then((athleteHistoryModel: AthleteHistoryModel) => {
			const blob = new Blob([JSON.stringify(athleteHistoryModel)], {type: "application/json; charset=utf-8"});
			const filename = moment().format("Y.M.D-H.mm") + "_v" + athleteHistoryModel.pluginVersion + ".history.json";
			this.saveAs(blob, filename);
			done();
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
				return Promise.reject("Athlete history model has not been deleted totally. Some properties cannot be deleted.");
			}

			return Promise.resolve(null);
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
