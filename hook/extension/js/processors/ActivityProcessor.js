/**
 *   Contructor
 */
function ActivityProcessor(vacuumProcessor) {
    this.vacuumProcessor_ = vacuumProcessor;
}

ActivityProcessor.movingThresholdKph = 5; // Kph
ActivityProcessor.cadenceThresholdRpm = 35; // RPMs
ActivityProcessor.defaultBikeWeight = 10; // KGs
ActivityProcessor.cachePrefix = 'stravaplus_activity_';

/**
 * Define prototype
 */
ActivityProcessor.prototype = {

    /**
     *
     */
    getAnalysisData: function getAnalysisData(activityId, userGender, userRestHr, userMaxHr, userFTP, callback) {

        // Find in cache first is data exist
        var cacheResult = JSON.parse(localStorage.getItem(ActivityProcessor.cachePrefix + activityId));

        if (!_.isNull(cacheResult) && !StravaPlus.debugMode) {
            if (StravaPlus.debugMode) console.log("Using existing activity cache in non debug mode: " + JSON.stringify(cacheResult));
            callback(cacheResult);
            return;
        }

        // Else no cache... then call VacuumProcessor for getting data, compute them and cache them
        this.vacuumProcessor_.getActivityStream(function(activityStatsMap, activityStream, athleteWeight) { // Get stream on page

            var result = this.computeAnalysisData_(userGender, userRestHr, userMaxHr, userFTP, athleteWeight, activityStatsMap, activityStream);

            if (StravaPlus.debugMode) console.log("Creating activity cache: " + JSON.stringify(result));

            localStorage.setItem(ActivityProcessor.cachePrefix + activityId, JSON.stringify(result)); // Cache the result to local storage
            callback(result);

        }.bind(this));
    },

    computeAnalysisData_: function computeAnalysisData_(userGender, userRestHr, userMaxHr, userFTP, athleteWeight, activityStatsMap, activityStream) {

        // Move ratio
        var moveRatio = this.moveRatio_(activityStatsMap, activityStream);

        // Toughness score
        var toughnessScore = this.toughnessScore_(activityStatsMap, activityStream, moveRatio);

        // Q1 Speed
        // Median Speed
        // Q3 Speed
        // Standard deviation Speed
        var speedData = this.speedData_(activityStatsMap, activityStream.velocity_smooth);

        // Estimated Normalized power
        // Estimated Variability index
        // Estimated Intensity factor
        // Normalized Watt per Kg
        var powerData = this.powerData_(athleteWeight, userFTP, activityStatsMap, activityStream.watts, activityStream.velocity_smooth);

        // TRaining IMPulse
        // %HRR Avg
        // %HRR Zones
        // Q1 HR
        // Median HR
        // Q3 HR
        var heartRateData = this.heartRateData_(userGender, userRestHr, userMaxHr, activityStream.heartrate, activityStream.time, activityStatsMap);

        // Pedaling percentage
        // Time Pedaling
        // Crank revolution
        var pedalingData = this.pedalingData_(activityStream.cadence, activityStream.velocity_smooth, activityStatsMap);

        // Return an array with all that shit...
        return {
            'moveRatio': moveRatio,
            'toughnessScore': toughnessScore,
            'speedData': speedData,
            'powerData': powerData,
            'heartRateData': heartRateData,
            'pedalingData': pedalingData
        };
    },

    /**
     * ...
     */
    moveRatio_: function moveRatio_(activityStatsMap, activityStream) {

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
    toughnessScore_: function toughnessScore_(activityStatsMap, activityStream, moveRatio) {

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

    /**
     * ...
     */
    speedData_: function speedData_(activityStatsMap, velocityArray) {

        var rawAvgSpeedSum = 0;
        var speedsNonZero = Array();
        var speedVarianceSum = 0;
        var currentSpeed;

        for (var i = 0; i < velocityArray.length; i++) { // Loop on samples

            // Compute speed
            currentSpeed = velocityArray[i] * 3.6;

            if (currentSpeed != 0) { // Multiply by 3.6 to convert to kph; 
                speedsNonZero.push(currentSpeed);
                rawAvgSpeedSum += currentSpeed;

                // Compute variance speed
                speedVarianceSum += Math.pow(currentSpeed, 2);
            }

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
            'lowerQuartileSpeed': Helper.lowerQuartile(speedsNonZeroSorted),
            'medianSpeed': Helper.median(speedsNonZeroSorted),
            'upperQuartileSpeed': Helper.upperQuartile(speedsNonZeroSorted),
            'varianceSpeed': varianceSpeed,
            'standardDeviationSpeed': standardDeviationSpeed,
        };
    },

    /**
     * ...
     */
    powerData_: function powerData_(athleteWeight, userFTP, activityStatsMap, powerArray, velocityArray) {

        if (_.isEmpty(powerArray)) {
            return null;
        }

        var accumulatedWattsOnMoveFourRoot = 0;
        var accumulatedWattsOnMove = 0;
        var wattSampleOnMoveCount = 0;

        for (var i = 0; i < powerArray.length; i++) { // Loop on samples

            if (velocityArray[i] * 3.6 > ActivityProcessor.movingThresholdKph) {
                // Compute average and normalized power
                accumulatedWattsOnMoveFourRoot += Math.pow(powerArray[i], 3.925);
                accumulatedWattsOnMove += powerArray[i];
                wattSampleOnMoveCount++;
            }
        }

        // Finalize compute of Power
        var avgWatts = accumulatedWattsOnMove / wattSampleOnMoveCount;
        var normalizedPower = Math.sqrt(Math.sqrt(accumulatedWattsOnMoveFourRoot / wattSampleOnMoveCount));
        var variabilityIndex = normalizedPower / avgWatts;
        var intensityFactor = (_.isEmpty(userFTP)) ? null : (normalizedPower / userFTP);
        var normalizedWattsPerKg = normalizedPower / (athleteWeight + ActivityProcessor.defaultBikeWeight);

        return {
            'avgWatts': avgWatts,
            'normalizedPower': normalizedPower,
            'variabilityIndex': variabilityIndex,
            'intensityFactor': intensityFactor,
            'normalizedWattsPerKg': normalizedWattsPerKg,
        };

    },

    /**
     * ...
     */
    heartRateData_: function heartRateData_(userGender, userRestHr, userMaxHr, heartRateArray, timeArray, activityStatsMap) {

        if (_.isUndefined(heartRateArray)) {
            return null;
        }

        // For heartrate related data.
        var hrrZones = { //TODO Move out this?
            'z1': {
                's': 0,
                'percentDistrib': null,
                'fromHrr': 0,
                'toHrr': 0.3,
                'fromHr': null,
                'toHr': null,
            },
            'z2': {
                's': 0,
                'percentDistrib': null,
                'fromHrr': 0.3,
                'toHrr': 0.4,
                'fromHr': null,
                'toHr': null,
            },
            'z3': {
                's': 0,
                'percentDistrib': null,
                'fromHrr': 0.4,
                'toHrr': 0.5,
                'fromHr': null,
                'toHr': null,
            },
            'z4': {
                's': 0,
                'percentDistrib': null,
                'fromHrr': 0.5,
                'toHrr': 0.6,
                'fromHr': null,
                'toHr': null,
            },
            'z5': {
                's': 0,
                'percentDistrib': null,
                'fromHrr': 0.6,
                'toHrr': 0.7,
                'fromHr': null,
                'toHr': null,
            },
            'z6': {
                's': 0,
                'percentDistrib': null,
                'fromHrr': 0.7,
                'toHrr': 0.8,
                'fromHr': null,
                'toHr': null,
            },
            'z7': {
                's': 0,
                'percentDistrib': null,
                'fromHrr': 0.8,
                'toHrr': 0.9,
                'fromHr': null,
                'toHr': null,
            },
            'z8': {
                's': 0,
                'percentDistrib': null,
                'fromHrr': 0.9,
                'toHrr': 1.0,
                'fromHr': null,
                'toHr': null,
            },
        };

        var TRIMP = 0;
        var TRIMPGenderFactor = (userGender == 'men') ? 1.92 : 1.67;
        var hrrSecondsCount = 0;

        // Find HR for each Hrr of each zones
        for (var zone in hrrZones) {
            hrrZones[zone]['fromHr'] = Helper.heartrateFromHeartRateReserve(hrrZones[zone]['fromHrr'], userMaxHr, userRestHr);
            hrrZones[zone]['toHr'] = Helper.heartrateFromHeartRateReserve(hrrZones[zone]['toHrr'], userMaxHr, userRestHr);
        }

        for (var i = 0; i < heartRateArray.length; i++) { // Loop on samples

            // Compute heartrate data
            if (i > 0) {
                // Compute TRIMP
                var hr = (heartRateArray[i] + heartRateArray[i - 1]) / 2; // Getting HR avg between current sample and previous one.
                var heartRateReserveAvg = Helper.heartRateReserveFromHeartrate(hr, userMaxHr, userRestHr); //(hr - userSettings.userRestHr) / (userSettings.userMaxHr - userSettings.userRestHr);
                var durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)
                var durationInMinutes = durationInSeconds / 60;

                TRIMP += durationInMinutes * heartRateReserveAvg * Math.pow(0.64, TRIMPGenderFactor * heartRateReserveAvg);

                // Count Heart Rate Reserve distribution
                if (heartRateReserveAvg < hrrZones['z1']['toHrr']) { // Z1
                    hrrZones['z1']['s'] += durationInSeconds;
                } else if (heartRateReserveAvg >= hrrZones['z2']['fromHrr'] && heartRateReserveAvg < hrrZones['z2']['toHrr']) { // Z2
                    hrrZones['z2']['s'] += durationInSeconds;
                } else if (heartRateReserveAvg >= hrrZones['z3']['fromHrr'] && heartRateReserveAvg < hrrZones['z3']['toHrr']) { // Z3
                    hrrZones['z3']['s'] += durationInSeconds;
                } else if (heartRateReserveAvg >= hrrZones['z4']['fromHrr'] && heartRateReserveAvg < hrrZones['z4']['toHrr']) { // Z4
                    hrrZones['z4']['s'] += durationInSeconds;
                } else if (heartRateReserveAvg >= hrrZones['z5']['fromHrr'] && heartRateReserveAvg < hrrZones['z5']['toHrr']) { // Z5
                    hrrZones['z5']['s'] += durationInSeconds;
                } else if (heartRateReserveAvg >= hrrZones['z6']['fromHrr'] && heartRateReserveAvg < hrrZones['z6']['toHrr']) { // Z5
                    hrrZones['z6']['s'] += durationInSeconds;
                } else if (heartRateReserveAvg >= hrrZones['z7']['fromHrr'] && heartRateReserveAvg < hrrZones['z7']['toHrr']) { // Z5
                    hrrZones['z7']['s'] += durationInSeconds;
                } else if (heartRateReserveAvg >= hrrZones['z8']['fromHrr'] && heartRateReserveAvg < hrrZones['z8']['toHrr']) { // Z5
                    hrrZones['z8']['s'] += durationInSeconds;
                }

                hrrSecondsCount += durationInSeconds;
            }
        }


        var heartRateArraySorted = heartRateArray.sort(function(a, b) {
            return a - b;
        });

        // Update zone distribution percentage
        for (var zone in hrrZones) {
            hrrZones[zone]['percentDistrib'] = ((hrrZones[zone]['s'] / hrrSecondsCount).toFixed(2) * 100);
        }

        return {
            'TRIMP': TRIMP,
            'hrrZones': hrrZones,
            'lowerQuartileHeartRate': Helper.lowerQuartile(heartRateArraySorted),
            'medianHeartRate': Helper.median(heartRateArraySorted),
            'upperQuartileHeartRate': Helper.upperQuartile(heartRateArraySorted),
            'activityHeartRateReserve': Helper.heartRateReserveFromHeartrate(activityStatsMap.averageHeartRate, userMaxHr, userRestHr) * 100,
        };

    },

    pedalingData_: function pedalingData_(cadenceArray, velocityArray, activityStatsMap) {

        if (_.isUndefined(cadenceArray) || _.isUndefined(velocityArray)) {
            return null;
        }

        // On Moving
        var cadenceSumOnMoving = 0;
        var cadenceOnMovingCount = 0;
        var pedalingOnMoveSampleCount = 0;
        var movingSampleCount = 0;

        for (var i = 0; i < velocityArray.length; i++) {

            if (velocityArray[i] * 3.6 > ActivityProcessor.movingThresholdKph) {

                // Rider is moving here..

                if (cadenceArray[i] > ActivityProcessor.cadenceThresholdRpm) {

                    // Rider is moving here while pedaling
                    pedalingOnMoveSampleCount++;
                    cadenceSumOnMoving += cadenceArray[i];
                    cadenceOnMovingCount++;
                }

                movingSampleCount++;
            }
        }

        var pedalingRatioOnMovingTime = pedalingOnMoveSampleCount / movingSampleCount;
        var averageCadenceOnMovingTime = cadenceSumOnMoving / cadenceOnMovingCount;

        return {
            'pedalingPercentageMoving': pedalingRatioOnMovingTime * 100, // TODO OnMove
            'pedalingTimeMoving': (pedalingRatioOnMovingTime * activityStatsMap.movingTime),
            'averageCadenceMoving': averageCadenceOnMovingTime,
            'crankRevolutions': (averageCadenceOnMovingTime / 60 * activityStatsMap.movingTime),
        };
    },
};
