import IQService = angular.IQService;
import IDeferred = angular.IDeferred;

class ChromeStorageService {

    protected $q: IQService;

    constructor(q: IQService) {
        this.$q = q;
    }

    public getAllFromLocalStorage(): IPromise<any> {
        let deferred: IDeferred<any> = this.$q.defer();
        chrome.storage.local.get(null, (data: any) => {
            deferred.resolve(data);
        });
        return deferred.promise;
    }

    public getFromLocalStorage(key: string): IPromise<any> {
        let deferred: IDeferred<any> = this.$q.defer();
        let object: any = {};
        object[key] = null;
        chrome.storage.local.get(object, (data: any) => {
            deferred.resolve(data[key]);
        });
        return deferred.promise;
    }

    public setToLocalStorage(key: string, value: any): IPromise<any> {
        let deferred: IDeferred<any> = this.$q.defer();

        let object: any = {};
        object[key] = value;
        chrome.storage.local.set(object, () => {

            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError)
                deferred.reject(chrome.runtime.lastError);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    }

    public removeFromLocalStorage(key: string): IPromise<any> {
        let deferred: IDeferred<any> = this.$q.defer();
        chrome.storage.local.remove(key, () => {
            deferred.resolve();
        });
        return deferred.promise;
    }

    public getLastSyncDate(): IPromise<number> {

        let deferred: IDeferred<number> = this.$q.defer();

        this.getFromLocalStorage('lastSyncDateTime').then((lastSyncDateTime: number) => {

            if (_.isUndefined(lastSyncDateTime) || _.isNull(lastSyncDateTime) || !_.isNumber(lastSyncDateTime)) {
                deferred.resolve(-1);
            } else {
                deferred.resolve(lastSyncDateTime);
            }
        });

        return deferred.promise;
    }

    public getLocalSyncedAthleteProfile(): IPromise<IAthleteProfile> {
        return this.getFromLocalStorage('syncWithAthleteProfile');
    }

    public getProfileConfigured(): IPromise<boolean> {
        return this.getFromLocalStorage('profileConfigured');
    }

    public setProfileConfigured(status: boolean): IPromise<any> {
        let deferred: IDeferred<any> = this.$q.defer();
        chrome.storage.local.set({
            profileConfigured: status
        }, () => {
            deferred.resolve();
        });
        return deferred.promise;
    }

    public fetchUserSettings(callback?: (userSettingsSynced: IUserSettings) => void): IPromise<IUserSettings> {
        let deferred: IDeferred<IUserSettings> = this.$q.defer();
        chrome.storage.sync.get(userSettings, (userSettingsSynced: IUserSettings) => {
            if (callback) callback(userSettingsSynced);
            deferred.resolve(userSettingsSynced);
        });
        return deferred.promise;
    }

    public updateUserSetting(key: string, value: any, callback?: () => void): IPromise<any> {
        let deferred: IDeferred<any> = this.$q.defer();
        let settingToBeUpdated: any = {};
        settingToBeUpdated[key] = value;
        chrome.storage.sync.set(settingToBeUpdated, () => {
            if (callback) callback();
            deferred.resolve();
        });
        return deferred.promise;
    }

    public fetchComputedActivities(): IPromise<Array<ISyncActivityComputed>> {
        return <IPromise<Array<ISyncActivityComputed>>> this.getFromLocalStorage('computedActivities');
    }

    public getLocalStorageUsage(): IPromise<IStorageUsage> {

        let deferred: IDeferred<IStorageUsage> = this.$q.defer();
        chrome.storage.local.getBytesInUse((bytesInUse: number) => {
            deferred.resolve(<IStorageUsage>{
                bytesInUse: bytesInUse,
                quotaBytes: chrome.storage.local.QUOTA_BYTES,
                percentUsage: bytesInUse / chrome.storage.local.QUOTA_BYTES * 100
            });
        });
        return deferred.promise;
    }
}

app.factory('ChromeStorageService', ['$q', ($q: IQService) => {
    return new ChromeStorageService($q);
}]);
