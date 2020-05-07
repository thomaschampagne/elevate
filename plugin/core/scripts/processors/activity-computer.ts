import * as _ from "lodash";
import { Helper } from "../helper";
import { RunningPowerEstimator } from "./running-power-estimator";
import { SplitCalculator } from "./split-calculator";
import {
	ActivitySourceDataModel,
	ActivityStreamsModel,
	AnalysisDataModel,
	AscentSpeedDataModel,
	AthleteSettingsModel,
	AthleteSnapshotModel,
	CadenceDataModel,
	ElevationDataModel,
	Gender,
	GradeDataModel,
	HeartRateDataModel,
	MoveDataModel,
	PaceDataModel,
	PowerBestSplitModel,
	PowerDataModel,
	SpeedDataModel,
	UpFlatDownModel,
	UpFlatDownSumCounterModel,
	UpFlatDownSumTotalModel,
	UserSettingsModel,
	UserZonesModel,
	ZoneModel
} from "@elevate/shared/models";
import { StreamVariationSplit } from "../models/stream-variation-split.model";

export class ActivityComputer {

	public static readonly DEFAULT_LTHR_KARVONEN_HRR_FACTOR: number = 0.85;
	public static readonly MOVING_THRESHOLD_KPH: number = 0.1; // Kph
	public static readonly CADENCE_THRESHOLD_RPM: number = 35; // RPMs
	public static readonly GRADE_CLIMBING_LIMIT: number = 1.6;
	public static readonly GRADE_DOWNHILL_LIMIT: number = -1.6;
	public static readonly GRADE_PROFILE_FLAT_PERCENTAGE_DETECTED: number = 60;
	public static readonly GRADE_PROFILE_FLAT: string = "FLAT";
	public static readonly GRADE_PROFILE_HILLY: string = "HILLY";
	public static readonly ASCENT_SPEED_GRADE_LIMIT: number = ActivityComputer.GRADE_CLIMBING_LIMIT;
	public static readonly AVG_POWER_TIME_WINDOW_SIZE: number = 30; // Seconds
	public static readonly SPLIT_MAX_SCALE_TIME_GAP_THRESHOLD: number = 60 * 60 * 12; // 12 hours

	protected athleteSnapshot: AthleteSnapshotModel;
	protected activityType: string;
	protected isTrainer: boolean;
	protected userSettings: UserSettingsModel;
	protected movementData: MoveDataModel;
	protected isOwner: boolean;
	protected hasPowerMeter: boolean;
	protected activitySourceData: ActivitySourceDataModel;
	protected activityStream: ActivityStreamsModel;
	protected bounds: number[];
	protected returnZones: boolean;

	constructor(activityType: string,
				isTrainer: boolean,
				userSettings: UserSettingsModel,
				athleteSnapshot: AthleteSnapshotModel,
				isOwner: boolean,
				hasPowerMeter: boolean,
				activitySourceData: ActivitySourceDataModel,
				activityStream: ActivityStreamsModel,
				bounds: number[],
				returnZones: boolean) {

		// Store activityType, isTrainer, input activity params and userSettingsData
		this.activityType = activityType;
		this.isTrainer = isTrainer;
		this.userSettings = userSettings;
		this.userSettings.zones = UserZonesModel.asInstance(this.userSettings.zones);
		this.athleteSnapshot = athleteSnapshot;
		this.isOwner = isOwner;
		this.hasPowerMeter = hasPowerMeter;
		this.activitySourceData = activitySourceData;
		this.activityStream = activityStream;
		this.bounds = bounds;
		this.returnZones = returnZones;
	}

	public static streamVariationsSplits(trackedStream: number[], timeScale: number[], distanceScale: number[]): StreamVariationSplit[] {

		const streamVariations = [];
		let previousVariationSign = null;
		let lastNonVariationIndex = null;

		for (let i = 0; i < trackedStream.length; i++) {

			const currentValue = trackedStream[i];
			const nextValue = trackedStream[i + 1];
			const hasNextValue = _.isNumber(nextValue);
			const variationSign = Math.sign(nextValue - currentValue);

			if (_.isNull(previousVariationSign)) {
				previousVariationSign = variationSign;
			}
			if (_.isNull(lastNonVariationIndex)) {
				lastNonVariationIndex = i;
			}

			const streamVariation: StreamVariationSplit = {
				variation: (trackedStream[i] - trackedStream[lastNonVariationIndex]),
				time: (timeScale[i] - timeScale[lastNonVariationIndex]),
				distance: (distanceScale[i] - distanceScale[lastNonVariationIndex])
			};

			if (variationSign !== 0 && previousVariationSign !== variationSign && hasNextValue) { // Sign change

				streamVariations.push(streamVariation);
				previousVariationSign = variationSign;
				lastNonVariationIndex = i;

			} else if (!hasNextValue) { // negative
				streamVariations.push(streamVariation);
			}
		}

		return streamVariations;
	}

	/**
	 * Compute Heart Rate Stress Score (HRSS)
	 * @param {string} userGender
	 * @param {number} userMaxHr
	 * @param {number} userMinHr
	 * @param {number} lactateThreshold
	 * @param {number} activityTrainingImpulse
	 * @returns {number}
	 */
	public static computeHeartRateStressScore(userGender: Gender, userMaxHr: number, userMinHr: number, lactateThreshold: number, activityTrainingImpulse: number): number {
		const lactateThresholdReserve = (lactateThreshold - userMinHr) / (userMaxHr - userMinHr);
		const TRIMPGenderFactor: number = (userGender === Gender.MEN) ? 1.92 : 1.67;
		const lactateThresholdTrainingImpulse = 60 * lactateThresholdReserve * 0.64 * Math.exp(TRIMPGenderFactor * lactateThresholdReserve);
		return (activityTrainingImpulse / lactateThresholdTrainingImpulse * 100);
	}

	/**
	 *
	 * @param movingTime
	 * @param weightedPower
	 * @param cyclingFtp
	 */
	public static computePowerStressScore(movingTime: number, weightedPower: number, cyclingFtp: number): number {

		if (!_.isNumber(cyclingFtp) || cyclingFtp <= 0) {
			return null;
		}

		const intensity = (weightedPower / cyclingFtp);
		return (movingTime * weightedPower * intensity) / (cyclingFtp * 3600) * 100;
	}

	public static computeBestPowerSplits(timeArray: number[], powerArray: number[]) {
		// Find Best 20min, best 80% and an entire power curve of time power splits
		let best20min = null;
		let bestEightyPercent = null;
		let powerCurve: PowerBestSplitModel[] = [];
		try {

			const splitCalculator: SplitCalculator =
				new SplitCalculator(_.clone(timeArray), _.clone(powerArray), ActivityComputer.SPLIT_MAX_SCALE_TIME_GAP_THRESHOLD);

			try {
				bestEightyPercent = splitCalculator.getBestSplit(_.floor(_.last(timeArray) * 0.80), true);
			} catch (err) {
				console.warn("No best 80% power available for this range");
			}

			try {
				best20min = splitCalculator.getBestSplit(60 * 20, true);
			} catch (err) {
				console.warn("No best 20min power available for this range");
			}

			try {
				// Set up some abitrary times here that we will use for the power curve
				const defaultPowerCurveTimes = [
					..._.range(1, 30, 1), // 1s to 30s in 1s
					..._.range(30, 60, 5), // to 60s in 5s
					..._.range(60, 5 * 60, 10), // to 5m in 10s
					..._.range(5 * 60 + 30, 20 * 60, 30), // to 20 min in 30s
					..._.range(20 * 60, 60 * 60, 60), // to 60 min in minutes
					..._.range(60 * 60, 5 * 60 * 60, 5 * 60), // to 5 hour in 5 min
					..._.range(5 * 60 * 60, 24 * 60 * 60, 60 * 60) // to 24 hour in 1 hour
				];

				// Ensure the final value is the maximum time
				const maxTime = _.max(timeArray);
				const timesToUse = [...defaultPowerCurveTimes.filter(t => t < maxTime), maxTime];
				powerCurve = splitCalculator.getBestSplitRanges(timesToUse, true)
					.map(r => ({watts: r.result, time: r.range}));

			} catch (err) {
				console.warn("Power curve could not be calculated");
			}

		} catch (err) {
			console.warn(err);
		}

		return {best20min, bestEightyPercent, powerCurve};
	}

	/**
	 * @param {number} movingTime
	 * @param {number} gradeAdjustedAvgPace in s/km
	 * @param {number} runningThresholdPace
	 * @returns {number}
	 */
	public static computeRunningStressScore(movingTime: number, gradeAdjustedAvgPace: number, runningThresholdPace: number): number {
		// Convert pace to speed (km/s)
		const gradeAdjustedAvgSpeed = 1 / gradeAdjustedAvgPace;
		const runningThresholdSpeed = 1 / runningThresholdPace;
		const intensityFactor = gradeAdjustedAvgSpeed / runningThresholdSpeed;
		return (movingTime * gradeAdjustedAvgSpeed * intensityFactor) / (runningThresholdSpeed * 3600) * 100;
	}

	/**
	 *
	 * @param activityType
	 * @param athleteSettingsModel
	 */
	public static resolveLTHR(activityType: string, athleteSettingsModel: AthleteSettingsModel): number {

		if (athleteSettingsModel.lthr) {
			if (activityType === "Ride" || activityType === "VirtualRide" || activityType === "EBikeRide") {
				if (_.isNumber(athleteSettingsModel.lthr.cycling)) {
					return athleteSettingsModel.lthr.cycling;
				}
			}

			if (activityType === "Run") {
				if (_.isNumber(athleteSettingsModel.lthr.running)) {
					return athleteSettingsModel.lthr.running;
				}
			}

			if (_.isNumber(athleteSettingsModel.lthr.default)) {
				return athleteSettingsModel.lthr.default;
			}
		}

		return athleteSettingsModel.restHr + ActivityComputer.DEFAULT_LTHR_KARVONEN_HRR_FACTOR
			* (athleteSettingsModel.maxHr - athleteSettingsModel.restHr);

	}


	public compute(): AnalysisDataModel {

		const hasActivityStream = !_.isEmpty(this.activityStream);

		if (hasActivityStream) {

			// Append altitude_smooth to fetched strava activity stream before compute analysis data
			this.activityStream.altitude_smooth = this.smoothAltitudeStream(this.activityStream, this.activitySourceData);

			// Slices array stream if activity bounds are given.
			// It's mainly used for segment effort extended stats
			this.sliceStreamFromBounds(this.activityStream, this.bounds);
		}

		return this.computeAnalysisData(this.athleteSnapshot, this.hasPowerMeter, this.activitySourceData, this.activityStream);
	}

	protected sliceStreamFromBounds(activityStream: ActivityStreamsModel, bounds: number[]): void {

		// Slices array if activity bounds given. It's mainly used for segment effort extended stats
		if (bounds && bounds[0] && bounds[1]) {

			if (!_.isEmpty(activityStream.velocity_smooth)) {
				activityStream.velocity_smooth = activityStream.velocity_smooth.slice(bounds[0], bounds[1]);
			}

			if (!_.isEmpty(activityStream.time)) {
				activityStream.time = activityStream.time.slice(bounds[0], bounds[1]);
			}

			if (!_.isEmpty(activityStream.latlng)) {
				activityStream.latlng = activityStream.latlng.slice(bounds[0], bounds[1]);
			}

			if (!_.isEmpty(activityStream.heartrate)) {
				activityStream.heartrate = activityStream.heartrate.slice(bounds[0], bounds[1]);
			}

			if (!_.isEmpty(activityStream.watts)) {
				activityStream.watts = activityStream.watts.slice(bounds[0], bounds[1]);
			}

			if (!_.isEmpty(activityStream.watts_calc)) {
				activityStream.watts_calc = activityStream.watts_calc.slice(bounds[0], bounds[1]);
			}

			if (!_.isEmpty(activityStream.cadence)) {
				activityStream.cadence = activityStream.cadence.slice(bounds[0], bounds[1]);
			}

			if (!_.isEmpty(activityStream.grade_smooth)) {
				activityStream.grade_smooth = activityStream.grade_smooth.slice(bounds[0], bounds[1]);
			}

			if (!_.isEmpty(activityStream.altitude)) {
				activityStream.altitude = activityStream.altitude.slice(bounds[0], bounds[1]);
			}

			if (!_.isEmpty(activityStream.distance)) {
				activityStream.distance = activityStream.distance.slice(bounds[0], bounds[1]);
			}

			if (!_.isEmpty(activityStream.altitude_smooth)) {
				activityStream.altitude_smooth = activityStream.altitude_smooth.slice(bounds[0], bounds[1]);
			}

			if (!_.isEmpty(activityStream.grade_adjusted_speed)) {
				activityStream.grade_adjusted_speed = activityStream.grade_adjusted_speed.slice(bounds[0], bounds[1]);
			}
		}
	}

	protected smoothAltitudeStream(activityStream: ActivityStreamsModel, activitySourceData: ActivitySourceDataModel): any {
		return this.smoothAltitude(activityStream, activitySourceData.elevation);
	}


	protected computeAnalysisData(athleteSnapshot: AthleteSnapshotModel, hasPowerMeter: boolean, activitySourceData: ActivitySourceDataModel,
								  activityStream: ActivityStreamsModel): AnalysisDataModel {

		// Include speed and pace
		const hasActivityStream = !_.isEmpty(activityStream);
		if (hasActivityStream && activityStream.velocity_smooth) {
			this.movementData = this.moveData(activityStream.velocity_smooth, activityStream.time, activityStream.grade_adjusted_speed);
		} else if (_.isEmpty(activityStream.velocity_smooth) && this.activityType === "Run") { //For a manual activity, activityStream will still be passed but will be empty
			// Allow to estimate running move data if no stream available (goal is to get RSS computation for manual activities)
			this.movementData = this.moveDataEstimate(this.activitySourceData.movingTime, this.activitySourceData.distance);
		} else {
			return null;
		}

		// Q1 Speed
		// Median Speed
		// Q3 Speed
		// Standard deviation Speed
		const speedData: SpeedDataModel = (_.isEmpty(this.movementData)) ? null : this.movementData.speed;

		// Q1 Pace
		// Median Pace
		// Q3 Pace
		// Standard deviation Pace
		const paceData: PaceDataModel = (_.isEmpty(this.movementData)) ? null : this.movementData.pace;

		const moveRatio: number = (_.isEmpty(this.movementData)) ? null : this.moveRatio(this.movementData.movingTime, this.movementData.elapsedTime);

		// Estimated Normalized power
		// Estimated Variability index
		// Estimated Intensity factor
		// Normalized Watt per Kg
		let powerData: PowerDataModel;

		// If Running activity with no power data, then try to estimate it for the author of activity...
		if (this.activityType === "Run"
			&& !this.hasPowerMeter
			&& this.isOwner) {
			powerData = this.estimatedRunningPower(activityStream, athleteSnapshot.athleteSettings.weight, hasPowerMeter, athleteSnapshot.athleteSettings.cyclingFtp);
		} else {
			powerData = this.powerData(athleteSnapshot.athleteSettings.weight, hasPowerMeter, athleteSnapshot.athleteSettings.cyclingFtp,
				activityStream.watts, activityStream.velocity_smooth, activityStream.time);
		}

		// TRaining IMPulse
		// %HRR Avg
		// %HRR Zones
		// Q1 HR
		// Median HR
		// Q3 HR
		const heartRateData: HeartRateDataModel = (!_.isEmpty(activityStream)) ? this.heartRateData(athleteSnapshot, activityStream.heartrate, activityStream.time, activityStream.velocity_smooth) : null;

		// Avg grade
		// Q1/Q2/Q3 grade
		const gradeData: GradeDataModel = (!_.isEmpty(activityStream)) ? this.gradeData(activityStream.grade_smooth, activityStream.velocity_smooth, activityStream.time, activityStream.distance, activityStream.cadence) : null;

		// Cadence percentage
		// Time Cadence
		// Crank revolution
		const cadenceData: CadenceDataModel = (!_.isEmpty(activityStream)) ? this.cadenceData(activityStream.cadence, activityStream.velocity_smooth, activityStream.distance, activityStream.time) : null;
		// ... if exists cadenceData then append cadence pace (climbing, flat & downhill) if she has been previously provided by "gradeData"
		if (cadenceData && gradeData && gradeData.upFlatDownCadencePaceData) {
			cadenceData.upFlatDownCadencePaceData = gradeData.upFlatDownCadencePaceData;
		}

		// Avg grade
		// Q1/Q2/Q3 elevation
		const elevationData: ElevationDataModel = this.elevationData(activityStream);

		// Calculating running index (https://github.com/thomaschampagne/elevate/issues/704)
		const isRunningActivity = this.activityType.match(/Run|VirtualRun/g) !== null;
		const runningPerformanceIndex: number = (isRunningActivity && !_.isEmpty(elevationData) && !_.isEmpty(heartRateData)) ? this.runningPerformanceIndex(athleteSnapshot, this.activitySourceData, elevationData, heartRateData) : null;

		// Return an array with all that shit...
		return {
			moveRatio: moveRatio,
			runningPerformanceIndex: runningPerformanceIndex,
			speedData: speedData,
			paceData: paceData,
			powerData: powerData,
			heartRateData: heartRateData,
			cadenceData: cadenceData,
			gradeData: gradeData,
			elevationData: elevationData
		};
	}

	protected estimatedRunningPower(activityStream: ActivityStreamsModel, athleteWeight: number, hasPowerMeter: boolean, userFTP: number) {

		if (_.isEmpty(activityStream.distance)) { //return null if activityStream is basically empty (i.e. a manual run activity)
			return null;
		}

		try {
			console.log("Trying to estimate wattage of this run...");
			activityStream.watts = RunningPowerEstimator.createRunningPowerEstimationStream(
				athleteWeight,
				activityStream.distance,
				activityStream.time, activityStream.altitude);
		} catch (err) {
			console.error(err);
		}

		const isEstimatedRunningPower = true;

		return this.powerData(athleteWeight, hasPowerMeter, userFTP, activityStream.watts, activityStream.velocity_smooth,
			activityStream.time, isEstimatedRunningPower);
	}

	protected moveRatio(movingTime: number, elapsedTime: number): number {

		if (_.isNull(movingTime) || _.isNull(elapsedTime)) {
			return null;
		}

		const ratio: number = movingTime / elapsedTime;

		if (_.isNaN(ratio)) {
			return null;
		}

		return ratio;
	}

	protected runningPerformanceIndex(athleteSnapshot: AthleteSnapshotModel, activitySourceData: ActivitySourceDataModel, elevationData: ElevationDataModel, heartRateData: HeartRateDataModel): number {
		const averageHeartRate: number = heartRateData.averageHeartRate;
		const userMaxHr: number = athleteSnapshot.athleteSettings.maxHr;
		const runIntensity: number = Math.round((averageHeartRate / userMaxHr * 1.45 - 0.3) * 100) / 100; // Calculate the run intensity; this is rounded to 2 decimal points
		const gradeAdjustedDistance = activitySourceData.distance + (elevationData.accumulatedElevationAscent * 6) - (elevationData.accumulatedElevationDescent * 4);
		const distanceRate: number = (213.9 / (activitySourceData.movingTime / 60) * ((gradeAdjustedDistance / 1000) ** 1.06)) + 3.5;
		return distanceRate / runIntensity;
	}

	protected getZoneId(zones: ZoneModel[], value: number): number {
		for (let zoneId = 0; zoneId < zones.length; zoneId++) {
			if (value <= zones[zoneId].to) {
				return zoneId;
			}
		}
	}

	protected prepareZonesForDistributionComputation(sourceZones: ZoneModel[]): ZoneModel[] {
		const preparedZones: ZoneModel[] = [];
		_.forEach(sourceZones, (zone: ZoneModel) => {
			zone.s = 0;
			zone.percentDistrib = null;
			preparedZones.push(zone);
		});
		return preparedZones;
	}

	protected finalizeDistributionComputationZones(zones: ZoneModel[]): ZoneModel[] {
		let total = 0;
		let zone: ZoneModel;

		for (let i = 0; i < zones.length; i++) {
			zone = zones[i];
			if (zone.s) {
				total += zone.s;
			}
			zone.percentDistrib = 0;
		}

		if (total > 0) {
			for (let i = 0; i < zones.length; i++) {
				zone = zones[i];
				if (zone.s) {
					zone.percentDistrib = zone.s / total * 100;
				}
			}
		}
		return zones;
	}

	/**
	 *
	 * @param {number} currentValue
	 * @param {number} previousValue
	 * @param {number} delta between current & previous values
	 * @returns {number} the discrete value
	 */
	protected discreteValueBetween(currentValue: number, previousValue: number, delta: number): number {
		return currentValue * delta - ((currentValue - previousValue) * delta) / 2; // Discrete integral
	}

	/**
	 *
	 * @param {number} movingTime
	 * @param {number} distance
	 * @returns {MoveDataModel}
	 */
	protected moveDataEstimate(movingTime: number, distance: number): MoveDataModel {

		if (!_.isNumber(movingTime) || movingTime === 0 || !_.isNumber(distance) || distance === 0) {
			return null;
		}

		const averageSpeed = distance / movingTime * 3.6;
		const averagePace = Helper.convertSpeedToPace(averageSpeed);

		const speedData: SpeedDataModel = {
			genuineAvgSpeed: averageSpeed,
			totalAvgSpeed: averageSpeed,
			best20min: null,
			avgPace: averagePace, // send in seconds
			lowerQuartileSpeed: null,
			medianSpeed: null,
			upperQuartileSpeed: null,
			varianceSpeed: 0,
			genuineGradeAdjustedAvgSpeed: averageSpeed,
			standardDeviationSpeed: 0,
			speedZones: null
		};

		const runningStressScore = (this.activityType === "Run" && averagePace && this.athleteSnapshot.athleteSettings.runningFtp)
			? ActivityComputer.computeRunningStressScore(movingTime, averagePace, this.athleteSnapshot.athleteSettings.runningFtp) : null;

		const paceData: PaceDataModel = {
			avgPace: averagePace, // send in seconds
			best20min: null,
			lowerQuartilePace: null,
			medianPace: null,
			upperQuartilePace: null,
			variancePace: 0,
			genuineGradeAdjustedAvgPace: averagePace,
			paceZones: null,
			gradeAdjustedPaceZones: null,
			runningStressScore: runningStressScore,
			runningStressScorePerHour: (runningStressScore) ? runningStressScore / movingTime * 60 * 60 : null
		};

		return {
			movingTime: movingTime,
			elapsedTime: movingTime,
			speed: speedData,
			pace: paceData,
		};
	}

	/**
	 *
	 * @param {number[]} velocityArray
	 * @param {number[]} timeArray
	 * @param {number[]} gradeAdjustedSpeedArray
	 * @returns {MoveDataModel}
	 */
	protected moveData(velocityArray: number[], timeArray: number[], gradeAdjustedSpeedArray?: number[]): MoveDataModel {

		if (_.isEmpty(velocityArray) || _.isEmpty(timeArray) || _.mean(velocityArray) === 0) {
			return null;
		}

		// No grade adjusted speed if treadmill indoor run
		if (this.isTrainer
			&& this.activityType === "Run"
			&& _.mean(gradeAdjustedSpeedArray) === 0) {
			gradeAdjustedSpeedArray = velocityArray;
		}

		let genuineAvgSpeedSum = 0,
			genuineAvgSpeedSecondsSum = 0;
		const speedsNonZero: number[] = [];
		const speedsNonZeroDuration: number[] = [];
		const gradeAdjustedSpeedsNonZero: number[] = [];
		let speedVarianceSum = 0;
		let currentSpeed: number;

		let speedZones: ZoneModel[] = this.prepareZonesForDistributionComputation(this.userSettings.zones.get(UserZonesModel.TYPE_SPEED));
		let paceZones: ZoneModel[] = this.prepareZonesForDistributionComputation(this.userSettings.zones.get(UserZonesModel.TYPE_PACE));
		let gradeAdjustedPaceZones: ZoneModel[] = this.prepareZonesForDistributionComputation(this.userSettings.zones.get(UserZonesModel.TYPE_GRADE_ADJUSTED_PACE));

		let movingSeconds = 0;
		let elapsedSeconds = 0;

		const hasGradeAdjustedSpeed: boolean = !_.isEmpty(gradeAdjustedSpeedArray);

		// End Preparing zone
		for (let i = 0; i < velocityArray.length; i++) { // Loop on samples

			// Compute distribution for graph/table
			if (i > 0) {

				elapsedSeconds += (timeArray[i] - timeArray[i - 1]);

				// Compute speed
				currentSpeed = velocityArray[i] * 3.6; // Multiply by 3.6 to convert to kph;

				movingSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)

				if (currentSpeed > 0) { // If moving...

					speedsNonZero.push(currentSpeed);
					speedsNonZeroDuration.push(movingSeconds);

					// Compute variance speed
					speedVarianceSum += Math.pow(currentSpeed, 2);

					// distance
					genuineAvgSpeedSum += this.discreteValueBetween(velocityArray[i] * 3.6, velocityArray[i - 1] * 3.6, movingSeconds);
					// time
					genuineAvgSpeedSecondsSum += movingSeconds;

					// Find speed zone id
					const speedZoneId: number = this.getZoneId(this.userSettings.zones.get(UserZonesModel.TYPE_SPEED), currentSpeed);
					if (!_.isUndefined(speedZoneId) && !_.isUndefined(speedZones[speedZoneId])) {
						speedZones[speedZoneId].s += movingSeconds;
					}

					// Find pace zone
					const pace: number = Helper.convertSpeedToPace(currentSpeed);

					const paceZoneId: number = this.getZoneId(this.userSettings.zones.get(UserZonesModel.TYPE_PACE), (pace === -1) ? 0 : pace);
					if (!_.isUndefined(paceZoneId) && !_.isUndefined(paceZones[paceZoneId])) {
						paceZones[paceZoneId].s += movingSeconds;
					}

				}

				if (hasGradeAdjustedSpeed) {

					if (gradeAdjustedSpeedArray[i] > 0) {

						const gradeAdjustedSpeed = gradeAdjustedSpeedArray[i] * 3.6;
						gradeAdjustedSpeedsNonZero.push(gradeAdjustedSpeed);

						const gradeAdjustedPace = Helper.convertSpeedToPace(gradeAdjustedSpeed);

						const gradeAdjustedPaceZoneId: number = this.getZoneId(this.userSettings.zones.get(UserZonesModel.TYPE_GRADE_ADJUSTED_PACE), (gradeAdjustedPace === -1) ? 0 : gradeAdjustedPace);
						if (!_.isUndefined(gradeAdjustedPaceZoneId) && !_.isUndefined(gradeAdjustedPaceZones[gradeAdjustedPaceZoneId])) {
							gradeAdjustedPaceZones[gradeAdjustedPaceZoneId].s += movingSeconds;
						}
					}
				}
			}
		}

		// Update zone distribution percentage
		speedZones = this.finalizeDistributionComputationZones(speedZones);
		paceZones = this.finalizeDistributionComputationZones(paceZones);
		gradeAdjustedPaceZones = this.finalizeDistributionComputationZones(gradeAdjustedPaceZones);

		// Finalize compute of Speed
		const genuineAvgSpeed: number = genuineAvgSpeedSum / genuineAvgSpeedSecondsSum;
		const varianceSpeed: number = (speedVarianceSum / speedsNonZero.length) - Math.pow(genuineAvgSpeed, 2);
		const standardDeviationSpeed: number = (varianceSpeed > 0) ? Math.sqrt(varianceSpeed) : 0;
		const percentiles: number[] = Helper.weightedPercentiles(speedsNonZero, speedsNonZeroDuration, [0.25, 0.5, 0.75]);


		let best20min = null;
		try {
			const splitCalculator = new SplitCalculator(_.clone(timeArray), _.clone(velocityArray), ActivityComputer.SPLIT_MAX_SCALE_TIME_GAP_THRESHOLD);
			best20min = splitCalculator.getBestSplit(60 * 20, true) * 3.6;
		} catch (err) {
			console.warn("No best 20min speed/pace available for this range");
		}

		const genuineGradeAdjustedAvgSpeed = _.mean(gradeAdjustedSpeedsNonZero);

		const speedData: SpeedDataModel = {
			genuineAvgSpeed: genuineAvgSpeed,
			totalAvgSpeed: genuineAvgSpeed * this.moveRatio(genuineAvgSpeedSecondsSum, elapsedSeconds),
			best20min: best20min,
			avgPace: Math.floor(Helper.convertSpeedToPace(genuineAvgSpeed)), // send in seconds
			lowerQuartileSpeed: percentiles[0],
			medianSpeed: percentiles[1],
			upperQuartileSpeed: percentiles[2],
			varianceSpeed: varianceSpeed,
			genuineGradeAdjustedAvgSpeed: genuineGradeAdjustedAvgSpeed,
			standardDeviationSpeed: standardDeviationSpeed,
			speedZones: (this.returnZones) ? speedZones : null,
		};

		const genuineGradeAdjustedAvgPace = (hasGradeAdjustedSpeed && genuineGradeAdjustedAvgSpeed > 0) ? Math.floor(Helper.convertSpeedToPace(genuineGradeAdjustedAvgSpeed)) : null;

		const runningStressScore = ((this.activityType === "Run" || this.activityType === "VirtualRun") && genuineGradeAdjustedAvgPace && this.athleteSnapshot.athleteSettings.runningFtp)
			? ActivityComputer.computeRunningStressScore(this.activitySourceData.movingTime, genuineGradeAdjustedAvgPace, this.athleteSnapshot.athleteSettings.runningFtp) : null;

		const paceData: PaceDataModel = {
			avgPace: Math.floor(Helper.convertSpeedToPace(genuineAvgSpeed)), // send in seconds
			best20min: (best20min) ? Math.floor(Helper.convertSpeedToPace(best20min)) : null,
			lowerQuartilePace: Helper.convertSpeedToPace(percentiles[0]),
			medianPace: Helper.convertSpeedToPace(percentiles[1]),
			upperQuartilePace: Helper.convertSpeedToPace(percentiles[2]),
			variancePace: Helper.convertSpeedToPace(varianceSpeed),
			genuineGradeAdjustedAvgPace: genuineGradeAdjustedAvgPace,
			paceZones: (this.returnZones) ? paceZones : null,
			gradeAdjustedPaceZones: (this.returnZones && hasGradeAdjustedSpeed) ? gradeAdjustedPaceZones : null,
			runningStressScore: runningStressScore,
			runningStressScorePerHour: (runningStressScore) ? runningStressScore / genuineAvgSpeedSecondsSum * 60 * 60 : null
		};

		return {
			movingTime: genuineAvgSpeedSecondsSum,
			elapsedTime: elapsedSeconds,
			speed: speedData,
			pace: paceData,
		};
	}

	/**
	 * Andrew Coggan weighted power compute method
	 * (source: http://forum.slowtwitch.com/Slowtwitch_Forums_C1/Triathlon_Forum_F1/Normalized_Power_Formula_or_Calculator..._P3097774/)
	 * 1) starting at the 30s mark, calculate a rolling 30 s average (of the preceeding time points, obviously).
	 * 2) raise all the values obtained in step #1 to the 4th power.
	 * 3) take the average of all of the values obtained in step #2.
	 * 4) take the 4th root of the value obtained in step #3.
	 * (And when you get tired of exporting every file to, e.g., Excel to perform such calculations, help develop a program
	 * like WKO+ to do the work for you <g>.)
	 */
	protected powerData(athleteWeight: number, hasPowerMeter: boolean, cyclingFtp: number, powerArray: number[],
						velocityArray: number[], timeArray: number[], isEstimatedRunningPower?: boolean): PowerDataModel {

		if (_.isEmpty(powerArray) || _.isEmpty(timeArray) || _.mean(powerArray) === 0) {
			return null;
		}

		let powerZonesAlongActivityType: ZoneModel[];
		if (this.activityType === "Ride") {
			powerZonesAlongActivityType = this.userSettings.zones.get(UserZonesModel.TYPE_POWER);
		} else if (this.activityType === "Run") {
			powerZonesAlongActivityType = this.userSettings.zones.get(UserZonesModel.TYPE_RUNNING_POWER);
		} else {
			powerZonesAlongActivityType = null;
		}

		powerZonesAlongActivityType = this.prepareZonesForDistributionComputation(powerZonesAlongActivityType);

		let accumulatedWattsOnMove = 0;
		let wattSampleOnMoveCount = 0;
		const wattsSamplesOnMove: number[] = [];
		const wattsSamplesOnMoveDuration: number[] = [];

		let durationInSeconds: number;
		let totalMovingInSeconds = 0;

		let rollingWindowSize = 0;
		let rollingIndex = 0;
		let sum4thPower = 0;

		let rollingSum = (powerArray.length > 0 ? powerArray[0] : 0);
		let totalMovingSamples = 1;

		const hasNoSpeedStream = _.isEmpty(velocityArray);

		for (let i = 1; i < powerArray.length; i++) { // Loop on samples

			const isReadyForPowerStats = (this.isTrainer || hasNoSpeedStream || _.isNumber(velocityArray[i]));
			if (!isReadyForPowerStats) {
				continue;
			}

			// Compute distribution for graph/table
			durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)

			rollingSum += powerArray[i];
			rollingWindowSize += durationInSeconds;

			sum4thPower += Math.pow(rollingSum / (i - rollingIndex + 1), 4);

			// Reduce rolling window size if necessary. This is a bit
			// complicated as we don't know a priori how many samples to
			// remove from the beginning of the window as the delta time
			// between samples varies.
			while (rollingWindowSize >= ActivityComputer.AVG_POWER_TIME_WINDOW_SIZE) {
				rollingSum -= powerArray[rollingIndex];
				rollingWindowSize -= (timeArray[rollingIndex + 1] - timeArray[rollingIndex]);
				rollingIndex++;
			}

			// When speed data is given, totalMovingInSeconds value increases only if athlete is moving
			if (hasNoSpeedStream || (velocityArray[i] * 3.6 > ActivityComputer.MOVING_THRESHOLD_KPH) || this.isTrainer) {
				totalMovingInSeconds += durationInSeconds;
				totalMovingSamples++;
			}

			wattsSamplesOnMove.push(powerArray[i]);
			wattsSamplesOnMoveDuration.push(durationInSeconds);

			// average over time
			accumulatedWattsOnMove += this.discreteValueBetween(powerArray[i], powerArray[i - 1], durationInSeconds);
			wattSampleOnMoveCount += durationInSeconds;

			const powerZoneId: number = this.getZoneId(powerZonesAlongActivityType, powerArray[i]);

			if (!_.isUndefined(powerZoneId) && !_.isUndefined(powerZonesAlongActivityType[powerZoneId])) {
				powerZonesAlongActivityType[powerZoneId].s += durationInSeconds;
			}
		}

		// Finalize compute of Power
		const avgWatts: number = _.mean(powerArray);

		const weightedPower = Math.sqrt(Math.sqrt(sum4thPower / totalMovingSamples));

		const variabilityIndex: number = weightedPower / avgWatts;
		const intensity: number = (_.isNumber(cyclingFtp) && cyclingFtp > 0) ? (weightedPower / cyclingFtp) : null;
		const weightedWattsPerKg: number = weightedPower / athleteWeight;
		const avgWattsPerKg: number = avgWatts / athleteWeight;

		const percentiles: number[] = Helper.weightedPercentiles(wattsSamplesOnMove, wattsSamplesOnMoveDuration, [0.25, 0.5, 0.75]);

		// Update zone distribution percentage
		powerZonesAlongActivityType = this.finalizeDistributionComputationZones(powerZonesAlongActivityType);

		// Find default set of best powers
		const {best20min, bestEightyPercent, powerCurve} = ActivityComputer.computeBestPowerSplits(timeArray, powerArray);

		const powerStressScore = ActivityComputer.computePowerStressScore(totalMovingInSeconds, weightedPower, cyclingFtp);
		const powerStressScorePerHour: number = powerStressScore / totalMovingInSeconds * 60 * 60;

		const powerData: PowerDataModel = {
			hasPowerMeter: hasPowerMeter,
			avgWatts: avgWatts,
			avgWattsPerKg: avgWattsPerKg,
			weightedPower: weightedPower,
			best20min: best20min,
			bestEightyPercent: bestEightyPercent,
			variabilityIndex: variabilityIndex,
			punchFactor: intensity,
			powerStressScore: powerStressScore,
			powerStressScorePerHour: powerStressScorePerHour,
			weightedWattsPerKg: weightedWattsPerKg,
			lowerQuartileWatts: percentiles[0],
			medianWatts: percentiles[1],
			upperQuartileWatts: percentiles[2],
			powerZones: (this.returnZones) ? powerZonesAlongActivityType : null, // Only while moving
			powerCurve: powerCurve || []
		};

		if (!_.isUndefined(isEstimatedRunningPower)) {
			powerData.isEstimatedRunningPower = isEstimatedRunningPower;
		}

		return powerData;
	}

	protected heartRateData(athleteSnapshot: AthleteSnapshotModel, heartRateArray: number[], timeArray: number[],
							velocityArray: number[]): HeartRateDataModel {

		if (_.isEmpty(heartRateArray) || _.isEmpty(timeArray) || _.mean(heartRateArray) === 0) {
			return null;
		}

		let heartRateZones: ZoneModel[] = this.prepareZonesForDistributionComputation(this.userSettings.zones.get(UserZonesModel.TYPE_HEART_RATE));

		let trainingImpulse = 0;
		const TRIMPGenderFactor: number = (athleteSnapshot.gender === Gender.MEN) ? 1.92 : 1.67;
		let hrrSecondsCount = 0;
		let hr: number, heartRateReserveAvg: number, durationInSeconds: number, durationInMinutes: number,
			zoneId: number;
		let hrSum = 0;
		const heartRateArrayMoving: any[] = [];
		const heartRateArrayMovingDuration: any[] = [];

		for (let i = 0; i < heartRateArray.length; i++) { // Loop on samples

			if (i > 0 && (
				this.isTrainer || // can be cycling home trainer
				!velocityArray || // OR Non movements activities
				velocityArray[i] * 3.6 > ActivityComputer.MOVING_THRESHOLD_KPH  // OR Movement over MOVING_THRESHOLD_KPH for any kind of activities having movements data
			)) {

				// Compute heartrate data while moving from now
				durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)
				// average over time
				hrSum += this.discreteValueBetween(heartRateArray[i], heartRateArray[i - 1], durationInSeconds);
				hrrSecondsCount += durationInSeconds;

				heartRateArrayMoving.push(heartRateArray[i]);
				heartRateArrayMovingDuration.push(durationInSeconds);

				// Compute trainingImpulse
				hr = (heartRateArray[i] + heartRateArray[i - 1]) / 2; // Getting HR avg between current sample and previous one.
				heartRateReserveAvg = Helper.heartRateReserveFromHeartrate(hr, athleteSnapshot.athleteSettings.maxHr, athleteSnapshot.athleteSettings.restHr); // (hr - userSettingsData.userRestHr) / (userSettingsData.userMaxHr - userSettingsData.userRestHr);
				durationInMinutes = durationInSeconds / 60;

				trainingImpulse += durationInMinutes * heartRateReserveAvg * 0.64 * Math.exp(TRIMPGenderFactor * heartRateReserveAvg);

				// Count Heart Rate Reserve distribution
				zoneId = this.getZoneId(heartRateZones, heartRateArray[i]);

				if (!_.isUndefined(zoneId)) {
					heartRateZones[zoneId].s += durationInSeconds;
				}
			}
		}

		// Update zone distribution percentage
		heartRateZones = this.finalizeDistributionComputationZones(heartRateZones);

		const TRIMPPerHour: number = trainingImpulse / hrrSecondsCount * 60 * 60;
		const percentiles: number[] = Helper.weightedPercentiles(heartRateArrayMoving, heartRateArrayMovingDuration, [0.25, 0.5, 0.75]);

		const userLthrAlongActivityType: number = ActivityComputer.resolveLTHR(this.activityType, athleteSnapshot.athleteSettings);

		const heartRateStressScore = ActivityComputer.computeHeartRateStressScore(athleteSnapshot.gender, athleteSnapshot.athleteSettings.maxHr,
			athleteSnapshot.athleteSettings.restHr, userLthrAlongActivityType, trainingImpulse);
		const HRSSPerHour: number = heartRateStressScore / hrrSecondsCount * 60 * 60;

		const averageHeartRate: number = hrSum / hrrSecondsCount;
		const maxHeartRate: number = _.max(heartRateArray);

		let best20min = null;
		try {
			const splitCalculator = new SplitCalculator(_.clone(timeArray), _.clone(heartRateArray), ActivityComputer.SPLIT_MAX_SCALE_TIME_GAP_THRESHOLD);
			best20min = splitCalculator.getBestSplit(60 * 20, true);
		} catch (err) {
			console.warn("No best 20min heart rate available for this range");
		}

		let best60min = null;
		try {
			const splitCalculator = new SplitCalculator(_.clone(timeArray), _.clone(heartRateArray), ActivityComputer.SPLIT_MAX_SCALE_TIME_GAP_THRESHOLD);
			best60min = splitCalculator.getBestSplit(60 * 60, true);
		} catch (err) {
			console.warn("No best 60min heart rate available for this range");
		}

		return {
			HRSS: heartRateStressScore,
			HRSSPerHour: HRSSPerHour,
			TRIMP: trainingImpulse,
			TRIMPPerHour: TRIMPPerHour,
			best20min: best20min,
			best60min: best60min,
			heartRateZones: (this.returnZones) ? heartRateZones : null,
			lowerQuartileHeartRate: percentiles[0],
			medianHeartRate: percentiles[1],
			upperQuartileHeartRate: percentiles[2],
			averageHeartRate: averageHeartRate,
			maxHeartRate: maxHeartRate,
			activityHeartRateReserve: Helper.heartRateReserveFromHeartrate(averageHeartRate, athleteSnapshot.athleteSettings.maxHr, athleteSnapshot.athleteSettings.restHr) * 100,
			activityHeartRateReserveMax: Helper.heartRateReserveFromHeartrate(maxHeartRate, athleteSnapshot.athleteSettings.maxHr, athleteSnapshot.athleteSettings.restHr) * 100,
		};
	}

	protected cadenceData(cadenceArray: number[], velocityArray: number[], distanceArray: number[],
						  timeArray: number[]): CadenceDataModel {

		if (_.isEmpty(cadenceArray) || _.isEmpty(timeArray) || _.mean(cadenceArray) === 0) {
			return null;
		}

		const hasDistanceData = !_.isEmpty(distanceArray);

		// recomputing crank revolutions using cadence data
		let totalOccurrences = 0;

		// On Moving
		let cadenceSumOnMoving = 0;
		let cadenceSumDurationOnMoving = 0;
		let cadenceVarianceSumOnMoving = 0;
		let cadenceOnMoveSampleCount = 0;
		let movingSampleCount = 0;

		let cadenceZoneTyped: ZoneModel[];
		if (this.activityType === "Ride") {
			cadenceZoneTyped = this.userSettings.zones.get(UserZonesModel.TYPE_CYCLING_CADENCE);
		} else if (this.activityType === "Run") {
			cadenceZoneTyped = this.userSettings.zones.get(UserZonesModel.TYPE_RUNNING_CADENCE);
		} else {
			return null;
		}

		let cadenceZones: ZoneModel[] = this.prepareZonesForDistributionComputation(cadenceZoneTyped);

		let durationInSeconds = 0;
		const cadencesOnMoving: number[] = [];
		const cadencesDuration: number[] = [];

		const distancesPerOccurrenceOnMoving: number[] = []; // Can be: Each time a foot touch the ground while running OR Each crank revolution for Cycling
		const distancesPerOccurrenceDuration: number[] = [];

		for (let i = 0; i < cadenceArray.length; i++) {

			if (i > 0) {

				durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)

				// Recomputing crank revolutions using cadence data
				const occurrencesOnPeriod = this.discreteValueBetween(cadenceArray[i], cadenceArray[i - 1], durationInSeconds / 60 /* Minutes */);

				totalOccurrences += occurrencesOnPeriod;

				if ((this.isTrainer || !velocityArray || velocityArray[i] * 3.6 > ActivityComputer.MOVING_THRESHOLD_KPH) && i > 0) {

					movingSampleCount++;

					// Rider is moving here..
					if (cadenceArray[i] > ActivityComputer.CADENCE_THRESHOLD_RPM) {

						// Rider is moving here while cadence
						cadenceOnMoveSampleCount++;

						// cadence averaging over time
						cadenceSumOnMoving += this.discreteValueBetween(cadenceArray[i], cadenceArray[i - 1], durationInSeconds);
						cadenceSumDurationOnMoving += durationInSeconds;
						cadenceVarianceSumOnMoving += Math.pow(cadenceArray[i], 2);
						cadencesOnMoving.push(cadenceArray[i]);
						cadencesDuration.push(durationInSeconds);

						// Compute distance traveled foreach "hit":
						// - Running: Each time a foot touch the ground
						// - Cycling: Each crank revolution for Cycling
						if (hasDistanceData && (this.activityType === "Ride" || this.activityType === "Run")) {

							const metersTravelled = (distanceArray[i] - distanceArray[i - 1]);

							let occurrenceDistance: number = null;

							if (this.activityType === "Ride") {
								occurrenceDistance = metersTravelled / occurrencesOnPeriod; // Aka Crank revolutions on delta time
							}

							if (this.activityType === "Run") {
								occurrenceDistance = metersTravelled / (occurrencesOnPeriod * 2); // Aka strides with 2 legs representation on delta time
							}

							if (!_.isNull(occurrenceDistance)) {
								distancesPerOccurrenceOnMoving.push(occurrenceDistance);
								distancesPerOccurrenceDuration.push(durationInSeconds);
							}
						}
					}

					const cadenceZoneId: number = this.getZoneId(cadenceZoneTyped, cadenceArray[i]);

					if (!_.isUndefined(cadenceZoneId) && !_.isUndefined(cadenceZones[cadenceZoneId])) {
						cadenceZones[cadenceZoneId].s += durationInSeconds;
					}
				}
			}
		}

		const cadenceRatioOnMovingTime: number = cadenceOnMoveSampleCount / movingSampleCount;
		const averageCadenceOnMovingTime: number = cadenceSumOnMoving / cadenceSumDurationOnMoving;

		const varianceCadence: number = (cadenceVarianceSumOnMoving / cadenceOnMoveSampleCount) - Math.pow(averageCadenceOnMovingTime, 2);
		const standardDeviationCadence: number = (varianceCadence > 0) ? Math.sqrt(varianceCadence) : 0;

		// Update zone distribution percentage
		cadenceZones = this.finalizeDistributionComputationZones(cadenceZones);

		const cadencesPercentiles: number[] = Helper.weightedPercentiles(cadencesOnMoving, cadencesDuration, [0.25, 0.5, 0.75]);

		const distancesPerOccurrencePercentiles: number[] = Helper.weightedPercentiles(distancesPerOccurrenceOnMoving, distancesPerOccurrenceDuration, [0.25, 0.5, 0.75]);

		const cadenceData: CadenceDataModel = {
			cadencePercentageMoving: cadenceRatioOnMovingTime * 100,
			cadenceTimeMoving: cadenceSumDurationOnMoving,
			averageCadenceMoving: averageCadenceOnMovingTime,
			standardDeviationCadence: parseFloat(standardDeviationCadence.toFixed(1)),
			totalOccurrences: totalOccurrences,
			lowerQuartileCadence: cadencesPercentiles[0],
			medianCadence: cadencesPercentiles[1],
			upperQuartileCadence: cadencesPercentiles[2],
			averageDistancePerOccurrence: _.mean(distancesPerOccurrenceOnMoving),
			lowerQuartileDistancePerOccurrence: distancesPerOccurrencePercentiles[0],
			medianDistancePerOccurrence: distancesPerOccurrencePercentiles[1],
			upperQuartileDistancePerOccurrence: distancesPerOccurrencePercentiles[2],
			cadenceZones: (this.returnZones) ? cadenceZones : null,
		};

		return cadenceData;
	}

	protected gradeData(gradeArray: number[], velocityArray: number[], timeArray: number[], distanceArray: number[], cadenceArray: number[]): GradeDataModel {

		if (_.isEmpty(gradeArray) || _.isEmpty(velocityArray) || _.isEmpty(timeArray) || _.mean(velocityArray) === 0) {
			return null;
		}

		if (this.isTrainer) {
			return;
		}

		let gradeSum = 0,
			gradeCount = 0;

		let gradeZones: ZoneModel[] = this.prepareZonesForDistributionComputation(this.userSettings.zones.get(UserZonesModel.TYPE_GRADE));
		const upFlatDownInSeconds: UpFlatDownSumTotalModel = {
			up: 0,
			flat: 0,
			down: 0,
			total: 0
		};

		// Currently deals with avg speed/pace
		const upFlatDownMoveData: UpFlatDownModel = {
			up: 0,
			flat: 0,
			down: 0
		};

		const upFlatDownDistanceData: UpFlatDownModel = {
			up: 0,
			flat: 0,
			down: 0
		};

		const upFlatDownCadenceData: UpFlatDownSumCounterModel = {
			up: 0,
			flat: 0,
			down: 0,
			countUp: 0,
			countFlat: 0,
			countDown: 0
		};

		let durationInSeconds: number, durationCount = 0;
		let distance = 0;
		let currentSpeed: number;
		let avgMinGrade = 0;
		let avgMaxGrade = 0;

		const gradeArrayMoving: any[] = [];
		const gradeArrayDistance: any[] = [];

		const hasCadenceData: boolean = !_.isEmpty(cadenceArray);

		for (let i = 0; i < gradeArray.length; i++) { // Loop on samples

			if (i > 0) {

				currentSpeed = velocityArray[i] * 3.6; // Multiply by 3.6 to convert to kph;
				// Compute distribution for graph/table
				if (currentSpeed > 0) { // If moving...
					durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)
					distance = distanceArray[i] - distanceArray[i - 1];

					// elevation gain
					gradeSum += this.discreteValueBetween(gradeArray[i], gradeArray[i - 1], distance);
					// distance
					gradeCount += distance;

					gradeArrayMoving.push(gradeArray[i]);
					gradeArrayDistance.push(distance);

					const gradeZoneId: number = this.getZoneId(this.userSettings.zones.get(UserZonesModel.TYPE_GRADE), gradeArray[i]);

					if (!_.isUndefined(gradeZoneId) && !_.isUndefined(gradeZones[gradeZoneId])) {
						gradeZones[gradeZoneId].s += durationInSeconds;
					}

					durationCount += durationInSeconds;

					// Compute DOWN/FLAT/UP duration
					if (gradeArray[i] > ActivityComputer.GRADE_CLIMBING_LIMIT) { // UPHILL
						// time
						upFlatDownInSeconds.up += durationInSeconds;
						// distance
						upFlatDownDistanceData.up += distance;

						// If cadence sensor exists, then try add up cadence data (not null) while climbing
						if (hasCadenceData && cadenceArray[i] > ActivityComputer.CADENCE_THRESHOLD_RPM) {
							upFlatDownCadenceData.up += cadenceArray[i];
							upFlatDownCadenceData.countUp++; // Increment added cadence count
						}

					} else if (gradeArray[i] < ActivityComputer.GRADE_DOWNHILL_LIMIT) { // DOWNHILL
						// time
						upFlatDownInSeconds.down += durationInSeconds;
						// distance
						upFlatDownDistanceData.down += distance;

						// If cadence sensor exists, then try add up cadence data (not null) while downhill
						if (hasCadenceData && cadenceArray[i] > ActivityComputer.CADENCE_THRESHOLD_RPM) {
							upFlatDownCadenceData.down += cadenceArray[i];
							upFlatDownCadenceData.countDown++; // Increment added cadence count
						}

					} else { // FLAT

						// time
						upFlatDownInSeconds.flat += durationInSeconds;
						// distance
						upFlatDownDistanceData.flat += distance;

						// If cadence sensor exists, then try add up cadence data (not null) while on flat
						if (hasCadenceData && cadenceArray[i] > ActivityComputer.CADENCE_THRESHOLD_RPM) {
							upFlatDownCadenceData.flat += cadenceArray[i];
							upFlatDownCadenceData.countFlat++; // Increment added cadence count
						}
					}
				}
			}
		}

		upFlatDownInSeconds.total = durationCount;

		// Compute grade profile
		let gradeProfile: string;
		if ((upFlatDownInSeconds.flat / upFlatDownInSeconds.total * 100) >= ActivityComputer.GRADE_PROFILE_FLAT_PERCENTAGE_DETECTED) {
			gradeProfile = ActivityComputer.GRADE_PROFILE_FLAT;
		} else {
			gradeProfile = ActivityComputer.GRADE_PROFILE_HILLY;
		}

		// Compute speed while up, flat down
		upFlatDownMoveData.up = upFlatDownDistanceData.up / upFlatDownInSeconds.up * 3.6;
		upFlatDownMoveData.down = upFlatDownDistanceData.down / upFlatDownInSeconds.down * 3.6;
		upFlatDownMoveData.flat = upFlatDownDistanceData.flat / upFlatDownInSeconds.flat * 3.6;

		// Convert distance to KM
		upFlatDownDistanceData.up = upFlatDownDistanceData.up / 1000;
		upFlatDownDistanceData.down = upFlatDownDistanceData.down / 1000;
		upFlatDownDistanceData.flat = upFlatDownDistanceData.flat / 1000;

		// Compute cadence pace up/down/flat
		upFlatDownCadenceData.up = upFlatDownCadenceData.up / upFlatDownCadenceData.countUp;
		upFlatDownCadenceData.down = upFlatDownCadenceData.down / upFlatDownCadenceData.countDown;
		upFlatDownCadenceData.flat = upFlatDownCadenceData.flat / upFlatDownCadenceData.countFlat;

		// Update zone distribution percentage
		gradeZones = this.finalizeDistributionComputationZones(gradeZones);
		const percentiles: number[] = Helper.weightedPercentiles(gradeArrayMoving, gradeArrayDistance, [0.25, 0.5, 0.75]);

		const avgGrade: number = gradeSum / gradeCount;
		// Find min and max grade
		const sortedGradeArray = _.sortBy(gradeArray, (grade: number) => {
			return grade;
		});
		const minMaxGradeSamplePercentage = 0.25; // %
		const gradeSamplesReadCount = Math.floor(sortedGradeArray.length * minMaxGradeSamplePercentage / 100);
		avgMinGrade = (gradeSamplesReadCount >= 1) ? _.mean(_.slice(sortedGradeArray, 0, gradeSamplesReadCount)) : _.first(sortedGradeArray);
		avgMaxGrade = (gradeSamplesReadCount >= 1) ? _.mean(_.slice(sortedGradeArray, -1 * gradeSamplesReadCount)) : _.last(sortedGradeArray);

		const gradeData: GradeDataModel = {
			avgGrade: avgGrade,
			avgMaxGrade: avgMaxGrade,
			avgMinGrade: avgMinGrade,
			lowerQuartileGrade: percentiles[0],
			medianGrade: percentiles[1],
			upperQuartileGrade: percentiles[2],
			gradeZones: (this.returnZones) ? gradeZones : null,
			upFlatDownInSeconds,
			upFlatDownMoveData,
			upFlatDownDistanceData,
			upFlatDownCadencePaceData: (hasCadenceData) ? {
				up: upFlatDownCadenceData.up,
				flat: upFlatDownCadenceData.flat,
				down: upFlatDownCadenceData.down
			} : null,
			gradeProfile,
		};

		return gradeData;
	}

	protected elevationData(activityStream: ActivityStreamsModel): ElevationDataModel {

		if (_.isEmpty(activityStream)) {
			return null;
		}

		const distanceArray: any = activityStream.distance;
		const timeArray: any = activityStream.time;
		const velocityArray: any = activityStream.velocity_smooth;
		const altitudeArray: any = activityStream.altitude_smooth;

		if (_.isEmpty(distanceArray) || _.isEmpty(timeArray) || _.isEmpty(velocityArray) || _.isEmpty(altitudeArray) || _.mean(distanceArray) === 0 || _.mean(velocityArray) === 0) {
			return null;
		}

		const skipAscentSpeedCompute: boolean = !_.isEmpty(this.bounds);

		let accumulatedElevation = 0;
		let accumulatedElevationAscent = 0;
		let accumulatedElevationDescent = 0;
		let accumulatedDistance = 0;

		// specials arrays for ascent speeds
		const ascentSpeedMeterPerHourSamples: number[] = [];
		const ascentSpeedMeterPerHourDistance: number[] = [];
		let ascentSpeedMeterPerHourSum = 0;

		let elevationSampleCount = 0;
		const elevationSamples: number[] = [];
		const elevationSamplesDistance: number[] = [];
		let elevationZones: any = this.prepareZonesForDistributionComputation(this.userSettings.zones.get(UserZonesModel.TYPE_ELEVATION));
		let ascentSpeedZones: any = this.prepareZonesForDistributionComputation(this.userSettings.zones.get(UserZonesModel.TYPE_ASCENT));
		let durationInSeconds = 0;
		let distance = 0;
		let ascentDurationInSeconds = 0;

		for (let i = 0; i < altitudeArray.length; i++) { // Loop on samples

			// Compute distribution for graph/table
			if (i > 0 && velocityArray[i] * 3.6 > ActivityComputer.MOVING_THRESHOLD_KPH) {

				durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)
				distance = distanceArray[i] - distanceArray[i - 1];

				// Compute average and normalized

				// average elevation over distance
				accumulatedElevation += this.discreteValueBetween(altitudeArray[i], altitudeArray[i - 1], distance);
				elevationSampleCount += distance;
				elevationSamples.push(altitudeArray[i]);
				elevationSamplesDistance.push(distance);

				const elevationZoneId: number = this.getZoneId(this.userSettings.zones.get(UserZonesModel.TYPE_ELEVATION), altitudeArray[i]);

				if (!_.isUndefined(elevationZoneId) && !_.isUndefined(elevationZones[elevationZoneId])) {
					elevationZones[elevationZoneId].s += durationInSeconds;
				}

				// Meters climbed between current and previous
				const elevationDiff: number = altitudeArray[i] - altitudeArray[i - 1];

				// If previous altitude lower than current then => climbing
				if (elevationDiff > 0) {

					accumulatedElevationAscent += elevationDiff;
					ascentDurationInSeconds = timeArray[i] - timeArray[i - 1];

					const ascentSpeedMeterPerHour: number = elevationDiff / ascentDurationInSeconds * 3600; // m climbed / seconds

					// Only if grade is > "ascentSpeedGradeLimit"
					if (distance > 0 && (elevationDiff / distance * 100) > ActivityComputer.ASCENT_SPEED_GRADE_LIMIT) {
						accumulatedDistance += distanceArray[i] - distanceArray[i - 1];
						ascentSpeedMeterPerHourSamples.push(ascentSpeedMeterPerHour);
						ascentSpeedMeterPerHourDistance.push(accumulatedDistance);
						ascentSpeedMeterPerHourSum += ascentSpeedMeterPerHour;

						const ascentSpeedZoneId: number = this.getZoneId(this.userSettings.zones.get(UserZonesModel.TYPE_ASCENT), ascentSpeedMeterPerHour);
						if (!_.isUndefined(ascentSpeedZoneId) && !_.isUndefined(ascentSpeedZones[ascentSpeedZoneId])) {
							ascentSpeedZones[ascentSpeedZoneId].s += ascentDurationInSeconds;
						}
					}

				} else {
					accumulatedElevationDescent -= elevationDiff;
				}

			}
		}

		// Finalize compute of Elevation
		const avgElevation: number = accumulatedElevation / elevationSampleCount;

		const avgAscentSpeed: number = ascentSpeedMeterPerHourSum / ascentSpeedMeterPerHourSamples.length;

		// Update zone distribution percentage
		elevationZones = this.finalizeDistributionComputationZones(elevationZones);
		ascentSpeedZones = this.finalizeDistributionComputationZones(ascentSpeedZones);

		const percentilesElevation: number[] = Helper.weightedPercentiles(elevationSamples, elevationSamplesDistance, [0.25, 0.5, 0.75]);
		const percentilesAscent: number[] = Helper.weightedPercentiles(ascentSpeedMeterPerHourSamples, ascentSpeedMeterPerHourDistance, [0.25, 0.5, 0.75]);

		const ascentSpeedData: AscentSpeedDataModel = {
			avg: _.isFinite(avgAscentSpeed) ? avgAscentSpeed : -1,
			lowerQuartile: parseFloat(percentilesAscent[0].toFixed(0)),
			median: parseFloat(percentilesAscent[1].toFixed(0)),
			upperQuartile: parseFloat(percentilesAscent[2].toFixed(0)),
		};

		let elevationData: ElevationDataModel = {
			avgElevation: parseFloat(avgElevation.toFixed(0)),
			accumulatedElevationAscent,
			accumulatedElevationDescent,
			lowerQuartileElevation: parseFloat(percentilesElevation[0].toFixed(0)),
			medianElevation: parseFloat(percentilesElevation[1].toFixed(0)),
			upperQuartileElevation: parseFloat(percentilesElevation[2].toFixed(0)),
			elevationZones: (this.returnZones) ? elevationZones : null, // Only while moving
			ascentSpeedZones: (this.returnZones) ? ascentSpeedZones : null, // Only while moving
			ascentSpeed: ascentSpeedData,
		};

		if (skipAscentSpeedCompute) {
			elevationData = <ElevationDataModel> _.omit(elevationData, "ascentSpeedZones");
			elevationData = <ElevationDataModel> _.omit(elevationData, "ascentSpeed");
		}

		return elevationData;
	}

	protected smoothAltitude(activityStream: ActivityStreamsModel, stravaElevation: number): number[] {

		if (_.isEmpty(activityStream) || _.isEmpty(activityStream.altitude)) {
			return null;
		}

		const activityAltitudeArray: number[] = activityStream.altitude;
		const distanceArray: number[] = activityStream.distance;
		//  let timeArray = activityStream.time;  // for smoothing by time
		const velocityArray: number[] = activityStream.velocity_smooth;
		let smoothingL = 10;
		let smoothingH = 600;
		let smoothing: number;
		let altitudeArray: number[] = [];
		while (smoothingH - smoothingL >= 1) {
			smoothing = smoothingL + (smoothingH - smoothingL) / 2;
			altitudeArray = this.lowPassDataSmoothing(activityAltitudeArray, distanceArray, smoothing); // smoothing by distance
			// altitudeArray = this.lowPassDataSmoothing(activityAltitudeArray, timeArray, smoothing);  // smoothing by time
			let totalElevation = 0;
			for (let i = 0; i < altitudeArray.length; i++) { // Loop on samples
				if (i > 0 && velocityArray[i] * 3.6 > ActivityComputer.MOVING_THRESHOLD_KPH) {
					const elevationDiff: number = altitudeArray[i] - altitudeArray[i - 1];
					if (elevationDiff > 0) {
						totalElevation += elevationDiff;
					}
				}
			}

			if (totalElevation < stravaElevation) {
				smoothingH = smoothing;
			} else {
				smoothingL = smoothing;
			}
		}
		return altitudeArray;
	}

	protected lowPassDataSmoothing(data: number[], distance: number[], smoothing: number): number[] {
		// Below algorithm is applied in this method
		// http://phrogz.net/js/framerate-independent-low-pass-filter.html
		// value += (currentValue - value) / (smoothing / timeSinceLastSample);
		// it is adapted for stability - if (smoothing / timeSinceLastSample) is less then 1, set it to 1 -> no smoothing for that sample
		let smooth_factor = 0;
		const result: number[] = [];
		if (data && distance) {
			result[0] = data[0];
			for (let i = 1, max = data.length; i < max; i++) {
				if (smoothing === 0) {
					result[i] = data[i];
				} else {
					smooth_factor = smoothing / (distance[i] - distance[i - 1]);
					// only apply filter if smooth_factor > 1, else this leads to instability !!!
					result[i] = result[i - 1] + (data[i] - result[i - 1]) / (smooth_factor > 1 ? smooth_factor : 1); // low limit smooth_factor to 1!!!
					// result[i] = result[i - 1] + (data[i] - result[i - 1]) / ( smooth_factor ); // no stability check
				}
			}
		}
		return result;
	}

}

