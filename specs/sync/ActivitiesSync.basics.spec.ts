/// <reference path="../typings/specs.d.ts" />

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

    it('should test my promise ', (done) => {

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

    it('should remove activity from array properly ', () => {

        let rawPageOfActivities: Array<ISyncActivityComputed> = clone(window.__fixtures__['fixtures/sync/rawPage0120161213'].models);
        let sourceCount = rawPageOfActivities.length;

        rawPageOfActivities = removeActivityFromArray(722210052, rawPageOfActivities); // Remove Hike "Fort saint eynard"

        expect(rawPageOfActivities).not.toBeNull();
        expect(_.findWhere(rawPageOfActivities, {id: 722210052})).toBeUndefined();
        expect(rawPageOfActivities.length).toEqual(sourceCount - 1);

    });

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

    it('should detect activities added, modified and deleted ', () => {

        let computedActivities: Array<ISyncActivityComputed> = clone(window.__fixtures__['fixtures/sync/computedActivities20161213'].computedActivities);
        let rawPageOfActivities: Array<ISyncRawStravaActivity> = clone(window.__fixtures__['fixtures/sync/rawPage0120161213'].models);

        // TODO REMOVE Simulate Remove data from strava, remove 2:
        // TODO REMOVE rawPageOfActivities = removeActivityFromArray(722210052, rawPageOfActivities); // Remove Hike "Fort saint eynard"
        // TODO REMOVE rawPageOfActivities = removeActivityFromArray(700301520, rawPageOfActivities); // Remove Ride "Baladinette"
        // TODO REMOVE expect(rawPageOfActivities.length).toEqual(18);

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
        // TODO REMOVE .. Below expects useless. To be deleted
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
});