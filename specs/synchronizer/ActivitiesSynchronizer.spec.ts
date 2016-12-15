function clone(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
}

describe('ActivitiesSynchronizer', () => {

    let removeActivityFromArray = (activityId: number, fromArray: Array<any>): Array<any> => {
        return _.without(fromArray, _.findWhere(fromArray, {
            id: activityId
        }));
    };

    let editActivityFromArray = (activityId: number, fromArray: Array<any>, newName: string, newType: string): Array<any> => {
        let a: any = _.findWhere(fromArray, {
            id: activityId
        });
        a.name = newName;
        a.type = newType;
        a.display_type = newType;
        return fromArray;
    };


    /**
     * Skipped
     * Testing promises spies
     */
    xit('should test my promise ', (done) => {

        class Calc {
            public static add(a: number, b: number): Q.Promise<number> {
                let deferred: Q.Deferred<number> = Q.defer<number>();
                deferred.resolve(a + b);
                return deferred.promise;
            }
        }

        let deferred = Q.defer();
        deferred.resolve(3);
        spyOn(Calc, 'add').and.returnValue(deferred.promise); // Mock example

        Calc.add(10, 11).then((r: number) => {
            expect(r).toEqual(3); // Spy resolves as 3... no 21...
            done();
        });
    });

    /**
     * Skipped
     */
    it('should remove activity from array properly ', () => {

        let rawPageOfActivities: Array<ISyncActivityComputed> = clone(window.__fixtures__['fixtures/sync/rawPage0120161213'].models);
        let sourceCount = rawPageOfActivities.length;

        rawPageOfActivities = removeActivityFromArray(722210052, rawPageOfActivities); // Remove Hike "Fort saint eynard"

        expect(rawPageOfActivities).not.toBeNull();
        expect(_.findWhere(rawPageOfActivities, {id: 722210052})).toBeUndefined();
        expect(rawPageOfActivities.length).toEqual(sourceCount - 1);

    });

    /**
     * Skipped
     */
    it('should edit activity from array properly ', () => {

        let rawPageOfActivities: Array<ISyncActivityComputed> = clone(window.__fixtures__['fixtures/sync/rawPage0120161213'].models);
        let sourceCount = rawPageOfActivities.length;

        rawPageOfActivities = editActivityFromArray(722210052, rawPageOfActivities, "New_Name", "Ride"); // Edit Hike "Fort saint eynard"

        expect(rawPageOfActivities).not.toBeNull();
        let foundBack: ISyncActivityComputed = _.findWhere(rawPageOfActivities, {id: 722210052});
        expect(foundBack).toBeDefined();
        expect(foundBack.name).toEqual("New_Name");
        expect(foundBack.type).toEqual("Ride");
        expect(foundBack.display_type).toEqual("Ride");
        expect(rawPageOfActivities.length).toEqual(sourceCount);

    });

    /**
     * Skipped
     */
    it('should detect activities added, modified and deleted ', () => {

        // let userSettingsMock: IUserSettings = window.__fixtures__['fixtures/userSettings/2470979'];
        // let appResourcesMock: IAppResources = window.__fixtures__['fixtures/appResources/appResources'];

        let computedActivities: Array<ISyncActivityComputed> = clone(window.__fixtures__['fixtures/sync/computedActivities20161213'].computedActivities);
        let rawPageOfActivities: Array<ISyncRawStravaActivity> = clone(window.__fixtures__['fixtures/sync/rawPage0120161213'].models);

        // Simulate Remove data from strava, remove 2:
        /*
         rawPageOfActivities = removeActivityFromArray(722210052, rawPageOfActivities); // Remove Hike "Fort saint eynard"
         rawPageOfActivities = removeActivityFromArray(700301520, rawPageOfActivities); // Remove Ride "Baladinette"
         expect(rawPageOfActivities.length).toEqual(18);
         */

        // Simulate Added in strava: consist to remove from computed activities...
        computedActivities = removeActivityFromArray(723224273, computedActivities); // Remove Ride "Bon rythme ! 33 KPH !!"
        computedActivities = removeActivityFromArray(707356065, computedActivities); // Remove Ride "Je suis un gros lent !"

        // Simulate Modify: consist to edit data in strava
        rawPageOfActivities = editActivityFromArray(799672885, rawPageOfActivities, "Run comeback", "Run"); // Edit "Running back... Hard !"
        rawPageOfActivities = editActivityFromArray(708752345, rawPageOfActivities, "MTB @ Bastille", "Ride"); // Edit Run "Bastille"

        // Now find+test changes
        // let activitiesSynchronizer: ActivitiesSynchronizer = new ActivitiesSynchronizer(appResourcesMock, userSettingsMock);
        let changes: IHistoryChanges = ActivitiesSynchronizer.findAddedAndEditedActivities(rawPageOfActivities, computedActivities);

        expect(changes).not.toBeNull();
        expect(changes.deleted).toBeNull();

        /*
         NO ! Below expects useless. To be deleted
         expect(changes.deleted.length).toEqual(2);
         expect(_.findWhere(changes.deleted, {id: 722210052})).toBeDefined();
         expect(_.findWhere(changes.deleted, {id: 700301520})).toBeDefined();
         expect(_.findWhere(changes.deleted, {id: 999999999})).toBeUndefined(); // Fake
         */

        expect(changes.added.length).toEqual(2);
        expect(_.indexOf(changes.added, 723224273)).not.toEqual(-1);
        expect(_.indexOf(changes.added, 707356065)).not.toEqual(-1);
        expect(_.indexOf(changes.added, 999999999)).toEqual(-1); // Fake

        expect(changes.edited.length).toEqual(2);
        expect(_.findWhere(changes.edited, {id: 799672885})).toBeDefined();
        expect(_.findWhere(changes.edited, {id: 708752345})).toBeDefined();
        let findWhere: any = _.findWhere(changes.edited, {id: 799672885});
        expect(findWhere.name).toEqual("Run comeback");
        expect(findWhere.type).toEqual("Run");
        expect(findWhere.display_type).toEqual("Run");
        findWhere = _.findWhere(changes.edited, {id: 708752345});
        expect(findWhere.name).toEqual("MTB @ Bastille");
        expect(findWhere.type).toEqual("Ride");
        expect(findWhere.display_type).toEqual("Ride");

        expect(ActivitiesSynchronizer.findAddedAndEditedActivities([], null)).toBeNull();

    });

    /**
     * Skipped
     */
    it('should ActivitiesSynchronizer:fetchRawActivitiesRecursive', (done) => {

        /**
         * Start before each
         */

        let userSettingsMock: IUserSettings = clone(window.__fixtures__['fixtures/userSettings/2470979']);
        let appResourcesMock: IAppResources = clone(window.__fixtures__['fixtures/appResources/appResources']);

        // We have 2 pages
        let rawPageOfActivities_01: Array<ISyncRawStravaActivity> = clone(window.__fixtures__['fixtures/sync/rawPage0120161213']); // Page 01 - 20 ACT
        let rawPageOfActivities_02: Array<ISyncRawStravaActivity> = clone(window.__fixtures__['fixtures/sync/rawPage0220161213']); // Page 02 - 20 ACT

        let activitiesSynchronizer: ActivitiesSynchronizer = new ActivitiesSynchronizer(appResourcesMock, userSettingsMock);


        // Mocking http calls to strava training pages 1 and 2
        spyOn(activitiesSynchronizer, 'httpPageGet').and.callFake(function (perPage: number, page: number) {

            let deferred = $.Deferred();

            if (page == 1) {
                deferred.resolve(rawPageOfActivities_01, 'success');
            } else if (page == 2) {
                deferred.resolve(rawPageOfActivities_02, 'success');
            } else {
                console.log("Page " + page + " has no fixtures");
                deferred.resolve({models: []}, 'success'); // No models to give
            }
            return deferred.promise();
        });

        /**
         * End before each
         */

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



            // TODO Make fun tests here !
            // console.log('length: ' + rawStravaActivities.length);
            // console.log(JSON.stringify(rawStravaActivities));

            done();
        });
    });
});