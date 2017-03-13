interface IActivityStatsMap {
    // maxHeartRate: number;
    // averageHeartRate: number;
    distance: number;
    averageSpeed: number;
    avgPower: number;
    elevation: number;
}

interface IActivityStream {
    time: Array<number>;
    heartrate: Array<number>;
    velocity_smooth: Array<number>;
    cadence: Array<number>;
    watts: Array<number>;
    watts_calc: Array<number>;
    grade_smooth: Array<number>;
    distance: Array<number>;
    altitude: Array<number>;
    altitude_smooth?: Array<number>;
}

interface IAnalysisData {
    moveRatio: number;
    toughnessScore: number;
    speedData: ISpeedData;
    paceData: IPaceData;
    powerData: IPowerData;
    heartRateData: IHeartRateData;
    cadenceData: ICadenceData;
    gradeData: IGradeData;
    elevationData: IElevationData;
}

interface IMoveData {
    movingTime: number;
    elapsedTime: number;
    speed: ISpeedData;
    pace: IPaceData;
}

interface ISpeedData {
    genuineAvgSpeed: number;
    totalAvgSpeed: number;
    avgPace: number;
    lowerQuartileSpeed: number;
    medianSpeed: number;
    upperQuartileSpeed: number;
    varianceSpeed: number;
    standardDeviationSpeed: number;
    speedZones: Array<IZone>;
}

interface IPaceData {
    avgPace: number;
    lowerQuartilePace: number;
    medianPace: number;
    upperQuartilePace: number;
    variancePace: number;
    paceZones: Array<IZone>;

}

interface IPowerData {
    hasPowerMeter: boolean;
    avgWatts: number;
    avgWattsPerKg: number;
    weightedPower: number;
    variabilityIndex: number;
    punchFactor: number;
    powerStressScore: number;
    powerStressScorePerHour: number;
    weightedWattsPerKg: number;
    lowerQuartileWatts: number;
    medianWatts: number;
    upperQuartileWatts: number;
    powerZones: Array<IZone>;
}

interface IHeartRateData {
    TRIMP: number;
    TRIMPPerHour: number;
    lowerQuartileHeartRate: number;
    medianHeartRate: number;
    upperQuartileHeartRate: number;
    averageHeartRate: number;
    maxHeartRate: number;
    activityHeartRateReserve: number;
    activityHeartRateReserveMax: number;
    hrrZones: Array<IHrrZone>;
}
interface ICadenceData {
    cadencePercentageMoving: number;
    cadenceTimeMoving: number;
    averageCadenceMoving: number;
    standardDeviationCadence: number;
    crankRevolutions: number;
    lowerQuartileCadence: number;
    medianCadence: number;
    upperQuartileCadence: number;
    cadenceZones: Array<IZone>;
}
interface IGradeData {
    avgGrade: number;
    lowerQuartileGrade: number;
    medianGrade: number;
    upperQuartileGrade: number;
    upFlatDownInSeconds: {
        up: number;
        flat: number;
        down: number;
        total: number;
    };
    upFlatDownMoveData: {
        up: number;
        flat: number;
        down: number;
    };
    upFlatDownDistanceData: {
        up: number;
        flat: number;
        down: number;
    };
    gradeProfile: string;
    gradeZones: Array<IZone>;
}

interface IElevationData {
    avgElevation: number;
    accumulatedElevationAscent: number;
    accumulatedElevationDescent: number;
    lowerQuartileElevation: number;
    medianElevation: number;
    upperQuartileElevation: number;
    elevationZones: Array<IZone>;
    ascentSpeedZones: Array<IZone>;
    ascentSpeed: IAscentSpeedData;
}
interface IAscentSpeedData {
    avg: number;
    lowerQuartile: number;
    median: number;
    upperQuartile: number;
}

interface IZone {
    from: number;
    to: number;
    s?: number;
    percentDistrib?: number;
}

interface IHrrZone {
    fromHrr: number;
    toHrr: number;
    percentDistrib?: number;
    toHr?: number;
    s?: number;
    fromHr?: number;
}

interface ISpeedUnitData {
    units: string;
    speedUnitPerHour: string;
    speedUnitFactor: number;
}

interface IActivityBasicInfo {
    activityName: string;
    activityTime: string;
    segmentEffort?: {
        name: string;
        elapsedTimeSec: number;
    };
}
