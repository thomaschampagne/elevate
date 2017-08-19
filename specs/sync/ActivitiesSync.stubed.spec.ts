import * as _ from "lodash"
import * as Q from "q";
import {
    ActivitiesSynchronizer,
    ISyncResult
} from "../../plugin/core/scripts/synchronizer/ActivitiesSynchronizer";
import {ActivitiesProcessor} from "../../plugin/core/scripts/processors/ActivitiesProcessor";
import {IUserSettings} from "../../plugin/common/scripts/interfaces/IUserSettings";
import {IAppResources} from "../../plugin/core/scripts/interfaces/IAppResources";
import {
    ISyncActivityComputed, ISyncActivityWithStream, ISyncNotify,
    ISyncRawStravaActivity
} from "../../plugin/common/scripts/interfaces/ISync";
import {IAnalysisData} from "../../plugin/common/scripts/interfaces/IActivityData";
import {editActivityFromArray, removeActivityFromArray} from "../tools/SpecsTools";
import {IAthleteProfile} from '../../plugin/common/scripts/interfaces/IAthleteProfile';

describe('ActivitiesSynchronizer syncing with stubs', () => {

    let userSettingsMock: IUserSettings;
    let appResourcesMock: IAppResources;
    let activitiesSynchronizer: ActivitiesSynchronizer;
    let rawPagesOfActivities: Array<{ models: Array<ISyncRawStravaActivity> }>;
    let CHROME_STORAGE_STUB: any; // Fake stubed storage to simulate chrome local storage

    /**
     *
     * @param id
     */
    let addStravaActivity = (activityId: number) => {
        if (_.find(CHROME_STORAGE_STUB.computedActivities, {id: activityId})) {
            CHROME_STORAGE_STUB.computedActivities = removeActivityFromArray(activityId, CHROME_STORAGE_STUB.computedActivities);
            return true;
        } else {
            return false;
        }
    };

    /**
     *
     * @param activityId
     * @param rawPageOfActivities
     * @param newName
     * @param newType
     * @returns {boolean}
     */
    let editStravaActivity = (activityId: number, rawPageOfActivities: any, newName: string, newType: string) => {
        let found = _.find(rawPageOfActivities.models, {id: activityId});
        if (found) {
            rawPageOfActivities.models = editActivityFromArray(activityId, rawPageOfActivities.models, newName, newType);
            return true;
        } else {
            return false;
        }
    };

    /**
     *
     * @param id
     * @param atPage
     */
    let removeStravaActivity = (activityId: number, rawPageOfActivities: any) => {
        let found = _.find(rawPageOfActivities.models, {id: activityId});
        if (found) {
            rawPageOfActivities.models = removeActivityFromArray(activityId, rawPageOfActivities.models);
            return true;
        } else {
            return false;
        }
    };

    beforeEach(() => {

        CHROME_STORAGE_STUB = {}; // Reset storage

        userSettingsMock = _.cloneDeep(window.__fixtures__['fixtures/userSettings/2470979']);
        appResourcesMock = _.cloneDeep(window.__fixtures__['fixtures/appResources/appResources']);

        // We have 7 pages
        rawPagesOfActivities = [
            _.cloneDeep(window.__fixtures__['fixtures/sync/rawPage0120161213']), // Page 01 - 20 ACT
            _.cloneDeep(window.__fixtures__['fixtures/sync/rawPage0220161213']), // Page 02 - 20 ACT
            _.cloneDeep(window.__fixtures__['fixtures/sync/rawPage0320161213']), // Page 03 - 20 ACT
            _.cloneDeep(window.__fixtures__['fixtures/sync/rawPage0420161213']), // Page 04 - 20 ACT
            _.cloneDeep(window.__fixtures__['fixtures/sync/rawPage0520161213']), // Page 05 - 20 ACT
            _.cloneDeep(window.__fixtures__['fixtures/sync/rawPage0620161213']), // Page 06 - 20 ACT
            _.cloneDeep(window.__fixtures__['fixtures/sync/rawPage0720161213']), // Page 07 - 20 ACT
        ];
        activitiesSynchronizer = new ActivitiesSynchronizer(appResourcesMock, userSettingsMock);

        /**
         * Stubing http calls to strava training pages
         */
        spyOn(activitiesSynchronizer, 'httpPageGet').and.callFake((perPage: number, page: number) => {
            let defer = $.Deferred();
            if (rawPagesOfActivities[page - 1]) {
                defer.resolve(rawPagesOfActivities[page - 1], 'success');
            } else {
                defer.resolve({models: []}, 'success'); // No models to give
            }
            return defer.promise();
        });

        /**
         * Stubing activity stream promised, reduce @ 50 samples
         */
        let stream: any = _.cloneDeep(window.__fixtures__['fixtures/activities/723224273/stream']);
        stream.watts = stream.watts_calc; // because powerMeter is false

        spyOn(activitiesSynchronizer, 'fetchStreamByActivityId').and.callFake((activityId: number) => {
            let defer = Q.defer();
            let data: any = {};
            _.forEach(_.keys(stream), (key: string) => {
                data[key] = stream[key].slice(0, 50);
            });
            data.activityId = activityId;
            defer.notify(activityId);
            defer.resolve(data);
            return defer.promise;
        });

        /**
         * Stub ActivitiesProcessor:compute. Create fake analysis results
         */
        spyOn(activitiesSynchronizer.activitiesProcessor, 'compute').and.callFake((activitiesWithStream: Array<ISyncActivityWithStream>) => {
            let defer = Q.defer();
            console.log("Spy activitiesSynchronizer.activitiesProcessor:compute called");
            let activitiesComputed: Array<ISyncActivityComputed> = [];
            let fakeAnalysisData: IAnalysisData = {
                moveRatio: null,
                toughnessScore: null,
                speedData: null,
                paceData: null,
                powerData: null,
                heartRateData: null,
                cadenceData: null,
                gradeData: null,
                elevationData: null,
            };
            _.forEach(activitiesWithStream, (awStream: ISyncActivityWithStream) => {
                let activityComputed: ISyncActivityComputed = <ISyncActivityComputed> _.pick(awStream, ActivitiesProcessor.outputFields);
                activityComputed.extendedStats = fakeAnalysisData;
                activitiesComputed.push(activityComputed);
            });
            defer.resolve(activitiesComputed);
            return defer.promise;
        });

        /**
         * Stub:
         * - saveComputedActivitiesToLocal
         * - getComputedActivitiesFromLocal
         * - saveLastSyncDateToLocal
         * - getLastSyncDateFromLocal
         * - clearSyncCache
         * - saveSyncedAthleteProfile
         */
        spyOn(activitiesSynchronizer, 'saveComputedActivitiesToLocal').and.callFake((computedActivities: Array<ISyncActivityComputed>) => {
            let defer = Q.defer();
            CHROME_STORAGE_STUB.computedActivities = computedActivities;
            defer.resolve({
                data: CHROME_STORAGE_STUB
            });
            return defer.promise;
        });

        spyOn(activitiesSynchronizer, 'getComputedActivitiesFromLocal').and.callFake(() => {
            let defer = Q.defer();
            defer.resolve({
                data: CHROME_STORAGE_STUB.computedActivities
            });
            return defer.promise;
        });

        spyOn(activitiesSynchronizer, 'saveLastSyncDateToLocal').and.callFake((timestamp: number) => {
            let defer = Q.defer();
            CHROME_STORAGE_STUB.lastSyncDateTime = timestamp;
            defer.resolve({
                data: CHROME_STORAGE_STUB
            });
            return defer.promise;
        });

        spyOn(activitiesSynchronizer, 'getLastSyncDateFromLocal').and.callFake(() => {
            let defer = Q.defer();
            defer.resolve({
                data: (CHROME_STORAGE_STUB.lastSyncDateTime) ? CHROME_STORAGE_STUB.lastSyncDateTime : null
            });
            return defer.promise;
        });

        spyOn(activitiesSynchronizer, 'clearSyncCache').and.callFake(() => {
            let defer = Q.defer();
            CHROME_STORAGE_STUB = {}; // Remove all
            defer.resolve();
            return defer.promise;
        });

        spyOn(activitiesSynchronizer, 'saveSyncedAthleteProfile').and.callFake((syncedAthleteProfile: IAthleteProfile) => {
            let defer = Q.defer();
            CHROME_STORAGE_STUB.syncWithAthleteProfile = syncedAthleteProfile;
            defer.resolve({
                data: CHROME_STORAGE_STUB
            });
            return defer.promise;
        });
    });

    it('should ensure ActivitiesSynchronizer:fetchRawActivitiesRecursive()', (done: Function) => {

        // Give NO last sync date or page + page to read.
        activitiesSynchronizer.fetchRawActivitiesRecursive(null).then((rawStravaActivities: Array<ISyncRawStravaActivity>) => {

            expect(activitiesSynchronizer.httpPageGet).toHaveBeenCalled(); // Ensure spy call

            expect(rawStravaActivities).not.toBeNull();
            expect(rawStravaActivities.length).toEqual(20 * 7); // 140 > 7 pages

            let jeannieRide: ISyncRawStravaActivity = _.find(rawStravaActivities, {id: 718908064}); // Find in page 1
            expect(jeannieRide.name).toEqual("Pédalage avec Madame Jeannie Longo");
            expect(jeannieRide.start_time).toEqual("2016-09-20T13:44:54+0000");
            expect(jeannieRide.moving_time_raw).toEqual(8557);

            let relaxRide: ISyncRawStravaActivity = _.find(rawStravaActivities, {id: 642780978}); // Find in page 1
            expect(relaxRide.name).toEqual("Relax");
            expect(relaxRide.moving_time_raw).toEqual(4888);

            let burnedRide: ISyncRawStravaActivity = _.find(rawStravaActivities, {id: 377239233}); // Find in page 1
            expect(burnedRide.name).toEqual("Cramé !!");
            expect(burnedRide.type).toEqual("Ride");
            expect(burnedRide.moving_time_raw).toEqual(4315);

            let fakeRide: ISyncRawStravaActivity = _.find(rawStravaActivities, {id: 9999999999}); // Find in page 1
            expect(fakeRide).toBeUndefined();
            return activitiesSynchronizer.fetchRawActivitiesRecursive(null, 1, 3);

        }).then((rawStravaActivities: Array<ISyncRawStravaActivity>) => {
            // expect(activitiesSynchronizer.endReached).toBeFalsy();
            expect(rawStravaActivities.length).toEqual(20 * 3);
            return activitiesSynchronizer.fetchRawActivitiesRecursive(null, 6, 3); // Can only read page 6 + 7

        }).then((rawStravaActivities: Array<ISyncRawStravaActivity>) => {
            // expect(activitiesSynchronizer.endReached).toBeTruthy();
            expect(rawStravaActivities.length).toEqual(40); // Page 6 + 7
            return activitiesSynchronizer.fetchRawActivitiesRecursive(null, 6, 1);

        }).then((rawStravaActivities: Array<ISyncRawStravaActivity>) => {
            // expect(activitiesSynchronizer.endReached).toBeFalsy();
            expect(rawStravaActivities.length).toEqual(20);
            done();

        }, (err: any) => {
            expect(err).toBeNull();
            done();
        }, (progress: ISyncNotify) => {
            console.log(progress);
        });
    });

    it('should ensure ActivitiesSynchronizer:fetchWithStream()', (done: Function) => {

        // let fromPage = 1, pagesToRead = 3; // read 1 => 3
        activitiesSynchronizer.fetchWithStream(null, null, null).then((activitiesWithStream: Array<ISyncActivityWithStream>) => {

            expect(activitiesSynchronizer.fetchStreamByActivityId).toHaveBeenCalled(); // Ensure spy call

            expect(activitiesWithStream).not.toBeNull();
            expect(activitiesWithStream.length).toEqual(140);

            let jeannieRide: ISyncActivityWithStream = _.find(activitiesWithStream, {id: 718908064}); // Find "Pédalage avec Madame Jeannie Longo"
            expect(jeannieRide.name).toEqual("Pédalage avec Madame Jeannie Longo");
            expect(jeannieRide.start_time).toEqual("2016-09-20T13:44:54+0000");
            expect(jeannieRide.moving_time_raw).toEqual(8557);
            expect(jeannieRide.stream).not.toBeNull();

            let fakeRide: ISyncActivityWithStream = _.find(activitiesWithStream, {id: 9999999999}); // Find fake
            expect(fakeRide).toBeUndefined();

            // Now fetch in pages 4 to 6
            return activitiesSynchronizer.fetchWithStream(null, 4, 3);

        }).then((activitiesWithStream: Array<ISyncActivityWithStream>) => {

            // Testing activitiesSynchronizer.fetchWithStream(null, 4, 3); => pages 4 to 6
            expect(activitiesWithStream).not.toBeNull();
            expect(activitiesWithStream.length).toEqual(60);
            let jeannieRide: ISyncActivityWithStream = _.find(activitiesWithStream, {id: 718908064}); // Find from page 1, "Pédalage avec Madame Jeannie Longo"
            expect(jeannieRide).toBeUndefined(); // Must not exists in pages 4 to 6

            done(); // Finish it !

        }, (err: any) => {
            expect(err).toBeNull();
            done();
        }, (progress: ISyncNotify) => {
            console.log(progress);
        });

    });


    it('should ensure ActivitiesSynchronizer:fetchAndComputeGroupOfPages()', (done: Function) => {

        // Getting all pages (7)
        activitiesSynchronizer.fetchAndComputeGroupOfPages(null, null, null).then((activitiesComputed: Array<ISyncActivityComputed>) => {

            expect(activitiesSynchronizer.activitiesProcessor.compute).toHaveBeenCalled(); // Ensure spy call
            expect(activitiesComputed).not.toBeNull();
            expect(activitiesComputed.length).toEqual(140);

            expect(_.first(activitiesComputed).extendedStats).toBeDefined();
            expect(_.first(activitiesComputed).extendedStats.heartRateData).toBeNull();
            expect(_.first(activitiesComputed).extendedStats.speedData).toBeNull();

            // Now fetch in pages 7 to 10 (only 7 exists...)
            return activitiesSynchronizer.fetchAndComputeGroupOfPages(null, 7, 3);

        }).then((activitiesComputed: Array<ISyncActivityComputed>) => {

            // result of pages 7 to 10 (only 7 exists...)
            expect(activitiesComputed.length).toEqual(20); // Only 20 results... not 60 !

            let ride: ISyncActivityComputed = _.find(activitiesComputed, {id: 406217194}); // Find "Afternoon Ride"
            expect(ride.extendedStats).toBeDefined();
            expect(ride.extendedStats.heartRateData).toBeNull();
            expect(ride.extendedStats.speedData).toBeNull();
            expect(ride.moving_time_raw).toEqual(5901);

            let jeannieRide: ISyncActivityComputed = _.find(activitiesComputed, {id: 718908064}); // Find from page 1, "Pédalage avec Madame Jeannie Longo"
            expect(jeannieRide).toBeUndefined(); // Must not exists in page 7

            done();
        });
    });


    it('should ensure ActivitiesSynchronizer:computeActivitiesByGroupsOfPages() all pages', (done: Function) => {

        expect(activitiesSynchronizer).not.toBeNull();
        expect(activitiesSynchronizer).not.toBeUndefined();
        expect(activitiesSynchronizer.computeActivitiesByGroupsOfPages).not.toBeUndefined();

        // Getting all pages here:
        activitiesSynchronizer.computeActivitiesByGroupsOfPages(null).then((mergedComputedActivities: Array<ISyncActivityComputed>) => {

            expect(activitiesSynchronizer.getComputedActivitiesFromLocal).toHaveBeenCalled(); // Ensure spy call
            expect(activitiesSynchronizer.saveComputedActivitiesToLocal).toHaveBeenCalled(); // Ensure spy call

            expect(mergedComputedActivities).not.toBeNull();
            expect(mergedComputedActivities.length).toEqual(140);

            let jeannieRide: ISyncActivityComputed = _.find(mergedComputedActivities, {id: 718908064}); // Find "Pédalage avec Madame Jeannie Longo"
            expect(jeannieRide.name).toEqual("Pédalage avec Madame Jeannie Longo");
            expect(jeannieRide.start_time).toEqual("2016-09-20T13:44:54+0000");
            expect(jeannieRide.moving_time_raw).toEqual(8557);
            expect(jeannieRide.extendedStats).not.toBeNull();
            expect(jeannieRide.extendedStats.heartRateData).toBeNull();
            expect(jeannieRide.extendedStats.speedData).toBeNull();

            let fakeRide: ISyncActivityComputed = _.find(mergedComputedActivities, {id: 9999999999}); // Find fake
            expect(fakeRide).toBeUndefined();

            expect(activitiesSynchronizer.hasBeenComputedActivities).not.toBeNull(); // Keep tracking of merged activities instance

            done();
        });
    });


    it('should sync() when no existing stored computed activities', (done: Function) => {

        expect(activitiesSynchronizer.hasBeenComputedActivities).toBeNull(); // No mergedComputedActivities at the moment

        activitiesSynchronizer.getLastSyncDateFromLocal().then((savedLastSyncDateTime: any) => {
            // Check no last sync date
            expect(_.isNull(savedLastSyncDateTime.data) || _.isUndefined(savedLastSyncDateTime.data)).toBeTruthy();
            return activitiesSynchronizer.getComputedActivitiesFromLocal();
        }).then((computedActivitiesStored: any) => {
            // Check no computedActivitiesStored
            expect(_.isNull(computedActivitiesStored.data) || _.isUndefined(computedActivitiesStored.data)).toBeTruthy();
            return activitiesSynchronizer.sync(); // Start sync
        }).then((syncResult: ISyncResult) => {

            // Sync finished
            expect(activitiesSynchronizer.getComputedActivitiesFromLocal).toHaveBeenCalled(); // Ensure spy call
            expect(activitiesSynchronizer.saveComputedActivitiesToLocal).toHaveBeenCalled(); // Ensure spy call
            expect(activitiesSynchronizer.getLastSyncDateFromLocal).toHaveBeenCalledTimes(2); // Ensure spy call
            expect(activitiesSynchronizer.saveLastSyncDateToLocal).toHaveBeenCalledTimes(1); // Ensure spy call
            expect(activitiesSynchronizer.saveSyncedAthleteProfile).toHaveBeenCalledTimes(1); // Ensure spy call

            expect(syncResult.computedActivities).not.toBeNull();
            expect(syncResult.computedActivities.length).toEqual(140);

            let jeannieRide: ISyncActivityComputed = _.find(syncResult.computedActivities, {id: 718908064}); // Find "Pédalage avec Madame Jeannie Longo"
            expect(jeannieRide.name).toEqual("Pédalage avec Madame Jeannie Longo");
            expect(jeannieRide.start_time).toEqual("2016-09-20T13:44:54+0000");
            expect(jeannieRide.moving_time_raw).toEqual(8557);
            expect(jeannieRide.extendedStats).not.toBeNull();
            expect(jeannieRide.extendedStats.heartRateData).toBeNull();
            expect(jeannieRide.extendedStats.speedData).toBeNull();

            let fakeRide: ISyncActivityComputed = _.find(syncResult.computedActivities, {id: 9999999999}); // Find fake
            expect(fakeRide).toBeUndefined();

            expect(activitiesSynchronizer.hasBeenComputedActivities).not.toBeNull(); // Keep tracking of merged activities instance

            // Check lastSyncDate & syncedAthleteProfile
            return activitiesSynchronizer.getLastSyncDateFromLocal();

        }).then((savedLastSyncDateTime: any) => {

            expect(CHROME_STORAGE_STUB.lastSyncDateTime).not.toBeNull();
            expect(_.isNumber(CHROME_STORAGE_STUB.lastSyncDateTime)).toBeTruthy();
            expect(savedLastSyncDateTime.data).not.toBeNull();
            expect(_.isNumber(savedLastSyncDateTime.data)).toBeTruthy();

            // Check sync athlete profile
            expect(CHROME_STORAGE_STUB.syncWithAthleteProfile).not.toBeNull();
            expect(CHROME_STORAGE_STUB.syncWithAthleteProfile.userGender).not.toBeNull();
            expect(CHROME_STORAGE_STUB.syncWithAthleteProfile.userMaxHr).not.toBeNull();
            expect(CHROME_STORAGE_STUB.syncWithAthleteProfile.userRestHr).not.toBeNull();
            expect(CHROME_STORAGE_STUB.syncWithAthleteProfile.userWeight).not.toBeNull();
            expect(CHROME_STORAGE_STUB.syncWithAthleteProfile.userFTP).not.toBeNull();

            done();

        }, (err: any) => {

            expect(err).toBeNull();
            done();
        }, (progress: ISyncNotify) => {

        });
    });

    it('should sync() when a new today training came up + an old one', (done: Function) => {

        expect(CHROME_STORAGE_STUB.computedActivities).toBeUndefined();
        expect(CHROME_STORAGE_STUB.lastSyncDateTime).toBeUndefined();

        // Get a full sync, with nothing stored...
        // On sync done simulate 2 new added activities on strava.com
        // Re-sync and test...
        activitiesSynchronizer.sync().then((syncResult: ISyncResult) => {

            // Sync is done...
            expect(CHROME_STORAGE_STUB.computedActivities).not.toBeNull();
            expect(CHROME_STORAGE_STUB.computedActivities.length).toEqual(140);
            expect(syncResult.globalHistoryChanges.added.length).toEqual(140);
            expect(syncResult.globalHistoryChanges.deleted.length).toEqual(0);
            expect(syncResult.globalHistoryChanges.edited.length).toEqual(0);

            expect(syncResult.computedActivities.length).toEqual(CHROME_STORAGE_STUB.computedActivities.length);

            // Add a new trainings on strava.com
            expect(addStravaActivity(799672885)).toBeTruthy(); // Add "Running back... Hard" - page 01 (removing it from last storage)
            expect(addStravaActivity(644365059)).toBeTruthy(); // Add "Sortie avec vik" - page 02 (removing it from last storage)
            expect(addStravaActivity(371317512)).toBeTruthy(); // Add "Fast Fast Fast Pschitt" - page 07 (removing it from last storage)

            // We should not found "Running back... Hard" & "Sortie avec vik" anymore in storage
            expect(CHROME_STORAGE_STUB.computedActivities.length).toEqual(syncResult.computedActivities.length - 3);
            expect(_.find(CHROME_STORAGE_STUB.computedActivities, {id: 799672885})).toBeUndefined();
            expect(_.find(CHROME_STORAGE_STUB.computedActivities, {id: 644365059})).toBeUndefined();
            expect(_.find(CHROME_STORAGE_STUB.computedActivities, {id: 371317512})).toBeUndefined();

            expect(activitiesSynchronizer.hasBeenComputedActivities).not.toBeNull(); // Keep tracking of merged activities instance

            // Ready for a new sync
            return activitiesSynchronizer.sync();

        }).then((syncResult: ISyncResult) => {

            expect(syncResult.globalHistoryChanges.added.length).toEqual(3);
            expect(syncResult.globalHistoryChanges.deleted.length).toEqual(0);
            expect(syncResult.globalHistoryChanges.edited.length).toEqual(0);

            expect(CHROME_STORAGE_STUB.computedActivities).not.toBeNull();
            expect(CHROME_STORAGE_STUB.computedActivities.length).toEqual(140);
            expect(CHROME_STORAGE_STUB.computedActivities.length).toEqual(syncResult.computedActivities.length);

            // We should found "Running back... Hard" act anymore in storage
            expect(_.find(CHROME_STORAGE_STUB.computedActivities, {id: 799672885})).toBeDefined();
            expect(_.find(CHROME_STORAGE_STUB.computedActivities, {id: 644365059})).toBeDefined();
            expect(_.find(CHROME_STORAGE_STUB.computedActivities, {id: 371317512})).toBeDefined();

            done();
        });
    });


    it('should sync() when a training has been upload today to but perform 2 weeks ago, then test added first and last', (done: Function) => {

        // Get a full sync, with nothing stored...
        // On sync done simulate 1 new added 2 weeks ago
        // Re-sync and test...
        activitiesSynchronizer.sync().then((syncResult: ISyncResult) => {

            // Sync is done...
            expect(CHROME_STORAGE_STUB.computedActivities).not.toBeNull();
            expect(CHROME_STORAGE_STUB.computedActivities.length).toEqual(140);
            expect(syncResult.computedActivities.length).toEqual(140);
            expect(syncResult.globalHistoryChanges.added.length).toEqual(140);
            expect(syncResult.globalHistoryChanges.deleted.length).toEqual(0);
            expect(syncResult.globalHistoryChanges.edited.length).toEqual(0);

            expect(syncResult.computedActivities.length).toEqual(CHROME_STORAGE_STUB.computedActivities.length);

            // Add a new trainings on strava.com
            expect(addStravaActivity(657225503)).toBeTruthy(); // Add "xxxx" - page 01 (removing it from last storage)

            // We should not found "Running back... Hard" & "Sortie avec vik" anymore in storage
            expect(CHROME_STORAGE_STUB.computedActivities.length).toEqual(syncResult.computedActivities.length - 1);
            expect(_.find(CHROME_STORAGE_STUB.computedActivities, {id: 657225503})).toBeUndefined();

            expect(activitiesSynchronizer.hasBeenComputedActivities).not.toBeNull(); // Keep tracking of merged activities instance

            // Ready for a new sync
            return activitiesSynchronizer.sync();

        }).then((syncResult: ISyncResult) => {

            expect(CHROME_STORAGE_STUB.computedActivities.length).toEqual(140);
            expect(syncResult.computedActivities.length).toEqual(140);
            expect(syncResult.globalHistoryChanges.added.length).toEqual(1);
            expect(_.find(CHROME_STORAGE_STUB.computedActivities, {id: 657225503})).toBeDefined();

            // Now remove first activity and last...
            expect(_.find(CHROME_STORAGE_STUB.computedActivities, {id: 799672885})).toBeDefined();
            expect(_.find(CHROME_STORAGE_STUB.computedActivities, {id: 367463594})).toBeDefined();

            expect(addStravaActivity(799672885)).toBeTruthy();
            expect(addStravaActivity(367463594)).toBeTruthy();

            expect(CHROME_STORAGE_STUB.computedActivities.length).toEqual(138); // 140 - 2
            expect(_.find(CHROME_STORAGE_STUB.computedActivities, {id: 799672885})).toBeUndefined();
            expect(_.find(CHROME_STORAGE_STUB.computedActivities, {id: 367463594})).toBeUndefined();

            // Ready for a new sync
            return activitiesSynchronizer.sync();

        }).then((syncResult: ISyncResult) => {

            expect(CHROME_STORAGE_STUB.computedActivities.length).toEqual(140);
            expect(syncResult.computedActivities.length).toEqual(140);
            expect(syncResult.globalHistoryChanges.added.length).toEqual(2); // must be 2
            expect(syncResult.globalHistoryChanges.deleted.length).toEqual(0);
            expect(syncResult.globalHistoryChanges.edited.length).toEqual(0);

            expect(_.find(CHROME_STORAGE_STUB.computedActivities, {id: 799672885})).toBeDefined(); // must be defined!
            expect(_.find(CHROME_STORAGE_STUB.computedActivities, {id: 367463594})).toBeDefined(); // must be defined!
            done();
        }, (err: any) => {
            console.log("!! ERROR !!", err); // Error...
            done();
        }, (progress: ISyncNotify) => {
            // computeProgress...
            // deferred.notify(progress);
        });
    });

    it('should sync() when 2 activities been edited from strava.com', (done: Function) => {

        // Get a full sync, with nothing stored...
        // On sync done simulate ...
        // Re-sync and test...
        activitiesSynchronizer.sync().then((syncResult: ISyncResult) => {

            // Sync is done...
            expect(CHROME_STORAGE_STUB.computedActivities).not.toBeNull();
            expect(CHROME_STORAGE_STUB.computedActivities.length).toEqual(140);
            expect(syncResult.computedActivities.length).toEqual(140);
            expect(syncResult.globalHistoryChanges.added.length).toEqual(140);
            expect(syncResult.globalHistoryChanges.deleted.length).toEqual(0);
            expect(syncResult.globalHistoryChanges.edited.length).toEqual(0);

            expect(editStravaActivity(9999999, rawPagesOfActivities[0], 'FakeName', 'FakeType')).toBeFalsy(); // Fake one, nothing should be edited
            expect(editStravaActivity(707356065, rawPagesOfActivities[0], 'Prends donc un velo!', 'Ride')).toBeTruthy(); // Page 1, "Je suis un gros lent !"
            expect(editStravaActivity(427606185, rawPagesOfActivities[5], 'First Zwift', 'VirtualRide')).toBeTruthy(); // Page 6, "1st zwift ride"

            // Ready for a new sync
            return activitiesSynchronizer.sync();

        }).then((syncResult: ISyncResult) => {

            // Sync is done...
            expect(CHROME_STORAGE_STUB.computedActivities).not.toBeNull();
            expect(CHROME_STORAGE_STUB.computedActivities.length).toEqual(140);
            expect(syncResult.computedActivities).not.toBeNull();
            expect(syncResult.computedActivities.length).toEqual(140);

            expect(syncResult.globalHistoryChanges.added.length).toEqual(0);
            expect(syncResult.globalHistoryChanges.deleted.length).toEqual(0);
            expect(syncResult.globalHistoryChanges.edited.length).toEqual(2);

            // Check return
            let ride: ISyncActivityComputed = _.find(syncResult.computedActivities, {id: 707356065}); // Page 1, "Prends donc un velo!", old "Je suis un gros lent !"
            expect(ride.name).toEqual("Prends donc un velo!");
            expect(ride.type).toEqual("Ride");
            expect(ride.display_type).toEqual("Ride");

            let virtualRide: ISyncActivityComputed = _.find(syncResult.computedActivities, {id: 427606185}); // Page 1, "First Zwift", old "1st zwift ride"
            expect(virtualRide.name).toEqual("First Zwift");
            expect(virtualRide.type).toEqual("VirtualRide");
            expect(virtualRide.display_type).toEqual("VirtualRide");

            // Check in stub
            ride = <ISyncActivityComputed> _.find(CHROME_STORAGE_STUB.computedActivities, {id: 707356065}); // Page 1, "Prends donc un velo!", old "Je suis un gros lent !"
            expect(ride.name).toEqual("Prends donc un velo!");
            expect(ride.type).toEqual("Ride");
            expect(ride.display_type).toEqual("Ride");

            virtualRide = <ISyncActivityComputed> _.find(CHROME_STORAGE_STUB.computedActivities, {id: 427606185}); // Page 1, "First Zwift", old "1st zwift ride"
            expect(virtualRide.name).toEqual("First Zwift");
            expect(virtualRide.type).toEqual("VirtualRide");
            expect(virtualRide.display_type).toEqual("VirtualRide");

            done();
        }, (err: any) => {
            console.log("!! ERROR !!", err); // Error...
            done();
        }, (progress: ISyncNotify) => {
            // computeProgress...
            // deferred.notify(progress);
        });

    });

    it('should sync() when 3 activities have been removed from strava.com', (done: Function) => {

        // Get a full sync, with nothing stored...
        // On sync done simulate ...
        // Re-sync and test...
        activitiesSynchronizer.sync().then((syncResult: ISyncResult) => {

            // Sync is done...
            expect(CHROME_STORAGE_STUB.computedActivities).not.toBeNull();
            expect(CHROME_STORAGE_STUB.computedActivities.length).toEqual(140);
            expect(syncResult.computedActivities.length).toEqual(140);
            expect(syncResult.globalHistoryChanges.added.length).toEqual(140);
            expect(syncResult.globalHistoryChanges.deleted.length).toEqual(0);
            expect(syncResult.globalHistoryChanges.edited.length).toEqual(0);

            expect(removeStravaActivity(9999999, rawPagesOfActivities[0])).toBeFalsy(); // Fake one, nothing should be deleted
            expect(removeStravaActivity(707356065, rawPagesOfActivities[0])).toBeTruthy(); // Page 1, "Je suis un gros lent !"
            expect(removeStravaActivity(427606185, rawPagesOfActivities[5])).toBeTruthy(); // Page 6, "1st zwift ride"

            expect(_.find(rawPagesOfActivities[0].models, {id: 707356065})).toBeUndefined();
            expect(_.find(rawPagesOfActivities[5].models, {id: 427606185})).toBeUndefined();
            expect(_.find(rawPagesOfActivities[5].models, {id: 424565561})).toBeDefined(); // Should still exists

            // Ready for a new sync
            return activitiesSynchronizer.sync();

        }).then((syncResult: ISyncResult) => {

            expect(CHROME_STORAGE_STUB.computedActivities).not.toBeNull();
            expect(CHROME_STORAGE_STUB.computedActivities.length).toEqual(138); // -2 deleted
            expect(syncResult.computedActivities.length).toEqual(138); // -2 deleted

            expect(syncResult.globalHistoryChanges.added.length).toEqual(0);
            expect(syncResult.globalHistoryChanges.deleted.length).toEqual(2);
            expect(syncResult.globalHistoryChanges.edited.length).toEqual(0);

            // Check returns
            let ride: ISyncActivityComputed = <ISyncActivityComputed> _.find(CHROME_STORAGE_STUB.computedActivities, {id: 707356065}); // Page 1, "Prends donc un velo!", old "Je suis un gros lent !"
            expect(ride).toBeUndefined();

            let virtualRide: ISyncActivityComputed = <ISyncActivityComputed> _.find(CHROME_STORAGE_STUB.computedActivities, {id: 427606185}); // Page 1, "First Zwift", old "1st zwift ride"
            expect(virtualRide).toBeUndefined();

            let anotherRide: ISyncActivityComputed = <ISyncActivityComputed> _.find(CHROME_STORAGE_STUB.computedActivities, {id: 424565561}); // Should still exists
            expect(anotherRide).toBeDefined();

            done();

        }, (err: any) => {
            console.log("!! ERROR !!", err); // Error...
            done();
        }, (progress: ISyncNotify) => {
            // computeProgress...
            // deferred.notify(progress);
        });

    });

    it('should sync() when added/edited/deleted from strava.com in the same sync', (done: Function) => {

        // Get a full sync, with nothing stored...
        // On sync done simulate ...
        // Re-sync and test...
        activitiesSynchronizer.sync().then((syncResult: ISyncResult) => {

            // Sync is done...
            expect(CHROME_STORAGE_STUB.computedActivities).not.toBeNull();
            expect(CHROME_STORAGE_STUB.computedActivities.length).toEqual(140);
            expect(syncResult.computedActivities.length).toEqual(140);
            expect(syncResult.globalHistoryChanges.added.length).toEqual(140);
            expect(syncResult.globalHistoryChanges.deleted.length).toEqual(0);
            expect(syncResult.globalHistoryChanges.edited.length).toEqual(0);

            /**
             * Add 3 on various pages
             */
            expect(addStravaActivity(723224273)).toBeTruthy(); // "Bon rythme ! 33 KPH !!"
            expect(addStravaActivity(556443499)).toBeTruthy(); // "75k @ 31.5 KPH // 181 BPM"
            expect(addStravaActivity(368210547)).toBeTruthy(); // "Natation"

            expect(CHROME_STORAGE_STUB.computedActivities.length).toEqual(137); // 140 - 3
            expect(_.find(CHROME_STORAGE_STUB.computedActivities, {id: 723224273})).toBeUndefined();
            expect(_.find(CHROME_STORAGE_STUB.computedActivities, {id: 556443499})).toBeUndefined();
            expect(_.find(CHROME_STORAGE_STUB.computedActivities, {id: 368210547})).toBeUndefined();
            expect(_.find(CHROME_STORAGE_STUB.computedActivities, {id: 367463594})).toBeDefined(); // Should exists. Not removed from CHROME_STORAGE_STUB.computedActivities

            /**
             * Edit 4 on various pages
             */
            expect(editStravaActivity(999999999, rawPagesOfActivities[0], 'FakeName', 'FakeType')).toBeFalsy(); // Fake one, nothing should be edited
            expect(editStravaActivity(707356065, rawPagesOfActivities[0], 'Prends donc un velo!', 'Ride')).toBeTruthy(); // Page 1, "Je suis un gros lent !"
            expect(editStravaActivity(569640952, rawPagesOfActivities[2], 'Petit nez!', 'Ride')).toBeTruthy(); // Page 3, "Pinet"
            expect(editStravaActivity(427606185, rawPagesOfActivities[5], 'First Zwift', 'VirtualRide')).toBeTruthy(); // Page 6, "1st zwift ride"
            expect(editStravaActivity(372761597, rawPagesOfActivities[6], 'Rodage plaquettes new name', 'EBike')).toBeTruthy(); // Page 7, "Rodage plaquettes"

            expect(_.find(rawPagesOfActivities[2].models, {id: 569640952}).name).toEqual('Petit nez!');
            expect(_.find(rawPagesOfActivities[6].models, {id: 372761597}).type).toEqual('EBike');
            expect(_.find(rawPagesOfActivities[0].models, {id: 707356065}).type).not.toEqual('EBike');

            /**
             * Delete 5 on various pages
             */
            expect(removeStravaActivity(999999999, rawPagesOfActivities[0])).toBeFalsy(); // Fake one, nothing should be deleted
            expect(removeStravaActivity(661113141, rawPagesOfActivities[0])).toBeTruthy(); // Page 1, "Reprise apr\u00e8s vacances"
            expect(removeStravaActivity(566288762, rawPagesOfActivities[2])).toBeTruthy(); // Page 3, "Tranquille "
            expect(removeStravaActivity(552562511, rawPagesOfActivities[3])).toBeTruthy(); // Page 4, "Pererree 1.4"
            expect(removeStravaActivity(473894759, rawPagesOfActivities[4])).toBeTruthy(); // Page 5, "Zwift Watopia Easy Spin Flat"
            expect(removeStravaActivity(406217194, rawPagesOfActivities[6])).toBeTruthy(); // Page 7, "Afternoon Ride"

            expect(_.find(rawPagesOfActivities[0].models, {id: 661113141})).toBeUndefined(); // Page 1, "Reprise apr\u00e8s vacances"
            expect(_.find(rawPagesOfActivities[2].models, {id: 566288762})).toBeUndefined(); // Page 3, "Tranquille "
            expect(_.find(rawPagesOfActivities[3].models, {id: 552562511})).toBeUndefined(); // Page 4, "Pererree 1.4"
            expect(_.find(rawPagesOfActivities[4].models, {id: 473894759})).toBeUndefined(); // Page 5, "Zwift Watopia Easy Spin Flat"
            expect(_.find(rawPagesOfActivities[6].models, {id: 406217194})).toBeUndefined(); // Page 7, "Afternoon Ride"
            expect(_.find(rawPagesOfActivities[5].models, {id: 424565561})).toBeDefined(); // Should still exists "Chartreuse Rousse et Herbe fluo !!"

            // Ready for a new sync
            return activitiesSynchronizer.sync();

        }).then((syncResult: ISyncResult) => {

            expect(CHROME_STORAGE_STUB.computedActivities).not.toBeNull();
            expect(syncResult.computedActivities).not.toBeNull();
            expect(CHROME_STORAGE_STUB.computedActivities.length).toEqual(135); // -5 deleted
            expect(syncResult.computedActivities.length).toEqual(135); // -5 deleted

            expect(syncResult.globalHistoryChanges.added.length).toEqual(3);
            expect(syncResult.globalHistoryChanges.deleted.length).toEqual(5);
            expect(syncResult.globalHistoryChanges.edited.length).toEqual(4);

            // Check some edited
            let activity: ISyncActivityComputed = <ISyncActivityComputed> _.find(CHROME_STORAGE_STUB.computedActivities, {id: 707356065});
            expect(activity.name).toEqual("Prends donc un velo!");
            expect(activity.type).toEqual("Ride");
            expect(activity.display_type).toEqual("Ride");

            activity = <ISyncActivityComputed> _.find(CHROME_STORAGE_STUB.computedActivities, {id: 372761597});
            expect(activity.name).toEqual("Rodage plaquettes new name");
            expect(activity.type).toEqual("EBike");
            expect(activity.display_type).toEqual("EBike");

            // Check some added
            activity = <ISyncActivityComputed> _.find(CHROME_STORAGE_STUB.computedActivities, {id: 723224273});
            expect(activity.name).toEqual("Bon rythme ! 33 KPH !!");
            activity = <ISyncActivityComputed> _.find(CHROME_STORAGE_STUB.computedActivities, {id: 556443499});
            expect(activity.name).toEqual("75k @ 31.5 KPH // 181 BPM");

            // Check some deleted
            activity = <ISyncActivityComputed> _.find(CHROME_STORAGE_STUB.computedActivities, {id: 566288762});
            expect(activity).toBeUndefined();

            activity = <ISyncActivityComputed> _.find(CHROME_STORAGE_STUB.computedActivities, {id: 473894759});
            expect(activity).toBeUndefined();

            activity = <ISyncActivityComputed> _.find(CHROME_STORAGE_STUB.computedActivities, {id: 424565561});
            expect(activity).toBeDefined(); // Should still exists

            done();
        });

    });

    // TODO Test errors from pages, stream, compute ?
    // TODO Test notify progress (create dedicated method ?! TDD making !) ?

    /*
     xit('should NOT sync() with cases not declare...', (done: Function) => {
     // TODO ...
     });

     */
    afterEach(() => {
        activitiesSynchronizer = null;
    })

});