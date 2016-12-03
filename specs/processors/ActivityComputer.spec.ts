describe('ActivityComputer', () => {

    it('should compute correctly "Bon rythme ! 33 KPH !" @ https://www.strava.com/activities/723224273', () => {

        const athleteWeight: number = 71.9;
        const powerMeter: boolean = false;

        let userSettingsMock: IUserSettings = window.__fixtures__['fixtures/userSettings/2470979'];
        let stream: IActivityStream = window.__fixtures__['fixtures/activities/723224273/stream'];
        let statsMap: IActivityStatsMap = window.__fixtures__['fixtures/activities/723224273/statsMap'];

        stream.watts = stream.watts_calc; // because powerMeter is false

        let activityComputer: ActivityComputer = new ActivityComputer('Ride', powerMeter, userSettingsMock, athleteWeight, powerMeter, statsMap, stream, null, true);
        let result: IAnalysisData = activityComputer.compute();

        expect(result).not.toBeNull();
        expect(result.speedData).not.toBeNull();
        expect(result.cadenceData).not.toBeNull();
        expect(result.heartRateData).not.toBeNull();
        expect(result.powerData).not.toBeNull();
        expect(result.gradeData).not.toBeNull();
        expect(result.elevationData).not.toBeNull();
        expect(result.paceData).not.toBeNull();
        // ...
        // ...

        expect(Math.floor(result.heartRateData.TRIMP)).toEqual(228);
        // ...
        // ...
        // ...
        // ...

    });
});

