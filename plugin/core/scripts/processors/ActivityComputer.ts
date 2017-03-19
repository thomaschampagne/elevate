class ActivityComputer {

    public static MOVING_THRESHOLD_KPH: number = 0.1; // Kph
    public static CADENCE_THRESHOLD_RPM: number = 35; // RPMs
    public static GRADE_CLIMBING_LIMIT: number = 1.6;
    public static GRADE_DOWNHILL_LIMIT: number = -1.6;
    public static GRADE_PROFILE_FLAT_PERCENTAGE_DETECTED: number = 60;
    public static GRADE_PROFILE_FLAT: string = 'FLAT';
    public static GRADE_PROFILE_HILLY: string = 'HILLY';
    public static ASCENT_SPEED_GRADE_LIMIT: number = ActivityComputer.GRADE_CLIMBING_LIMIT;
    public static AVG_POWER_TIME_WINDOW_SIZE: number = 30; // Seconds

    protected activityType: string;
    protected isTrainer: boolean;
    protected userSettings: IUserSettings;
    protected movementData: IMoveData;
    protected athleteWeight: number;
    protected hasPowerMeter: boolean;
    protected activityStatsMap: IActivityStatsMap;
    protected activityStream: IActivityStream;
    protected bounds: Array<number>;
    protected returnZones: boolean;

    constructor(activityType: string, isTrainer: boolean, userSettings: IUserSettings, athleteWeight: number,
                hasPowerMeter: boolean,
                activityStatsMap: IActivityStatsMap,
                activityStream: IActivityStream,
                bounds: Array<number>, returnZones: boolean) {

        // Store activityType, isTrainer, input activity params and userSettings
        this.activityType = activityType;
        this.isTrainer = isTrainer;
        this.userSettings = userSettings;
        this.athleteWeight = athleteWeight;
        this.hasPowerMeter = hasPowerMeter;
        this.activityStatsMap = activityStatsMap;
        this.activityStream = activityStream;
        this.bounds = bounds;
        this.returnZones = returnZones;
    }

    public compute(): IAnalysisData {

        if (!this.activityStream) {
            return null;
        }

        // Append altitude_smooth to fetched strava activity stream before compute analysis data
        this.activityStream.altitude_smooth = this.smoothAltitudeStream(this.activityStream, this.activityStatsMap);

        // Slices array stream if activity bounds are given.
        // It's mainly used for segment effort extended stats
        this.sliceStreamFromBounds(this.activityStream, this.bounds);

        return this.computeAnalysisData(this.userSettings.userGender, this.userSettings.userRestHr, this.userSettings.userMaxHr, this.userSettings.userFTP, this.athleteWeight, this.hasPowerMeter, this.activityStatsMap, this.activityStream);
    }

    protected sliceStreamFromBounds(activityStream: IActivityStream, bounds: Array<number>): void {

        // Slices array if activity bounds given. It's mainly used for segment effort extended stats
        if (bounds && bounds[0] && bounds[1]) {

            if (!_.isEmpty(activityStream.velocity_smooth)) {
                activityStream.velocity_smooth = activityStream.velocity_smooth.slice(bounds[0], bounds[1]);
            }
            if (!_.isEmpty(activityStream.time)) {
                activityStream.time = activityStream.time.slice(bounds[0], bounds[1]);
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
        }
    }

    protected smoothAltitudeStream(activityStream: IActivityStream, activityStatsMap: IActivityStatsMap): any {
        return this.smoothAltitude(activityStream, activityStatsMap.elevation);
    }

    protected computeAnalysisData(userGender: string, userRestHr: number, userMaxHr: number, userFTP: number, athleteWeight: number, hasPowerMeter: boolean, activityStatsMap: IActivityStatsMap, activityStream: IActivityStream): IAnalysisData {

        // Include speed and pace
        this.movementData = null;

        if (activityStream.velocity_smooth) {
            this.movementData = this.moveData(activityStream.velocity_smooth, activityStream.time);
        }

        // Q1 Speed
        // Median Speed
        // Q3 Speed
        // Standard deviation Speed
        let speedData: ISpeedData = (_.isEmpty(this.movementData)) ? null : this.movementData.speed;

        // Q1 Pace
        // Median Pace
        // Q3 Pace
        // Standard deviation Pace
        let paceData: IPaceData = (_.isEmpty(this.movementData)) ? null : this.movementData.pace;

        let moveRatio: number = (_.isEmpty(this.movementData)) ? null : this.moveRatio(this.movementData.movingTime, this.movementData.elapsedTime);

        // Toughness score
        let toughnessScore: number = this.toughnessScore(activityStatsMap, moveRatio);

        // Estimated Normalized power
        // Estimated Variability index
        // Estimated Intensity factor
        // Normalized Watt per Kg
        let powerData: IPowerData = this.powerData(athleteWeight, hasPowerMeter, userFTP, activityStream.watts, activityStream.velocity_smooth, activityStream.time);

        // TRaining IMPulse
        // %HRR Avg
        // %HRR Zones
        // Q1 HR
        // Median HR
        // Q3 HR
        let heartRateData: IHeartRateData = this.heartRateData(userGender, userRestHr, userMaxHr, activityStream.heartrate, activityStream.time, activityStream.velocity_smooth);

        // Cadence percentage
        // Time Cadence
        // Crank revolution
        let cadenceData: ICadenceData = this.cadenceData(activityStream.cadence, activityStream.velocity_smooth, activityStream.time);


        // Avg grade
        // Q1/Q2/Q3 grade
        let gradeData: IGradeData = this.gradeData(activityStream.grade_smooth, activityStream.velocity_smooth, activityStream.time, activityStream.distance);

        // Avg grade
        // Q1/Q2/Q3 elevation
        let elevationData: IElevationData = this.elevationData(activityStream);

        // Return an array with all that shit...

        let analysisData: IAnalysisData = {
            moveRatio: moveRatio,
            toughnessScore: toughnessScore,
            speedData: speedData,
            paceData: paceData,
            powerData: powerData,
            heartRateData: heartRateData,
            cadenceData: cadenceData,
            gradeData: gradeData,
            elevationData: elevationData
        };

        return analysisData;
    }

    protected moveRatio(movingTime: number, elapsedTime: number): number {

        if (_.isNull(movingTime) || _.isNull(elapsedTime)) {
            return null;
        }

        let ratio: number = movingTime / elapsedTime;

        if (_.isNaN(ratio)) {
            return null;
        }

        return ratio;
    }

    protected toughnessScore(activityStatsMap: IActivityStatsMap, moveRatio: number): number {

        if (_.isNull(activityStatsMap.elevation) || _.isNull(activityStatsMap.avgPower) || _.isNull(activityStatsMap.averageSpeed) || _.isNull(activityStatsMap.distance)) {
            return null;
        }

        return Math.sqrt(
                Math.sqrt(
                    Math.pow(activityStatsMap.elevation, 2) *
                    activityStatsMap.avgPower *
                    Math.pow(activityStatsMap.averageSpeed, 2) *
                    Math.pow(activityStatsMap.distance, 2) *
                    moveRatio
                )
            ) / 20;
    }

    //noinspection JSUnusedGlobalSymbols
    protected getZoneFromDistributionStep(value: number, distributionStep: number, minValue: number): number {
        return ((value - minValue) / distributionStep);
    }

    protected  getZoneId(zones: Array<IZone>, value: number): number {
        for (let zoneId: number = 0; zoneId < zones.length; zoneId++) {
            if (value <= zones[zoneId].to) {
                return zoneId;
            }
        }
    }

    protected prepareZonesForDistributionComputation(sourceZones: Array<IZone>): Array<IZone> {
        let preparedZones: Array<IZone> = [];
        _.each(sourceZones, (zone: IZone) => {
            zone.s = 0;
            zone.percentDistrib = null;
            preparedZones.push(zone);
        });
        return preparedZones;
    }

    protected finalizeDistributionComputationHrrZones(zones: Array<IHrrZone>): Array<IHrrZone> {

        let total: number = 0;
        let zone: IHrrZone;
        for (let i: number = 0; i < zones.length; i++) {
            zone = zones[i];
            if (zone.s) {
                total += zone.s;
            }
            zone.percentDistrib = 0;
        }

        if (total > 0) {
            for (let i: number = 0; i < zones.length; i++) {
                zone = zones[i];
                if (zone.s) {
                    zone.percentDistrib = zone.s / total * 100;
                }
            }
        }
        return zones;
    }

    protected finalizeDistributionComputationZones(zones: Array<IZone>): Array<IZone> {
        let total: number = 0;
        let zone: IZone;

        for (let i: number = 0; i < zones.length; i++) {
            zone = zones[i];
            if (zone.s) {
                total += zone.s;
            }
            zone.percentDistrib = 0;
        }

        if (total > 0) {
            for (let i: number = 0; i < zones.length; i++) {
                zone = zones[i];
                if (zone.s) {
                    zone.percentDistrib = zone.s / total * 100;
                }
            }
        }
        return zones;
    }

    protected valueForSum(currentValue: number, previousValue: number, delta: number): number {
        // discrete integral
        return currentValue * delta - ((currentValue - previousValue) * delta) / 2;
    }

    protected moveData(velocityArray: Array<number>, timeArray: Array<number>): IMoveData {

        if (_.isEmpty(velocityArray) || _.isEmpty(timeArray)) {
            return null;
        }

        let genuineAvgSpeedSum: number = 0,
            genuineAvgSpeedSumCount: number = 0;
        let speedsNonZero: Array<number> = [];
        let speedsNonZeroDuration: Array<number> = [];
        let speedVarianceSum: number = 0;
        let currentSpeed: number;

        let speedZones: any = this.prepareZonesForDistributionComputation(this.userSettings.zones.speed);
        let paceZones: any = this.prepareZonesForDistributionComputation(this.userSettings.zones.pace);

        let movingSeconds: number = 0;
        let elapsedSeconds: number = 0;

        // End Preparing zone
        for (let i: number = 0; i < velocityArray.length; i++) { // Loop on samples

            // Compute distribution for graph/table
            if (i > 0) {

                elapsedSeconds += (timeArray[i] - timeArray[i - 1]);

                // Compute speed
                currentSpeed = velocityArray[i] * 3.6; // Multiply by 3.6 to convert to kph;

                if (currentSpeed > 0) { // If moving...

                    movingSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)

                    speedsNonZero.push(currentSpeed);
                    speedsNonZeroDuration.push(movingSeconds);

                    // Compute variance speed
                    speedVarianceSum += Math.pow(currentSpeed, 2);

                    // distance
                    genuineAvgSpeedSum += this.valueForSum(velocityArray[i] * 3.6, velocityArray[i - 1] * 3.6, movingSeconds);
                    // time
                    genuineAvgSpeedSumCount += movingSeconds;

                    // Find speed zone id
                    let speedZoneId: number = this.getZoneId(this.userSettings.zones.speed, currentSpeed);
                    if (!_.isUndefined(speedZoneId) && !_.isUndefined(speedZones[speedZoneId])) {
                        speedZones[speedZoneId].s += movingSeconds;
                    }

                    // Find pace zone
                    let pace: number = this.convertSpeedToPace(currentSpeed);

                    let paceZoneId: number = this.getZoneId(this.userSettings.zones.pace, (pace === -1) ? 0 : pace);
                    if (!_.isUndefined(paceZoneId) && !_.isUndefined(paceZones[paceZoneId])) {
                        paceZones[paceZoneId].s += movingSeconds;
                    }

                }
            }
        }

        // Update zone distribution percentage
        speedZones = this.finalizeDistributionComputationZones(speedZones);
        paceZones = this.finalizeDistributionComputationZones(paceZones);

        // Finalize compute of Speed
        let genuineAvgSpeed: number = genuineAvgSpeedSum / genuineAvgSpeedSumCount;
        let varianceSpeed: number = (speedVarianceSum / speedsNonZero.length) - Math.pow(genuineAvgSpeed, 2);
        let standardDeviationSpeed: number = (varianceSpeed > 0) ? Math.sqrt(varianceSpeed) : 0;
        let percentiles: Array<number> = Helper.weightedPercentiles(speedsNonZero, speedsNonZeroDuration, [0.25, 0.5, 0.75]);


        let speedData: ISpeedData = {
            genuineAvgSpeed: genuineAvgSpeed,
            totalAvgSpeed: genuineAvgSpeed * this.moveRatio(genuineAvgSpeedSumCount, elapsedSeconds),
            avgPace: parseInt(((1 / genuineAvgSpeed) * 60 * 60).toFixed(0)), // send in seconds
            lowerQuartileSpeed: percentiles[0],
            medianSpeed: percentiles[1],
            upperQuartileSpeed: percentiles[2],
            varianceSpeed: varianceSpeed,
            standardDeviationSpeed: standardDeviationSpeed,
            speedZones: (this.returnZones) ? speedZones : null
        };

        let paceData: IPaceData = {
            avgPace: parseInt(((1 / genuineAvgSpeed) * 60 * 60).toFixed(0)), // send in seconds
            lowerQuartilePace: this.convertSpeedToPace(percentiles[0]),
            medianPace: this.convertSpeedToPace(percentiles[1]),
            upperQuartilePace: this.convertSpeedToPace(percentiles[2]),
            variancePace: this.convertSpeedToPace(varianceSpeed),
            paceZones: (this.returnZones) ? paceZones : null
        };

        let moveData: IMoveData = {
            movingTime: genuineAvgSpeedSumCount,
            elapsedTime: elapsedSeconds,
            speed: speedData,
            pace: paceData
        };

        return moveData;
    }

    /**
     * @param speed in kph
     * @return pace in seconds/km, if NaN/Infinite then return -1
     */
    protected convertSpeedToPace(speed: number): number {
        if (_.isNaN(speed)) {
            return -1;
        }
        return (speed === 0) ? -1 : 1 / speed * 60 * 60;
    }

    /**
     * Andrew Coggan weighted power compute method (source: http://forum.slowtwitch.com/Slowtwitch_Forums_C1/Triathlon_Forum_F1/Normalized_Power_Formula_or_Calculator..._P3097774/)
     * 1) starting at the 30s mark, calculate a rolling 30 s average (of the preceeding time points, obviously).
     * 2) raise all the values obtained in step #1 to the 4th power.
     * 3) take the average of all of the values obtained in step #2.
     * 4) take the 4th root of the value obtained in step #3.
     * (And when you get tired of exporting every file to, e.g., Excel to perform such calculations, help develop a program like WKO+ to do the work for you <g>.)
     */
    protected powerData(athleteWeight: number, hasPowerMeter: boolean, userFTP: number, powerArray: Array<number>, velocityArray: Array<number>, timeArray: Array<number>): IPowerData {

        if (_.isEmpty(powerArray) || _.isEmpty(timeArray)) {
            return null;
        }

        let powerZonesAlongActivityType: Array<IZone>;
        if (this.activityType === 'Ride') {
            powerZonesAlongActivityType = this.userSettings.zones.power;
        } else if (this.activityType === 'Run') {
            powerZonesAlongActivityType = this.userSettings.zones.runningPower;
        } else {
            powerZonesAlongActivityType = null;
        }

        powerZonesAlongActivityType = this.prepareZonesForDistributionComputation(powerZonesAlongActivityType);

        let accumulatedWattsOnMove: number = 0;
        let wattSampleOnMoveCount: number = 0;
        let wattsSamplesOnMove: Array<number> = [];
        let wattsSamplesOnMoveDuration: Array<number> = [];

        let durationInSeconds: number;
        let totalMovingInSeconds: number = 0;

        let timeWindowValue: number = 0;
        let sumPowerTimeWindow: Array<number> = [];
        let sum4thPower: Array<number> = [];

        for (let i: number = 0; i < powerArray.length; i++) { // Loop on samples

            if ((this.isTrainer || !velocityArray || velocityArray[i] * 3.6 > ActivityComputer.MOVING_THRESHOLD_KPH) && i > 0) {

                // Compute distribution for graph/table
                durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)
                totalMovingInSeconds += durationInSeconds;

                timeWindowValue += durationInSeconds; // Add seconds to time buffer
                sumPowerTimeWindow.push(powerArray[i]); // Add power value

                if (timeWindowValue >= ActivityComputer.AVG_POWER_TIME_WINDOW_SIZE) {

                    // Get average of power during these 30 seconds windows & power 4th
                    sum4thPower.push(Math.pow(_.reduce(sumPowerTimeWindow, function (a, b) { // The reduce function and implementation return the sum of array
                            return (<number> a) + (<number> b);
                        }, 0) / sumPowerTimeWindow.length, 4));

                    timeWindowValue = 0; // Reset time window
                    sumPowerTimeWindow = []; // Reset sum of power window
                }

                wattsSamplesOnMove.push(powerArray[i]);
                wattsSamplesOnMoveDuration.push(durationInSeconds);

                // average over time
                accumulatedWattsOnMove += this.valueForSum(powerArray[i], powerArray[i - 1], durationInSeconds);
                wattSampleOnMoveCount += durationInSeconds;

                let powerZoneId: number = this.getZoneId(powerZonesAlongActivityType, powerArray[i]);

                if (!_.isUndefined(powerZoneId) && !_.isUndefined(powerZonesAlongActivityType[powerZoneId])) {
                    powerZonesAlongActivityType[powerZoneId].s += durationInSeconds;
                }
            }
        }

        // Finalize compute of Power
        let avgWatts: number = accumulatedWattsOnMove / wattSampleOnMoveCount;

        let weightedPower: number = Math.sqrt(Math.sqrt(_.reduce(sum4thPower, function (a, b) { // The reduce function and implementation return the sum of array
                return (<number> a) + (<number> b);
            }, 0) / sum4thPower.length));

        /*
         // If user has a power meters we prefer use the value given by strava
         if (hasPowerMeter) {
         weightedPower = activityStatsMap.weightedPower;
         }*/

        let variabilityIndex: number = weightedPower / avgWatts;
        let punchFactor: number = (_.isNumber(userFTP) && userFTP > 0) ? (weightedPower / userFTP) : null;
        let weightedWattsPerKg: number = weightedPower / athleteWeight;
        let avgWattsPerKg: number = avgWatts / athleteWeight;
        let powerStressScore = (_.isNumber(userFTP) && userFTP > 0) ? ((totalMovingInSeconds * weightedPower * punchFactor) / (userFTP * 3600) * 100) : null; // TSS = (sec x NP x IF)/(FTP x 3600) x 100
        let powerStressScorePerHour: number = (powerStressScore) ? powerStressScore / totalMovingInSeconds * 60 * 60 : null;
        let percentiles: Array<number> = Helper.weightedPercentiles(wattsSamplesOnMove, wattsSamplesOnMoveDuration, [0.25, 0.5, 0.75]);

        // Update zone distribution percentage
        powerZonesAlongActivityType = this.finalizeDistributionComputationZones(powerZonesAlongActivityType);

        let powerData: IPowerData = {
            hasPowerMeter: hasPowerMeter,
            avgWatts: avgWatts,
            avgWattsPerKg: avgWattsPerKg,
            weightedPower: weightedPower,
            variabilityIndex: variabilityIndex,
            punchFactor: punchFactor,
            powerStressScore: powerStressScore,
            powerStressScorePerHour: powerStressScorePerHour,
            weightedWattsPerKg: weightedWattsPerKg,
            lowerQuartileWatts: percentiles[0],
            medianWatts: percentiles[1],
            upperQuartileWatts: percentiles[2],
            powerZones: (this.returnZones) ? powerZonesAlongActivityType : null// Only while moving
        };

        return powerData;
    }

    protected heartRateData(userGender: string, userRestHr: number, userMaxHr: number, heartRateArray: Array<number>, timeArray: Array<number>, velocityArray: Array<number>): IHeartRateData {

        if (_.isEmpty(heartRateArray) || _.isEmpty(timeArray)) {
            return null;
        }

        let trainingImpulse: number = 0;
        let TRIMPGenderFactor: number = (userGender == 'men') ? 1.92 : 1.67;
        let hrrSecondsCount: number = 0;
        let hrrZonesCount: number = Object.keys(this.userSettings.userHrrZones).length;
        let hr: number, heartRateReserveAvg: number, durationInSeconds: number, durationInMinutes: number, zoneId: number;
        let hrSum: number = 0;
        let heartRateArrayMoving: Array<any> = [];
        let heartRateArrayMovingDuration: Array<any> = [];

        // Find HR for each Hrr of each zones
        _.each(this.userSettings.userHrrZones, (zone: IHrrZone) => {
            zone.fromHr = Helper.heartrateFromHeartRateReserve(zone.fromHrr, userMaxHr, userRestHr);
            zone.toHr = Helper.heartrateFromHeartRateReserve(zone.toHrr, userMaxHr, userRestHr);
            zone.s = 0;
            zone.percentDistrib = null;
        });

        for (let i: number = 0; i < heartRateArray.length; i++) { // Loop on samples

            if (i > 0 && (
                    this.isTrainer || // can be cycling home trainer
                    !velocityArray || // OR Non movements activities
                    velocityArray[i] * 3.6 > ActivityComputer.MOVING_THRESHOLD_KPH  // OR Movement over MOVING_THRESHOLD_KPH for any kind of activities having movements data
                )) {

                // Compute heartrate data while moving from now
                durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)
                // average over time
                hrSum += this.valueForSum(heartRateArray[i], heartRateArray[i - 1], durationInSeconds);
                hrrSecondsCount += durationInSeconds;

                heartRateArrayMoving.push(heartRateArray[i]);
                heartRateArrayMovingDuration.push(durationInSeconds);

                // Compute trainingImpulse
                hr = (heartRateArray[i] + heartRateArray[i - 1]) / 2; // Getting HR avg between current sample and previous one.
                heartRateReserveAvg = Helper.heartRateReserveFromHeartrate(hr, userMaxHr, userRestHr); //(hr - userSettings.userRestHr) / (userSettings.userMaxHr - userSettings.userRestHr);
                durationInMinutes = durationInSeconds / 60;

                trainingImpulse += durationInMinutes * heartRateReserveAvg * 0.64 * Math.exp(TRIMPGenderFactor * heartRateReserveAvg);

                // Count Heart Rate Reserve distribution
                zoneId = this.getHrrZoneId(hrrZonesCount, heartRateReserveAvg * 100);

                if (!_.isUndefined(zoneId)) {
                    this.userSettings.userHrrZones[zoneId].s += durationInSeconds;
                }
            }
        }

        let heartRateArraySorted: Array<number> = heartRateArray.sort(function (a, b) {
            return a - b;
        });

        // Update zone distribution percentage
        this.userSettings.userHrrZones = this.finalizeDistributionComputationHrrZones(this.userSettings.userHrrZones);

        let averageHeartRate: number = hrSum / hrrSecondsCount;
        let maxHeartRate: number = heartRateArraySorted[heartRateArraySorted.length - 1];

        let TRIMPPerHour: number = trainingImpulse / hrrSecondsCount * 60 * 60;
        let percentiles: Array<number> = Helper.weightedPercentiles(heartRateArrayMoving, heartRateArrayMovingDuration, [0.25, 0.5, 0.75]);

        let heartRateData: IHeartRateData = {
            TRIMP: trainingImpulse,
            TRIMPPerHour: TRIMPPerHour,
            hrrZones: (this.returnZones) ? this.userSettings.userHrrZones : null,
            lowerQuartileHeartRate: percentiles[0],
            medianHeartRate: percentiles[1],
            upperQuartileHeartRate: percentiles[2],
            averageHeartRate: averageHeartRate,
            maxHeartRate: maxHeartRate,
            activityHeartRateReserve: Helper.heartRateReserveFromHeartrate(averageHeartRate, userMaxHr, userRestHr) * 100,
            activityHeartRateReserveMax: Helper.heartRateReserveFromHeartrate(maxHeartRate, userMaxHr, userRestHr) * 100
        };

        return heartRateData;
    }

    protected getHrrZoneId(hrrZonesCount: number, hrrValue: number): number {
        for (let zoneId: number = 0; zoneId < hrrZonesCount; zoneId++) {
            if (hrrValue <= this.userSettings.userHrrZones[zoneId].toHrr) {
                return zoneId;
            }
        }
    }

    protected cadenceData(cadenceArray: Array<any>, velocityArray: Array<any>, timeArray: Array<any>): ICadenceData {

        if (_.isEmpty(cadenceArray) || _.isEmpty(timeArray)) {
            return null;
        }

        // recomputing crank revolutions using cadence data
        let crankRevolutions: number = 0;
        // On Moving
        let cadenceSumOnMoving: number = 0;
        let cadenceSumDurationOnMoving: number = 0;
        let cadenceVarianceSumOnMoving: number = 0;
        let cadenceOnMoveSampleCount: number = 0;
        let movingSampleCount: number = 0;

        let cadenceZoneTyped: Array<IZone>;
        if (this.activityType === 'Ride') {
            cadenceZoneTyped = this.userSettings.zones.cyclingCadence;
        } else if (this.activityType === 'Run') {
            cadenceZoneTyped = this.userSettings.zones.runningCadence;
        } else {
            return null;
        }

        let cadenceZones: Array<IZone> = this.prepareZonesForDistributionComputation(cadenceZoneTyped);

        let durationInSeconds: number = 0;
        let cadenceArrayMoving: Array<any> = [];
        let cadenceArrayDuration: Array<any> = [];

        for (let i: number = 0; i < cadenceArray.length; i++) {

            if (i > 0) {
                durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)
                // recomputing crank revolutions using cadence data
                crankRevolutions += this.valueForSum(cadenceArray[i], cadenceArray[i - 1], durationInSeconds / 60);

                if ((this.isTrainer || !velocityArray || velocityArray[i] * 3.6 > ActivityComputer.MOVING_THRESHOLD_KPH) && i > 0) {

                    movingSampleCount++;

                    // Rider is moving here..
                    if (cadenceArray[i] > ActivityComputer.CADENCE_THRESHOLD_RPM) {
                        // Rider is moving here while cadence
                        cadenceOnMoveSampleCount++;
                        // cadence averaging over time
                        cadenceSumOnMoving += this.valueForSum(cadenceArray[i], cadenceArray[i - 1], durationInSeconds);
                        cadenceSumDurationOnMoving += durationInSeconds;
                        cadenceVarianceSumOnMoving += Math.pow(cadenceArray[i], 2);
                        cadenceArrayMoving.push(cadenceArray[i]);
                        cadenceArrayDuration.push(durationInSeconds);
                    }

                    let cadenceZoneId: number = this.getZoneId(cadenceZoneTyped, cadenceArray[i]);

                    if (!_.isUndefined(cadenceZoneId) && !_.isUndefined(cadenceZones[cadenceZoneId])) {
                        cadenceZones[cadenceZoneId].s += durationInSeconds;
                    }
                }
            }
        }

        let cadenceRatioOnMovingTime: number = cadenceOnMoveSampleCount / movingSampleCount;
        let averageCadenceOnMovingTime: number = cadenceSumOnMoving / cadenceSumDurationOnMoving;


        let varianceCadence: number = (cadenceVarianceSumOnMoving / cadenceOnMoveSampleCount) - Math.pow(averageCadenceOnMovingTime, 2);
        let standardDeviationCadence: number = (varianceCadence > 0) ? Math.sqrt(varianceCadence) : 0;

        // Update zone distribution percentage
        cadenceZones = this.finalizeDistributionComputationZones(cadenceZones);

        let percentiles: Array<number> = Helper.weightedPercentiles(cadenceArrayMoving, cadenceArrayDuration, [0.25, 0.5, 0.75]);

        let cadenceData: ICadenceData = {
            cadencePercentageMoving: cadenceRatioOnMovingTime * 100,
            cadenceTimeMoving: cadenceSumDurationOnMoving,
            averageCadenceMoving: averageCadenceOnMovingTime,
            standardDeviationCadence: parseFloat(standardDeviationCadence.toFixed(1)),
            crankRevolutions: crankRevolutions,
            lowerQuartileCadence: percentiles[0],
            medianCadence: percentiles[1],
            upperQuartileCadence: percentiles[2],
            cadenceZones: (this.returnZones) ? cadenceZones : null
        };

        return cadenceData;
    }

    protected gradeData(gradeArray: Array<number>, velocityArray: Array<number>, timeArray: Array<number>, distanceArray: Array<number>): IGradeData {

        if (_.isEmpty(gradeArray) || _.isEmpty(velocityArray) || _.isEmpty(timeArray)) {
            return null;
        }

        if (this.isTrainer) {
            return;
        }

        let gradeSum: number = 0,
            gradeCount: number = 0;

        let gradeZones: Array<IZone> = this.prepareZonesForDistributionComputation(this.userSettings.zones.grade);
        let upFlatDownInSeconds: any = {
            up: 0,
            flat: 0,
            down: 0,
            total: 0
        };

        // Currently deals with avg speed/pace
        let upFlatDownMoveData: any = {
            up: 0,
            flat: 0,
            down: 0
        };

        let upFlatDownDistanceData: any = {
            up: 0,
            flat: 0,
            down: 0
        };

        let durationInSeconds: number, durationCount: number = 0;
        let distance: number = 0;
        let currentSpeed: number;

        let gradeArrayMoving: Array<any> = [];
        let gradeArrayDistance: Array<any> = [];

        for (let i: number = 0; i < gradeArray.length; i++) { // Loop on samples

            if (i > 0) {
                currentSpeed = velocityArray[i] * 3.6; // Multiply by 3.6 to convert to kph;
                // Compute distribution for graph/table
                if (currentSpeed > 0) { // If moving...
                    durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)
                    distance = distanceArray[i] - distanceArray[i - 1];

                    // elevation gain
                    gradeSum += this.valueForSum(gradeArray[i], gradeArray[i - 1], distance);
                    // distance
                    gradeCount += distance;

                    gradeArrayMoving.push(gradeArray[i]);
                    gradeArrayDistance.push(distance);

                    let gradeZoneId: number = this.getZoneId(this.userSettings.zones.grade, gradeArray[i]);

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

                    } else if (gradeArray[i] < ActivityComputer.GRADE_DOWNHILL_LIMIT) { // DOWNHILL
                        // time
                        upFlatDownInSeconds.down += durationInSeconds;
                        // distance
                        upFlatDownDistanceData.down += distance;

                    } else { // FLAT
                        // time
                        upFlatDownInSeconds.flat += durationInSeconds;
                        // distance
                        upFlatDownDistanceData.flat += distance;

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

        let avgGrade: number = gradeSum / gradeCount;

        // Update zone distribution percentage
        gradeZones = this.finalizeDistributionComputationZones(gradeZones);

        let percentiles: Array<number> = Helper.weightedPercentiles(gradeArrayMoving, gradeArrayDistance, [0.25, 0.5, 0.75]);

        let gradeData: IGradeData = {
            avgGrade: avgGrade,
            lowerQuartileGrade: percentiles[0],
            medianGrade: percentiles[1],
            upperQuartileGrade: percentiles[2],
            gradeZones: (this.returnZones) ? gradeZones : null,
            upFlatDownInSeconds: upFlatDownInSeconds,
            upFlatDownMoveData: upFlatDownMoveData,
            upFlatDownDistanceData: upFlatDownDistanceData,
            gradeProfile: gradeProfile
        };

        return gradeData;

    }

    protected elevationData(activityStream: IActivityStream): IElevationData {

        let distanceArray: any = activityStream.distance;
        let timeArray: any = activityStream.time;
        let velocityArray: any = activityStream.velocity_smooth;
        let altitudeArray: any = activityStream.altitude_smooth;

        if (_.isEmpty(distanceArray) || _.isEmpty(timeArray) || _.isEmpty(velocityArray) || _.isEmpty(altitudeArray)) {
            return null;
        }

        let skipAscentSpeedCompute: boolean = !_.isEmpty(this.bounds);

        let accumulatedElevation: number = 0;
        let accumulatedElevationAscent: number = 0;
        let accumulatedElevationDescent: number = 0;
        let accumulatedDistance: number = 0;

        // specials arrays for ascent speeds
        let ascentSpeedMeterPerHourSamples: Array<number> = [];
        let ascentSpeedMeterPerHourDistance: Array<number> = [];
        let ascentSpeedMeterPerHourSum: number = 0;

        let elevationSampleCount: number = 0;
        let elevationSamples: Array<number> = [];
        let elevationSamplesDistance: Array<number> = [];
        let elevationZones: any = this.prepareZonesForDistributionComputation(this.userSettings.zones.elevation);
        let ascentSpeedZones: any = this.prepareZonesForDistributionComputation(this.userSettings.zones.ascent);
        let durationInSeconds: number = 0;
        let distance: number = 0;
        let ascentDurationInSeconds: number = 0;

        for (let i: number = 0; i < altitudeArray.length; i++) { // Loop on samples

            // Compute distribution for graph/table
            if (i > 0 && velocityArray[i] * 3.6 > ActivityComputer.MOVING_THRESHOLD_KPH) {

                durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)
                distance = distanceArray[i] - distanceArray[i - 1];

                // Compute average and normalized

                // average elevation over distance
                accumulatedElevation += this.valueForSum(altitudeArray[i], altitudeArray[i - 1], distance);
                elevationSampleCount += distance;
                elevationSamples.push(altitudeArray[i]);
                elevationSamplesDistance.push(distance);

                let elevationZoneId: number = this.getZoneId(this.userSettings.zones.elevation, altitudeArray[i]);

                if (!_.isUndefined(elevationZoneId) && !_.isUndefined(elevationZones[elevationZoneId])) {
                    elevationZones[elevationZoneId].s += durationInSeconds;
                }

                // Meters climbed between current and previous
                let elevationDiff: number = altitudeArray[i] - altitudeArray[i - 1];

                // If previous altitude lower than current then => climbing
                if (elevationDiff > 0) {

                    accumulatedElevationAscent += elevationDiff;
                    ascentDurationInSeconds = timeArray[i] - timeArray[i - 1];

                    let ascentSpeedMeterPerHour: number = elevationDiff / ascentDurationInSeconds * 3600; // m climbed / seconds

                    // Only if grade is > "ascentSpeedGradeLimit"
                    if (distance > 0 && (elevationDiff / distance * 100) > ActivityComputer.ASCENT_SPEED_GRADE_LIMIT) {
                        accumulatedDistance += distanceArray[i] - distanceArray[i - 1];
                        ascentSpeedMeterPerHourSamples.push(ascentSpeedMeterPerHour);
                        ascentSpeedMeterPerHourDistance.push(accumulatedDistance);
                        ascentSpeedMeterPerHourSum += ascentSpeedMeterPerHour;

                        let ascentSpeedZoneId: number = this.getZoneId(this.userSettings.zones.ascent, ascentSpeedMeterPerHour);
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
        let avgElevation: number = accumulatedElevation / elevationSampleCount;

        let avgAscentSpeed: number = ascentSpeedMeterPerHourSum / ascentSpeedMeterPerHourSamples.length;

        // Update zone distribution percentage
        elevationZones = this.finalizeDistributionComputationZones(elevationZones);
        ascentSpeedZones = this.finalizeDistributionComputationZones(ascentSpeedZones);

        let percentilesElevation: Array<number> = Helper.weightedPercentiles(elevationSamples, elevationSamplesDistance, [0.25, 0.5, 0.75]);
        let percentilesAscent: Array<number> = Helper.weightedPercentiles(ascentSpeedMeterPerHourSamples, ascentSpeedMeterPerHourDistance, [0.25, 0.5, 0.75]);

        let ascentSpeedData: IAscentSpeedData = {
            avg: _.isFinite(avgAscentSpeed) ? avgAscentSpeed : -1,
            lowerQuartile: parseFloat(percentilesAscent[0].toFixed(0)),
            median: parseFloat(percentilesAscent[1].toFixed(0)),
            upperQuartile: parseFloat(percentilesAscent[2].toFixed(0))
        };

        let elevationData: IElevationData = {
            avgElevation: parseFloat(avgElevation.toFixed(0)),
            accumulatedElevationAscent: accumulatedElevationAscent,
            accumulatedElevationDescent: accumulatedElevationDescent,
            lowerQuartileElevation: parseFloat(percentilesElevation[0].toFixed(0)),
            medianElevation: parseFloat(percentilesElevation[1].toFixed(0)),
            upperQuartileElevation: parseFloat(percentilesElevation[2].toFixed(0)),
            elevationZones: (this.returnZones) ? elevationZones : null, // Only while moving
            ascentSpeedZones: (this.returnZones) ? ascentSpeedZones : null, // Only while moving
            ascentSpeed: ascentSpeedData
        };

        if (skipAscentSpeedCompute) {
            elevationData = _.omit(elevationData, 'ascentSpeedZones');
            elevationData = _.omit(elevationData, 'ascentSpeed');
        }

        return elevationData;
    }

    protected smoothAltitude(activityStream: IActivityStream, stravaElevation: number): Array<number> {

        if (!activityStream || !activityStream.altitude) {
            return null;
        }

        let activityAltitudeArray: Array<number> = activityStream.altitude;
        let distanceArray: Array<number> = activityStream.distance;
        //  let timeArray = activityStream.time;  // for smoothing by time
        let velocityArray: Array<number> = activityStream.velocity_smooth;
        let smoothingL: number = 10;
        let smoothingH: number = 600;
        let smoothing: number;
        let altitudeArray: Array<number> = [];
        while (smoothingH - smoothingL >= 1) {
            smoothing = smoothingL + (smoothingH - smoothingL) / 2;
            altitudeArray = this.lowPassDataSmoothing(activityAltitudeArray, distanceArray, smoothing); // smoothing by distance
            // altitudeArray = this.lowPassDataSmoothing(activityAltitudeArray, timeArray, smoothing);  // smoothing by time
            let totalElevation: number = 0;
            for (let i: number = 0; i < altitudeArray.length; i++) { // Loop on samples
                if (i > 0 && velocityArray[i] * 3.6 > ActivityComputer.MOVING_THRESHOLD_KPH) {
                    let elevationDiff: number = altitudeArray[i] - altitudeArray[i - 1];
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

    protected lowPassDataSmoothing(data: Array<number>, distance: Array<number>, smoothing: number): Array<number> {
        // Below algorithm is applied in this method
        // http://phrogz.net/js/framerate-independent-low-pass-filter.html
        // value += (currentValue - value) / (smoothing / timeSinceLastSample);
        // it is adapted for stability - if (smoothing / timeSinceLastSample) is less then 1, set it to 1 -> no smoothing for that sample
        let smooth_factor: number = 0;
        let result: Array<number> = [];
        if (data && distance) {
            result[0] = data[0];
            for (let i: number = 1, max = data.length; i < max; i++) {
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
