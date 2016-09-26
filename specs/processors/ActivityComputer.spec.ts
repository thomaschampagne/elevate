describe('ActivityComputer', () => {

    it('should be not null', () => {
        let activityComputer: ActivityComputer = new ActivityComputer('Ride', false, userSettings, 71, false, null, null, null);
        let result: AnalysisData = activityComputer.compute();
        expect(activityComputer).not.toBeNull();
    });

    it('should have result null', () => {
        let activityComputer: ActivityComputer = new ActivityComputer('Ride', false, userSettings, 71, false, null, null, null);
        let result: AnalysisData = activityComputer.compute();
        expect(result).toBeNull();
    });

    it('should load user settings from mocks...', () => {
        let userSettings: UserSettings = window.__mocks__['mock/userSettings'];
        console.info(userSettings);
    });
});

