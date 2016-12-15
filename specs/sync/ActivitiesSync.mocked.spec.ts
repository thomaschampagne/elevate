/// <reference path="../typings/specs.d.ts" />

describe('ActivitiesSynchronizer mocked', () => {

    let activitiesSynchronizer: ActivitiesSynchronizer;

    beforeEach(() => {

        let userSettingsMock: IUserSettings = clone(window.__fixtures__['fixtures/userSettings/2470979']);
        let appResourcesMock: IAppResources = clone(window.__fixtures__['fixtures/appResources/appResources']);

        // We have 2 pages
        let rawPageOfActivities_01: Array<ISyncRawStravaActivity> = clone(window.__fixtures__['fixtures/sync/rawPage0120161213']); // Page 01 - 20 ACT
        let rawPageOfActivities_02: Array<ISyncRawStravaActivity> = clone(window.__fixtures__['fixtures/sync/rawPage0220161213']); // Page 02 - 20 ACT
        let rawPageOfActivities_03: Array<ISyncRawStravaActivity> = clone(window.__fixtures__['fixtures/sync/rawPage0320161213']); // Page 03 - 20 ACT
        let rawPageOfActivities_04: Array<ISyncRawStravaActivity> = clone(window.__fixtures__['fixtures/sync/rawPage0420161213']); // Page 04 - 20 ACT
        let rawPageOfActivities_05: Array<ISyncRawStravaActivity> = clone(window.__fixtures__['fixtures/sync/rawPage0520161213']); // Page 05 - 20 ACT
        let rawPageOfActivities_06: Array<ISyncRawStravaActivity> = clone(window.__fixtures__['fixtures/sync/rawPage0620161213']); // Page 06 - 20 ACT
        let rawPageOfActivities_07: Array<ISyncRawStravaActivity> = clone(window.__fixtures__['fixtures/sync/rawPage0720161213']); // Page 07 - 20 ACT

        activitiesSynchronizer = new ActivitiesSynchronizer(appResourcesMock, userSettingsMock);

        // Mocking http calls to strava training pages 1 and 2
        spyOn(activitiesSynchronizer, 'httpPageGet').and.callFake(function (perPage: number, page: number) {
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

    });

    it('should ActivitiesSynchronizer:fetchRawActivitiesRecursive', (done) => {

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
        });
    });


    xit('should ActivitiesSynchronizer:fetchRawActivitiesRecursive', (done) => {

        let fromPage = 1, pagesToRead = 3; // read 1 => 3
        activitiesSynchronizer.fetchWithStream(null, fromPage, pagesToRead).then((rawStravaActivities: Array<ISyncActivityWithStream>) => {

            // expect(rawStravaActivities).not.toBeNull();
            // expect(rawStravaActivities.length).toEqual(40);
            //
            // let jeannieRide: ISyncRawStravaActivity = _.findWhere(rawStravaActivities, {id: 718908064}); // Find in page 1
            // expect(jeannieRide.name).toEqual("Pédalage avec Madame Jeannie Longo");
            // expect(jeannieRide.start_time).toEqual("2016-09-20T13:44:54+0000");
            // expect(jeannieRide.moving_time_raw).toEqual(8557);
            //
            // let relaxRide: ISyncRawStravaActivity = _.findWhere(rawStravaActivities, {id: 642780978}); // Find in page 1
            // expect(relaxRide.name).toEqual("Relax");
            // expect(relaxRide.moving_time_raw).toEqual(4888);
            //
            // let fakeRide: ISyncRawStravaActivity = _.findWhere(rawStravaActivities, {id: 9999999999}); // Find in page 1
            // expect(fakeRide).toBeUndefined();

            done();
        });

        // TODO fromPage = 4, pagesToRead = 3; // read 4 => 6
    });


    afterEach(() => {
        activitiesSynchronizer = null;
    })


});