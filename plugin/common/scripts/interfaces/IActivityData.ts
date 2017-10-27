export interface IActivityStatsMap {
    // maxHeartRate: number;
    // averageHeartRate: number;
    distance: number;
    averageSpeed: number;
    avgPower: number;
    elevation: number;
}

export interface IActivityStream {
    time: number[];
    latlng: number[][];
    heartrate: number[];
    velocity_smooth: number[];
    cadence: number[];
    watts: number[];
    watts_calc: number[];
    grade_smooth: number[];
    distance: number[];
    altitude: number[];
    altitude_smooth?: number[];
    grade_adjusted_distance: Array<number>;
}

export interface IAnalysisData {
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

export interface IMoveData {
    movingTime: number;
    elapsedTime: number;
    speed: ISpeedData;
    pace: IPaceData;
}

export interface ISpeedData {
    genuineAvgSpeed: number;
    totalAvgSpeed: number;
    avgPace: number;
    lowerQuartileSpeed: number;
    medianSpeed: number;
    upperQuartileSpeed: number;
    varianceSpeed: number;
    standardDeviationSpeed: number;
    speedZones: IZone[];
}

export interface IPaceData {
    avgPace: number;
    lowerQuartilePace: number;
    medianPace: number;
    upperQuartilePace: number;
    variancePace: number;
    paceZones: IZone[];

}

export interface IPowerData {
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
    powerZones: IZone[];
    isEstimatedRunningPower?: boolean;
}

export interface IHeartRateData {
    TRIMP: number;
    TRIMPPerHour: number;
    lowerQuartileHeartRate: number;
    medianHeartRate: number;
    upperQuartileHeartRate: number;
    averageHeartRate: number;
    maxHeartRate: number;
    activityHeartRateReserve: number;
    activityHeartRateReserveMax: number;
    heartRateZones: IZone[];
}

export interface ICadenceData {
    cadencePercentageMoving: number;
    cadenceTimeMoving: number;
    averageCadenceMoving: number;
    standardDeviationCadence: number;
    totalOccurrences: number;
    lowerQuartileCadence: number;
    medianCadence: number;
    upperQuartileCadence: number;
    upFlatDownCadencePaceData?: IUpFlatDown;
    averageDistancePerOccurrence: number;
    lowerQuartileDistancePerOccurrence: number;
    medianDistancePerOccurrence: number;
    upperQuartileDistancePerOccurrence: number;
    cadenceZones: IZone[];
}

export interface IGradeData {
    avgGrade: number;
    avgMaxGrade: number;
    avgMinGrade: number;
    lowerQuartileGrade: number;
    medianGrade: number;
    upperQuartileGrade: number;
    upFlatDownInSeconds: IUpFlatDownSumTotal;
    upFlatDownMoveData: IUpFlatDown;
    upFlatDownDistanceData: IUpFlatDown;
    upFlatDownCadencePaceData: IUpFlatDown | null;
    gradeProfile: string;
    gradeZones: IZone[];
}

export interface IElevationData {
    avgElevation: number;
    accumulatedElevationAscent: number;
    accumulatedElevationDescent: number;
    lowerQuartileElevation: number;
    medianElevation: number;
    upperQuartileElevation: number;
    elevationZones: IZone[];
    ascentSpeedZones: IZone[];
    ascentSpeed: IAscentSpeedData;
}

export interface IAscentSpeedData {
    avg: number;
    lowerQuartile: number;
    median: number;
    upperQuartile: number;
}

export interface IUpFlatDown {
    up: number;
    flat: number;
    down: number;
}

export interface IUpFlatDownSumTotal extends IUpFlatDown {
    total: number;
}

export interface IUpFlatDownSumCounter extends IUpFlatDown {
    countUp: number;
    countFlat: number;
    countDown: number;
}

export interface IZone {
    from: number;
    to: number;
    s?: number;
    percentDistrib?: number;
}

export interface ISpeedUnitData {
    units: string;
    speedUnitPerHour: string;
    speedUnitFactor: number;
}

export interface IActivityBasicInfo {
    activityName: string;
    activityTime: string;
    segmentEffort?: {
        name: string;
        elapsedTimeSec: number;
    };
}
