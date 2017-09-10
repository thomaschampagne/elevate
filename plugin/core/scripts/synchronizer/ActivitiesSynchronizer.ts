import * as _ from "lodash";
import * as Q from "q";
import {Helper} from "../../../common/scripts/Helper";
import {IAthleteProfile} from "../../../common/scripts/interfaces/IAthleteProfile";
import {ISyncActivityComputed, ISyncActivityWithStream, ISyncNotify, ISyncRawStravaActivity} from "../../../common/scripts/interfaces/ISync";
import {IUserSettings} from "../../../common/scripts/interfaces/IUserSettings";
import {StorageManager} from "../../../common/scripts/modules/StorageManager";
import {IAppResources} from "../interfaces/IAppResources";
import {MultipleActivityProcessor} from "../processors/MultipleActivityProcessor";

export interface IHistoryChanges {
    added: number[];
    deleted: number[];
    edited: Array<{id: number, name: string, type: string, display_type: string}>;
}

export interface ISyncResult {
    globalHistoryChanges: IHistoryChanges;
    computedActivities: ISyncActivityComputed[];
    lastSyncDateTime: number;
    syncWithAthleteProfile: IAthleteProfile;
}

export class ActivitiesSynchronizer {

    public static lastSyncDateTime: string = "lastSyncDateTime";
    public static computedActivities: string = "computedActivities";
    public static syncWithAthleteProfile: string = "syncWithAthleteProfile";

    protected appResources: IAppResources;
    protected userSettings: IUserSettings;
    protected extensionId: string;
    protected totalRawActivityIds: number[] = [];
    public static pagesPerGroupToRead: number = 2; // = 40 activities with 20 activities per page.
    protected _hasBeenComputedActivities: ISyncActivityComputed[] = null;
    protected _multipleActivityProcessor: MultipleActivityProcessor;
    protected _endReached: boolean = false;

    private _globalHistoryChanges: IHistoryChanges = {
        added: [],
        deleted: [],
        edited: [],
    };

    constructor(appResources: IAppResources, userSettings: IUserSettings) {
        this.appResources = appResources;
        this.userSettings = userSettings;
        this.extensionId = this.appResources.extensionId;
        this._multipleActivityProcessor = new MultipleActivityProcessor(this.appResources, this.userSettings);
    }

    public appendGlobalHistoryChanges(historyIn: IHistoryChanges): void {
        this._globalHistoryChanges.added = _.union(this._globalHistoryChanges.added, historyIn.added);
        this._globalHistoryChanges.deleted = _.union(this._globalHistoryChanges.deleted, historyIn.deleted);
        this._globalHistoryChanges.edited = _.union(this._globalHistoryChanges.edited, historyIn.edited);
    }

    /**
     * Provides:
     * - activity IDs missing in the local history (added in strava.com and not computed/stored)
     * - activity IDs to edit with their values (edited from strava.com)
     * @param activities Array<ISyncRawStravaActivity>
     * @param computedActivities Array<ISyncActivityComputed>
     * @return IHistoryChanges
     */
    public static findAddedAndEditedActivities(rawActivities: ISyncRawStravaActivity[], computedActivities: ISyncActivityComputed[]): IHistoryChanges {

        const added: number[] = [];
        const deleted: number[] = [];
        const edited: Array<{id: number, name: string, type: string, display_type: string}> = [];

        if (_.isNull(computedActivities) || _.isUndefined(computedActivities) || !computedActivities) {
            computedActivities = [];
        }

        if (!_.isEmpty(rawActivities)) {

            _.forEach(rawActivities, (rawActivity: ISyncRawStravaActivity) => {

                // Exist raw activity id in history?
                // Seek for activity in just interrogated pages
                const foundComputedActivity: ISyncActivityComputed = _.find(computedActivities, {id: rawActivity.id});

                if (foundComputedActivity) { // Yes  => Check for an edit..

                    if (foundComputedActivity.name !== rawActivity.name || foundComputedActivity.type !== rawActivity.type) {
                        // foundComputedActivity.name = rawActivity.name; // Update name
                        edited.push({
                            id: foundComputedActivity.id,
                            name: rawActivity.name,
                            type: rawActivity.type,
                            display_type: rawActivity.display_type,
                        });
                    }
                } else {
                    // No => rawActivity: Its an added activity from strava.com
                    added.push(rawActivity.id);
                }
                // ... Or all other computed will be removed... if done here...
            });
        }

        const historyChanges: IHistoryChanges = {
            added,
            deleted,
            edited,
        };

        return historyChanges;
    }

    /**
     * Provides:
     * - activity IDs to delete in the local history (removed from strava.com)
     * @param rawActivityIds
     * @param computedActivities
     * @returns {null}
     */
    public static findDeletedActivities(rawActivityIds: number[], computedActivities: ISyncActivityComputed[]): IHistoryChanges {

        const added: number[] = [];
        const deleted: number[] = [];
        const edited: Array<{id: number, name: string, type: string, display_type: string}> = [];

        _.forEach(computedActivities, (computedActivity: ISyncActivityComputed) => {
            // Seek for activity in just interrogated pages
            const notFound: boolean = (_.indexOf(rawActivityIds, computedActivity.id) == -1);
            if (notFound) {
                deleted.push(computedActivity.id);
            }
        });

        const historyChanges: IHistoryChanges = {
            added,
            deleted,
            edited,
        };
        return historyChanges;
    }

    /**
     * @return All activities with their stream
     */
    public fetchWithStream(lastSyncDateTime: Date, fromPage: number, pagesToRead: number): Q.Promise<ISyncActivityWithStream[]> {

        const deferred = Q.defer<ISyncActivityWithStream[]>();

        // Start fetching missing activities
        this.fetchRawActivitiesRecursive(lastSyncDateTime, fromPage, pagesToRead).then((rawActivities: ISyncRawStravaActivity[]) => {

            // Success
            console.log("Activities fetched in group " + this.printGroupLimits(fromPage, pagesToRead) + ": " + rawActivities.length);

            let fetchedActivitiesStreamCount: number = 0;
            let fetchedActivitiesProgress: number = 0;
            const promisesOfActivitiesStreamById: Array<Q.IPromise<ISyncActivityWithStream>> = [];

            this.getComputedActivitiesFromLocal().then((computedActivitiesStored: any) => {

                // Should find added and edited activities
                const historyChangesOnPagesRode: IHistoryChanges = ActivitiesSynchronizer.findAddedAndEditedActivities(rawActivities, (computedActivitiesStored.data) ? computedActivitiesStored.data : []);
                this.appendGlobalHistoryChanges(historyChangesOnPagesRode); // Update global history

                // For each activity, fetch his stream and compute extended stats
                _.forEach(historyChangesOnPagesRode.added, (activityId: number) => {
                    // Getting promise of stream for each activity...
                    promisesOfActivitiesStreamById.push(this.fetchStreamByActivityId(activityId));
                });

                // Track all parsed activities from strava: used for deletions detect at the end..
                _.forEach(rawActivities, (rawActivity: ISyncRawStravaActivity) => {
                    this.totalRawActivityIds.push(rawActivity.id);
                });

                Q.allSettled(promisesOfActivitiesStreamById).then((streamResults: any) => {

                    console.log("Stream length: " + streamResults.length + ", raw activities length: " + rawActivities.length + ")");

                    const activitiesWithStream: ISyncActivityWithStream[] = [];

                    _.forEach(streamResults, (data: Q.PromiseState<any>) => {

                        if (data.state === "rejected") {

                            // No stream found for this activity
                            console.warn("Stream not found for activity <" + data.reason.activityId + ">", data);

                            // Add to activities list without even if no stream...
                            const newlyDetectedActivity: ISyncRawStravaActivity = _.find(rawActivities, {id: data.reason.activityId});
                            const activityWithStream: ISyncActivityWithStream = newlyDetectedActivity as ISyncActivityWithStream;
                            activityWithStream.hasPowerMeter = null;
                            activityWithStream.stream = null;
                            activitiesWithStream.push(activityWithStream);

                        } else if (data.state === "fulfilled") {

                            // Find raw activities of fetched stream and push
                            const newlyDetectedActivity: ISyncRawStravaActivity = _.find(rawActivities, {id: data.value.activityId});

                            let hasPowerMeter: boolean = true;
                            if (_.isEmpty(data.value.watts)) {
                                data.value.watts = data.value.watts_calc;
                                hasPowerMeter = false;
                            }

                            const activityWithStream: ISyncActivityWithStream = newlyDetectedActivity as ISyncActivityWithStream;
                            activityWithStream.hasPowerMeter = hasPowerMeter;
                            activityWithStream.stream = data.value;

                            activitiesWithStream.push(activityWithStream);
                        }
                    });

                    // Finishing... force progress @ 100% because 'rejected' promises don't call progress callback
                    const notify: ISyncNotify = {
                        step: "fetchedStreamsPercentage",
                        progress: 100,
                    };
                    deferred.notify(notify);
                    deferred.resolve(activitiesWithStream);

                }, (err: any) => {
                    // error, we don't enter here with allSettled...

                }, (notification: any) => {

                    // Progress...
                    fetchedActivitiesProgress = fetchedActivitiesStreamCount / historyChangesOnPagesRode.added.length * 100;

                    const notify: ISyncNotify = {
                        step: "fetchedStreamsPercentage",
                        progress: fetchedActivitiesProgress,
                        index: notification.index,
                        activityId: notification.value,
                    };

                    deferred.notify(notify);

                    fetchedActivitiesStreamCount++;
                });

            });

        }, (err: any) => {
            deferred.reject(err);
        }, (progress: ISyncNotify) => {
            deferred.notify(progress);
        });

        return deferred.promise;
    }

    public httpPageGet(perPage: number, page: number): JQueryXHR {
        return $.ajax("/athlete/training_activities?new_activity_only=false&per_page=" + perPage + "&page=" + page);
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
    public fetchRawActivitiesRecursive(lastSyncDateTime: Date, page?: number, pagesToRead?: number, pagesRidden?: number, deferred?: Q.Deferred<any>, activitiesList?: ISyncRawStravaActivity[]): Q.Promise<ISyncRawStravaActivity[]> {

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
            deferred = Q.defer<ISyncRawStravaActivity[]>();
        }

        if (!activitiesList) {
            activitiesList = [];
        }

        const perPage: number = 20;
        const promiseActivitiesRequest: JQueryXHR = this.httpPageGet(perPage, page);

        const notify: ISyncNotify = {
            step: "fetchActivitiesPercentage",
        };

        promiseActivitiesRequest.then((data: any, textStatus: string, jqXHR: JQueryXHR) => {

            // Success...
            if (textStatus !== "success") {

                deferred.reject("Unable to get models" + textStatus);

            } else { // No errors...

                // If we have reached the max page to read then resolve...
                if (pagesToRead && pagesToRead === pagesRidden) {
                    console.log("[PagesRidden] Resolving with " + activitiesList.length + " activities found");
                    deferred.resolve(activitiesList);

                } else if (_.isEmpty(data.models)) {
                    console.log("[EndReached] Resolving with " + activitiesList.length + " activities found.");
                    this._endReached = true;
                    deferred.resolve(activitiesList);

                } else {

                    notify.totalActivities = data.total;

                    // Append activities
                    activitiesList = _.flatten(_.union(activitiesList, data.models));
                    notify.progress = (activitiesList.length / ((pagesToRead && perPage) ? (pagesToRead * perPage) : notify.totalActivities)) * 100;

                    deferred.notify(notify);

                    setTimeout(() => {
                        this.fetchRawActivitiesRecursive(lastSyncDateTime, page + 1, pagesToRead, pagesRidden + 1, deferred, activitiesList);
                    }, 50);
                }
            }

        }, (data: any, textStatus: string, errorThrown: any) => {
            // error
            const err: any = {
                method: "ActivitiesSynchronizer.fetchRawActivitiesRecursive",
                page,
                data,
                textStatus,
                errorThrown,
            };

            console.error(err);
            deferred.reject(err);

        });

        return deferred.promise;
    }

    /**
     * Fetch the stream of an activity
     * @param activityId
     * @return {Q.Promise<T>}
     */
    public fetchStreamByActivityId(activityId: number): Q.IPromise<any> {

        const deferred = Q.defer();

        const activityStreamUrl: string = "/activities/" + activityId + "/streams?stream_types[]=watts_calc&stream_types[]=watts&stream_types[]=velocity_smooth&stream_types[]=time&stream_types[]=distance&stream_types[]=cadence&stream_types[]=heartrate&stream_types[]=grade_smooth&stream_types[]=altitude&stream_types[]=latlng";

        const promiseActivityStream: JQueryXHR = $.ajax(activityStreamUrl);

        promiseActivityStream.then((data: any, textStatus: any, jqXHR: JQueryXHR) => {

            // success
            deferred.notify(activityId);
            data.activityId = activityId; // Append activityId resolved data
            deferred.resolve(data);

        }, (data: any, textStatus: any, errorThrown: any) => {
            // Error
            deferred.reject({
                method: "ActivitiesSynchronizer.fetchStreamByActivityId",
                activityId,
                data,
                textStatus,
                errorThrown,
            });

        });

        return deferred.promise;
    }

    /**
     * Erase stored last sync date and computed activities
     * @return {Q.Promise<U>}
     */
    public clearSyncCache(): Q.IPromise<any> {

        const promise = Helper.removeFromStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.computedActivities).then(() => {
            console.log("computedActivities removed from local storage");
            return Helper.removeFromStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.lastSyncDateTime);
        }).then(() => {
            console.log("lastSyncDateTime removed from local storage");
            return Helper.removeFromStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.syncWithAthleteProfile);
        }).then(() => {
            console.log("syncWithAthleteProfile removed from local storage");
        });

        return promise;
    }

    /**
     * Trigger the fetch of activities (Along last sync date), their stream and the compute of each activities.
     * @returns {Q.Promise<Array<ISyncActivityComputed>>} Promising an array of computed activities along the last sync date
     */
    public fetchAndComputeGroupOfPages(lastSyncDateTime: Date, fromPage: number, pagesToRead: number): Q.Promise<ISyncActivityComputed[]> {

        const deferred = Q.defer();

        this.fetchWithStream(lastSyncDateTime, fromPage, pagesToRead).then((activitiesWithStreams: ISyncActivityWithStream[]) => {

            return this._multipleActivityProcessor.compute(activitiesWithStreams);

        }, (err: any) => {

            deferred.reject(err);
            return null;

        }, (progress: ISyncNotify) => {

            // fetchWithStreamProgress...
            if (progress) {
                progress.fromPage = fromPage;
                progress.toPage = fromPage + pagesToRead - 1;
                deferred.notify(progress);
            }

        }).then((computedActivities: ISyncActivityComputed[]) => {

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

        return (deferred.promise as Q.Promise<ISyncActivityComputed[]>);
    }

    protected printGroupLimits(fromPage: number, pagesPerGroupToRead: number) {
        return "[" + fromPage + " => " + (fromPage - 1 + pagesPerGroupToRead) + "]";
    }

    /**
     * For each group of pages: fetch activities, their stream, compute stats, and store result. And recursively handle next group if needed...
     * @return {Q.Promise<Array<ISyncActivityComputed>>}
     */
    public computeActivitiesByGroupsOfPages(lastSyncDateTime: Date, fromPage?: number, pagesPerGroupToRead?: number, handledGroupCount?: number, deferred?: Q.Deferred<any>): Q.Promise<ISyncActivityComputed[]> {

        if (!handledGroupCount) {
            handledGroupCount = 0;
        }

        if (!fromPage) {
            fromPage = 1;
        }

        if (!pagesPerGroupToRead) {
            pagesPerGroupToRead = ActivitiesSynchronizer.pagesPerGroupToRead;
        }

        if (!deferred) {
            deferred = Q.defer<ISyncActivityComputed[]>();
        }

        let computedActivitiesInGroup: ISyncActivityComputed[] = null;

        if (this._endReached) {

            deferred.resolve(this._hasBeenComputedActivities);

        } else {

            this.fetchAndComputeGroupOfPages(lastSyncDateTime, fromPage, pagesPerGroupToRead).then((computedActivitiesPromised: ISyncActivityComputed[]) => {

                handledGroupCount++;

                // if(handledGroupCount >= 1) {
                //     deferred.resolve();
                // }

                computedActivitiesInGroup = computedActivitiesPromised;
                computedActivitiesPromised = null; // Free mem !
                // console.log(computedActivitiesInGroup.length + '  activities computed in group ' + this.printGroupLimits(fromPage, pagesPerGroupToRead), computedActivitiesInGroup);
                console.log("Group handled count: " + handledGroupCount);

                // Retrieve previous saved activities
                return this.getComputedActivitiesFromLocal();

            }).then((computedActivitiesStored: any) => {

                // Success getting previous stored activities. Now merging with new...
                if (computedActivitiesInGroup !== null && computedActivitiesInGroup.length > 0) {

                    // There's new activities to save
                    if (_.isEmpty(computedActivitiesStored) || _.isEmpty(computedActivitiesStored.data)) {
                        computedActivitiesStored = {};
                        computedActivitiesStored.data = [] as ISyncActivityComputed[];
                    }

                    this._hasBeenComputedActivities = _.flatten(_.union(computedActivitiesInGroup, computedActivitiesStored.data));

                    // Sort this.mergedActivities ascending before save
                    this._hasBeenComputedActivities = _.sortBy(this._hasBeenComputedActivities, (item) => {
                        return (new Date(item.start_time)).getTime();
                    });

                    // Ensure activity unicity
                    this._hasBeenComputedActivities = _.uniqBy(this._hasBeenComputedActivities, (item: ISyncActivityComputed) => {
                        return item.id;
                    });

                    console.log("Updating computed activities to extension local storage.");

                    // Save activities to local storage
                    this.saveComputedActivitiesToLocal(this._hasBeenComputedActivities).then((pagesGroupSaved: any) => {

                        // Current group have been saved with previously stored activities...
                        // console.log('Group ' + this.printGroupLimits(fromPage, pagesPerGroupToRead) + ' saved to extension local storage, total count: ' + pagesGroupSaved.data.computedActivities.length + ' data: ', pagesGroupSaved);

                        const notify: ISyncNotify = {
                            step: "savedComputedActivities",
                            progress: 100,
                            pageGroupId: handledGroupCount + 1,
                            browsedActivitiesCount: this.totalRawActivityIds.length, //pagesGroupSaved.data.computedActivities.length,
                        };

                        deferred.notify(notify);

                        // Continue to next group, recursive call.
                        this.computeActivitiesByGroupsOfPages(lastSyncDateTime, fromPage + pagesPerGroupToRead, pagesPerGroupToRead, handledGroupCount, deferred);

                        // Free mem !
                        computedActivitiesInGroup = null;
                        computedActivitiesStored = null;
                    });
                } else {

                    // Current group have been saved with previously stored activities...
                    console.log("Group " + this.printGroupLimits(fromPage, pagesPerGroupToRead) + " handled");

                    const notify: ISyncNotify = {
                        step: "savedComputedActivities",
                        progress: 100,
                        pageGroupId: handledGroupCount + 1,
                        browsedActivitiesCount: this.totalRawActivityIds.length,
                    };

                    deferred.notify(notify);

                    // Continue to next group, recursive call.
                    this.computeActivitiesByGroupsOfPages(lastSyncDateTime, fromPage + pagesPerGroupToRead, pagesPerGroupToRead, handledGroupCount, deferred);

                    // Free mem !
                    computedActivitiesInGroup = null;
                    computedActivitiesStored = null;
                }

            }, (err: any) => {
                // Error...
                deferred.reject(err);

            }, (progress: ISyncNotify) => {

                // computeProgress...
                deferred.notify(progress);

            });
        }

        return deferred.promise;
    }

    /**
     * Trigger the computing of new activities and save the result to local storage by merging with existing activities
     * @return Q.Promise of synced activities
     */
    public sync(): Q.Promise<ISyncResult> {

        // let updateActivitiesInfoAtEnd: boolean = false;
        const deferred = Q.defer<ISyncResult>();
        let syncNotify: ISyncNotify = {};

        // Reset values for a sync
        this.initializeForSync();

        // Check for lastSyncDateTime
        this.getLastSyncDateFromLocal().then((savedLastSyncDateTime: any) => {

            const lastSyncDateTime: Date = (savedLastSyncDateTime.data && _.isNumber(savedLastSyncDateTime.data)) ? new Date(savedLastSyncDateTime.data) : null;
            return this.computeActivitiesByGroupsOfPages(lastSyncDateTime);

        }).then(() => {

            // Let's check for deletion + apply edits
            return this.getComputedActivitiesFromLocal();

        }).then((computedActivitiesStored: any) => {

            if (computedActivitiesStored && computedActivitiesStored.data) {

                // Check for  deletions, check for added and edited has been done in "fetchWithStream" for each group of pages
                const historyChangesOnPagesRode: IHistoryChanges = ActivitiesSynchronizer.findDeletedActivities(this.totalRawActivityIds, (computedActivitiesStored.data as ISyncActivityComputed[]));
                this.appendGlobalHistoryChanges(historyChangesOnPagesRode); // Update global history

                // Apply names/types changes
                if (this._globalHistoryChanges.edited.length > 0) {
                    _.forEach(this._globalHistoryChanges.edited, (editData) => {
                        const activityToEdit: ISyncActivityComputed = _.find((computedActivitiesStored.data as ISyncActivityComputed[]), {id: editData.id}); // Find from page 1, "Pédalage avec Madame Jeannie Longo"
                        activityToEdit.name = editData.name;
                        activityToEdit.type = editData.type;
                        activityToEdit.display_type = editData.display_type;
                    });
                }

                // Apply deletions
                if (this._globalHistoryChanges.deleted.length > 0) {
                    _.forEach(this._globalHistoryChanges.deleted, (deleteId: number) => {
                        computedActivitiesStored.data = _.without(computedActivitiesStored.data, _.find(computedActivitiesStored.data, {
                            id: deleteId,
                        }));
                    });
                }

                return this.saveComputedActivitiesToLocal(computedActivitiesStored.data);

            } else {
                deferred.reject("You tried to edit/delete from local history without having local data ?!");
                return null;
            }

        }).then(() => {

            // Compute Activities By Groups Of Pages done... Now updating the last sync date
            return this.saveLastSyncDateToLocal((new Date()).getTime());

        }).then((saved: any) => {

            // Last Sync Date Time saved... Now save syncedAthleteProfile
            syncNotify.step = "updatingLastSyncDateTime";
            syncNotify.progress = 100;
            deferred.notify(syncNotify);

            console.log("Last sync date time saved: ", new Date(saved.data.lastSyncDateTime));

            const syncedAthleteProfile: IAthleteProfile = {
                userGender: this.userSettings.userGender,
                userMaxHr: this.userSettings.userMaxHr,
                userRestHr: this.userSettings.userRestHr,
                userWeight: this.userSettings.userWeight,
                userFTP: this.userSettings.userFTP,
                // userSwimFTP: this.userSettings.userSwimFTP
            };

            return this.saveSyncedAthleteProfile(syncedAthleteProfile);

        }).then((saved: any) => {

            // Synced Athlete Profile saved ...
            console.log("Sync With Athlete Profile done");

            const syncResult: ISyncResult = {
                globalHistoryChanges: this._globalHistoryChanges,
                computedActivities: saved.data.computedActivities,
                lastSyncDateTime: saved.data.lastSyncDateTime,
                syncWithAthleteProfile: saved.data.syncWithAthleteProfile,
            };

            deferred.resolve(syncResult); // Sync finish !!

        }, (err: any) => {

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
                browsedActivitiesCount: (progress.browsedActivitiesCount) ? progress.browsedActivitiesCount : ((syncNotify && syncNotify.browsedActivitiesCount) ? syncNotify.browsedActivitiesCount : 0),
                totalActivities: (progress.totalActivities) ? progress.totalActivities : ((syncNotify && syncNotify.totalActivities) ? syncNotify.totalActivities : null),
            };
            deferred.notify(syncNotify);
        });

        return deferred.promise;
    }

    protected initializeForSync() {
        this._hasBeenComputedActivities = null;
        this._globalHistoryChanges = {
            added: [],
            deleted: [],
            edited: [],
        };
        this._endReached = false;
        this.totalRawActivityIds = [];
    }

    public saveSyncedAthleteProfile(syncedAthleteProfile: IAthleteProfile) {
        return Helper.setToStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.syncWithAthleteProfile, syncedAthleteProfile);
    }

    public saveLastSyncDateToLocal(timestamp: number) {
        return Helper.setToStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.lastSyncDateTime, timestamp);
    }

    public getLastSyncDateFromLocal() {
        return Helper.getFromStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.lastSyncDateTime);
    }

    public saveComputedActivitiesToLocal(computedActivities: ISyncActivityComputed[]): Q.Promise<any> {
        return Helper.setToStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.computedActivities, computedActivities);
    }

    public getComputedActivitiesFromLocal(): Q.Promise<any> {
        return Helper.getFromStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.computedActivities);
    }

    get multipleActivityProcessor(): MultipleActivityProcessor {
        return this._multipleActivityProcessor;
    }

    get hasBeenComputedActivities(): ISyncActivityComputed[] {
        return this._hasBeenComputedActivities;
    }

    get globalHistoryChanges(): IHistoryChanges {
        return this._globalHistoryChanges;
    }
}
