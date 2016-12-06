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

        // Test extended stats
        expect(result.moveRatio.toString()).toEqual("0.9996736292428199");
        expect(result.speedData.genuineAvgSpeed.toString()).toEqual("33.063408423114524");
        expect(result.speedData.totalAvgSpeed.toString()).toEqual("33.05261749347252");
        expect(result.speedData.avgPace.toString()).toEqual("109");
        expect(result.speedData.lowerQuartileSpeed.toString()).toEqual("27.36");
        expect(result.speedData.medianSpeed.toString()).toEqual("33.480000000000004");
        expect(result.speedData.upperQuartileSpeed.toString()).toEqual("38.88");
        expect(result.speedData.varianceSpeed.toString()).toEqual("75.00773148027588");
        expect(result.speedData.standardDeviationSpeed.toString()).toEqual("8.660700403562975");

        expect(result.paceData.avgPace.toString()).toEqual("109");
        expect(result.paceData.lowerQuartilePace.toString()).toEqual("131.57894736842104");
        expect(result.paceData.medianPace.toString()).toEqual("107.5268817204301");
        expect(result.paceData.upperQuartilePace.toString()).toEqual("92.59259259259258");
        expect(result.paceData.variancePace.toString()).toEqual("47.99505236265758");

        expect(result.powerData.hasPowerMeter).toEqual(false);
        expect(result.powerData.avgWatts.toString()).toEqual("210.70878223963433");
        expect(result.powerData.avgWattsPerKg.toString()).toEqual("2.9305811159893507");
        expect(result.powerData.weightedPower.toString()).toEqual("245.24085595646744");
        expect(result.powerData.variabilityIndex.toString()).toEqual("1.1638853081954628");
        expect(result.powerData.punchFactor.toString()).toEqual("1.0218368998186143");
        expect(result.powerData.weightedWattsPerKg.toString()).toEqual("3.4108603053750683");
        expect(result.powerData.lowerQuartileWatts.toString()).toEqual("92");
        expect(result.powerData.medianWatts.toString()).toEqual("204");
        expect(result.powerData.upperQuartileWatts.toString()).toEqual("304");

        expect(result.heartRateData.TRIMP.toString()).toEqual("228.48086657699946");
        expect(result.heartRateData.TRIMPPerHour.toString()).toEqual("134.26887360058734");
        expect(result.heartRateData.lowerQuartileHeartRate.toString()).toEqual("161");
        expect(result.heartRateData.medianHeartRate.toString()).toEqual("167");
        expect(result.heartRateData.upperQuartileHeartRate.toString()).toEqual("174");
        expect(result.heartRateData.averageHeartRate.toString()).toEqual("164.33806725432584");
        expect(result.heartRateData.maxHeartRate.toString()).toEqual("190");
        expect(result.heartRateData.activityHeartRateReserve.toString()).toEqual("76.99230145440377");
        expect(result.heartRateData.activityHeartRateReserveMax.toString()).toEqual("93.54838709677419");

        expect(result.cadenceData.cadencePercentageMoving.toString()).toEqual("89.20640104506859");
        expect(result.cadenceData.cadenceTimeMoving.toString()).toEqual("5463");
        expect(result.cadenceData.averageCadenceMoving.toString()).toEqual("84.16877173714076");
        expect(result.cadenceData.standardDeviationCadence.toString()).toEqual("15.7");
        expect(result.cadenceData.crankRevolutions.toString()).toEqual("7740.983333333314");
        expect(result.cadenceData.lowerQuartileCadence.toString()).toEqual("79");
        expect(result.cadenceData.medianCadence.toString()).toEqual("87");
        expect(result.cadenceData.upperQuartileCadence.toString()).toEqual("93");

        expect(result.gradeData.avgGrade.toString()).toEqual("0.016110032040401574");
        expect(result.gradeData.lowerQuartileGrade.toString()).toEqual("-1.3");
        expect(result.gradeData.medianGrade.toString()).toEqual("0");
        expect(result.gradeData.upperQuartileGrade.toString()).toEqual("1.5");
        expect(result.gradeData.gradeProfile.toString()).toEqual("HILLY");
        expect(result.gradeData.upFlatDownInSeconds.up.toString()).toEqual("1745");
        expect(result.gradeData.upFlatDownInSeconds.flat.toString()).toEqual("3278");
        expect(result.gradeData.upFlatDownInSeconds.down.toString()).toEqual("1103");
        expect(result.gradeData.upFlatDownInSeconds.total.toString()).toEqual("6126");
        expect(result.gradeData.upFlatDownMoveData.up.toString()).toEqual("26.35530085959888");
        expect(result.gradeData.upFlatDownMoveData.flat.toString()).toEqual("34.56351433801095");
        expect(result.gradeData.upFlatDownMoveData.down.toString()).toEqual("39.24979147778793");
        expect(result.gradeData.upFlatDownDistanceData.up.toString()).toEqual("12.775000000000013");
        expect(result.gradeData.upFlatDownDistanceData.flat.toString()).toEqual("31.471999999999966");
        expect(result.gradeData.upFlatDownDistanceData.down.toString()).toEqual("12.025700000000024");

        expect(result.elevationData.avgElevation.toString()).toEqual("240");
        expect(result.elevationData.accumulatedElevationAscent.toString()).toEqual("389.8135095003674");
        expect(result.elevationData.accumulatedElevationDescent.toString()).toEqual("374.2319520937469");
        expect(result.elevationData.lowerQuartileElevation.toString()).toEqual("215");
        expect(result.elevationData.medianElevation.toString()).toEqual("231");
        expect(result.elevationData.upperQuartileElevation.toString()).toEqual("245");

    });
});

