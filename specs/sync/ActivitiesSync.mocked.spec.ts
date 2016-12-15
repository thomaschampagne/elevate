/// <reference path="../typings/specs.d.ts" />

describe('ActivitiesSynchronizer mocked', () => {

    let activitiesSynchronizer: ActivitiesSynchronizer;

    beforeEach(() => {

        let userSettingsMock: IUserSettings = clone(window.__fixtures__['fixtures/userSettings/2470979']);
        let appResourcesMock: IAppResources = clone(window.__fixtures__['fixtures/appResources/appResources']);

        // We have 2 pages
        let rawPageOfActivities_01: Array<ISyncRawStravaActivity> = clone(window.__fixtures__['fixtures/sync/rawPage0120161213']); // Page 01 - 20 ACT
        let rawPageOfActivities_02: Array<ISyncRawStravaActivity> = clone(window.__fixtures__['fixtures/sync/rawPage0220161213']); // Page 02 - 20 ACT

        activitiesSynchronizer = new ActivitiesSynchronizer(appResourcesMock, userSettingsMock);

        // Mocking http calls to strava training pages 1 and 2
        spyOn(activitiesSynchronizer, 'httpPageGet').and.callFake(function (perPage: number, page: number) {
            let defer = $.Deferred();
            if (page == 1) {
                defer.resolve(rawPageOfActivities_01, 'success');
            } else if (page == 2) {
                defer.resolve(rawPageOfActivities_02, 'success');
            } else {
                console.log("Page " + page + " has no fixtures");
                defer.resolve({models: []}, 'success'); // No models to give
            }
            return defer.promise();
        });

    });

    it('should ActivitiesSynchronizer:fetchRawActivitiesRecursive', (done) => {

        activitiesSynchronizer.fetchRawActivitiesRecursive(null).then((rawStravaActivities: Array<ISyncRawStravaActivity>) => {

            expect(rawStravaActivities).not.toBeNull();
            expect(rawStravaActivities.length).toEqual(40);

            let jeannieRide: ISyncRawStravaActivity = _.findWhere(rawStravaActivities, {id: 718908064}); // Find in page 1
            expect(jeannieRide.name).toEqual("Pédalage avec Madame Jeannie Longo");
            expect(jeannieRide.start_time).toEqual("2016-09-20T13:44:54+0000");
            expect(jeannieRide.moving_time_raw).toEqual(8557);

            let relaxRide: ISyncRawStravaActivity = _.findWhere(rawStravaActivities, {id: 642780978}); // Find in page 1
            expect(relaxRide.name).toEqual("Relax");
            expect(relaxRide.moving_time_raw).toEqual(4888);

            let fakeRide: ISyncRawStravaActivity = _.findWhere(rawStravaActivities, {id: 9999999999}); // Find in page 1
            expect(fakeRide).toBeUndefined();

            done();
        });
    });


});