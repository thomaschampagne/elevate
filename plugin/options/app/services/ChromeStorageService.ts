import IQService = angular.IQService;
import IDeferred = angular.IDeferred;
import { IPromise } from "angular";
import * as _ from "lodash";
import { AthleteProfileModel } from "../../../common/scripts/models/AthleteProfile";
import { SyncedActivityModel } from "../../../common/scripts/models/Sync";
import { UserSettingsModel } from "../../../common/scripts/models/UserSettings";
import { IStorageUsage } from "../../../common/scripts/modules/StorageManager";
import { userSettings } from "../../../common/scripts/UserSettings";

export class ChromeStorageService {

	protected $q: IQService;

	constructor(q: IQService) {
		this.$q = q;
	}

	public getAllFromLocalStorage(): IPromise<any> {
		const deferred: IDeferred<any> = this.$q.defer();
		chrome.storage.local.get(null, (data: any) => {
			deferred.resolve(data);
		});
		return deferred.promise;
	}

	public getFromLocalStorage(key: string): IPromise<any> {
		const deferred: IDeferred<any> = this.$q.defer();
		const object: any = {};
		object[key] = null;
		chrome.storage.local.get(object, (data: any) => {
			deferred.resolve(data[key]);
		});
		return deferred.promise;
	}

	public setToLocalStorage(key: string, value: any): IPromise<any> {
		const deferred: IDeferred<any> = this.$q.defer();

		const object: any = {};
		object[key] = value;
		chrome.storage.local.set(object, () => {

			if (chrome.runtime.lastError) {
				console.error(chrome.runtime.lastError);
				deferred.reject(chrome.runtime.lastError);
			} else {
				deferred.resolve();
			}
		});

		return deferred.promise;
	}

	public removeFromLocalStorage(key: string): IPromise<any> {
		const deferred: IDeferred<any> = this.$q.defer();
		chrome.storage.local.remove(key, () => {
			deferred.resolve();
		});
		return deferred.promise;
	}

	public getLastSyncDate(): IPromise<number> {

		const deferred: IDeferred<number> = this.$q.defer();

		this.getFromLocalStorage("lastSyncDateTime").then((lastSyncDateTime: number) => {

			if (_.isUndefined(lastSyncDateTime) || _.isNull(lastSyncDateTime) || !_.isNumber(lastSyncDateTime)) {
				deferred.resolve(-1);
			} else {
				deferred.resolve(lastSyncDateTime);
			}
		});

		return deferred.promise;
	}

	public getLocalSyncedAthleteProfile(): IPromise<AthleteProfileModel> {
		return this.getFromLocalStorage("syncWithAthleteProfile");
	}

	public getProfileConfigured(): IPromise<boolean> {
		return this.getFromLocalStorage("profileConfigured");
	}

	public setProfileConfigured(status: boolean): IPromise<any> {
		const deferred: IDeferred<any> = this.$q.defer();
		chrome.storage.local.set({
			profileConfigured: status,
		}, () => {
			deferred.resolve();
		});
		return deferred.promise;
	}

	public fetchUserSettings(callback?: (userSettingsSynced: UserSettingsModel) => void): IPromise<UserSettingsModel> {
		const deferred: IDeferred<UserSettingsModel> = this.$q.defer();
		chrome.storage.sync.get(userSettings, (userSettingsSynced: UserSettingsModel) => {
			if (callback) callback(userSettingsSynced);
			deferred.resolve(userSettingsSynced);
		});
		return deferred.promise;
	}

	public updateUserSetting(key: string, value: any, callback?: () => void): IPromise<any> {
		const deferred: IDeferred<any> = this.$q.defer();
		const settingToBeUpdated: any = {};
		settingToBeUpdated[key] = value;
		chrome.storage.sync.set(settingToBeUpdated, () => {
			if (callback) callback();
			deferred.resolve();
		});
		return deferred.promise;
	}

	public fetchComputedActivities(): IPromise<SyncedActivityModel[]> {
		return this.getFromLocalStorage("computedActivities") as IPromise<SyncedActivityModel[]>;
	}

	public getLocalStorageUsage(): IPromise<IStorageUsage> {

		const deferred: IDeferred<IStorageUsage> = this.$q.defer();
		chrome.storage.local.getBytesInUse((bytesInUse: number) => {
			deferred.resolve({
				bytesInUse,
				quotaBytes: chrome.storage.local.QUOTA_BYTES,
				percentUsage: bytesInUse / chrome.storage.local.QUOTA_BYTES * 100,
			} as IStorageUsage);
		});
		return deferred.promise;
	}
}

export let chromeStorageService = ["$q", ($q: IQService) => {
	return new ChromeStorageService($q);
}];
