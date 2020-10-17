import { Migration7x0x0x0 } from "../../../scripts/migrations/Migration7x0x0x0";

describe("migration_to_7_0_0_0", () => {
  const oldSerializedDb = `{"athlete":{"datedAthleteSettings":[{"cyclingFtp":145,"lthr":{"cycling":null,"default":null,"running":null},"maxHr":194,"restHr":65,"runningFtp":450,"since":"2020-03-23","swimFtp":null,"weight":78},{"cyclingFtp":145,"lthr":{"cycling":null,"default":null,"running":null},"maxHr":194,"restHr":65,"runningFtp":450,"since":null,"swimFtp":null,"weight":78}],"gender":"men"},"athleteId":2470979,"bestSplitsConfiguration":{"splits":[{"id":"9e4890cf-4f73-bddb-26e6-20fa582c62a5","length":1,"unit":0},{"id":"5e07a645-7050-048f-247a-5c6a063ea61a","length":10,"unit":0},{"id":"da7a2bbf-f4dc-667e-bf43-59232fdaa1ba","length":20,"unit":0},{"id":"07112a08-31b3-5da6-b644-d757c68b9654","length":10,"unit":1},{"id":"0a5b42a4-7e7c-5f82-f20c-2c9292fe2822","length":30,"unit":1},{"id":"85812530-88ee-b9df-54d6-42f17de85cea","length":50,"unit":1}]},"syncDateTime":1601110190597,"syncedActivities":[{"athleteSnapshot":{"athleteSettings":{"cyclingFtp":145,"lthr":{"cycling":null,"default":null,"running":null},"maxHr":194,"restHr":65,"runningFtp":450,"swimFtp":null,"weight":78},"gender":"men"},"bike_id":824321,"calories":727.57080078125,"commute":false,"display_type":"Ride","distance_raw":37072.3,"elapsed_time_raw":6649,"elevation_gain_raw":150.433,"elevation_unit":"m","extendedStats":{"cadenceData":null,"elevationData":{"accumulatedElevationAscent":149.9625251427031,"accumulatedElevationDescent":154.19778006213284,"ascentSpeed":{"avg":446.04305838455235,"lowerQuartile":294,"median":450,"upperQuartile":584},"ascentSpeedZones":null,"avgElevation":223,"elevationZones":null,"lowerQuartileElevation":216,"medianElevation":219,"upperQuartileElevation":222},"gradeData":{"avgGrade":-0.0002877292188818679,"avgMaxGrade":15.3,"avgMinGrade":-14.714285714285712,"gradeProfile":"HILLY","gradeZones":null,"lowerQuartileGrade":-1.6,"medianGrade":0,"upFlatDownCadencePaceData":null,"upFlatDownDistanceData":{"down":8.750799999999995,"flat":19.64590000000002,"up":8.66939999999999},"upFlatDownInSeconds":{"down":1525,"flat":3125,"total":6465,"up":1815},"upFlatDownMoveData":{"down":20.657626229508182,"flat":22.63207680000002,"up":17.195504132231388},"upperQuartileGrade":1.5},"heartRateData":null,"moveRatio":0.9723266656640096,"paceData":{"avgPace":174,"best20min":143,"genuineGradeAdjustedAvgPace":162,"gradeAdjustedPaceZones":null,"lowerQuartilePace":243.90243902439028,"medianPace":169.4915254237288,"paceZones":null,"runningStressScore":null,"runningStressScorePerHour":null,"upperQuartilePace":131.57894736842104,"variancePace":28.434665888505833},"powerData":{"avgWatts":106.10899269145217,"avgWattsPerKg":1.3603717011724636,"best20min":131.87958333333336,"bestEightyPercent":101.14617371686406,"hasPowerMeter":false,"lowerQuartileWatts":0,"medianWatts":47,"powerStressScore":241.29563184885603,"powerStressScorePerHour":134.36415694599873,"powerZones":null,"punchFactor":1.1591555415301207,"upperQuartileWatts":156,"variabilityIndex":1.5840085675924744,"weightedPower":168.0775535218675,"weightedWattsPerKg":2.154840429767532},"speedData":{"avgPace":174,"best20min":25.163484299999947,"genuineAvgSpeed":20.66004640371233,"genuineGradeAdjustedAvgSpeed":22.15029721955898,"lowerQuartileSpeed":14.76,"medianSpeed":21.240000000000002,"speedZones":null,"standardDeviationSpeed":11.25193424636121,"totalAvgSpeed":20.08831403218532,"upperQuartileSpeed":27.36,"varianceSpeed":126.60602428443622}},"hasPowerMeter":false,"id":66364510,"moving_time_raw":6206,"name":"Gresivaudan-Grenoble loop","private":false,"short_unit":"km","start_time":"2012-03-10T09:15:19+0000","trainer":false,"type":"Ride"},{"athleteSnapshot":{"athleteSettings":{"cyclingFtp":145,"lthr":{"cycling":null,"default":null,"running":null},"maxHr":194,"restHr":65,"runningFtp":450,"swimFtp":null,"weight":78},"gender":"men"},"bike_id":824321,"calories":null,"commute":false,"display_type":"Ride","distance_raw":30000,"elapsed_time_raw":3600,"elevation_gain_raw":0,"elevation_unit":"m","extendedStats":null,"hasPowerMeter":false,"id":163685810,"moving_time_raw":3600,"name":"Non-tracked ride","private":false,"short_unit":"km","start_time":"2012-05-01T10:00:00+0000","trainer":false,"type":"Ride"}],"userSettings":{"activateRunningCadence":true,"activateRunningGradeAdjustedPace":true,"activateRunningHeartRate":true,"activateRunningTemperature":true,"activityStravaMapType":"terrain","defaultLeaderBoardFilter":"overall","displayActivityBestSplits":true,"displayActivityRatio":true,"displayAdvancedElevationData":true,"displayAdvancedGradeData":true,"displayAdvancedHrData":true,"displayAdvancedPowerData":true,"displayAdvancedSpeedData":true,"displayBikeOdoInActivity":true,"displayCadenceData":true,"displayNearbySegments":true,"displayRecentEffortsHRAdjustedPacePower":false,"displayRunningPerformanceIndex":true,"displayRunningPowerEstimation":true,"displaySegmentRankPercentage":true,"displaySegmentTimeComparisonPosition":false,"displaySegmentTimeComparisonToCurrentYearPR":false,"displaySegmentTimeComparisonToKOM":false,"displaySegmentTimeComparisonToPR":false,"displayWindyOverlay":false,"enableBothLegsCadence":true,"feedChronologicalOrder":false,"feedHideChallenges":false,"feedHideCreatedRoutes":false,"feedHidePosts":false,"feedHideRideActivitiesUnderDistance":0,"feedHideRunActivitiesUnderDistance":0,"feedHideSuggestedAthletes":false,"feedHideVirtualRides":false,"localStorageMustBeCleared":false,"remoteLinks":true,"reviveGoogleMaps":true,"reviveGoogleMapsLayerType":"terrain","showHiddenBetaFeatures":false,"systemUnit":"metric","temperatureUnit":"C","zones":{"ascent":[0,100,200,300,400,500,600,700,800,900,1000,1200,1400,1600,1800,2000,2200,2400,2600,2800,3000,3200,3400,3600,3800,4000,4200,4400,4600,4800,5000,6000],"cyclingCadence":[0,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100,105,110,115,125,150],"elevation":[0,100,200,300,400,500,600,700,800,900,1000,1200,1400,1600,1800,2000,2200,2400,2600,2800,3000,3500,4000,5000],"grade":[-20,-17,-14,-12,-9,-6,-3,-2,-1,-0.5,0.5,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,20,25],"gradeAdjustedPace":[60,90,120,150,180,210,240,270,300,330,360,390,420,450,480,540,570,720,900],"heartRate":[120,140,150,160,170,180,185,190,195,210],"pace":[60,90,120,150,180,210,240,270,300,330,360,390,420,450,480,540,570,720,900],"power":[0,110,150,180,210,240,280,420,1000],"runningCadence":[65,67,69,71,73,75,77,79,81,83,85,87,89,91,93,95,97,99,101,103,105,107,109,111,115,120],"runningPower":[25,50,100,150,200,250,300,350,400,500,600,800,1000],"speed":[0,7,9,11,13,15,18,21,24,27,30,32,34,36,38,40,42,44,47,50,60,75,100]}},"versionInstalled":{"on":1600899286726,"version":"6.16.2"},"yearProgressPresets":[{"activityTypes":["Ride"],"id":"fpyovssd0st0yxmg","includeCommuteRide":true,"includeIndoorRide":true,"mode":0,"progressType":0,"targetValue":null}, {"activityTypes":["Run"],"id":"dsadsa23214","includeCommuteRide":true,"includeIndoorRide":true,"mode":0,"progressType":0,"targetValue":null}]}`;

  let migration;

  beforeEach(done => {
    migration = new Migration7x0x0x0();
    done();
  });

  it("should migrate a full old v6 database to the new v7 format", done => {
    // Given
    const oldDatabase = JSON.parse(oldSerializedDb);

    // When
    const newDatabase = migration.perform(oldDatabase);

    // Then
    expect(newDatabase).not.toBeNull();
    expect(newDatabase.athlete.name).toEqual("athlete");
    expect(newDatabase.athlete.data.length).toEqual(1);
    expect(newDatabase.athlete.data[0].$loki).toEqual(1);
    expect(newDatabase.athlete.data[0].meta).toBeDefined();

    expect(newDatabase.athleteId.name).toEqual("athleteId");
    expect(newDatabase.athleteId.data.length).toEqual(1);
    expect(newDatabase.athleteId.data[0].$loki).toEqual(1);
    expect(newDatabase.athleteId.data[0].meta).toBeDefined();
    expect(newDatabase.athleteId.data[0].athleteId).toEqual(2470979);

    expect(newDatabase.bestSplitsConfiguration.name).toEqual("bestSplitsConfiguration");
    expect(newDatabase.bestSplitsConfiguration.data.length).toEqual(1);
    expect(newDatabase.bestSplitsConfiguration.data[0].$loki).toEqual(1);
    expect(newDatabase.bestSplitsConfiguration.data[0].meta).toBeDefined();
    expect(newDatabase.bestSplitsConfiguration.data[0].splits.length).toEqual(6);

    expect(newDatabase.syncDateTime.name).toEqual("syncDateTime");
    expect(newDatabase.syncDateTime.data.length).toEqual(1);
    expect(newDatabase.syncDateTime.data[0].$loki).toEqual(1);
    expect(newDatabase.syncDateTime.data[0].meta).toBeDefined();
    expect(newDatabase.syncDateTime.data[0].syncDateTime).toEqual(1601110190597);

    expect(newDatabase.syncedActivities.name).toEqual("syncedActivities");
    expect(newDatabase.syncedActivities.data.length).toEqual(2);
    expect(newDatabase.syncedActivities.data[0].$loki).toEqual(1);
    expect(newDatabase.syncedActivities.data[0].meta).toBeDefined();
    expect(newDatabase.syncedActivities.data[1].$loki).toEqual(2);
    expect(newDatabase.syncedActivities.data[1].meta).toBeDefined();
    expect(newDatabase.syncedActivities.binaryIndices).toEqual({
      name: { dirty: false, name: "name", values: [] },
      start_time: { dirty: false, name: "start_time", values: [] },
      type: { dirty: false, name: "type", values: [] }
    });
    expect(newDatabase.syncedActivities.uniqueNames).toEqual(["id"]);

    expect(newDatabase.userSettings.name).toEqual("userSettings");
    expect(newDatabase.userSettings.data.length).toEqual(1);
    expect(newDatabase.userSettings.data[0].$loki).toEqual(1);
    expect(newDatabase.userSettings.data[0].meta).toBeDefined();
    expect(newDatabase.userSettings.data[0].systemUnit).toEqual("metric");

    expect(newDatabase.yearProgressPresets.name).toEqual("yearProgressPresets");
    expect(newDatabase.yearProgressPresets.data.length).toEqual(2);
    expect(newDatabase.yearProgressPresets.data[0].$loki).toEqual(1);
    expect(newDatabase.yearProgressPresets.data[0].meta).toBeDefined();
    expect(newDatabase.yearProgressPresets.data[1].$loki).toEqual(2);
    expect(newDatabase.yearProgressPresets.data[1].meta).toBeDefined();

    expect(newDatabase.versionInstalled.name).toEqual("versionInstalled");
    expect(newDatabase.versionInstalled.data.length).toEqual(1);
    expect(newDatabase.versionInstalled.data[0].$loki).toEqual(1);
    expect(newDatabase.versionInstalled.data[0].meta).toBeDefined();

    done();
  });

  it("should migrate a partial old v6 database to the new v7 format", done => {
    // Given
    const oldDatabase = JSON.parse(oldSerializedDb);

    delete oldDatabase.bestSplitsConfiguration;
    delete oldDatabase.yearProgressPresets;

    // When
    const newDatabase = migration.perform(oldDatabase);

    // Then
    expect(newDatabase).not.toBeNull();
    expect(newDatabase.athlete.name).toEqual("athlete");
    expect(newDatabase.athlete.data.length).toEqual(1);
    expect(newDatabase.athlete.data[0].$loki).toEqual(1);
    expect(newDatabase.athlete.data[0].meta).toBeDefined();

    expect(newDatabase.athleteId.name).toEqual("athleteId");
    expect(newDatabase.athleteId.data.length).toEqual(1);
    expect(newDatabase.athleteId.data[0].$loki).toEqual(1);
    expect(newDatabase.athleteId.data[0].meta).toBeDefined();
    expect(newDatabase.athleteId.data[0].athleteId).toEqual(2470979);

    expect(newDatabase.bestSplitsConfiguration).not.toBeDefined();

    expect(newDatabase.syncDateTime.name).toEqual("syncDateTime");
    expect(newDatabase.syncDateTime.data.length).toEqual(1);
    expect(newDatabase.syncDateTime.data[0].$loki).toEqual(1);
    expect(newDatabase.syncDateTime.data[0].meta).toBeDefined();
    expect(newDatabase.syncDateTime.data[0].syncDateTime).toEqual(1601110190597);

    expect(newDatabase.syncedActivities.name).toEqual("syncedActivities");
    expect(newDatabase.syncedActivities.data.length).toEqual(2);
    expect(newDatabase.syncedActivities.data[0].$loki).toEqual(1);
    expect(newDatabase.syncedActivities.data[0].meta).toBeDefined();
    expect(newDatabase.syncedActivities.data[1].$loki).toEqual(2);
    expect(newDatabase.syncedActivities.data[1].meta).toBeDefined();
    expect(newDatabase.syncedActivities.binaryIndices).toEqual({
      name: { dirty: false, name: "name", values: [] },
      start_time: { dirty: false, name: "start_time", values: [] },
      type: { dirty: false, name: "type", values: [] }
    });
    expect(newDatabase.syncedActivities.uniqueNames).toEqual(["id"]);

    expect(newDatabase.userSettings.name).toEqual("userSettings");
    expect(newDatabase.userSettings.data.length).toEqual(1);
    expect(newDatabase.userSettings.data[0].$loki).toEqual(1);
    expect(newDatabase.userSettings.data[0].meta).toBeDefined();
    expect(newDatabase.userSettings.data[0].systemUnit).toEqual("metric");

    expect(newDatabase.yearProgressPresets).not.toBeDefined();

    expect(newDatabase.versionInstalled.name).toEqual("versionInstalled");
    expect(newDatabase.versionInstalled.data.length).toEqual(1);
    expect(newDatabase.versionInstalled.data[0].$loki).toEqual(1);
    expect(newDatabase.versionInstalled.data[0].meta).toBeDefined();

    done();
  });

  it("should return null new data on empty old one", done => {
    // Given
    const oldDatabase = null;

    // When
    const newDatabase = migration.perform(oldDatabase);

    // Then
    expect(newDatabase).toBeNull();
    done();
  });

  it("should return new empty database", done => {
    // Given
    const oldDatabase = {};

    // When
    const newDatabase = migration.perform(oldDatabase);

    // Then
    expect(newDatabase).toEqual(oldDatabase);
    done();
  });

  it("should throw NOT_AN_OLD_DATABASE and skip", done => {
    // Given
    const oldDatabase: any = {
      athlete: {
        data: []
      }
    };
    const expected = new Error("NOT_AN_OLD_DATABASE");

    // When
    const call = () => {
      migration.perform(oldDatabase);
    };

    // Then
    expect(call).toThrow(expected);
    done();
  });
});
