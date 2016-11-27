class ActivitiesSynchronizer {

    public static lastSyncDateTime: string = 'lastSyncDateTime';
    public static computedActivities: string = 'computedActivities';
    public static syncWithAthleteProfile: string = 'syncWithAthleteProfile';

    public static pagesPerGroupToRead: number = 3; // = 60 activities with 20 activities per page.
    protected appResources: IAppResources;
    protected userSettings: IUserSettings;
    protected extensionId: string;
    protected activitiesProcessor: ActivitiesProcessor;

    constructor(appResources: IAppResources, userSettings: IUserSettings/*, fromPage?: number, maxPages?: number*/) {
        this.appResources = appResources;
        this.userSettings = userSettings;
        this.extensionId = this.appResources.extensionId;
        this.activitiesProcessor = new ActivitiesProcessor(this.appResources, this.userSettings);
    }

    /**
     * @return All activities with their stream
     */
    protected fetchWithStream(lastSyncDateTime: Date, fromPage: number, pagesToRead: number): Q.Promise<Array<ISyncActivityWithStream>> {

        let deferred = Q.defer();

        // Start fetching missing activities
        this.fetchRawActivitiesRecursive(lastSyncDateTime, fromPage, pagesToRead).then((activities: Array<ISyncRawStravaActivity>) => {

            // Success
            console.log('Activities fetched in group ' + this.printGroupLimits(fromPage, pagesToRead) + ': ' + activities.length);

            let fetchedActivitiesStreamCount: number = 0;
            let fetchedActivitiesProgress: number = 0;
            let promisesOfActivitiesStreamById: Array<Q.IPromise<ISyncActivityWithStream>> = [];

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
    protected fetchRawActivitiesRecursive(lastSyncDateTime: Date, page?: number, pagesToRead?: number, pagesRidden?: number, deferred?: Q.Deferred<any>, activitiesList?: Array<ISyncRawStravaActivity>): Q.Promise<Array<ISyncRawStravaActivity>> {

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

        let activitiesUrl: string = '/athlete/training_activities?new_activity_only=false&per_page=' + perPage + '&page=' + page;

        let promiseActivitiesRequest: JQueryXHR = $.ajax(activitiesUrl);

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
                            notify.progress = (activitiesList.length / (pagesToRead * perPage)) * 100;
                            deferred.notify(notify);
                            this.fetchRawActivitiesRecursive(lastSyncDateTime, page + 1, pagesToRead, pagesRidden + 1, deferred, activitiesList);
                        }

                    } else {
                        // Append activities
                        activitiesList = _.flatten(_.union(activitiesList, data.models));
                        notify.progress = (activitiesList.length / (pagesToRead * perPage)) * 100;
                        deferred.notify(notify);
                        this.fetchRawActivitiesRecursive(lastSyncDateTime, page + 1, pagesToRead, pagesRidden + 1, deferred, activitiesList);
                    }
                }
            }

        }, (data: any, textStatus: string, errorThrown: any) => {
            // error
            let err: any = {
                method: 'ActivitiesSynchronizer.fetchRawActivitiesRecursive',
                activitiesUrl: activitiesUrl,
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
    protected fetchStreamByActivityId(activityId: number): Q.IPromise<any> {

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
    protected fetchAndComputeGroupOfPages(lastSyncDateTime: Date, fromPage: number, pagesToRead: number): Q.Promise<Array<ISyncActivityComputed>> {

        let deferred = Q.defer();

        this.fetchWithStream(lastSyncDateTime, fromPage, pagesToRead).then((activitiesWithStreams: Array<ISyncActivityWithStream>) => {

            // fetchWithStreamSuccess...
            return this.activitiesProcessor.compute(activitiesWithStreams);

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
     *
     * @return {Promise<Array<ISyncActivityComputed>>}
     */
    protected computeActivitiesByGroupsOfPages(lastSyncDateTime: Date, fromPage?: number, pagesPerGroupToRead?: number, handledGroupCount?: number, deferred?: Q.Deferred<any>): Q.Promise<Array<ISyncActivityComputed>> {

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
            deferred = Q.defer();
        }

        let computedActivitiesInGroup: Array<ISyncActivityComputed> = null;

        this.fetchAndComputeGroupOfPages(lastSyncDateTime, fromPage, pagesPerGroupToRead).then((computedActivitiesPromised: Array<ISyncActivityComputed>) => {

            if (_.isEmpty(computedActivitiesPromised)) {
                deferred.resolve();
            }

            handledGroupCount++;

            // if(handledGroupCount >= 1) {
            //     deferred.resolve();
            // }

            computedActivitiesInGroup = computedActivitiesPromised;

            console.log(computedActivitiesInGroup.length + '  activities computed in group ' + this.printGroupLimits(fromPage, pagesPerGroupToRead), computedActivitiesInGroup);
            console.log('Group handled count: ' + handledGroupCount);

            // Retrieve previous saved activities
            return Helper.getFromStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.computedActivities);

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

                let mergedActivities: Array<ISyncActivityComputed> = _.flatten(_.union(computedActivitiesInGroup, computedActivitiesStored.data));

                // Sort mergedActivities ascending before save
                mergedActivities = _.sortBy(mergedActivities, (item) => {
                    return (new Date(item.start_time)).getTime();
                });

                // Ensure activity unicity
                mergedActivities = _.uniq(mergedActivities, (item) => {
                    return item.id;
                });


                console.log('Updating computed activities to extension local storage.');

                // Save activities to local storage
                Helper.setToStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.computedActivities, mergedActivities).then((pagesGroupSaved: any) => {

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
                    mergedActivities = null;

                });
            }

        });

        return (<Q.Promise<Array<ISyncActivityComputed>>> deferred.promise);
    }


    /**
     * Trigger the computing of new activities and save the result to local storage by merging with existing activities
     * @return Promise of synced activities
     */
    public sync(): Q.Promise<any> {

        let deferred = Q.defer();

        let syncNotify: ISyncNotify;

        // Check for lastSyncDateTime
        Helper.getFromStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.lastSyncDateTime).then((savedLastSyncDateTime: any) => {

            let computeGroupedActivitiesPromise: Q.IPromise<any> = null;

            let lastSyncDateTime: Date = null;

            if (savedLastSyncDateTime.data) {

                lastSyncDateTime = new Date(savedLastSyncDateTime.data);
                computeGroupedActivitiesPromise = this.computeActivitiesByGroupsOfPages(lastSyncDateTime);
                console.log('Last sync date time found: ', lastSyncDateTime);

            } else {

                console.log('No last sync date time found');

                // No last sync date time found, then clear local cache (some previous groups of page could be saved if a previous sync was interrupted)
                computeGroupedActivitiesPromise = this.clearSyncCache().then(() => {
                    return this.computeActivitiesByGroupsOfPages(lastSyncDateTime);
                });
            }

            return computeGroupedActivitiesPromise;

        }).then(() => {

            // Updating the last sync date
            return Helper.setToStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.lastSyncDateTime, (new Date()).getTime());

        }, (err: any) => {
            // Error...
            deferred.reject(err);

        }, (progress: ISyncNotify) => {

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

        }).then((saved: any) => {

            // saveLastSyncDateTimeSuccess...
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

            return Helper.setToStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.syncWithAthleteProfile, syncedAthleteProfile);

        }).then((saved: any) => {
            console.log('Sync With Athlete Profile', saved.data.syncWithAthleteProfile);
            deferred.resolve(saved.data);
        });

        return deferred.promise;
    }

    /**
     * Use only for remove "lastActivitiesToBeRemoved" activities from synced and reposition the last sync date to the latest activities.
     * @param lastActivitiesToBeRemoved
     */
    public removeComputedActivities(lastActivitiesToBeRemoved: number): void {

        Helper.getFromStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.computedActivities).then((computedActivitiesStored: any) => {

            // There's new activities to save
            if (!_.isEmpty(computedActivitiesStored.data) && lastActivitiesToBeRemoved) {

                let computedActivitiesStoredCasted = <Array<ISyncActivityComputed>> computedActivitiesStored.data;

                computedActivitiesStoredCasted = computedActivitiesStoredCasted.slice(0, (computedActivitiesStoredCasted.length - lastActivitiesToBeRemoved));

                let newLastSyncDate = new Date(_.last(computedActivitiesStoredCasted).start_time).getTime() + _.last(computedActivitiesStoredCasted).elapsed_time_raw * 1000;

                // Save activities to local storage
                Helper.setToStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.computedActivities, computedActivitiesStoredCasted).then((pagesGroupSaved: any) => {

                    Helper.setToStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.lastSyncDateTime, newLastSyncDate).then((saved: any) => {
                        // saveLastSyncDateTimeSuccess...
                        console.log('Last sync date time saved: ', new Date(saved.data.lastSyncDateTime));
                    });

                });
            }
        });
    }
}
