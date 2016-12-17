/// <reference path="../typings/specs.d.ts" />

describe('ActivitiesSynchronizer mocked', () => {

    let userSettingsMock: IUserSettings;
    let appResourcesMock: IAppResources;

    let activitiesSynchronizer: ActivitiesSynchronizer;

    let rawPagesOfActivities: Array<Array<ISyncRawStravaActivity>>;

    let CHROME_STORAGE_MOCK: any; // Fake mocked storage to simulate chrome local storage

    beforeEach(() => {

        CHROME_STORAGE_MOCK = {}; // Reset storage

        userSettingsMock = clone(window.__fixtures__['fixtures/userSettings/2470979']);
        appResourcesMock = clone(window.__fixtures__['fixtures/appResources/appResources']);

        // We have 7 pages
        rawPagesOfActivities = [
            clone(window.__fixtures__['fixtures/sync/rawPage0120161213']), // Page 01 - 20 ACT
            clone(window.__fixtures__['fixtures/sync/rawPage0220161213']), // Page 02 - 20 ACT
            clone(window.__fixtures__['fixtures/sync/rawPage0320161213']), // Page 03 - 20 ACT
            clone(window.__fixtures__['fixtures/sync/rawPage0420161213']), // Page 04 - 20 ACT
            clone(window.__fixtures__['fixtures/sync/rawPage0520161213']), // Page 05 - 20 ACT
            clone(window.__fixtures__['fixtures/sync/rawPage0620161213']), // Page 06 - 20 ACT
            clone(window.__fixtures__['fixtures/sync/rawPage0720161213']), // Page 07 - 20 ACT
        ];
        activitiesSynchronizer = new ActivitiesSynchronizer(appResourcesMock, userSettingsMock);

        /**
         * Mocking http calls to strava training pages 1 and 2
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
         * Mocking activity stream promised, reduce @ 50 samples
         */
        let stream: any = clone(window.__fixtures__['fixtures/activities/723224273/stream']);
        stream.watts = stream.watts_calc; // because powerMeter is false

        /*_.each(_.keys(stream), (key: string) => {
            stream[key] = stream[key].slice(0, 50);
        });
        stream = <IActivityStream> stream;*/

        spyOn(activitiesSynchronizer, 'fetchStreamByActivityId').and.callFake((activityId: number) => {
            let defer = Q.defer();
            let data: any = {};
            _.each(_.keys(stream), (key: string) => {
                data[key] = stream[key].slice(0, 50);
            });
            data.activityId = activityId;
            defer.notify(activityId);
            defer.resolve(data);
            return defer.promise;
        });

        /**
         * Mock ActivitiesProcessor:compute. Create fake analysis results
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
            _.each(activitiesWithStream, (awStream: ISyncActivityWithStream) => {
                let activityComputed: ISyncActivityComputed = <ISyncActivityComputed> _.pick(awStream, ActivitiesProcessor.outputFields);
                activityComputed.extendedStats = fakeAnalysisData;
                activitiesComputed.push(activityComputed);
            });
            defer.resolve(activitiesComputed);
            return defer.promise;
        });

        /**
         * Mock:
         * - saveComputedActivitiesToLocal
         * - getComputedActivitiesFromLocal
         * - saveLastSyncDateToLocal
         * - getLastSyncDateFromLocal
         * - clearSyncCache
         * - saveSyncedAthleteProfile
         */
        spyOn(activitiesSynchronizer, 'saveComputedActivitiesToLocal').and.callFake((computedActivities: Array<ISyncActivityComputed>) => {
            let defer = Q.defer();
            CHROME_STORAGE_MOCK.computedActivities = computedActivities;
            defer.resolve({
                data: CHROME_STORAGE_MOCK
            });
            return defer.promise;
        });

        spyOn(activitiesSynchronizer, 'getComputedActivitiesFromLocal').and.callFake(() => {
            let defer = Q.defer();
            defer.resolve({
                data: CHROME_STORAGE_MOCK.computedActivities
            });
            return defer.promise;
        });

        spyOn(activitiesSynchronizer, 'saveLastSyncDateToLocal').and.callFake((timestamp: number) => {
            let defer = Q.defer();
            CHROME_STORAGE_MOCK.lastSyncDateTime = timestamp;
            defer.resolve({
                data: CHROME_STORAGE_MOCK
            });
            return defer.promise;
        });

        spyOn(activitiesSynchronizer, 'getLastSyncDateFromLocal').and.callFake(() => {
            let defer = Q.defer();
            defer.resolve({
                data: (CHROME_STORAGE_MOCK.lastSyncDateTime) ? CHROME_STORAGE_MOCK.lastSyncDateTime : null
            });
            return defer.promise;
        });

        spyOn(activitiesSynchronizer, 'clearSyncCache').and.callFake(() => {
            let defer = Q.defer();
            CHROME_STORAGE_MOCK = {}; // Remove all
            defer.resolve();
            return defer.promise;
        });

        spyOn(activitiesSynchronizer, 'saveSyncedAthleteProfile').and.callFake((syncedAthleteProfile: IAthleteProfile) => {
            let defer = Q.defer();
            CHROME_STORAGE_MOCK.syncWithAthleteProfile = syncedAthleteProfile;
            defer.resolve({
                data: CHROME_STORAGE_MOCK
            });
            return defer.promise;
        });
    });

    it('should ensure ActivitiesSynchronizer:fetchRawActivitiesRecursive()', (done) => {

        // TODO Also test endReached ?! !!

        // Give NO last sync date or page + page to read.
        activitiesSynchronizer.fetchRawActivitiesRecursive(null).then((syncRawStravaResult: ISyncRawStravaResult) => {

            expect(activitiesSynchronizer.httpPageGet).toHaveBeenCalled(); // Ensure spy call

            expect(syncRawStravaResult.activitiesList).not.toBeNull();
            expect(syncRawStravaResult.activitiesList.length).toEqual(20 * 7); // 140 > 7 pages
            expect(syncRawStravaResult.noMoreResults).toBeTruthy();

            let jeannieRide: ISyncRawStravaActivity = _.findWhere(syncRawStravaResult.activitiesList, {id: 718908064}); // Find in page 1
            expect(jeannieRide.name).toEqual("Pédalage avec Madame Jeannie Longo");
            expect(jeannieRide.start_time).toEqual("2016-09-20T13:44:54+0000");
            expect(jeannieRide.moving_time_raw).toEqual(8557);

            let relaxRide: ISyncRawStravaActivity = _.findWhere(syncRawStravaResult.activitiesList, {id: 642780978}); // Find in page 1
            expect(relaxRide.name).toEqual("Relax");
            expect(relaxRide.moving_time_raw).toEqual(4888);

            let burnedRide: ISyncRawStravaActivity = _.findWhere(syncRawStravaResult.activitiesList, {id: 377239233}); // Find in page 1
            expect(burnedRide.name).toEqual("Cramé !!");
            expect(burnedRide.type).toEqual("Ride");
            expect(burnedRide.moving_time_raw).toEqual(4315);

            let fakeRide: ISyncRawStravaActivity = _.findWhere(syncRawStravaResult.activitiesList, {id: 9999999999}); // Find in page 1
            expect(fakeRide).toBeUndefined();

            return activitiesSynchronizer.fetchRawActivitiesRecursive(null, 1, 3);

        }).then((syncRawStravaResult: ISyncRawStravaResult) => {

            expect(syncRawStravaResult.noMoreResults).toBeFalsy();
            expect(syncRawStravaResult.activitiesList.length).toEqual(20 * 3);
            return activitiesSynchronizer.fetchRawActivitiesRecursive(null, 6, 3); // Can only read page 6 + 7

        }).then((syncRawStravaResult: ISyncRawStravaResult) => {

            expect(syncRawStravaResult.noMoreResults).toBeTruthy();
            expect(syncRawStravaResult.activitiesList.length).toEqual(40); // Page 6 + 7
            return activitiesSynchronizer.fetchRawActivitiesRecursive(null, 6, 1);

        }).then((syncRawStravaResult: ISyncRawStravaResult) => {

            expect(syncRawStravaResult.noMoreResults).toBeFalsy();
            expect(syncRawStravaResult.activitiesList.length).toEqual(20);
            done();

        }, (err: any) => {
            expect(err).toBeNull();
            done();
        }, (progress: ISyncNotify) => {
            console.log(progress);
        });
    });

    it('should ensure ActivitiesSynchronizer:fetchWithStream()', (done) => {

        // let fromPage = 1, pagesToRead = 3; // read 1 => 3
        activitiesSynchronizer.fetchWithStream(null, null, null).then((activitiesWithStream: Array<ISyncActivityWithStream>) => {

            expect(activitiesSynchronizer.fetchStreamByActivityId).toHaveBeenCalled(); // Ensure spy call

            expect(activitiesWithStream).not.toBeNull();
            expect(activitiesWithStream.length).toEqual(140);

            let jeannieRide: ISyncActivityWithStream = _.findWhere(activitiesWithStream, {id: 718908064}); // Find "Pédalage avec Madame Jeannie Longo"
            expect(jeannieRide.name).toEqual("Pédalage avec Madame Jeannie Longo");
            expect(jeannieRide.start_time).toEqual("2016-09-20T13:44:54+0000");
            expect(jeannieRide.moving_time_raw).toEqual(8557);
            expect(jeannieRide.stream).not.toBeNull();

            let fakeRide: ISyncActivityWithStream = _.findWhere(activitiesWithStream, {id: 9999999999}); // Find fake
            expect(fakeRide).toBeUndefined();

            // Now fetch in pages 4 to 6
            return activitiesSynchronizer.fetchWithStream(null, 4, 3);

        }).then((activitiesWithStream: Array<ISyncActivityWithStream>) => {

            // Testing activitiesSynchronizer.fetchWithStream(null, 4, 3); => pages 4 to 6
            expect(activitiesWithStream).not.toBeNull();
            expect(activitiesWithStream.length).toEqual(60);
            let jeannieRide: ISyncActivityWithStream = _.findWhere(activitiesWithStream, {id: 718908064}); // Find from page 1, "Pédalage avec Madame Jeannie Longo"
            expect(jeannieRide).toBeUndefined(); // Must not exists in pages 4 to 6

            done(); // Finish it !

        }, (err: any) => {
            expect(err).toBeNull();
            done();
        }, (progress: ISyncNotify) => {
            console.log(progress);
        });

    });


    it('should ensure ActivitiesSynchronizer:fetchAndComputeGroupOfPages()', (done) => {

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

            let ride: ISyncActivityComputed = _.findWhere(activitiesComputed, {id: 406217194}); // Find "Afternoon Ride"
            expect(ride.extendedStats).toBeDefined();
            expect(ride.extendedStats.heartRateData).toBeNull();
            expect(ride.extendedStats.speedData).toBeNull();
            expect(ride.moving_time_raw).toEqual(5901);

            let jeannieRide: ISyncActivityComputed = _.findWhere(activitiesComputed, {id: 718908064}); // Find from page 1, "Pédalage avec Madame Jeannie Longo"
            expect(jeannieRide).toBeUndefined(); // Must not exists in page 7

            done();
        });
    });


    it('should ensure ActivitiesSynchronizer:computeActivitiesByGroupsOfPages() all pages', (done) => {

        // Getting all pages here:
        activitiesSynchronizer.computeActivitiesByGroupsOfPages(null).then((mergedComputedActivities: Array<ISyncActivityComputed>) => {

            expect(activitiesSynchronizer.getComputedActivitiesFromLocal).toHaveBeenCalled(); // Ensure spy call
            expect(activitiesSynchronizer.saveComputedActivitiesToLocal).toHaveBeenCalled(); // Ensure spy call

            expect(mergedComputedActivities).not.toBeNull();
            expect(mergedComputedActivities.length).toEqual(140);

            let jeannieRide: ISyncActivityComputed = _.findWhere(mergedComputedActivities, {id: 718908064}); // Find "Pédalage avec Madame Jeannie Longo"
            expect(jeannieRide.name).toEqual("Pédalage avec Madame Jeannie Longo");
            expect(jeannieRide.start_time).toEqual("2016-09-20T13:44:54+0000");
            expect(jeannieRide.moving_time_raw).toEqual(8557);
            expect(jeannieRide.extendedStats).not.toBeNull();
            expect(jeannieRide.extendedStats.heartRateData).toBeNull();
            expect(jeannieRide.extendedStats.speedData).toBeNull();

            let fakeRide: ISyncActivityComputed = _.findWhere(mergedComputedActivities, {id: 9999999999}); // Find fake
            expect(fakeRide).toBeUndefined();

            expect(activitiesSynchronizer.mergedComputedActivities).not.toBeNull(); // Keep tracking of merged activities instance

            done();
        });
    });


    it('should sync() when no existing stored computed activities', (done) => {

        expect(activitiesSynchronizer.mergedComputedActivities).toBeNull(); // No mergedComputedActivities at the moment

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

            let jeannieRide: ISyncActivityComputed = _.findWhere(syncResult.computedActivities, {id: 718908064}); // Find "Pédalage avec Madame Jeannie Longo"
            expect(jeannieRide.name).toEqual("Pédalage avec Madame Jeannie Longo");
            expect(jeannieRide.start_time).toEqual("2016-09-20T13:44:54+0000");
            expect(jeannieRide.moving_time_raw).toEqual(8557);
            expect(jeannieRide.extendedStats).not.toBeNull();
            expect(jeannieRide.extendedStats.heartRateData).toBeNull();
            expect(jeannieRide.extendedStats.speedData).toBeNull();

            let fakeRide: ISyncActivityComputed = _.findWhere(syncResult.computedActivities, {id: 9999999999}); // Find fake
            expect(fakeRide).toBeUndefined();

            expect(activitiesSynchronizer.mergedComputedActivities).not.toBeNull(); // Keep tracking of merged activities instance

            // Check lastSyncDate & syncedAthleteProfile
            return activitiesSynchronizer.getLastSyncDateFromLocal();

        }).then((savedLastSyncDateTime: any) => {

            expect(CHROME_STORAGE_MOCK.lastSyncDateTime).not.toBeNull();
            expect(_.isNumber(CHROME_STORAGE_MOCK.lastSyncDateTime)).toBeTruthy();
            expect(savedLastSyncDateTime.data).not.toBeNull();
            expect(_.isNumber(savedLastSyncDateTime.data)).toBeTruthy();

            // Check sync athlete profile
            expect(CHROME_STORAGE_MOCK.syncWithAthleteProfile).not.toBeNull();
            expect(CHROME_STORAGE_MOCK.syncWithAthleteProfile.userGender).not.toBeNull();
            expect(CHROME_STORAGE_MOCK.syncWithAthleteProfile.userMaxHr).not.toBeNull();
            expect(CHROME_STORAGE_MOCK.syncWithAthleteProfile.userRestHr).not.toBeNull();
            expect(CHROME_STORAGE_MOCK.syncWithAthleteProfile.userWeight).not.toBeNull();
            expect(CHROME_STORAGE_MOCK.syncWithAthleteProfile.userFTP).not.toBeNull();

            done();

        }, (err: any) => {

            expect(err).toBeNull();
            done();
        }, (progress: ISyncNotify) => {

        });
    });


    // TODO Test errors from pages, stream, compute ?
    // TODO Test notify progress (create dedicated method ?! TDD making !) ?

    /**
     *
     * @param id
     */
    let addStravaActivity = (activityId: number) => {

        if (_.findWhere(CHROME_STORAGE_MOCK.computedActivities, {id: activityId})) {
            CHROME_STORAGE_MOCK.computedActivities = removeActivityFromArray(activityId, CHROME_STORAGE_MOCK.computedActivities);
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
    let removeStravaActivity = (activityId: number, atPage: number) => {
        if (_.findWhere(rawPagesOfActivities[atPage - 1], {id: activityId})) {
            rawPagesOfActivities[atPage - 1] = removeActivityFromArray(activityId, rawPagesOfActivities[atPage - 1]);
            return true;
        } else {
            return false;
        }
    };

    it('should sync() when a new today training came up + an old one', (done) => {

        expect(CHROME_STORAGE_MOCK.computedActivities).toBeUndefined();
        expect(CHROME_STORAGE_MOCK.lastSyncDateTime).toBeUndefined();

        // Get a full sync, with nothing stored...
        // On sync done simulate 2 new added activities on strava.com
        // Re-sync and test...
        activitiesSynchronizer.sync().then((syncResult: ISyncResult) => {

            // Sync is done...
            expect(CHROME_STORAGE_MOCK.computedActivities).not.toBeNull();
            expect(CHROME_STORAGE_MOCK.computedActivities.length).toEqual(140);
            expect(syncResult.globalHistoryChanges.added.length).toEqual(140);
            expect(syncResult.globalHistoryChanges.deleted.length).toEqual(0);
            expect(syncResult.globalHistoryChanges.edited.length).toEqual(0);

            expect(syncResult.computedActivities.length).toEqual(CHROME_STORAGE_MOCK.computedActivities.length);

            // Add a new trainings on strava.com
            expect(addStravaActivity(799672885)).toBeTruthy(); // Add "Running back... Hard" - page 01 (removing it from last storage)
            expect(addStravaActivity(644365059)).toBeTruthy(); // Add "Sortie avec vik" - page 02 (removing it from last storage)
            expect(addStravaActivity(371317512)).toBeTruthy(); // Add "Fast Fast Fast Pschitt" - page 07 (removing it from last storage)

            // We should not found "Running back... Hard" & "Sortie avec vik" anymore in storage
            expect(CHROME_STORAGE_MOCK.computedActivities.length).toEqual(syncResult.computedActivities.length - 3);
            expect(_.findWhere(CHROME_STORAGE_MOCK.computedActivities, {id: 799672885})).toBeUndefined();
            expect(_.findWhere(CHROME_STORAGE_MOCK.computedActivities, {id: 644365059})).toBeUndefined();
            expect(_.findWhere(CHROME_STORAGE_MOCK.computedActivities, {id: 371317512})).toBeUndefined();

            expect(activitiesSynchronizer.mergedComputedActivities).not.toBeNull(); // Keep tracking of merged activities instance

            console.log('**********************************************************');

            // Ready for a new sync
            return activitiesSynchronizer.sync();

        }).then((syncResult: ISyncResult) => {

            expect(syncResult.globalHistoryChanges.added.length).toEqual(3);
            expect(syncResult.globalHistoryChanges.deleted.length).toEqual(0);
            expect(syncResult.globalHistoryChanges.edited.length).toEqual(0);

            expect(CHROME_STORAGE_MOCK.computedActivities).not.toBeNull();
            expect(CHROME_STORAGE_MOCK.computedActivities.length).toEqual(140);
            expect(CHROME_STORAGE_MOCK.computedActivities.length).toEqual(syncResult.computedActivities.length);

            // We should not found "Running back... Hard" act anymore in storage
            expect(_.findWhere(CHROME_STORAGE_MOCK.computedActivities, {id: 799672885})).toBeDefined();
            expect(_.findWhere(CHROME_STORAGE_MOCK.computedActivities, {id: 644365059})).toBeDefined();
            expect(_.findWhere(CHROME_STORAGE_MOCK.computedActivities, {id: 371317512})).toBeDefined();

            done();
        });
    });

    /*

     it('should sync() when a training has been upload today to but perform 2 weeks ago', (done) => {
     // TODO ...
     });

     it('should sync() when 3 activities have been removed from strava.com', (done) => {
     // TODO ...
     });

     it('should sync() when 2 activities been edited from strava.com', (done) => {
     // TODO ...
     });

     it('should NOT sync() with cases not declare...', (done) => {
     // TODO ...
     });

     */


    afterEach(() => {
        activitiesSynchronizer = null;
    })


});