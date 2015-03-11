/**
 *   Contructor
 */
function ActivityProcessor(vacuumProcessor, userHrrZones) {
    this.vacuumProcessor_ = vacuumProcessor;
    this.userHrrZones_ = userHrrZones;
}

ActivityProcessor.movingThresholdKph = 3.5; // Kph
ActivityProcessor.cadenceThresholdRpm = 35; // RPMs
ActivityProcessor.cadenceLimitRpm = 125;
ActivityProcessor.defaultBikeWeight = 10; // KGs
ActivityProcessor.cachePrefix = 'stravaplus_activity_';
ActivityProcessor.distributionZoneCount = 18;


/**
 * Define prototype
 */
ActivityProcessor.prototype = {

    /**
     *
     */
    getAnalysisData: function(activityId, userGender, userRestHr, userMaxHr, userFTP, callback) {

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

            console.warn(activityStatsMap);
            console.warn(result);

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

        // Q1 Speed
        // Median Speed
        // Q3 Speed
        // Standard deviation Speed
        var speedData = this.speedData_(activityStatsMap, activityStream.velocity_smooth, activityStream.time);

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

        // Return an array with all that shit...
        return {
            'moveRatio': moveRatio,
            'toughnessScore': toughnessScore,
            'speedData': speedData,
            'powerData': powerData,
            'heartRateData': heartRateData,
            'cadenceData': cadenceData
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

    getZoneFromDistributionStep_: function(value, distributionStep) {
        return parseInt(value / distributionStep);
    },

    /**
     * ...
     */
    speedData_: function(activityStatsMap, velocityArray, timeArray) {

        var rawAvgSpeedSum = 0;
        var speedsNonZero = Array();
        var speedVarianceSum = 0;
        var currentSpeed;

        var speedZones = [];
        var maxSpeed = Math.max.apply(Math, velocityArray) * 3.6;
        var minSpeed = Math.min.apply(Math, velocityArray) * 3.6;
        var distributionStep = (maxSpeed - minSpeed) / ActivityProcessor.distributionZoneCount;
        var durationInSeconds, durationCount = 0;

        for (var i = 0; i < ActivityProcessor.distributionZoneCount; i++) {

            speedZones.push({
                from: distributionStep * i,
                to: distributionStep * (i + 1),
                s: 0,
                percentDistrib: null
            });
        }

        for (var i = 0; i < velocityArray.length; i++) { // Loop on samples

            // Compute speed
            currentSpeed = velocityArray[i] * 3.6; // Multiply by 3.6 to convert to kph; 

            if (currentSpeed != 0) {
                speedsNonZero.push(currentSpeed);
                rawAvgSpeedSum += currentSpeed;

                // Compute variance speed
                speedVarianceSum += Math.pow(currentSpeed, 2);
            }

            // Compute distribution for graph/table
            if (i > 0) {

                durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)

                var speedZoneId = this.getZoneFromDistributionStep_(currentSpeed, distributionStep);

                if (!_.isUndefined(speedZoneId) && !_.isUndefined(speedZones[speedZoneId])) {
                    speedZones[speedZoneId]['s'] += durationInSeconds;
                }

                durationCount += durationInSeconds;
            }

        }

        // Update zone distribution percentage
        for (var zone in speedZones) {
            speedZones[zone]['percentDistrib'] = ((speedZones[zone]['s'] / durationCount).toFixed(4) * 100);
        }

        // Finalize compute of Speed
        var rawAvgSpeed = rawAvgSpeedSum / speedsNonZero.length;
        var varianceSpeed = (speedVarianceSum / speedsNonZero.length) - Math.pow(activityStatsMap.averageSpeed, 2);
        var standardDeviationSpeed = (varianceSpeed > 0) ? Math.sqrt(varianceSpeed) : 0;
        var speedsNonZeroSorted = speedsNonZero.sort(function(a, b) {
            return a - b;
        });


        return {
            'rawAvgSpeed': rawAvgSpeed,
            'avgPace': parseInt(((1 / rawAvgSpeed) * 60 * 60).toFixed(0)), // send in seconds
            'lowerQuartileSpeed': Helper.lowerQuartile(speedsNonZeroSorted),
            'medianSpeed': Helper.median(speedsNonZeroSorted),
            'upperQuartileSpeed': Helper.upperQuartile(speedsNonZeroSorted),
            'varianceSpeed': varianceSpeed,
            'standardDeviationSpeed': standardDeviationSpeed,
            'speedZones': speedZones
        };
    },

    /**
     * ...
     */
    powerData_: function(athleteWeight, hasPowerMeter, userFTP, activityStatsMap, powerArray, velocityArray, timeArray) {

        if (_.isEmpty(powerArray)) {
            return null;
        }

        var accumulatedWattsOnMoveFourRoot = 0;
        var accumulatedWattsOnMove = 0;
        var wattSampleOnMoveCount = 0;
        var wattsSamplesOnMove = [];

        var powerZones = [];
        var maxPower = Math.max.apply(Math, powerArray);
        var minPower = Math.min.apply(Math, powerArray);
        var distributionStep = (maxPower - minPower) / ActivityProcessor.distributionZoneCount;

        var durationInSeconds, durationCount = 0;

        for (var i = 0; i < ActivityProcessor.distributionZoneCount; i++) {

            powerZones.push({
                from: distributionStep * i,
                to: distributionStep * (i + 1),
                s: 0,
                percentDistrib: null
            });
        }

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

                    var powerZoneId = this.getZoneFromDistributionStep_(powerArray[i], distributionStep);

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

        if (_.isUndefined(heartRateArray)) {
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

                TRIMP += durationInMinutes * heartRateReserveAvg * Math.pow(0.64, TRIMPGenderFactor * heartRateReserveAvg);

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

        return {
            'TRIMP': TRIMP,
            'hrrZones': this.userHrrZones_,
            'lowerQuartileHeartRate': Helper.lowerQuartile(heartRateArraySorted),
            'medianHeartRate': Helper.median(heartRateArraySorted),
            'upperQuartileHeartRate': Helper.upperQuartile(heartRateArraySorted),
            'averageHeartRate': activityStatsMap.averageHeartRate,
            'activityHeartRateReserve': Helper.heartRateReserveFromHeartrate(activityStatsMap.averageHeartRate, userMaxHr, userRestHr) * 100,
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

        if (_.isUndefined(cadenceArray) || _.isUndefined(velocityArray)) {
            return null;
        }

        // On Moving
        var cadenceSumOnMoving = 0;
        var cadenceOnMovingCount = 0;
        var cadenceOnMoveSampleCount = 0;
        var movingSampleCount = 0;

        var cadenceZones = [];
        var maxCadence = Math.max.apply(Math, cadenceArray);
        var minCadence = Math.min.apply(Math, cadenceArray);

        // Clamp max cadence value
        if(maxCadence > ActivityProcessor.cadenceLimitRpm) {
            maxCadence = ActivityProcessor.cadenceLimitRpm;
        }

        var distributionStep = (maxCadence - minCadence) / ActivityProcessor.distributionZoneCount;
        var durationInSeconds, durationCount = 0;

        for (var i = 0; i < ActivityProcessor.distributionZoneCount; i++) {

            cadenceZones.push({
                from: distributionStep * i,
                to: distributionStep * (i + 1),
                s: 0,
                percentDistrib: null
            });
        }

        for (var i = 0; i < velocityArray.length; i++) {

            if (velocityArray[i] * 3.6 > ActivityProcessor.movingThresholdKph) {

                // Rider is moving here..
                if (cadenceArray[i] > ActivityProcessor.cadenceThresholdRpm) {

                    // Rider is moving here while cadence
                    cadenceOnMoveSampleCount++;
                    cadenceSumOnMoving += cadenceArray[i];
                    cadenceOnMovingCount++;
                }

                movingSampleCount++;

                // Compute distribution for graph/table
                if (i > 0) {

                    durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)

                    var cadenceZoneId = this.getZoneFromDistributionStep_(cadenceArray[i], distributionStep);
                    if (!_.isUndefined(cadenceZoneId) && !_.isUndefined(cadenceZones[cadenceZoneId])) {
                        cadenceZones[cadenceZoneId]['s'] += durationInSeconds;
                    }

                    durationCount += durationInSeconds;
                }
            }
        }

        var cadenceRatioOnMovingTime = cadenceOnMoveSampleCount / movingSampleCount;
        var averageCadenceOnMovingTime = cadenceSumOnMoving / cadenceOnMovingCount;

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
            'crankRevolutions': (averageCadenceOnMovingTime / 60 * activityStatsMap.movingTime),
            'lowerQuartileCadence': Helper.lowerQuartile(cadenceArraySorted),
            'medianCadence': Helper.median(cadenceArraySorted),
            'upperQuartileCadence': Helper.upperQuartile(cadenceArraySorted),
            'cadenceZones': cadenceZones
        };
    },
};
