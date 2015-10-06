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
        var heartRateData = this.heartRateData_(userGender, userRestHr, userMaxHr, activityStream.heartrate, activityStream.time, activityStatsMap);

        // Cadence percentage
        // Time Cadence
        // Crank revolution
        var cadenceData = this.cadenceData_(activityStream.cadence, activityStream.velocity_smooth, activityStatsMap, activityStream.time);


        // Avg grade
        // Q1/Q2/Q3 grade
        var gradeData = this.gradeData_(activityStream.grade_smooth, activityStream.velocity_smooth, activityStream.time);

        // Avg grade
        // Q1/Q2/Q3 grade
        var elevationData = this.elevationData_(activityStream.altitude, activityStream.grade_smooth, activityStream.time);

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
        var speedVarianceSum = 0;
        var currentSpeed;

        var speedZones = this.prepareZonesForDistribComputation(this.zones.speed);
        var paceZones = this.prepareZonesForDistribComputation(this.zones.pace);

        var durationInSeconds = 0,
            durationCount = 0;

        // End Preparing zone
        for (var i = 0; i < velocityArray.length; i++) { // Loop on samples

            // Compute speed
            currentSpeed = velocityArray[i] * 3.6; // Multiply by 3.6 to convert to kph; 

            if (currentSpeed > 0) { // If moving...

                speedsNonZero.push(currentSpeed);

                genuineAvgSpeedSum += currentSpeed;
                genuineAvgSpeedSumCount++;

                // Compute variance speed
                speedVarianceSum += Math.pow(currentSpeed, 2);

                // Compute distribution for graph/table
                if (i > 0) {

                    durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)

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

                    durationCount += durationInSeconds;
                }
            }
        }

        // Update zone distribution percentage
        for (var zone in speedZones) {
            speedZones[zone]['percentDistrib'] = ((speedZones[zone]['s'] / durationCount).toFixed(4) * 100);
        }
        for (var zone in paceZones) {
            paceZones[zone]['percentDistrib'] = ((paceZones[zone]['s'] / durationCount).toFixed(4) * 100);
        }

        // Finalize compute of Speed
        var genuineAvgSpeed = genuineAvgSpeedSum / genuineAvgSpeedSumCount;
        var varianceSpeed = (speedVarianceSum / speedsNonZero.length) - Math.pow(activityStatsMap.averageSpeed, 2);
        var standardDeviationSpeed = (varianceSpeed > 0) ? Math.sqrt(varianceSpeed) : 0;
        var speedsNonZeroSorted = speedsNonZero.sort(function(a, b) {
            return a - b;
        });


        return [{
            'genuineAvgSpeed': genuineAvgSpeed,
            'avgPace': parseInt(((1 / genuineAvgSpeed) * 60 * 60).toFixed(0)), // send in seconds
            'lowerQuartileSpeed': Helper.lowerQuartile(speedsNonZeroSorted),
            'medianSpeed': Helper.median(speedsNonZeroSorted),
            'upperQuartileSpeed': Helper.upperQuartile(speedsNonZeroSorted),
            'varianceSpeed': varianceSpeed,
            'standardDeviationSpeed': standardDeviationSpeed,
            'speedZones': speedZones
        }, {
            'lowerQuartilePace': this.convertSpeedToPace(Helper.lowerQuartile(speedsNonZeroSorted)),
            'medianPace': this.convertSpeedToPace(Helper.median(speedsNonZeroSorted)),
            'upperQuartilePace': this.convertSpeedToPace(Helper.upperQuartile(speedsNonZeroSorted)),
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

        var powerZones = this.prepareZonesForDistribComputation(this.zones.power);

        var durationInSeconds, durationCount = 0;

        for (var i = 0; i < powerArray.length; i++) { // Loop on samples

            if (velocityArray[i] * 3.6 > ActivityProcessor.movingThresholdKph) {
                // Compute average and normalized power
                accumulatedWattsOnMoveFourRoot += Math.pow(powerArray[i], 3.925);
                accumulatedWattsOnMove += powerArray[i];
                wattSampleOnMoveCount++;
                wattsSamplesOnMove.push(powerArray[i]);

                // Compute distribution for graph/table
                if (i > 0) {

                    durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)

                    var powerZoneId = this.getZoneId(this.zones.power, powerArray[i]);

                    if (!_.isUndefined(powerZoneId) && !_.isUndefined(powerZones[powerZoneId])) {
                        powerZones[powerZoneId]['s'] += durationInSeconds;
                    }

                    durationCount += durationInSeconds;
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
        var wattsSamplesOnMoveSorted = wattsSamplesOnMove.sort(function(a, b) {
            return a - b;
        });

        // Update zone distribution percentage
        for (var zone in powerZones) {
            powerZones[zone]['percentDistrib'] = ((powerZones[zone]['s'] / durationCount).toFixed(4) * 100);
        }

        return {
            'hasPowerMeter': hasPowerMeter,
            'avgWatts': avgWatts,
            'weightedPower': weightedPower,
            'variabilityIndex': variabilityIndex,
            'punchFactor': punchFactor,
            'weightedWattsPerKg': weightedWattsPerKg,
            'lowerQuartileWatts': Helper.lowerQuartile(wattsSamplesOnMoveSorted),
            'medianWatts': Helper.median(wattsSamplesOnMoveSorted),
            'upperQuartileWatts': Helper.upperQuartile(wattsSamplesOnMoveSorted),
            'powerZones': powerZones // Only while moving
        };

    },

    /**
     * ...
     */
    heartRateData_: function(userGender, userRestHr, userMaxHr, heartRateArray, timeArray, activityStatsMap) {

        if (_.isEmpty(heartRateArray) || _.isEmpty(timeArray)) {
            return null;
        }

        var TRIMP = 0;
        var TRIMPGenderFactor = (userGender == 'men') ? 1.92 : 1.67;
        var hrrSecondsCount = 0;
        var hrrZonesCount = Object.keys(this.userHrrZones_).length;
        var hr, heartRateReserveAvg, durationInSeconds, durationInMinutes, zoneId;
        var hrSum = 0;
        var hrCount = 0;

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

            // Compute heartrate data
            if (i > 0) {

                hrSum += heartRateArray[i];

                // Compute TRIMP
                hr = (heartRateArray[i] + heartRateArray[i - 1]) / 2; // Getting HR avg between current sample and previous one.
                heartRateReserveAvg = Helper.heartRateReserveFromHeartrate(hr, userMaxHr, userRestHr); //(hr - userSettings.userRestHr) / (userSettings.userMaxHr - userSettings.userRestHr);
                durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)
                durationInMinutes = durationInSeconds / 60;

                // TRIMP += durationInMinutes * heartRateReserveAvg * Math.pow(0.64, TRIMPGenderFactor * heartRateReserveAvg);
                TRIMP += durationInMinutes * heartRateReserveAvg * 0.64 * Math.exp(TRIMPGenderFactor * heartRateReserveAvg);

                // Count Heart Rate Reserve distribution
                zoneId = this.getHrrZoneId(hrrZonesCount, heartRateReserveAvg * 100);

                if (!_.isUndefined(zoneId)) {
                    this.userHrrZones_[zoneId]['s'] += durationInSeconds;
                }

                hrrSecondsCount += durationInSeconds;
                hrCount++;
            }
        }

        var heartRateArraySorted = heartRateArray.sort(function(a, b) {
            return a - b;
        });

        // Update zone distribution percentage
        for (var zone in this.userHrrZones_) {
            this.userHrrZones_[zone]['percentDistrib'] = ((this.userHrrZones_[zone]['s'] / hrrSecondsCount).toFixed(4) * 100);
        }

        activityStatsMap.averageHeartRate = hrSum / hrCount;
        activityStatsMap.maxHeartRate = heartRateArraySorted[heartRateArraySorted.length - 1];

        var TRIMPPerHour = TRIMP / hrrSecondsCount * 60 * 60;

        return {
            'TRIMP': TRIMP,
            'TRIMPPerHour': TRIMPPerHour,
            'hrrZones': this.userHrrZones_,
            'lowerQuartileHeartRate': Helper.lowerQuartile(heartRateArraySorted),
            'medianHeartRate': Helper.median(heartRateArraySorted),
            'upperQuartileHeartRate': Helper.upperQuartile(heartRateArraySorted),
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

        // On Moving
        var cadenceSumOnMoving = 0;
        var cadenceVarianceSumOnMoving = 0;
        var cadenceOnMovingCount = 0;
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

        var durationInSeconds = 0,
            durationCount = 0;

        for (var i = 0; i < velocityArray.length; i++) {

            if (velocityArray[i] * 3.6 > ActivityProcessor.movingThresholdKph) {

                // Rider is moving here..
                if (cadenceArray[i] > ActivityProcessor.cadenceThresholdRpm) {

                    // Rider is moving here while cadence
                    cadenceOnMoveSampleCount++;
                    cadenceSumOnMoving += cadenceArray[i];
                    cadenceVarianceSumOnMoving += Math.pow(cadenceArray[i], 2);
                    cadenceOnMovingCount++;
                }

                movingSampleCount++;

                // Compute distribution for graph/table
                if (i > 0) {

                    durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)

                    var cadenceZoneId = this.getZoneId(cadenceZoneTyped, cadenceArray[i]);

                    if (!_.isUndefined(cadenceZoneId) && !_.isUndefined(cadenceZones[cadenceZoneId])) {
                        cadenceZones[cadenceZoneId]['s'] += durationInSeconds;
                    }

                    durationCount += durationInSeconds;
                }
            }
        }

        var cadenceRatioOnMovingTime = cadenceOnMoveSampleCount / movingSampleCount;
        var averageCadenceOnMovingTime = cadenceSumOnMoving / cadenceOnMovingCount;


        var varianceCadence = (cadenceVarianceSumOnMoving / cadenceOnMoveSampleCount) - Math.pow(averageCadenceOnMovingTime, 2);
        var standardDeviationCadence = (varianceCadence > 0) ? Math.sqrt(varianceCadence) : 0;

        // Update zone distribution percentage
        for (var zone in cadenceZones) {
            cadenceZones[zone]['percentDistrib'] = ((cadenceZones[zone]['s'] / durationCount).toFixed(4) * 100);
        }

        var cadenceArraySorted = cadenceArray.sort(function(a, b) {
            return a - b;
        });

        return {
            'cadencePercentageMoving': cadenceRatioOnMovingTime * 100,
            'cadenceTimeMoving': (cadenceRatioOnMovingTime * activityStatsMap.movingTime),
            'averageCadenceMoving': averageCadenceOnMovingTime,
            'standardDeviationCadence': standardDeviationCadence.toFixed(1),
            'crankRevolutions': (averageCadenceOnMovingTime / 60 * activityStatsMap.movingTime),
            'lowerQuartileCadence': Helper.lowerQuartile(cadenceArraySorted),
            'medianCadence': Helper.median(cadenceArraySorted),
            'upperQuartileCadence': Helper.upperQuartile(cadenceArraySorted),
            'cadenceZones': cadenceZones
        };
    },

    gradeData_: function(gradeArray, velocityArray, timeArray) {

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
            down: 0,
            count: {
                up: 0,
                flat: 0,
                down: 0,
            }
        };

        var durationInSeconds, durationCount = 0;
        var currentSpeed;

        for (var i = 0; i < gradeArray.length; i++) { // Loop on samples

            gradeSum += gradeArray[i];
            gradeCount++;

            // Compute distribution for graph/table
            if (i > 0) {

                currentSpeed = velocityArray[i] * 3.6; // Multiply by 3.6 to convert to kph; 

                if (currentSpeed > 0) { // If moving...

                    durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)

                    var gradeZoneId = this.getZoneId(this.zones.grade, gradeArray[i]);

                    if (!_.isUndefined(gradeZoneId) && !_.isUndefined(gradeZones[gradeZoneId])) {
                        gradeZones[gradeZoneId]['s'] += durationInSeconds;
                    }

                    durationCount += durationInSeconds;

                    // Compute DOWN/FLAT/UP duration
                    if (gradeArray[i] > ActivityProcessor.gradeClimbingLimit) { // UPHILL
                        upFlatDownInSeconds.up += durationInSeconds;
                        upFlatDownMoveData.up += currentSpeed;
                        upFlatDownMoveData.count.up++;
                    } else if (gradeArray[i] < ActivityProcessor.gradeDownHillLimit) { // DOWNHILL
                        upFlatDownInSeconds.down += durationInSeconds;
                        upFlatDownMoveData.down += currentSpeed;
                        upFlatDownMoveData.count.down++;
                    } else { // FLAT
                        upFlatDownInSeconds.flat += durationInSeconds;
                        upFlatDownMoveData.flat += currentSpeed;
                        upFlatDownMoveData.count.flat++;
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
        upFlatDownMoveData.up = upFlatDownMoveData.up / upFlatDownMoveData.count.up;
        upFlatDownMoveData.down = upFlatDownMoveData.down / upFlatDownMoveData.count.down;
        upFlatDownMoveData.flat = upFlatDownMoveData.flat / upFlatDownMoveData.count.flat;

        var avgGrade = gradeSum / gradeCount;

        var gradeSortedSamples = gradeArray.sort(function(a, b) {
            return a - b;
        });

        // Update zone distribution percentage
        for (var zone in gradeZones) {
            gradeZones[zone]['percentDistrib'] = ((gradeZones[zone]['s'] / durationCount).toFixed(4) * 100);
        }

        return {
            'avgGrade': avgGrade,
            'lowerQuartileGrade': Helper.lowerQuartile(gradeSortedSamples),
            'medianGrade': Helper.median(gradeSortedSamples),
            'upperQuartileGrade': Helper.upperQuartile(gradeSortedSamples),
            'gradeZones': gradeZones,
            'upFlatDownInSeconds': upFlatDownInSeconds,
            'upFlatDownMoveData': upFlatDownMoveData,
            'gradeProfile': gradeProfile
        };

    },

    elevationData_: function(altitudeArray, gradeArray, timeArray) {

        if (_.isEmpty(altitudeArray) || _.isEmpty(gradeArray) || _.isEmpty(timeArray)) {
            return null;
        }

        var accumulatedElevation = 0;
        var accumulatedElevationAscent = 0;
        var ascentSpeedMeterPerHourSamples = [];
        var ascentSpeedMeterPerHourSum = 0;
        var elevationSampleCount = 0;
        var elevationSamples = [];
        var elevationZones = this.prepareZonesForDistribComputation(this.zones.elevation);
        var durationInSeconds, durationCount = 0;
        var ascentCountEverySample = 10;
        var ascentDurationInSeconds = 0;

        for (var i = 0; i < altitudeArray.length; i++) { // Loop on samples

            // Compute distribution for graph/table
            if (i > 0) {

                // Compute average and normalized elevation
                accumulatedElevation += altitudeArray[i];
                elevationSampleCount++;
                elevationSamples.push(altitudeArray[i]);

                durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)

                var elevationZoneId = this.getZoneId(this.zones.elevation, altitudeArray[i]);

                if (!_.isUndefined(elevationZoneId) && !_.isUndefined(elevationZones[elevationZoneId])) {
                    elevationZones[elevationZoneId]['s'] += durationInSeconds;
                }

                durationCount += durationInSeconds;

                // Compute elevation diff each ascentCountEverySample
                if ((i % ascentCountEverySample) == 0) {

                    // Meters climbed between current and sample at ascentCountEverySample position lower.
                    var elevationDiff = altitudeArray[i] - altitudeArray[i - ascentCountEverySample];

                    // If previous altitude lower than current then => climbing
                    if (elevationDiff > 0) {

                        // Take time from 'ascentCountEverySample' last samples 
                        for (j = 0; j < ascentCountEverySample; j++) {
                            ascentDurationInSeconds += timeArray[i - j] - timeArray[i - j - 1];
                        }

                        accumulatedElevationAscent += elevationDiff;
                        var ascentSpeedMeterPerHour = elevationDiff / ascentDurationInSeconds * 3600; // m climbed / seconds

                        ascentSpeedMeterPerHourSamples.push(ascentSpeedMeterPerHour);
                        ascentSpeedMeterPerHourSum += ascentSpeedMeterPerHour;
                        ascentDurationInSeconds = 0; // reset for next loop
                    }
                }
            }
        }

        // Finalize compute of Elevation
        var avgElevation = accumulatedElevation / elevationSampleCount;


        var elevationSamplesSorted = elevationSamples.sort(function(a, b) {
            return a - b;
        });

        var ascentSpeedMeterPerHourSamplesSorted = ascentSpeedMeterPerHourSamples.sort(function(a, b) {
            return a - b;
        });

        var avgAscentSpeed = ascentSpeedMeterPerHourSum / ascentSpeedMeterPerHourSamples.length;

        // Update zone distribution percentage
        for (var zone in elevationZones) {
            elevationZones[zone]['percentDistrib'] = ((elevationZones[zone]['s'] / durationCount).toFixed(4) * 100);
        }

        return {
            'avgElevation': avgElevation.toFixed(0),
            'lowerQuartileElevation': Helper.lowerQuartile(elevationSamplesSorted).toFixed(0),
            'medianElevation': Helper.median(elevationSamplesSorted).toFixed(0),
            'upperQuartileElevation': Helper.upperQuartile(elevationSamplesSorted).toFixed(0),
            'elevationZones': elevationZones, // Only while moving
            'ascentSpeed': {
                'avg': avgAscentSpeed,
                'lowerQuartile': Helper.lowerQuartile(ascentSpeedMeterPerHourSamplesSorted).toFixed(0),
                'median': Helper.median(ascentSpeedMeterPerHourSamplesSorted).toFixed(0),
                'upperQuartile': Helper.upperQuartile(ascentSpeedMeterPerHourSamplesSorted).toFixed(0)
            }
        };
    }
};
