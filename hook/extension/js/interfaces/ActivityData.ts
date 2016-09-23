interface ActivityCommonStats {
    distance: number;
    movingTime: number;
    elevation: number;
    avgPower: number;
    weightedPower: number;
    energyOutput: number;
    elapsedTime: number;
    averageSpeed: number;
    averageHeartRate: number;
    maxHeartRate: number;
}
interface ActivityStatsMap {
    maxHeartRate: number;
    averageHeartRate: number;
    distance: number;
    averageSpeed: number;
    avgPower: number;
    elevation: number;
}

interface ActivityStream {
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

interface AnalysisData {
    moveRatio: number;
    toughnessScore: number;
    speedData: SpeedData;
    paceData: PaceData;
    powerData: PowerData;
    heartRateData: HeartRateData;
    cadenceData: CadenceData;
    gradeData: GradeData;
    elevationData: ElevationData;
}

interface MoveData {
    movingTime: number;
    elapsedTime: number;
    speed: SpeedData;
    pace: PaceData;
}

interface SpeedData {
    genuineAvgSpeed: number;
    totalAvgSpeed: number;
    avgPace: number;
    lowerQuartileSpeed: number;
    medianSpeed: number;
    upperQuartileSpeed: number;
    varianceSpeed: number;
    standardDeviationSpeed: number;
    speedZones: Array<Zone>;
}

interface PaceData {
    avgPace: number;
    lowerQuartilePace: number;
    medianPace: number;
    upperQuartilePace: number;
    variancePace: number;
    paceZones: Array<Zone>;

}

interface PowerData {
    hasPowerMeter: boolean;
    avgWatts: number;
    avgWattsPerKg: number;
    weightedPower: number;
    variabilityIndex: number;
    punchFactor: number;
    weightedWattsPerKg: number;
    lowerQuartileWatts: number;
    medianWatts: number;
    upperQuartileWatts: number;
    powerZones: Array<Zone>;
}

interface HeartRateData {
    TRIMP: number;
    TRIMPPerHour: number;
    lowerQuartileHeartRate: number;
    medianHeartRate: number;
    upperQuartileHeartRate: number;
    averageHeartRate: number;
    maxHeartRate: number;
    activityHeartRateReserve: number;
    activityHeartRateReserveMax: number;
    hrrZones: Array<HrrZone>;
}
interface CadenceData {
    cadencePercentageMoving: number;
    cadenceTimeMoving: number;
    averageCadenceMoving: number;
    standardDeviationCadence: number;
    crankRevolutions: number;
    lowerQuartileCadence: number;
    medianCadence: number;
    upperQuartileCadence: number;
    cadenceZones: Array<Zone>;
}
interface GradeData {
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
    gradeZones: Array<Zone>;
}

interface ElevationData {
    avgElevation: number;
    accumulatedElevationAscent: number;
    accumulatedElevationDescent: number;
    lowerQuartileElevation: number;
    medianElevation: number;
    upperQuartileElevation: number;
    elevationZones: Array<Zone>;
    ascentSpeedZones: Array<Zone>;
    ascentSpeed: AscentSpeedData;
}
interface AscentSpeedData {
    avg: number;
    lowerQuartile: number;
    median: number;
    upperQuartile: number;
}

interface Zone {
    from: number;
    to: number;
    s?: number;
    percentDistrib?: number;
}

interface HrrZone {
    fromHrr: number;
    toHrr: number;
    percentDistrib?: number;
    toHr?: number;
    s?: number;
    fromHr?: number;
}

interface SpeedUnitData {
    units: string;
    speedUnitPerHour: string;
    speedUnitFactor: number;
}

interface ActivityBasicInfo {
    activityName: string;
    activityTime: string;
    segmentEffort?: {
        name: string;
        elapsedTimeSec: number;
    };
}
