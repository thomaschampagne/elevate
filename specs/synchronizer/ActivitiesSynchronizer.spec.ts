describe('ActivitiesSynchronizer', () => {

    it('should sync ', () => {

        let userSettingsMock: IUserSettings = window.__fixtures__['fixtures/userSettings/2470979'];
        let appResourcesMock: IAppResources = window.__fixtures__['fixtures/appResources/appResources'];

        let activitiesSynchronizer: ActivitiesSynchronizer = new ActivitiesSynchronizer(appResourcesMock, userSettingsMock);

        // activitiesSynchronizer.sync().then((activities: Array<ISyncActivityComputed>) => {
        //     console.log('Activities: ' + activities.length);
        // });

    });
});