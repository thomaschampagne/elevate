/**
 *   Contructor
 */
function ActivityProcessor(vacuumProcessor, userHrrZones, zones) {
    this.vacuumProcessor_ = vacuumProcessor;
    this.userHrrZones_ = userHrrZones;
    this.zones = zones;
}

ActivityProcessor.movingThresholdKph = 3.5; // Kph
ActivityProcessor.cadenceThresholdRpm = 35; // RPMs
ActivityProcessor.cadenceLimitRpm = 125;
ActivityProcessor.defaultBikeWeight = 10; // KGs
ActivityProcessor.cachePrefix = 'stravistix_activity_';
ActivityProcessor.gradeClimbingLimit = 1.6;
ActivityProcessor.gradeDownHillLimit = -1.6;
ActivityProcessor.gradeProfileFlatPercentageDetected = 60;
ActivityProcessor.gradeProfileFlat = 'FLAT';
ActivityProcessor.gradeProfileHilly = 'HILLY';


/**
 * Define prototype
 */
ActivityProcessor.prototype = {

    setActivityType: function(activityType) {
        this.activityType = activityType;
    },

    /**
     *
     */
    getAnalysisData: function(activityId, userGender, userRestHr, userMaxHr, userFTP, callback) {

        if (!this.activityType) {
            console.error('No activity type set for ActivityProcessor');
        }

        // Find in cache first is data exist
        var cacheResult = JSON.parse(localStorage.getItem(ActivityProcessor.cachePrefix + activityId));

        if (!_.isNull(cacheResult) && env.useActivityStreamCache) {
            if (env.debugMode) console.log("Using existing activity cache in non debug mode: " + JSON.stringify(cacheResult));
            callback(cacheResult);
            return;
        }

        userFTP = parseInt(userFTP);

        // Else no cache... then call VacuumProcessor for getting data, compute them and cache them
        this.vacuumProcessor_.getActivityStream(function(activityStatsMap, activityStream, athleteWeight, hasPowerMeter) { // Get stream on page

            // Append altitude_smooth to fetched strava activity stream before compute analysis data on
            activityStream.altitude_smooth = this.smoothAltitude_(activityStream, activityStatsMap.elevation);

            var result = this.computeAnalysisData_(userGender, userRestHr, userMaxHr, userFTP, athleteWeight, hasPowerMeter, activityStatsMap, activityStream);

            if (env.debugMode) console.log("Creating activity cache: " + JSON.stringify(result));

            localStorage.setItem(ActivityProcessor.cachePrefix + activityId, JSON.stringify(result)); // Cache the result to local storage
            callback(result);

        }.bind(this));
    },

    computeAnalysisData_: function(userGender, userRestHr, userMaxHr, userFTP, athleteWeight, hasPowerMeter, activityStatsMap, activityStream) {

        // Move ratio
        var moveRatio = this.moveRatio_(activityStatsMap, activityStream);

        // Toughness score
        var toughnessScore = this.toughnessScore_(activityStatsMap, activityStream, moveRatio);

        // Include speed and pace
        var moveData = [null, null];
        if (activityStream.velocity_smooth) {
            moveData = this.moveData_(activityStatsMap, activityStream.velocity_smooth, activityStream.time);
        }

        // Q1 Speed
        // Median Speed
        // Q3 Speed
        // Standard deviation Speed
        var speedData = (_.isEmpty(moveData)) ? null : moveData[0];

        // Q1 Pace
        // Median Pace
        // Q3 Pace
        // Standard deviation Pace
        var paceData = (_.isEmpty(moveData)) ? null : moveData[1];

        // Estimated Normalized power
        // Estimated Variability index
        // Estimated Intensity factor
        // Normalized Watt per Kg
        var powerData = this.powerData_(athleteWeight, hasPowerMeter, userFTP, activityStatsMap, activityStream.watts, activityStream.velocity_smooth, activityStream.time);

        // TRaining IMPulse
        // %HRR Avg
        // %HRR Zones
        // Q1 HR
        // Median HR
        // Q3 HR
        var heartRateData = this.heartRateData_(userGender, userRestHr, userMaxHr, activityStream.heartrate, activityStream.time, activityStream.velocity_smooth, activityStatsMap);

        // Cadence percentage
        // Time Cadence
        // Crank revolution
        var cadenceData = this.cadenceData_(activityStream.cadence, activityStream.velocity_smooth, activityStatsMap, activityStream.time);


        // Avg grade
        // Q1/Q2/Q3 grade
        var gradeData = this.gradeData_(activityStream.grade_smooth, activityStream.velocity_smooth, activityStream.time, activityStream.distance);

        // Avg grade
        // Q1/Q2/Q3 grade
        var elevationData = this.elevationData_(activityStream, activityStatsMap);

        // Return an array with all that shit...
        return {
            'moveRatio': moveRatio,
            'toughnessScore': toughnessScore,
            'speedData': speedData,
            'paceData': paceData,
            'powerData': powerData,
            'heartRateData': heartRateData,
            'cadenceData': cadenceData,
            'gradeData': gradeData,
            'elevationData': elevationData
        };
    },

    /**
     * ...
     */
    moveRatio_: function(activityStatsMap, activityStream) {

        if (_.isNull(activityStatsMap.movingTime) || _.isNull(activityStatsMap.elapsedTime)) {
            Helper.log('WARN', 'Unable to compute ActivityRatio on this activity with following data: ' + JSON.stringify(activityStatsMap))
            return null;
        }

        var ratio = activityStatsMap.movingTime / activityStatsMap.elapsedTime;

        if (_.isNaN(ratio)) {
            return null;
        }

        return ratio;
    },

    /**
     * ...
     */
    toughnessScore_: function(activityStatsMap, activityStream, moveRatio) {

        if (_.isNull(activityStatsMap.elevation) || _.isNull(activityStatsMap.avgPower) || _.isNull(activityStatsMap.averageSpeed) || _.isNull(activityStatsMap.distance)) {
            return null;
        }

        var toughnessScore = Math.sqrt(
            Math.sqrt(
                Math.pow(activityStatsMap.elevation, 2) *
                activityStatsMap.avgPower *
                Math.pow(activityStatsMap.averageSpeed, 2) *
                Math.pow(activityStatsMap.distance, 2) *
                moveRatio
            )
        ) / 20;

        return toughnessScore;
    },

    getZoneFromDistributionStep_: function(value, distributionStep, minValue) {
        return parseInt((value - minValue) / (distributionStep));
    },

    getZoneId: function(zones, value) {
        for (zoneId = 0; zoneId < zones.length; zoneId++) {
            if (value <= zones[zoneId].to) {
                return zoneId;
            }
        }
    },

    /**
     *
     */
    prepareZonesForDistribComputation: function(sourceZones) {
        var preparedZones = [];
        for (zone in sourceZones) {
            sourceZones[zone].s = 0;
            sourceZones[zone].percentDistrib = null;
            preparedZones.push(sourceZones[zone]);
        }
        return preparedZones;
    },

    finalizeDistribComputationZones: function(zones) {
        var total = 0;
        for (zone of zones) {
            if (zone['s']) {
                total += zone['s'];
            }
            zone['percentDistrib'] = 0;
        }
        if (total > 0) {
            for (zone of zones) {
                if (zone['s']) {
                    zone['percentDistrib'] = ((zone['s'] / total).toFixed(4) * 100);
                }
            }
        }
        return zones;
    },

    valueForSum_: function(currentValue, previousValue, delta) {
        // discrete integral
        return currentValue * delta - ((currentValue - previousValue) * delta) / 2;
    },

    /**
     * ...
     */
    moveData_: function(activityStatsMap, velocityArray, timeArray) {

        if (_.isEmpty(velocityArray) || _.isEmpty(timeArray)) {
            return null;
        }

        var genuineAvgSpeedSum = 0,
            genuineAvgSpeedSumCount = 0;
        var speedsNonZero = Array();
        var speedsNonZeroDuration = Array();
        var speedVarianceSum = 0;
        var currentSpeed;

        var speedZones = this.prepareZonesForDistribComputation(this.zones.speed);
        var paceZones = this.prepareZonesForDistribComputation(this.zones.pace);

        var durationInSeconds = 0;

        // End Preparing zone
        for (var i = 0; i < velocityArray.length; i++) { // Loop on samples

            // Compute speed
            currentSpeed = velocityArray[i] * 3.6; // Multiply by 3.6 to convert to kph; 

            if (currentSpeed > 0) { // If moving...

                // Compute distribution for graph/table
                if (i > 0) {

                    durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)

                    speedsNonZero.push(currentSpeed);
                    speedsNonZeroDuration.push(durationInSeconds);

                    // Compute variance speed
                    speedVarianceSum += Math.pow(currentSpeed, 2);

                    // distance
                    genuineAvgSpeedSum += this.valueForSum_(velocityArray[i] * 3.6, velocityArray[i - 1] * 3.6, durationInSeconds);
                    // time
                    genuineAvgSpeedSumCount += durationInSeconds;

                    // Find speed zone id
                    var speedZoneId = this.getZoneId(this.zones.speed, currentSpeed);
                    if (!_.isUndefined(speedZoneId) && !_.isUndefined(speedZones[speedZoneId])) {
                        speedZones[speedZoneId]['s'] += durationInSeconds;
                    }

                    // Find pace zone
                    var paceZoneId = this.getZoneId(this.zones.pace, this.convertSpeedToPace(currentSpeed));
                    if (!_.isUndefined(paceZoneId) && !_.isUndefined(paceZones[paceZoneId])) {
                        paceZones[paceZoneId]['s'] += durationInSeconds;
                    }

                }
            }
        }

        // Update zone distribution percentage
        speedZones = this.finalizeDistribComputationZones(speedZones);
        paceZones = this.finalizeDistribComputationZones(paceZones);

        // Finalize compute of Speed
        var genuineAvgSpeed = genuineAvgSpeedSum / genuineAvgSpeedSumCount;
        var varianceSpeed = (speedVarianceSum / speedsNonZero.length) - Math.pow(activityStatsMap.averageSpeed, 2);
        var standardDeviationSpeed = (varianceSpeed > 0) ? Math.sqrt(varianceSpeed) : 0;
        var percentiles = Helper.weightedPercentiles(speedsNonZero, speedsNonZeroDuration, [ 0.25, 0.5, 0.75 ]);

        return [{
            'genuineAvgSpeed': genuineAvgSpeed,
            'avgPace': parseInt(((1 / genuineAvgSpeed) * 60 * 60).toFixed(0)), // send in seconds
            'lowerQuartileSpeed': percentiles[0],
            'medianSpeed': percentiles[1],
            'upperQuartileSpeed': percentiles[2],
            'varianceSpeed': varianceSpeed,
            'standardDeviationSpeed': standardDeviationSpeed,
            'speedZones': speedZones
        }, {
            'lowerQuartilePace': this.convertSpeedToPace(percentiles[0]),
            'medianPace': this.convertSpeedToPace(percentiles[1]),
            'upperQuartilePace': this.convertSpeedToPace(percentiles[2]),
            'variancePace': this.convertSpeedToPace(varianceSpeed),
            'paceZones': paceZones
        }];
    },

    /**
     * @param speed in kph
     * @return pace in seconds/km
     */
    convertSpeedToPace: function(speed) {
        return (speed === 0) ? 'infinite' : parseInt((1 / speed) * 60 * 60);
    },

    /**
     * ...
     */
    powerData_: function(athleteWeight, hasPowerMeter, userFTP, activityStatsMap, powerArray, velocityArray, timeArray) {

        if (_.isEmpty(powerArray) || _.isEmpty(velocityArray) || _.isEmpty(timeArray)) {
            return null;
        }

        var accumulatedWattsOnMoveFourRoot = 0;
        var accumulatedWattsOnMove = 0;
        var wattSampleOnMoveCount = 0;
        var wattsSamplesOnMove = [];
        var wattsSamplesOnMoveDuration = [];

        var powerZones = this.prepareZonesForDistribComputation(this.zones.power);

        var durationInSeconds;

        for (var i = 0; i < powerArray.length; i++) { // Loop on samples

            if (velocityArray[i] * 3.6 > ActivityProcessor.movingThresholdKph && i > 0) {
                // Compute average and normalized power
                accumulatedWattsOnMoveFourRoot += Math.pow(powerArray[i], 3.925);
                // Compute distribution for graph/table
                durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)

                wattsSamplesOnMove.push(powerArray[i]);
                wattsSamplesOnMoveDuration.push(durationInSeconds);

                // average over time
                accumulatedWattsOnMove += this.valueForSum_(powerArray[i], powerArray[i - 1], durationInSeconds);
                wattSampleOnMoveCount += durationInSeconds;

                var powerZoneId = this.getZoneId(this.zones.power, powerArray[i]);

                if (!_.isUndefined(powerZoneId) && !_.isUndefined(powerZones[powerZoneId])) {
                    powerZones[powerZoneId]['s'] += durationInSeconds;
                }
            }
        }

        // Finalize compute of Power
        var avgWatts = accumulatedWattsOnMove / wattSampleOnMoveCount;

        var weightedPower;

        if (hasPowerMeter) {
            weightedPower = activityStatsMap.weightedPower;
        } else {
            weightedPower = Math.sqrt(Math.sqrt(accumulatedWattsOnMoveFourRoot / wattSampleOnMoveCount));
        }

        var variabilityIndex = weightedPower / avgWatts;
        var punchFactor = (_.isNumber(userFTP) && userFTP > 0) ? (weightedPower / userFTP) : null;
        var weightedWattsPerKg = weightedPower / (athleteWeight + ActivityProcessor.defaultBikeWeight);
        
        var percentiles = Helper.weightedPercentiles(wattsSamplesOnMove, wattsSamplesOnMoveDuration, [ 0.25, 0.5, 0.75 ]);

        // Update zone distribution percentage
        powerZones = this.finalizeDistribComputationZones(powerZones);

        return {
            'hasPowerMeter': hasPowerMeter,
            'avgWatts': avgWatts,
            'weightedPower': weightedPower,
            'variabilityIndex': variabilityIndex,
            'punchFactor': punchFactor,
            'weightedWattsPerKg': weightedWattsPerKg,
            'lowerQuartileWatts': percentiles[0],
            'medianWatts': percentiles[1],
            'upperQuartileWatts': percentiles[2],
            'powerZones': powerZones // Only while moving
        };

    },

    /**
     * ...
     */
    heartRateData_: function(userGender, userRestHr, userMaxHr, heartRateArray, timeArray, velocityArray, activityStatsMap) {

        if (_.isEmpty(heartRateArray) || _.isEmpty(timeArray) || _.isEmpty(velocityArray)) {
            return null;
        }

        var TRIMP = 0;
        var TRIMPGenderFactor = (userGender == 'men') ? 1.92 : 1.67;
        var hrrSecondsCount = 0;
        var hrrZonesCount = Object.keys(this.userHrrZones_).length;
        var hr, heartRateReserveAvg, durationInSeconds, durationInMinutes, zoneId;
        var hrSum = 0;
        var heartRateArrayMoving = [];
        var heartRateArrayMovingDuration = [];

        // Find HR for each Hrr of each zones
        for (var zone in this.userHrrZones_) {
            this.userHrrZones_[zone]['fromHr'] = parseFloat(Helper.heartrateFromHeartRateReserve(this.userHrrZones_[zone]['fromHrr'], userMaxHr, userRestHr));
            this.userHrrZones_[zone]['toHr'] = parseFloat(Helper.heartrateFromHeartRateReserve(this.userHrrZones_[zone]['toHrr'], userMaxHr, userRestHr));
            this.userHrrZones_[zone]['fromHrr'] = parseFloat(this.userHrrZones_[zone]['fromHrr']);
            this.userHrrZones_[zone]['toHrr'] = parseFloat(this.userHrrZones_[zone]['toHrr']);
            this.userHrrZones_[zone]['s'] = 0;
            this.userHrrZones_[zone]['percentDistrib'] = null;
        }

        for (var i = 0; i < heartRateArray.length; i++) { // Loop on samples
            if (velocityArray[i] * 3.6 > ActivityProcessor.movingThresholdKph && i > 0) {
                // Compute heartrate data while moving from now
                durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)
                // average over time
                hrSum += this.valueForSum_(heartRateArray[i], heartRateArray[i - 1], durationInSeconds);
                hrrSecondsCount += durationInSeconds;

                heartRateArrayMoving.push(heartRateArray[i]);
                heartRateArrayMovingDuration.push(durationInSeconds);

                // Compute TRIMP
                hr = (heartRateArray[i] + heartRateArray[i - 1]) / 2; // Getting HR avg between current sample and previous one.
                heartRateReserveAvg = Helper.heartRateReserveFromHeartrate(hr, userMaxHr, userRestHr); //(hr - userSettings.userRestHr) / (userSettings.userMaxHr - userSettings.userRestHr);
                durationInMinutes = durationInSeconds / 60;

                TRIMP += durationInMinutes * heartRateReserveAvg * 0.64 * Math.exp(TRIMPGenderFactor * heartRateReserveAvg);

                // Count Heart Rate Reserve distribution
                zoneId = this.getHrrZoneId(hrrZonesCount, heartRateReserveAvg * 100);

                if (!_.isUndefined(zoneId)) {
                    this.userHrrZones_[zoneId]['s'] += durationInSeconds;
                }
            }
        }

        var heartRateArraySorted = heartRateArray.sort(function(a, b) {
            return a - b;
        });

        // Update zone distribution percentage
        userHrrZones_ = this.finalizeDistribComputationZones(this.userHrrZones_);

        activityStatsMap.averageHeartRate = hrSum / hrrSecondsCount;
        activityStatsMap.maxHeartRate = heartRateArraySorted[heartRateArraySorted.length - 1];

        var TRIMPPerHour = TRIMP / hrrSecondsCount * 60 * 60;
        var percentiles = Helper.weightedPercentiles(heartRateArrayMoving, heartRateArrayMovingDuration, [ 0.25, 0.5, 0.75 ]);

        return {
            'TRIMP': TRIMP,
            'TRIMPPerHour': TRIMPPerHour,
            'hrrZones': this.userHrrZones_,
            'lowerQuartileHeartRate': percentiles[0],
            'medianHeartRate': percentiles[1],
            'upperQuartileHeartRate': percentiles[2],
            'averageHeartRate': activityStatsMap.averageHeartRate,
            'maxHeartRate': activityStatsMap.maxHeartRate,
            'activityHeartRateReserve': Helper.heartRateReserveFromHeartrate(activityStatsMap.averageHeartRate, userMaxHr, userRestHr) * 100,
            'activityHeartRateReserveMax': Helper.heartRateReserveFromHeartrate(activityStatsMap.maxHeartRate, userMaxHr, userRestHr) * 100
        };

    },

    getHrrZoneId: function(hrrZonesCount, hrrValue) {
        for (zoneId = 0; zoneId < hrrZonesCount; zoneId++) {
            if (hrrValue <= this.userHrrZones_[zoneId]['toHrr']) {
                return zoneId;
            }
        }
    },

    cadenceData_: function(cadenceArray, velocityArray, activityStatsMap, timeArray) {

        if (_.isEmpty(cadenceArray) || _.isEmpty(velocityArray) || _.isEmpty(timeArray)) {
            return null;
        }

        // recomputing crank revolutions using cadence data
        var crankRevolutions = 0;
        // On Moving
        var cadenceSumOnMoving = 0;
        var cadenceSumDurationOnMoving = 0;
        var cadenceVarianceSumOnMoving = 0;
        var cadenceOnMoveSampleCount = 0;
        var movingSampleCount = 0;

        var cadenceZoneTyped;
        if (this.activityType === 'Ride') {
            cadenceZoneTyped = this.zones.cyclingCadence;
        } else if (this.activityType === 'Run') {
            cadenceZoneTyped = this.zones.runningCadence;
        } else {
            return null;
        }

        var cadenceZones = this.prepareZonesForDistribComputation(cadenceZoneTyped);

        var durationInSeconds = 0;
        var cadenceArrayMoving = [];
        var cadenceArrayDuration = [];

        for (var i = 0; i < velocityArray.length; i++) {

            if (i > 0) {
                durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)
                // recomputing crank revolutions using cadence data
                crankRevolutions += this.valueForSum_(cadenceArray[i], cadenceArray[i - 1], durationInSeconds / 60);

                if (velocityArray[i] * 3.6 > ActivityProcessor.movingThresholdKph) {

                    movingSampleCount++;

                    // Rider is moving here..
                    if (cadenceArray[i] > ActivityProcessor.cadenceThresholdRpm) {
                        // Rider is moving here while cadence
                        cadenceOnMoveSampleCount++;
                        // cadence averaging over time
                        cadenceSumOnMoving += this.valueForSum_(cadenceArray[i], cadenceArray[i - 1], durationInSeconds);
                        cadenceSumDurationOnMoving += durationInSeconds;
                        cadenceVarianceSumOnMoving += Math.pow(cadenceArray[i], 2);
                        cadenceArrayMoving.push(cadenceArray[i]);
                        cadenceArrayDuration.push(durationInSeconds);
                    }

                    var cadenceZoneId = this.getZoneId(cadenceZoneTyped, cadenceArray[i]);

                    if (!_.isUndefined(cadenceZoneId) && !_.isUndefined(cadenceZones[cadenceZoneId])) {
                        cadenceZones[cadenceZoneId]['s'] += durationInSeconds;
                    }
                }
            }
        }

        var cadenceRatioOnMovingTime = cadenceOnMoveSampleCount / movingSampleCount;
        var averageCadenceOnMovingTime = cadenceSumOnMoving / cadenceSumDurationOnMoving;


        var varianceCadence = (cadenceVarianceSumOnMoving / cadenceOnMoveSampleCount) - Math.pow(averageCadenceOnMovingTime, 2);
        var standardDeviationCadence = (varianceCadence > 0) ? Math.sqrt(varianceCadence) : 0;

        // Update zone distribution percentage
        cadenceZones = this.finalizeDistribComputationZones(cadenceZones);

        var percentiles = Helper.weightedPercentiles(cadenceArrayMoving, cadenceArrayDuration, [ 0.25, 0.5, 0.75 ]);

        return {
            'cadencePercentageMoving': cadenceRatioOnMovingTime * 100,
            'cadenceTimeMoving': (cadenceRatioOnMovingTime * activityStatsMap.movingTime),
            'averageCadenceMoving': averageCadenceOnMovingTime,
            'standardDeviationCadence': standardDeviationCadence.toFixed(1),
            'crankRevolutions': crankRevolutions,
            'lowerQuartileCadence': percentiles[0],
            'medianCadence': percentiles[1],
            'upperQuartileCadence': percentiles[2],
            'cadenceZones': cadenceZones
        };
    },

    gradeData_: function(gradeArray, velocityArray, timeArray, distanceArray) {

        if (_.isEmpty(gradeArray) || _.isEmpty(velocityArray) || _.isEmpty(timeArray)) {
            return null;
        }

        // If home trainer
        if (window.pageView && window.pageView.activity && window.pageView.activity().get('trainer')) {
            return null;
        }

        var gradeSum = 0,
            gradeCount = 0;

        var gradeZones = this.prepareZonesForDistribComputation(this.zones.grade);
        var upFlatDownInSeconds = {
            up: 0,
            flat: 0,
            down: 0,
            total: 0
        };

        // Currently deals with avg speed/pace
        var upFlatDownMoveData = {
            up: 0,
            flat: 0,
            down: 0
        };

        var durationInSeconds, durationCount = 0;
        var distance = 0;
        var currentSpeed;

        var gradeArrayMoving = [];
        var gradeArrayDistance = [];

        for (var i = 0; i < gradeArray.length; i++) { // Loop on samples

            if (i > 0) {
                currentSpeed = velocityArray[i] * 3.6; // Multiply by 3.6 to convert to kph; 
                // Compute distribution for graph/table
                if (currentSpeed > 0) { // If moving...
                    durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)
                    distance = distanceArray[i] - distanceArray[i - 1];

                    // elevation gain
                    gradeSum += this.valueForSum_(gradeArray[i], gradeArray[i - 1], distance);
                    // distance
                    gradeCount += distance;

                    gradeArrayMoving.push(gradeArray[i]);
                    gradeArrayDistance.push(distance);

                    var gradeZoneId = this.getZoneId(this.zones.grade, gradeArray[i]);

                    if (!_.isUndefined(gradeZoneId) && !_.isUndefined(gradeZones[gradeZoneId])) {
                        gradeZones[gradeZoneId]['s'] += durationInSeconds;
                    }

                    durationCount += durationInSeconds;

                    // Compute DOWN/FLAT/UP duration
                    if (gradeArray[i] > ActivityProcessor.gradeClimbingLimit) { // UPHILL
                        // time
                        upFlatDownInSeconds.up += durationInSeconds;
                        // distance
                        upFlatDownMoveData.up += currentSpeed * durationInSeconds;
                    } else if (gradeArray[i] < ActivityProcessor.gradeDownHillLimit) { // DOWNHILL
                        // time
                        upFlatDownInSeconds.down += durationInSeconds;
                        // distance
                        upFlatDownMoveData.down += currentSpeed * durationInSeconds;
                    } else { // FLAT
                        // time
                        upFlatDownInSeconds.flat += durationInSeconds;
                        // distance
                        upFlatDownMoveData.flat += currentSpeed * durationInSeconds;
                    }
                }
            }
        }

        upFlatDownInSeconds.total = durationCount;

        // Compute grade profile
        var gradeProfile;
        if ((upFlatDownInSeconds.flat / upFlatDownInSeconds.total * 100) >= ActivityProcessor.gradeProfileFlatPercentageDetected) {
            gradeProfile = ActivityProcessor.gradeProfileFlat;
        } else {
            gradeProfile = ActivityProcessor.gradeProfileHilly;
        }

        // Compute speed while up, flat down
        upFlatDownMoveData.up = upFlatDownMoveData.up / upFlatDownInSeconds.up;
        upFlatDownMoveData.down = upFlatDownMoveData.down / upFlatDownInSeconds.down;
        upFlatDownMoveData.flat = upFlatDownMoveData.flat / upFlatDownInSeconds.flat;

        var avgGrade = gradeSum / gradeCount;

        // Update zone distribution percentage
        gradeZones = this.finalizeDistribComputationZones(gradeZones);

        var percentiles = Helper.weightedPercentiles(gradeArrayMoving, gradeArrayDistance, [ 0.25, 0.5, 0.75 ]);

        return {
            'avgGrade': avgGrade,
            'lowerQuartileGrade': percentiles[0],
            'medianGrade': percentiles[1],
            'upperQuartileGrade': percentiles[2],
            'gradeZones': gradeZones,
            'upFlatDownInSeconds': upFlatDownInSeconds,
            'upFlatDownMoveData': upFlatDownMoveData,
            'gradeProfile': gradeProfile
        };

    },


    elevationData_: function(activityStream, activityStatsMap) {
        var distanceArray = activityStream.distance;
        var timeArray = activityStream.time;
        var velocityArray = activityStream.velocity_smooth;
        var altitudeArray = activityStream.altitude_smooth;

        if (_.isEmpty(distanceArray) || _.isEmpty(timeArray) || _.isEmpty(velocityArray) || _.isEmpty(altitudeArray)) {
            return null;
        }

        var accumulatedElevation = 0;
        var accumulatedElevationAscent = 0;
        var accumulatedElevationDescent = 0;
        var accumulatedDistance = 0;

        // specials arrays for ascent speeds
        var ascentSpeedMeterPerHourSamples = [];
        var ascentSpeedMeterPerHourDistance = [];
        var ascentSpeedMeterPerHourTime = [];
        var ascentSpeedMeterPerHourSum = 0;

        var elevationSampleCount = 0;
        var elevationSamples = [];
        var elevationSamplesDistance = [];
        var elevationZones = this.prepareZonesForDistribComputation(this.zones.elevation);
        var ascentSpeedZones = this.prepareZonesForDistribComputation(this.zones.ascent);
        var durationInSeconds = 0;
        var distance = 0;
        var ascentDurationInSeconds = 0;

        for (var i = 0; i < altitudeArray.length; i++) { // Loop on samples

            // Compute distribution for graph/table
            if (i > 0 && velocityArray[i] * 3.6 > ActivityProcessor.movingThresholdKph) {

                durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)
                distance = distanceArray[i] - distanceArray[i - 1];

                // Compute average and normalized 

                // average elevation over distance
                accumulatedElevation += this.valueForSum_(altitudeArray[i], altitudeArray[i - 1], distance);
                elevationSampleCount += distance;
                elevationSamples.push(altitudeArray[i]);
                elevationSamplesDistance.push(distance);

                var elevationZoneId = this.getZoneId(this.zones.elevation, altitudeArray[i]);

                if (!_.isUndefined(elevationZoneId) && !_.isUndefined(elevationZones[elevationZoneId])) {
                    elevationZones[elevationZoneId]['s'] += durationInSeconds;
                }

                // Meters climbed between current and previous
                var elevationDiff = altitudeArray[i] - altitudeArray[i - 1];

                // If previous altitude lower than current then => climbing
                if (elevationDiff > 0) {

                    accumulatedElevationAscent += elevationDiff;
                    ascentDurationInSeconds = timeArray[i] - timeArray[i - 1];

                    var ascentSpeedMeterPerHour = elevationDiff / ascentDurationInSeconds * 3600; // m climbed / seconds

                    // only if grade is > 3%
                    if (distance > 0 && (elevationDiff / distance) > 0.03) {
                        accumulatedDistance += distanceArray[i] - distanceArray[i - 1];
                        ascentSpeedMeterPerHourSamples.push(ascentSpeedMeterPerHour);
                        ascentSpeedMeterPerHourDistance.push(accumulatedDistance);
                        ascentSpeedMeterPerHourTime.push(ascentDurationInSeconds);
                        ascentSpeedMeterPerHourSum += ascentSpeedMeterPerHour;
                    }
                } else {
                    accumulatedElevationDescent -= elevationDiff;
                }

            }
        }

        var ascentSpeedArray = ascentSpeedMeterPerHourSamples; //this.filterData_(ascentSpeedMeterPerHourSamples, ascentSpeedMeterPerHourDistance, 200);
        var j = 0;
        for (j = 0; j < ascentSpeedArray.length; j++) {
            var ascentSpeedZoneId = this.getZoneId(this.zones.ascent, ascentSpeedArray[j]);

            if (!_.isUndefined(ascentSpeedZoneId) && !_.isUndefined(ascentSpeedZones[ascentSpeedZoneId])) {
                ascentSpeedZones[ascentSpeedZoneId]['s'] += ascentSpeedMeterPerHourTime[j];
            }
        }

        // Finalize compute of Elevation
        var avgElevation = accumulatedElevation / elevationSampleCount;

        var ascentSpeedMeterPerHourSamplesSorted = ascentSpeedMeterPerHourSamples.sort(function(a, b) {
            return a - b;
        });

        var avgAscentSpeed = ascentSpeedMeterPerHourSum / ascentSpeedMeterPerHourSamples.length;

        // Update zone distribution percentage
        elevationZones = this.finalizeDistribComputationZones(elevationZones);
        ascentSpeedZones = this.finalizeDistribComputationZones(ascentSpeedZones);

        var percentilesElevation = Helper.weightedPercentiles(elevationSamples, elevationSamplesDistance, [ 0.25, 0.5, 0.75 ]);
        var percentilesAscent = Helper.weightedPercentiles(ascentSpeedMeterPerHourSamples, ascentSpeedMeterPerHourDistance, [ 0.25, 0.5, 0.75 ]);

        return {
            'avgElevation': avgElevation.toFixed(0),
            'accumulatedElevationAscent': accumulatedElevationAscent,
            'accumulatedElevationDescent': accumulatedElevationDescent,
            'lowerQuartileElevation': percentilesElevation[0].toFixed(0),
            'medianElevation': percentilesElevation[1].toFixed(0),
            'upperQuartileElevation': percentilesElevation[2].toFixed(0),
            'elevationZones': elevationZones, // Only while moving
            'ascentSpeedZones': ascentSpeedZones, // Only while moving
            'ascentSpeed': {
                'avg': avgAscentSpeed,
                'lowerQuartile': percentilesAscent[0].toFixed(0),
                'median': percentilesAscent[1].toFixed(0),
                'upperQuartile': percentilesAscent[2].toFixed(0)
            }
        };
    },

    smoothAltitude_: function smoothAltitude(activityStream, stravaElevation) {
        var activityAltitudeArray = activityStream.altitude;
        var distanceArray = activityStream.distance;
        var velocityArray = activityStream.velocity_smooth;
        var smoothingL = 10;
        var smoothingH = 600;
        var smoothing;
        var altitudeArray;
        while (smoothingH - smoothingL >= 1) {
            smoothing = smoothingL + (smoothingH - smoothingL) / 2;
            altitudeArray = this.lowPassDataSmoothing_(activityAltitudeArray, distanceArray, smoothing);
            var totalElevation = 0;
            for (var i = 0; i < altitudeArray.length; i++) { // Loop on samples
                if (i > 0 && velocityArray[i] * 3.6 > VacuumProcessor.movingThresholdKph) {
                    var elevationDiff = altitudeArray[i] - altitudeArray[i - 1];
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
    },

    lowPassDataSmoothing_: function(data, distance, smoothing) {
        // Below algorithm is applied in this method
        // http://phrogz.net/js/framerate-independent-low-pass-filter.html
        if (data && distance) {
            var result = [];
            result[0] = data[0];
            for (i = 1, max = data.length; i < max; i++) {
                if (smoothing === 0) {
                    result[i] = data[i];
                } else {
                    result[i] = result[i - 1] + (distance[i] - distance[i - 1]) * (data[i] - result[i - 1]) / smoothing;
                }
            }
            return result;
        }
    }
};
