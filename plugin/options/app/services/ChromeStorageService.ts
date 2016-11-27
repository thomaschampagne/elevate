import IQService = angular.IQService;
import IDeferred = angular.IDeferred;

class ChromeStorageService {

    protected $q: IQService;

    constructor(q: IQService) {
        this.$q = q;
    }

    public getAllFromLocalStorage(): Q.IPromise<any> {
        let deferred: IDeferred<any> = this.$q.defer();
        chrome.storage.local.get(null, (data: any) => {
            deferred.resolve(data);
        });
        return deferred.promise;
    }

    public getFromLocalStorage(key: string): Q.IPromise<any> {
        let deferred: IDeferred<any> = this.$q.defer();
        let object: any = {};
        object[key] = null;
        chrome.storage.local.get(object, (data: any) => {
            deferred.resolve(data[key]);
        });
        return deferred.promise;
    }

    public removeFromLocalStorage(key: string): Q.IPromise<any> {
        let deferred: IDeferred<any> = this.$q.defer();
        chrome.storage.local.remove(key, () => {
            deferred.resolve();
        });
        return deferred.promise;
    }

    public getLastSyncDate(): Q.IPromise<number> {

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

    public getLocalSyncedAthleteProfile(): Q.IPromise<IAthleteProfile> {
        return this.getFromLocalStorage('syncWithAthleteProfile');
    }

    public getProfileConfigured(): Q.IPromise<boolean> {
        return this.getFromLocalStorage('profileConfigured');
    }

    public setProfileConfigured(status: boolean): Q.IPromise<any> {
        let deferred: IDeferred<any> = this.$q.defer();
        chrome.storage.local.set({
            profileConfigured: status
        }, () => {
            deferred.resolve();
        });
        return deferred.promise;
    }

    public fetchUserSettings(callback?: (userSettingsSynced: IUserSettings) => void): Q.IPromise<any> {
        let deferred: IDeferred<IUserSettings> = this.$q.defer();
        chrome.storage.sync.get(userSettings, (userSettingsSynced: IUserSettings) => {
            if (callback) callback(userSettingsSynced);
            deferred.resolve(userSettingsSynced);
        });
        return deferred.promise;
    }

    public updateUserSetting(key: string, value: any, callback?: () => void): Q.IPromise<any> {
        let deferred: IDeferred<any> = this.$q.defer();
        let settingToBeUpdated: any = {};
        settingToBeUpdated[key] = value;
        chrome.storage.sync.set(settingToBeUpdated, () => {
            if (callback) callback();
            deferred.resolve();
        });
        return deferred.promise;
    }

    public fetchComputedActivities(): Q.IPromise<Array<ISyncActivityComputed>> {
        return <Q.IPromise<Array<ISyncActivityComputed>>> this.getFromLocalStorage('computedActivities');
    }

    public getLocalStorageUsage(): Q.IPromise<IStorageUsage> {

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
