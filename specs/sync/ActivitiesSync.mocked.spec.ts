/// <reference path="../typings/specs.d.ts" />

describe('ActivitiesSynchronizer mocked', () => {

    let userSettingsMock: IUserSettings;
    let appResourcesMock: IAppResources;

    let activitiesSynchronizer: ActivitiesSynchronizer;
    let rawPageOfActivities_01: Array<ISyncRawStravaActivity>;
    let rawPageOfActivities_02: Array<ISyncRawStravaActivity>;
    let rawPageOfActivities_03: Array<ISyncRawStravaActivity>;
    let rawPageOfActivities_04: Array<ISyncRawStravaActivity>;
    let rawPageOfActivities_05: Array<ISyncRawStravaActivity>;
    let rawPageOfActivities_06: Array<ISyncRawStravaActivity>;
    let rawPageOfActivities_07: Array<ISyncRawStravaActivity>;

    beforeEach(() => {

        userSettingsMock = clone(window.__fixtures__['fixtures/userSettings/2470979']);
        appResourcesMock = clone(window.__fixtures__['fixtures/appResources/appResources']);

        // We have 2 pages
        rawPageOfActivities_01 = clone(window.__fixtures__['fixtures/sync/rawPage0120161213']); // Page 01 - 20 ACT
        rawPageOfActivities_02 = clone(window.__fixtures__['fixtures/sync/rawPage0220161213']); // Page 02 - 20 ACT
        rawPageOfActivities_03 = clone(window.__fixtures__['fixtures/sync/rawPage0320161213']); // Page 03 - 20 ACT
        rawPageOfActivities_04 = clone(window.__fixtures__['fixtures/sync/rawPage0420161213']); // Page 04 - 20 ACT
        rawPageOfActivities_05 = clone(window.__fixtures__['fixtures/sync/rawPage0520161213']); // Page 05 - 20 ACT
        rawPageOfActivities_06 = clone(window.__fixtures__['fixtures/sync/rawPage0620161213']); // Page 06 - 20 ACT
        rawPageOfActivities_07 = clone(window.__fixtures__['fixtures/sync/rawPage0720161213']); // Page 07 - 20 ACT

        activitiesSynchronizer = new ActivitiesSynchronizer(appResourcesMock, userSettingsMock);

        // Mocking http calls to strava training pages 1 and 2
        spyOn(activitiesSynchronizer, 'httpPageGet').and.callFake((perPage: number, page: number) => {
            let defer = $.Deferred();

            switch (page) {
                case 1:
                    defer.resolve(rawPageOfActivities_01, 'success');
                    break;
                case 2:
                    defer.resolve(rawPageOfActivities_02, 'success');
                    break;
                case 3:
                    defer.resolve(rawPageOfActivities_03, 'success');
                    break;
                case 4:
                    defer.resolve(rawPageOfActivities_04, 'success');
                    break;
                case 5:
                    defer.resolve(rawPageOfActivities_05, 'success');
                    break;
                case 6:
                    defer.resolve(rawPageOfActivities_06, 'success');
                    break;
                case 7:
                    defer.resolve(rawPageOfActivities_07, 'success');
                    break;
                default:
                    defer.resolve({models: []}, 'success'); // No models to give
                    break;
            }
            return defer.promise();
        });

        // Mocking activity stream promised, reduce @ 50 samples
        let stream: any = clone(window.__fixtures__['fixtures/activities/723224273/stream']);
        _.each(_.keys(stream), (key: string) => {
            stream[key] = stream[key].slice(0, 50);
        });
        stream = <IActivityStream> stream;
        spyOn(activitiesSynchronizer, 'fetchStreamByActivityId').and.callFake((activityId: number) => {
            let defer = Q.defer();
            let data: any = stream;
            data.activityId = activityId
            defer.notify(activityId);
            defer.resolve(data);
            return defer.promise;
        });


    });

    it('should ensure ActivitiesSynchronizer:fetchRawActivitiesRecursive()', (done) => {

        // Give NO last sync date or page + page to read.
        activitiesSynchronizer.fetchRawActivitiesRecursive(null).then((rawStravaActivities: Array<ISyncRawStravaActivity>) => {

            expect(rawStravaActivities).not.toBeNull();
            expect(rawStravaActivities.length).toEqual(20 * 7); // 140 > 7 pages

            let jeannieRide: ISyncRawStravaActivity = _.findWhere(rawStravaActivities, {id: 718908064}); // Find in page 1
            expect(jeannieRide.name).toEqual("Pédalage avec Madame Jeannie Longo");
            expect(jeannieRide.start_time).toEqual("2016-09-20T13:44:54+0000");
            expect(jeannieRide.moving_time_raw).toEqual(8557);

            let relaxRide: ISyncRawStravaActivity = _.findWhere(rawStravaActivities, {id: 642780978}); // Find in page 1
            expect(relaxRide.name).toEqual("Relax");
            expect(relaxRide.moving_time_raw).toEqual(4888);

            let burnedRide: ISyncRawStravaActivity = _.findWhere(rawStravaActivities, {id: 377239233}); // Find in page 1
            expect(burnedRide.name).toEqual("Cramé !!");
            expect(burnedRide.type).toEqual("Ride");
            expect(burnedRide.moving_time_raw).toEqual(4315);

            let fakeRide: ISyncRawStravaActivity = _.findWhere(rawStravaActivities, {id: 9999999999}); // Find in page 1
            expect(fakeRide).toBeUndefined();
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
            let jeannieRide2: ISyncActivityWithStream = _.findWhere(activitiesWithStream, {id: 718908064}); // Find from page 1, "Pédalage avec Madame Jeannie Longo"
            expect(jeannieRide2).toBeUndefined(); // Must not exists in pages 4 to 6
            done(); // Finish it !

        }, (err: any) => {
            expect(err).toBeNull();
            done();
        }, (progress: ISyncNotify) => {
            console.log(progress);
        });

    });


  /*

    it('should ensure ActivitiesSynchronizer:fetchAndComputeGroupOfPages()', (done) => {
        // TODO ...
    });

    it('should ensure ActivitiesSynchronizer:computeActivitiesByGroupsOfPages()', (done) => {
        // TODO ...
    });

    it('should sync() when no existing stored computed activities', (done) => {
        // TODO ...
    });

    it('should sync() when a new today training came up', (done) => {
        // TODO ...
    });

    it('should sync() when a training has been upload today to but perform 2 weeks ago', (done) => {
        // TODO ...
    });

    it('should sync() when 3 activities have been removed from strava.com', (done) => {
        // TODO ...
    });

    it('should sync() when 2 activities been edited from strava.com', (done) => {
        // TODO ...
    });

    */


    afterEach(() => {
        activitiesSynchronizer = null;
    })


});