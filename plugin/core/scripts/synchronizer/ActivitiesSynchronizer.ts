interface IAthleteProfile {
    userGender: string;
    userMaxHr: number;
    userRestHr: number;
    userFTP: number;
    userWeight: number;
}

interface IHistoryChanges {
    added: Array<number>,
    deleted: Array<number>,
    edited: Array<{id: number, name: string, type: string, display_type: string}>
}

class ActivitiesSynchronizer {

    get mergedComputedActivities(): Array<ISyncActivityComputed> {
        return this._mergedComputedActivities;
    }

    public static lastSyncDateTime: string = 'lastSyncDateTime';
    public static computedActivities: string = 'computedActivities';
    public static syncWithAthleteProfile: string = 'syncWithAthleteProfile';

    public static pagesPerGroupToRead: number = 3; // = 60 activities with 20 activities per page.
    private _mergedComputedActivities: Array<ISyncActivityComputed> = null;
    protected appResources: IAppResources;
    protected userSettings: IUserSettings;
    protected extensionId: string;
    protected _activitiesProcessor: ActivitiesProcessor;

    constructor(appResources: IAppResources, userSettings: IUserSettings/*, fromPage?: number, maxPages?: number*/) {
        this.appResources = appResources;
        this.userSettings = userSettings;
        this.extensionId = this.appResources.extensionId;
        this._activitiesProcessor = new ActivitiesProcessor(this.appResources, this.userSettings);
    }

    /**
     * Provides:
     * - activity IDs missing in the local history (added in strava.com and not computed/stored)
     * - activity IDs to delete in the local history (removed from strava.com)
     * - activity IDs to edit with their values (edited from strava.com)
     * @param activities Array<ISyncRawStravaActivity>
     * @param computedActivities Array<ISyncActivityComputed>
     * @return IHistoryChanges
     */
    public static findAddedAndEditedActivities(rawActivities: Array<ISyncRawStravaActivity>, computedActivities: Array<ISyncActivityComputed>): IHistoryChanges {

        if (_.isEmpty(rawActivities) || _.isEmpty(computedActivities)) {
            return null;
        }

        let added: Array<number> = [];
        let edited: Array<{id: number, name: string, type: string, display_type: string}> = [];

        _.each(rawActivities, (rawActivity: ISyncRawStravaActivity) => {

            // Exist raw activity id in history?
            // Seek for activity in just interrogated pages
            let foundComputedActivity: ISyncActivityComputed = _.findWhere(computedActivities, {id: rawActivity.id});

            if (foundComputedActivity) { // Yes  => Check for an edit..

                if (foundComputedActivity.name !== rawActivity.name || foundComputedActivity.type !== rawActivity.type) {
                    // foundComputedActivity.name = rawActivity.name; // Update name
                    edited.push({
                        id: foundComputedActivity.id,
                        name: rawActivity.name,
                        type: rawActivity.type,
                        display_type: rawActivity.display_type
                    });
                }
            } else {
                // No => rawActivity: Its an added activity from strava.com
                added.push(rawActivity.id);
            }
            // ... Or all other computed will be removed... if done here...
        });

        let historyChanges: IHistoryChanges = {
            added: added,
            deleted: null,
            edited: edited
        };

        return historyChanges;
    }

    /**
     * Provides:
     * - activity IDs to delete in the local history (removed from strava.com)
     * @param activities Array<ISyncRawStravaActivity>
     * @return IHistoryChanges
     */
    public static findToDeleteActivities(rawActivities: Array<ISyncRawStravaActivity>, computedActivities: Array<ISyncActivityComputed>): IHistoryChanges {

        return null;
    }

    /**
     * @return All activities with their stream
     */
    public fetchWithStream(lastSyncDateTime: Date, fromPage: number, pagesToRead: number): Q.Promise<Array<ISyncActivityWithStream>> {

        let deferred = Q.defer();

        // Start fetching missing activities
        this.fetchRawActivitiesRecursive(lastSyncDateTime, fromPage, pagesToRead).then((activities: Array<ISyncRawStravaActivity>) => {

            // Success
            console.log('Activities fetched in group ' + this.printGroupLimits(fromPage, pagesToRead) + ': ' + activities.length);

            let fetchedActivitiesStreamCount: number = 0;
            let fetchedActivitiesProgress: number = 0;
            let promisesOfActivitiesStreamById: Array<Q.IPromise<ISyncActivityWithStream>> = [];

            /*// ActivitiesSynchronizer.findAddedAndEditedActivities(activities)

             getfromstor....then((computedActivitiesStored: any) => {
             // Success getting previous stored activities.


             ActivitiesSynchronizer.findAddedAndEditedActivities(activities, computedActivitiesStored)
             });
             */


            // For each activity, fetch his stream and compute extended stats
            _.each(activities, (activity: ISyncRawStravaActivity) => {
                // Getting promise of stream for each activity...
                promisesOfActivitiesStreamById.push(this.fetchStreamByActivityId(activity.id));
            });

            Q.allSettled(promisesOfActivitiesStreamById).then((streamResults: any) => {

                // Success...

                if (streamResults.length !== activities.length) {
                    let errMessage: string = 'Stream length mismatch with activities fetched length: ' + streamResults.length + ' != ' + activities.length + ')';
                    deferred.reject(errMessage);
                } else {

                    console.log('Stream length match with activities fetched length: (' + streamResults.length + ' == ' + activities.length + ')');

                    let activitiesWithStream: Array<ISyncActivityWithStream> = [];

                    _.each(streamResults, (data: Q.PromiseState<any>, index: number) => {

                        if (data.state === 'rejected') {
                            // No stream found for this activity
                            console.warn('Stream not found for activity <' + data.reason.activityId + '>, index <' + index + '>', data);

                        } else if (data.state === 'fulfilled') {

                            // Then append stream to activity
                            let hasPowerMeter: boolean = true;
                            if (_.isEmpty(data.value.watts)) {
                                data.value.watts = data.value.watts_calc;
                                hasPowerMeter = false;
                            }

                            let activityWithStream: ISyncActivityWithStream = <ISyncActivityWithStream> activities[index];
                            activityWithStream.hasPowerMeter = hasPowerMeter;
                            activityWithStream.stream = data.value;
                            activitiesWithStream.push(activityWithStream);
                        }
                    });

                    // Finishing... force progress @ 100% because 'rejected' promises don't call progress callback
                    let notify: ISyncNotify = {
                        step: 'fetchedStreamsPercentage',
                        progress: 100
                    };

                    deferred.notify(notify);

                    deferred.resolve(activitiesWithStream);
                }

            }, (err: any) => {

                // error
                // We don't enter here with allSettled...

            }, (notification: any) => {

                // Progress...
                fetchedActivitiesProgress = fetchedActivitiesStreamCount / activities.length * 100;

                let notify: ISyncNotify = {
                    step: 'fetchedStreamsPercentage',
                    progress: fetchedActivitiesProgress,
                    index: notification.index,
                    activityId: notification.value,
                };

                deferred.notify(notify);

                fetchedActivitiesStreamCount++;
            });

        }, (err: any) => {
            deferred.reject(err);
        }, (progress: ISyncNotify) => {
            deferred.notify(progress);
        });

        return (<Q.Promise<Array<ISyncActivityWithStream>>> deferred.promise);
    }

    public httpPageGet(perPage: number, page: number): JQueryXHR {
        return $.ajax('/athlete/training_activities?new_activity_only=false&per_page=' + perPage + '&page=' + page);
    }

    /**
     *
     * @param lastSyncDateTime Last sync date existing. can be null
     * @param page page to start. Equals 1 if no from page given
     * @param pagesToRead Max pages to fetch from "fromPage". 0 gives unlimited pages
     * @param pagesRidden Number of page fetched
     * @param deferred
     * @param activitiesList
     * @return {Q.Promise<Array<ISyncRawStravaActivity>>}
     */
    public fetchRawActivitiesRecursive(lastSyncDateTime: Date, page?: number, pagesToRead?: number, pagesRidden?: number, deferred?: Q.Deferred<any>, activitiesList?: Array<ISyncRawStravaActivity>): Q.Promise<Array<ISyncRawStravaActivity>> {

        if (!page) {
            page = 1; // Usually start from first page when no page given
        }

        if (!pagesToRead) {
            pagesToRead = 0; // if 0 equals no pages limits
        }

        if (!pagesRidden) {
            pagesRidden = 0;
        }

        if (!deferred) {
            deferred = Q.defer();
        }

        if (!activitiesList) {
            activitiesList = [];
        }

        // If we have reached the max page to read then resolve...
        if (pagesToRead && pagesToRead === pagesRidden) {
            console.log('Resolving with ' + activitiesList.length + ' activities found');
            deferred.resolve(activitiesList);
            return;
        }

        let perPage: number = 20;
        let promiseActivitiesRequest: JQueryXHR = this.httpPageGet(perPage, page);

        let notify: ISyncNotify = {
            step: 'fetchActivitiesPercentage'
        };

        promiseActivitiesRequest.then((data: any, textStatus: string, jqXHR: JQueryXHR) => {

            // Success...
            if (textStatus !== 'success') {

                deferred.reject('Unable to get models' + textStatus);

            } else { // No errors...

                // If current page contains no activities
                if (_.isEmpty(data.models)) {
                    console.log('Resolving with ' + activitiesList.length + ' activities found.');
                    deferred.resolve(activitiesList);
                } else {

                    notify.totalActivities = data.total;

                    if (lastSyncDateTime) {

                        // Filter activities with start date upper than lastSyncDateTime
                        let activitiesCompliantWithLastSyncDateTime = _.filter(data.models, (model: ISyncRawStravaActivity) => {
                            let activityEndTime: number = new Date(model.start_time).getTime() + model.elapsed_time_raw * 1000;
                            return (activityEndTime >= lastSyncDateTime.getTime());
                        });

                        // Append activities
                        activitiesList = _.flatten(_.union(activitiesList, activitiesCompliantWithLastSyncDateTime));

                        if (data.models.length > activitiesCompliantWithLastSyncDateTime.length) { // lastSyncDateTime reached... resolve!
                            notify.progress = 100;// 100% Complete
                            deferred.notify(notify);
                            deferred.resolve(activitiesList);
                        } else {
                            // Continue to fetch
                            notify.progress = (activitiesList.length / ((pagesToRead && perPage) ? (pagesToRead * perPage) : notify.totalActivities) * 100);
                            deferred.notify(notify);
                            setTimeout(() => {
                                this.fetchRawActivitiesRecursive(lastSyncDateTime, page + 1, pagesToRead, pagesRidden + 1, deferred, activitiesList);
                            }, 50);
                        }

                    } else {
                        // Append activities
                        activitiesList = _.flatten(_.union(activitiesList, data.models));
                        notify.progress = (activitiesList.length / ((pagesToRead && perPage) ? (pagesToRead * perPage) : notify.totalActivities)) * 100;
                        deferred.notify(notify);
                        setTimeout(() => {
                            this.fetchRawActivitiesRecursive(lastSyncDateTime, page + 1, pagesToRead, pagesRidden + 1, deferred, activitiesList);
                        }, 50);
                    }
                }
            }

        }, (data: any, textStatus: string, errorThrown: any) => {
            // error
            let err: any = {
                method: 'ActivitiesSynchronizer.fetchRawActivitiesRecursive',
                page: page,
                data: data,
                textStatus: textStatus,
                errorThrown: errorThrown,
            };

            console.error(err);
            deferred.reject(err);

        });

        return (<Q.Promise<Array<ISyncRawStravaActivity>>> deferred.promise);
    }

    /**
     * Fetch the stream of an activity
     * @param activityId
     * @return {Promise<T>}
     */
    public fetchStreamByActivityId(activityId: number): Q.IPromise<any> {

        let deferred = Q.defer();

        let activityStreamUrl: string = "/activities/" + activityId + "/streams?stream_types[]=watts_calc&stream_types[]=watts&stream_types[]=velocity_smooth&stream_types[]=time&stream_types[]=distance&stream_types[]=cadence&stream_types[]=heartrate&stream_types[]=grade_smooth&stream_types[]=altitude&stream_types[]=latlng";

        let promiseActivityStream: JQueryXHR = $.ajax(activityStreamUrl);

        promiseActivityStream.then((data: any, textStatus: any, jqXHR: JQueryXHR) => {

            // success
            deferred.notify(activityId);
            data.activityId = activityId; // Append activityId resolved data
            deferred.resolve(data);

        }, (data: any, textStatus: any, errorThrown: any) => {
            // Error
            deferred.reject({
                method: 'ActivitiesSynchronizer.fetchStreamByActivityId',
                activityId: activityId,
                data: data,
                textStatus: textStatus,
                errorThrown: errorThrown,
            });

        });

        return deferred.promise;
    }

    /**
     * Erase stored last sync date and computed activities
     * @return {Promise<U>}
     */
    public clearSyncCache(): Q.IPromise<any> {

        let promise = Helper.removeFromStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.computedActivities).then(() => {
            console.log('computedActivities removed from local storage');
            return Helper.removeFromStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.lastSyncDateTime);
        }).then(() => {
            console.log('lastSyncDateTime removed from local storage');
            return Helper.removeFromStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.syncWithAthleteProfile);
        }).then(() => {
            console.log('syncWithAthleteProfile removed from local storage');
        });

        return promise;
    }

    /**
     * Trigger the fetch of activities (Along last sync date), their stream and the compute of each activities.
     * @returns {Q.Promise<Array<ISyncActivityComputed>>} Promising an array of computed activities along the last sync date
     */
    public fetchAndComputeGroupOfPages(lastSyncDateTime: Date, fromPage: number, pagesToRead: number): Q.Promise<Array<ISyncActivityComputed>> {

        let deferred = Q.defer();

        this.fetchWithStream(lastSyncDateTime, fromPage, pagesToRead).then((activitiesWithStreams: Array<ISyncActivityWithStream>) => {

            // fetchWithStreamSuccess...
            return this._activitiesProcessor.compute(activitiesWithStreams);

        }, (err: any) => {

            // fetchWithStreamError...
            deferred.reject(err);
            return null;

        }, (progress: ISyncNotify) => {

            // fetchWithStreamProgress...
            if (progress) {
                progress.fromPage = fromPage;
                progress.toPage = fromPage + pagesToRead - 1;
                deferred.notify(progress);
            }

        }).then((computedActivities: Array<ISyncActivityComputed>) => {

            // computeSuccess...
            deferred.resolve(computedActivities);

        }, (err: any) => {

            // computeError...
            deferred.reject(err);

        }, (progress: ISyncNotify) => {

            // computeProgress...
            if (progress) {
                progress.fromPage = fromPage;
                progress.toPage = fromPage + pagesToRead - 1;
                deferred.notify(progress);
            }

        });

        return (<Q.Promise<Array<ISyncActivityComputed>>> deferred.promise);
    }


    protected printGroupLimits(fromPage: number, pagesPerGroupToRead: number) {
        return '[' + fromPage + ' => ' + (fromPage - 1 + pagesPerGroupToRead) + ']';
    }

    /**
     * For each group of pages: fetch activities, their stream, compute stats, and store result. And recursively handle next group if needed...
     * @return {Promise<Array<ISyncActivityComputed>>}
     */
    public computeActivitiesByGroupsOfPages(lastSyncDateTime: Date, fromPage?: number, pagesPerGroupToRead?: number, handledGroupCount?: number, deferred?: Q.Deferred<any>): Q.Promise<Array<ISyncActivityComputed>> {

        if (!handledGroupCount) {
            handledGroupCount = 0;
        }

        if (!fromPage) {
            fromPage = 1;
        }

        if (!pagesPerGroupToRead) {
            pagesPerGroupToRead = ActivitiesSynchronizer.pagesPerGroupToRead
        }

        if (!deferred) {
            deferred = Q.defer<Array<ISyncActivityComputed>>();
        }

        let computedActivitiesInGroup: Array<ISyncActivityComputed> = null;

        this.fetchAndComputeGroupOfPages(lastSyncDateTime, fromPage, pagesPerGroupToRead).then((computedActivitiesPromised: Array<ISyncActivityComputed>) => {

            if (_.isEmpty(computedActivitiesPromised)) {
                deferred.resolve(this._mergedComputedActivities);
                // this._mergedComputedActivities = null; // Free mem !
            }

            handledGroupCount++;

            // if(handledGroupCount >= 1) {
            //     deferred.resolve();
            // }

            computedActivitiesInGroup = computedActivitiesPromised;
            computedActivitiesPromised = null; // Free mem !
            console.log(computedActivitiesInGroup.length + '  activities computed in group ' + this.printGroupLimits(fromPage, pagesPerGroupToRead), computedActivitiesInGroup);
            console.log('Group handled count: ' + handledGroupCount);

            // Retrieve previous saved activities
            return this.getComputedActivitiesFromLocal();

        }, (err: any) => {
            // Error...
            deferred.reject(err);

        }, (progress: ISyncNotify) => {

            // computeProgress...
            deferred.notify(progress);

        }).then((computedActivitiesStored: any) => {

            // Success getting previous stored activities. Now merging with new...
            if (computedActivitiesInGroup !== null && computedActivitiesInGroup.length > 0) {

                // There's new activities to save
                if (_.isEmpty(computedActivitiesStored) || _.isEmpty(computedActivitiesStored.data)) {
                    computedActivitiesStored = {};
                    computedActivitiesStored.data = <Array<ISyncActivityComputed>> [];
                }

                this._mergedComputedActivities = _.flatten(_.union(computedActivitiesInGroup, computedActivitiesStored.data));

                // Sort this.mergedActivities ascending before save
                this._mergedComputedActivities = _.sortBy(this._mergedComputedActivities, (item) => {
                    return (new Date(item.start_time)).getTime();
                });

                // Ensure activity unicity
                this._mergedComputedActivities = _.uniq(this._mergedComputedActivities, (item) => {
                    return item.id;
                });

                console.log('Updating computed activities to extension local storage.');

                // Save activities to local storage
                this.saveComputedActivitiesToLocal(this._mergedComputedActivities).then((pagesGroupSaved: any) => {

                    // Current group have been saved with previously stored activities...
                    console.log('Group ' + this.printGroupLimits(fromPage, pagesPerGroupToRead) + ' saved to extension local storage, total count: ' + pagesGroupSaved.data.computedActivities.length + ' data: ', pagesGroupSaved);

                    let notify: ISyncNotify = {
                        step: 'savedComputedActivities',
                        progress: 100,
                        pageGroupId: handledGroupCount + 1,
                        savedActivitiesCount: pagesGroupSaved.data.computedActivities.length,
                    };

                    deferred.notify(notify);

                    // Continue to next group, recursive call.
                    this.computeActivitiesByGroupsOfPages(lastSyncDateTime, fromPage + pagesPerGroupToRead, pagesPerGroupToRead, handledGroupCount, deferred);

                    // Free mem !
                    computedActivitiesInGroup = null;
                    computedActivitiesStored = null;
                });
            }

        });

        return deferred.promise;
    }


    /**
     * Trigger the computing of new activities and save the result to local storage by merging with existing activities
     * @return Promise of synced activities
     */
    public sync(): Q.Promise<Array<ISyncActivityComputed>> {

        // let updateActivitiesInfoAtEnd: boolean = false;
        let deferred = Q.defer<Array<ISyncActivityComputed>>();
        let syncNotify: ISyncNotify = {};
        this._mergedComputedActivities = null; // Reset for a new sync !

        // Check for lastSyncDateTime
        this.getLastSyncDateFromLocal().then((savedLastSyncDateTime: any) => {

            let computeGroupedActivitiesPromise: Q.IPromise<any> = null;

            let lastSyncDateTime: Date = (savedLastSyncDateTime.data && _.isNumber(savedLastSyncDateTime.data)) ? new Date(savedLastSyncDateTime.data) : null;
            return this.computeActivitiesByGroupsOfPages(lastSyncDateTime);

            /*if (savedLastSyncDateTime.data) { // lastSyncDateTime found !
             lastSyncDateTime = new Date(savedLastSyncDateTime.data);
             computeGroupedActivitiesPromise = this.computeActivitiesByGroupsOfPages(lastSyncDateTime);
             // updateActivitiesInfoAtEnd = true;
             console.log('Last sync date time found: ', lastSyncDateTime);
             } else { // lastSyncDateTime NOT found ! Full sync !
             console.log('No last sync date time found');
             // No last sync date time found, then clear local cache (some previous groups of page could be saved if a previous sync was interrupted)
             computeGroupedActivitiesPromise = this.clearSyncCache().then(() => {
             return this.computeActivitiesByGroupsOfPages(lastSyncDateTime);
             });
             }*/
            // return computeGroupedActivitiesPromise;

        }).then(() => {

            // Compute Activities By Groups Of Pages done... Now updating the last sync date
            return this.saveLastSyncDateToLocal((new Date()).getTime());

        }).then((saved: any) => {


            // Last Sync Date Time saved... Now save syncedAthleteProfile
            syncNotify.step = 'updatingLastSyncDateTime';
            syncNotify.progress = 100;
            deferred.notify(syncNotify);

            console.log('Last sync date time saved: ', new Date(saved.data.lastSyncDateTime));

            let syncedAthleteProfile: IAthleteProfile = {
                userGender: this.userSettings.userGender,
                userMaxHr: this.userSettings.userMaxHr,
                userRestHr: this.userSettings.userRestHr,
                userWeight: this.userSettings.userWeight,
                userFTP: this.userSettings.userFTP
            };

            return this.saveSyncedAthleteProfile(syncedAthleteProfile);

        }).then(() => {

            // Synced Athlete Profile saved ...
            console.log('Sync With Athlete Profile done');
            // console.log();
            // console.log('Saved data:', saved.data);

            deferred.resolve(this._mergedComputedActivities); // Sync finish !!
            /*
             // Need to update activities info?!
             if (updateActivitiesInfoAtEnd) {
             console.log('Now updating activities info...');
             return this.updateActivitiesInfo();
             } else {
             return null;
             }*/

        }, (err: any) => {

            deferred.reject(err);

        }, (progress: ISyncNotify) => {

            // TODO Create TDD method which return that. Unit test it !!!
            syncNotify = {
                step: progress.step,
                progress: progress.progress,
                index: progress.index,
                activityId: progress.activityId,
                fromPage: progress.fromPage,
                toPage: progress.toPage,
                pageGroupId: (progress.pageGroupId) ? progress.pageGroupId : ((syncNotify && syncNotify.pageGroupId) ? syncNotify.pageGroupId : 1),
                savedActivitiesCount: (progress.savedActivitiesCount) ? progress.savedActivitiesCount : ((syncNotify && syncNotify.savedActivitiesCount) ? syncNotify.savedActivitiesCount : 0),
                totalActivities: (progress.totalActivities) ? progress.totalActivities : ((syncNotify && syncNotify.totalActivities) ? syncNotify.totalActivities : null)
            };
            deferred.notify(syncNotify);
        });

        return deferred.promise;
    }

    saveSyncedAthleteProfile(syncedAthleteProfile: IAthleteProfile) {
        return Helper.setToStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.syncWithAthleteProfile, syncedAthleteProfile);
    }

    saveLastSyncDateToLocal(timestamp: number) {
        return Helper.setToStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.lastSyncDateTime, timestamp);
    }

    getLastSyncDateFromLocal() {
        return Helper.getFromStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.lastSyncDateTime);
    }

    public saveComputedActivitiesToLocal(computedActivities: Array<ISyncActivityComputed>): Q.Promise<any> {
        return Helper.setToStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.computedActivities, computedActivities);
    }

    public getComputedActivitiesFromLocal(): Q.Promise<any> {
        return Helper.getFromStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.computedActivities);
    }

    get activitiesProcessor(): ActivitiesProcessor {
        return this._activitiesProcessor;
    }

    /**
     * Use only for remove "lastActivitiesToBeRemoved" activities from synced and reposition the last sync date to the latest activities.
     * @param lastActivitiesToBeRemoved
     */
    /*
     public removeComputedActivities(lastActivitiesToBeRemoved: number): void {

     Helper.getFromStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.computedActivities).then((computedActivitiesStored: any) => {

     // There's new activities to save
     if (!_.isEmpty(computedActivitiesStored.data) && lastActivitiesToBeRemoved) {

     let computedActivitiesStoredCasted = <Array<ISyncActivityComputed>> computedActivitiesStored.data;

     computedActivitiesStoredCasted = computedActivitiesStoredCasted.slice(0, (computedActivitiesStoredCasted.length - lastActivitiesToBeRemoved));

     let newLastSyncDate = new Date(_.last(computedActivitiesStoredCasted).start_time).getTime() + _.last(computedActivitiesStoredCasted).elapsed_time_raw * 1000;

     // Save activities to local storage
     this.saveComputedActivitiesToLocal(computedActivitiesStoredCasted).then((pagesGroupSaved: any) => {

     Helper.setToStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.lastSyncDateTime, newLastSyncDate).then((saved: any) => {
     // saveLastSyncDateTimeSuccess...
     console.log('Last sync date time saved: ', new Date(saved.data.lastSyncDateTime));
     });

     });
     }
     });
     }*/

    /**
     * Update activities names and types
     * @returns {Promise<T>}
     */
    public updateActivitiesInfo(): Q.Promise<any> { // TODO Remove

        let deferred = Q.defer();
        let computedActivities: Array<ISyncActivityComputed> = null;
        let changes: number = 0;

        Helper.getFromStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.computedActivities).then((computedActivitiesStored: any) => {

            computedActivities = <Array<ISyncActivityComputed>> computedActivitiesStored.data;
            computedActivitiesStored.data = null; // Release memory

            if (!_.isEmpty(computedActivities)) {
                return this.fetchRawActivitiesRecursive(null, null);  // Read all pages !
            } else {
                console.warn("No computedActivities stored ! Skip updateActivitiesInfos...");
                return null;
            }

        }).then((rawStravaActivities: Array<ISyncRawStravaActivity>) => {

            if (_.isEmpty(rawStravaActivities)) {
                return null;
            }

            // Test if name or type of activity has changed on each computed activities stored
            _.each(computedActivities, (computedActivity: ISyncActivityComputed) => {

                // Seek for activity in just interrogated pages
                let foundRawStravaActivity: ISyncRawStravaActivity = _.findWhere(rawStravaActivities, {id: computedActivity.id});

                if (foundRawStravaActivity) {

                    if (computedActivity.name !== foundRawStravaActivity.name) {
                        computedActivity.name = foundRawStravaActivity.name; // Update name
                        changes++
                    }

                    if (computedActivity.type !== foundRawStravaActivity.type) {
                        computedActivity.type = foundRawStravaActivity.type; // Update name
                        computedActivity.display_type = foundRawStravaActivity.display_type;// Update name
                        changes++;
                    }
                }
            });

            if (changes) {
                // Update activities to local storage
                return Helper.setToStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.computedActivities, computedActivities);
            } else {
                return null;
            }

        }).then(() => {
            deferred.resolve({updateActivitiesInfoChanges: changes});
        }, (err: any) => {
            deferred.reject(err);
        }, (progress: ISyncNotify) => {
            progress.step = 'updateActivitiesInfo'; // Override step name
            deferred.notify(progress);
        });

        return deferred.promise;
    }
}
