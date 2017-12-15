export class ActivityStatsMapModel {
    // maxHeartRate: number;
    // averageHeartRate: number;
    distance: number;
    averageSpeed: number;
    avgPower: number;
    elevation: number;
}

export class StreamsModel {
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

export class AnalysisDataModel {
    moveRatio: number;
    toughnessScore: number;
	speedData: SpeedDataModel;
	paceData: PaceDataModel;
	powerData: PowerDataModel;
	heartRateData: HeartRateDataModel;
	cadenceData: CadenceDataModel;
	gradeData: GradeDataModel;
	elevationData: ElevationDataModel;
}

export class MoveDataModel {
    movingTime: number;
    elapsedTime: number;
	speed: SpeedDataModel;
	pace: PaceDataModel;
}

export class SpeedDataModel {
    genuineAvgSpeed: number;
    totalAvgSpeed: number;
    avgPace: number;
    lowerQuartileSpeed: number;
    medianSpeed: number;
    upperQuartileSpeed: number;
    varianceSpeed: number;
    standardDeviationSpeed: number;
	speedZones: ZoneModel[];
}

export class PaceDataModel {
    avgPace: number;
    lowerQuartilePace: number;
    medianPace: number;
    upperQuartilePace: number;
    variancePace: number;
	paceZones: ZoneModel[];

}

export class PowerDataModel {
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
	powerZones: ZoneModel[];
    isEstimatedRunningPower?: boolean;
}

export class HeartRateDataModel {
    TRIMP: number;
    TRIMPPerHour: number;
    lowerQuartileHeartRate: number;
    medianHeartRate: number;
    upperQuartileHeartRate: number;
    averageHeartRate: number;
    maxHeartRate: number;
    activityHeartRateReserve: number;
    activityHeartRateReserveMax: number;
	heartRateZones: ZoneModel[];
}

export class CadenceDataModel {
    cadencePercentageMoving: number;
    cadenceTimeMoving: number;
    averageCadenceMoving: number;
    standardDeviationCadence: number;
    totalOccurrences: number;
    lowerQuartileCadence: number;
    medianCadence: number;
    upperQuartileCadence: number;
	upFlatDownCadencePaceData?: UpFlatDownModel;
    averageDistancePerOccurrence: number;
    lowerQuartileDistancePerOccurrence: number;
    medianDistancePerOccurrence: number;
    upperQuartileDistancePerOccurrence: number;
	cadenceZones: ZoneModel[];
}

export class GradeDataModel {
    avgGrade: number;
    avgMaxGrade: number;
    avgMinGrade: number;
    lowerQuartileGrade: number;
    medianGrade: number;
    upperQuartileGrade: number;
	upFlatDownInSeconds: UpFlatDownSumTotalModel;
	upFlatDownMoveData: UpFlatDownModel;
	upFlatDownDistanceData: UpFlatDownModel;
	upFlatDownCadencePaceData: UpFlatDownModel | null;
    gradeProfile: string;
	gradeZones: ZoneModel[];
}

export class ElevationDataModel {
    avgElevation: number;
    accumulatedElevationAscent: number;
    accumulatedElevationDescent: number;
    lowerQuartileElevation: number;
    medianElevation: number;
    upperQuartileElevation: number;
	elevationZones: ZoneModel[];
	ascentSpeedZones: ZoneModel[];
	ascentSpeed: AscentSpeedDataModel;
}

export class AscentSpeedDataModel {
    avg: number;
    lowerQuartile: number;
    median: number;
    upperQuartile: number;
}

export class UpFlatDownModel {
    up: number;
    flat: number;
    down: number;
}

export class UpFlatDownSumTotalModel extends UpFlatDownModel {
    total: number;
}

export class UpFlatDownSumCounterModel extends UpFlatDownModel {
    countUp: number;
    countFlat: number;
    countDown: number;
}

export class ZoneModel {
    from: number;
    to: number;
    s?: number;
    percentDistrib?: number;
}

export class SpeedUnitDataModel {
    units: string;
    speedUnitPerHour: string;
    speedUnitFactor: number;
}

export class ActivityBasicInfoModel {
    activityName: string;
    activityTime: string;
    segmentEffort?: {
        name: string;
        elapsedTimeSec: number;
    };
}
