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
    
});

