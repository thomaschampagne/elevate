// Worker function exectued by the main UI Thread
function ComputeAnalysisWorker() {

    // required dependencies for worker job
    this.required = [
        '/js/Helper.js',
        '/node_modules/fiber/src/fiber.min.js',
        '/node_modules/underscore/underscore-min.js'
    ];

    // Constant definition
    this.constants = {};
    this.constants.movingThresholdKph = 3.5; // Kph
    this.constants.cadenceThresholdRpm = 35; // RPMs
    this.constants.cadenceLimitRpm = 125;
    this.constants.gradeClimbingLimit = 1.6;
    this.constants.gradeDownHillLimit = -1.6;
    this.constants.gradeProfileFlatPercentageDetected = 60;
    this.constants.gradeProfileFlat = 'FLAT';
    this.constants.gradeProfileHilly = 'HILLY';
    this.constants.ascentSpeedGradeLimit = this.constants.gradeClimbingLimit;

    // Acces this by self everywhere !
    var self = this;

    // Message received from main script
    // Lets begin that ******* compute !
    this.onmessage = function(mainThreadEvent) {

        // Import required dependencies for worker job
        self.importRequiredLibraries(self.required, mainThreadEvent.data.appResources.extensionId);

        var AnalysisActivityComputer = Fiber.extend(function(base) {

            return {

                init: function(activityType, isTrainer, userSettings, params) {

                    // Store activityType, isTrainer, input activity params and userSettings
                    this.activityType = activityType;
                    this.isTrainer = isTrainer;
                    this.params = params;
                    this.userSettings = userSettings;
                },

                compute: function() {

                    // Append altitude_smooth to fetched strava activity stream before compute analysis data
                    this.params.activityStream.altitude_smooth = this.smoothAltitudeStream(this.params.activityStream, this.params.activityStatsMap);

                    // Slices array stream if activity bounds are given.
                    // It's mainly used for segment effort extended stats
                    this.sliceStreamFromBounds(this.params.activityStream, this.params.bounds);

                    return this.computeAnalysisData(this.userSettings.userGender, this.userSettings.userRestHr, this.userSettings.userMaxHr, this.userSettings.userFTP, this.params.athleteWeight, this.params.hasPowerMeter, this.params.activityStatsMap, this.params.activityStream);
                },

                sliceStreamFromBounds: function(activityStream, bounds) {

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

                    return activityStream;
                },

                smoothAltitudeStream: function(activityStream, activityStatsMap) {
                    return this.smoothAltitude(activityStream, activityStatsMap.elevation);
                },

                computeAnalysisData: function(userGender, userRestHr, userMaxHr, userFTP, athleteWeight, hasPowerMeter, activityStatsMap, activityStream) {


                    // Include speed and pace
                    this.moveData = null;

                    if (activityStream.velocity_smooth) {
                        this.moveData = this.moveData_(activityStatsMap, activityStream.velocity_smooth, activityStream.time);
                    }

                    // Q1 Speed
                    // Median Speed
                    // Q3 Speed
                    // Standard deviation Speed
                    var speedData = (_.isEmpty(this.moveData)) ? null : this.moveData.speed;

                    // Q1 Pace
                    // Median Pace
                    // Q3 Pace
                    // Standard deviation Pace
                    var paceData = (_.isEmpty(this.moveData)) ? null : this.moveData.pace;

                    var moveRatio = (_.isEmpty(this.moveData)) ? null : this.moveRatio_(this.moveData.movingTime, this.moveData.elapsedTime);

                    // Toughness score
                    var toughnessScore = this.toughnessScore_(activityStatsMap, activityStream, moveRatio);

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

                moveRatio_: function(movingTime, elapsedTime) {

                    if (_.isNull(movingTime) || _.isNull(elapsedTime)) {
                        Helper.log('WARN', 'Unable to compute ActivityRatio on this activity with following data: ' + JSON.stringify(activityStatsMap));
                        return null;
                    }

                    var ratio = movingTime / elapsedTime;

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
                    for (var zone in sourceZones) {
                        sourceZones[zone].s = 0;
                        sourceZones[zone].percentDistrib = null;
                        preparedZones.push(sourceZones[zone]);
                    }
                    return preparedZones;
                },

                finalizeDistribComputationZones: function(zones) {
                    var total = 0;
                    var zone;
                    for (var i = 0; i < zones.length; i++) {

                        zone = zones[i];
                        if (zone.s) {
                            total += zone.s;
                        }
                        zone.percentDistrib = 0;
                    }
                    if (total > 0) {
                        for (i = 0; i < zones.length; i++) {
                            zone = zones[i];

                            if (zone.s) {
                                zone.percentDistrib = ((zone.s / total).toFixed(4) * 100);
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

                    var speedZones = this.prepareZonesForDistribComputation(this.userSettings.zones.speed);
                    var paceZones = this.prepareZonesForDistribComputation(this.userSettings.zones.pace);

                    var movingSeconds = 0;
                    var elapsedSeconds = 0;

                    // End Preparing zone
                    for (var i = 0; i < velocityArray.length; i++) { // Loop on samples

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
                                genuineAvgSpeedSum += this.valueForSum_(velocityArray[i] * 3.6, velocityArray[i - 1] * 3.6, movingSeconds);
                                // time
                                genuineAvgSpeedSumCount += movingSeconds;

                                // Find speed zone id
                                var speedZoneId = this.getZoneId(this.userSettings.zones.speed, currentSpeed);
                                if (!_.isUndefined(speedZoneId) && !_.isUndefined(speedZones[speedZoneId])) {
                                    speedZones[speedZoneId].s += movingSeconds;
                                }

                                // Find pace zone
                                var paceZoneId = this.getZoneId(this.userSettings.zones.pace, this.convertSpeedToPace(currentSpeed));
                                if (!_.isUndefined(paceZoneId) && !_.isUndefined(paceZones[paceZoneId])) {
                                    paceZones[paceZoneId].s += movingSeconds;
                                }

                            }
                        }
                    }

                    // Update zone distribution percentage
                    speedZones = this.finalizeDistribComputationZones(speedZones);
                    paceZones = this.finalizeDistribComputationZones(paceZones);

                    // Finalize compute of Speed
                    var genuineAvgSpeed = genuineAvgSpeedSum / genuineAvgSpeedSumCount;
                    var varianceSpeed = (speedVarianceSum / speedsNonZero.length) - Math.pow(genuineAvgSpeed, 2);
                    var standardDeviationSpeed = (varianceSpeed > 0) ? Math.sqrt(varianceSpeed) : 0;
                    var percentiles = Helper.weightedPercentiles(speedsNonZero, speedsNonZeroDuration, [0.25, 0.5, 0.75]);

                    return {
                        movingTime: genuineAvgSpeedSumCount,
                        elapsedTime: elapsedSeconds,
                        speed: {
                            'genuineAvgSpeed': genuineAvgSpeed,
                            'totalAvgSpeed': genuineAvgSpeed * this.moveRatio_(genuineAvgSpeedSumCount, elapsedSeconds),
                            'avgPace': parseInt(((1 / genuineAvgSpeed) * 60 * 60).toFixed(0)), // send in seconds
                            'lowerQuartileSpeed': percentiles[0],
                            'medianSpeed': percentiles[1],
                            'upperQuartileSpeed': percentiles[2],
                            'varianceSpeed': varianceSpeed,
                            'standardDeviationSpeed': standardDeviationSpeed,
                            'speedZones': speedZones
                        },
                        pace: {
                            'avgPace': parseInt(((1 / genuineAvgSpeed) * 60 * 60).toFixed(0)), // send in seconds
                            'lowerQuartilePace': this.convertSpeedToPace(percentiles[0]),
                            'medianPace': this.convertSpeedToPace(percentiles[1]),
                            'upperQuartilePace': this.convertSpeedToPace(percentiles[2]),
                            'variancePace': this.convertSpeedToPace(varianceSpeed),
                            'paceZones': paceZones
                        }
                    };
                },

                /**
                 * @param speed in kph
                 * @return pace in seconds/km
                 */
                convertSpeedToPace: function(speed) {
                    return (speed === 0) ? 'infinite' : parseInt((1 / speed) * 60 * 60);
                },

                /**
                 * Andrew Coggan weighted power compute method (source: http://forum.slowtwitch.com/Slowtwitch_Forums_C1/Triathlon_Forum_F1/Normalized_Power_Formula_or_Calculator..._P3097774/)
                 * 1) starting at the 30s mark, calculate a rolling 30 s average (of the preceeding time points, obviously).
                 * 2) raise all the values obtained in step #1 to the 4th power.
                 * 3) take the average of all of the values obtained in step #2.
                 * 4) take the 4th root of the value obtained in step #3.
                 * (And when you get tired of exporting every file to, e.g., Excel to perform such calculations, help develop a program like WKO+ to do the work for you <g>.)
                 */

                powerData_: function(athleteWeight, hasPowerMeter, userFTP, activityStatsMap, powerArray, velocityArray, timeArray) {

                    if (_.isEmpty(powerArray) || _.isEmpty(velocityArray) || _.isEmpty(timeArray)) {
                        return null;
                    }

                    var accumulatedWattsOnMove = 0;
                    var wattSampleOnMoveCount = 0;
                    var wattsSamplesOnMove = [];
                    var wattsSamplesOnMoveDuration = [];

                    var powerZones = this.prepareZonesForDistribComputation(this.userSettings.zones.power);

                    var durationInSeconds;

                    var AVG_POWER_TIME_WIN_SIZE = 30; // Seconds
                    var timeWindowValue = 0;
                    var sumPowerTimeWindow = [];
                    var sum4thPower = [];

                    for (var i = 0; i < powerArray.length; i++) { // Loop on samples

                        if (velocityArray[i] * 3.6 > self.constants.movingThresholdKph && i > 0) {

                            // Compute distribution for graph/table
                            durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)

                            timeWindowValue += durationInSeconds; // Add seconds to time buffer
                            sumPowerTimeWindow.push(powerArray[i]); // Add power value

                            if (timeWindowValue >= AVG_POWER_TIME_WIN_SIZE) {

                                // Get average of power during these 30 seconds windows & power 4th
                                sum4thPower.push(Math.pow(_.reduce(sumPowerTimeWindow, function(a, b) { // The reduce function and implementation return the sum of array
                                    return a + b;
                                }, 0) / sumPowerTimeWindow.length, 4));

                                timeWindowValue = 0; // Reset time window
                                sumPowerTimeWindow = []; // Reset sum of power window
                            }

                            wattsSamplesOnMove.push(powerArray[i]);
                            wattsSamplesOnMoveDuration.push(durationInSeconds);

                            // average over time
                            accumulatedWattsOnMove += this.valueForSum_(powerArray[i], powerArray[i - 1], durationInSeconds);
                            wattSampleOnMoveCount += durationInSeconds;

                            var powerZoneId = this.getZoneId(this.userSettings.zones.power, powerArray[i]);

                            if (!_.isUndefined(powerZoneId) && !_.isUndefined(powerZones[powerZoneId])) {
                                powerZones[powerZoneId].s += durationInSeconds;
                            }
                        }
                    }

                    // Finalize compute of Power
                    var avgWatts = accumulatedWattsOnMove / wattSampleOnMoveCount;

                    var weightedPower = Math.sqrt(Math.sqrt(_.reduce(sum4thPower, function(a, b) { // The reduce function and implementation return the sum of array
                        return a + b;
                    }, 0) / sum4thPower.length));

                    /*
                    // If user has a power meters we prefer use the value given by strava
                    if (hasPowerMeter) {
                        weightedPower = activityStatsMap.weightedPower;
                    }*/

                    var variabilityIndex = weightedPower / avgWatts;
                    var punchFactor = (_.isNumber(userFTP) && userFTP > 0) ? (weightedPower / userFTP) : null;
                    var weightedWattsPerKg = weightedPower / athleteWeight;
                    var avgWattsPerKg = avgWatts / athleteWeight;

                    var percentiles = Helper.weightedPercentiles(wattsSamplesOnMove, wattsSamplesOnMoveDuration, [0.25, 0.5, 0.75]);

                    // Update zone distribution percentage
                    powerZones = this.finalizeDistribComputationZones(powerZones);

                    return {
                        'hasPowerMeter': hasPowerMeter,
                        'avgWatts': avgWatts,
                        'avgWattsPerKg': avgWattsPerKg,
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
                    var hrrZonesCount = Object.keys(this.userSettings.userHrrZones).length;
                    var hr, heartRateReserveAvg, durationInSeconds, durationInMinutes, zoneId;
                    var hrSum = 0;
                    var heartRateArrayMoving = [];
                    var heartRateArrayMovingDuration = [];

                    // Find HR for each Hrr of each zones
                    for (var zone in this.userSettings.userHrrZones) {
                        this.userSettings.userHrrZones[zone].fromHr = parseFloat(Helper.heartrateFromHeartRateReserve(this.userSettings.userHrrZones[zone].fromHrr, userMaxHr, userRestHr));
                        this.userSettings.userHrrZones[zone].toHr = parseFloat(Helper.heartrateFromHeartRateReserve(this.userSettings.userHrrZones[zone].toHrr, userMaxHr, userRestHr));
                        this.userSettings.userHrrZones[zone].fromHrr = parseFloat(this.userSettings.userHrrZones[zone].fromHrr);
                        this.userSettings.userHrrZones[zone].toHrr = parseFloat(this.userSettings.userHrrZones[zone].toHrr);
                        this.userSettings.userHrrZones[zone].s = 0;
                        this.userSettings.userHrrZones[zone].percentDistrib = null;
                    }

                    for (var i = 0; i < heartRateArray.length; i++) { // Loop on samples
                        if (velocityArray[i] * 3.6 > self.constants.movingThresholdKph && i > 0) {
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
                                this.userSettings.userHrrZones[zoneId].s += durationInSeconds;
                            }
                        }
                    }

                    var heartRateArraySorted = heartRateArray.sort(function(a, b) {
                        return a - b;
                    });

                    // Update zone distribution percentage
                    this.userSettings.userHrrZones = this.finalizeDistribComputationZones(this.userSettings.userHrrZones);

                    activityStatsMap.averageHeartRate = hrSum / hrrSecondsCount;
                    activityStatsMap.maxHeartRate = heartRateArraySorted[heartRateArraySorted.length - 1];

                    var TRIMPPerHour = TRIMP / hrrSecondsCount * 60 * 60;
                    var percentiles = Helper.weightedPercentiles(heartRateArrayMoving, heartRateArrayMovingDuration, [0.25, 0.5, 0.75]);

                    return {
                        'TRIMP': TRIMP,
                        'TRIMPPerHour': TRIMPPerHour,
                        'hrrZones': this.userSettings.userHrrZones,
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
                        if (hrrValue <= this.userSettings.userHrrZones[zoneId].toHrr) {
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
                        cadenceZoneTyped = this.userSettings.zones.cyclingCadence;
                    } else if (this.activityType === 'Run') {
                        cadenceZoneTyped = this.userSettings.zones.runningCadence;
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

                            if (velocityArray[i] * 3.6 > self.constants.movingThresholdKph) {

                                movingSampleCount++;

                                // Rider is moving here..
                                if (cadenceArray[i] > self.constants.cadenceThresholdRpm) {
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
                                    cadenceZones[cadenceZoneId].s += durationInSeconds;
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

                    var percentiles = Helper.weightedPercentiles(cadenceArrayMoving, cadenceArrayDuration, [0.25, 0.5, 0.75]);

                    return {
                        'cadencePercentageMoving': cadenceRatioOnMovingTime * 100,
                        'cadenceTimeMoving': cadenceSumDurationOnMoving,
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

                    if (this.isTrainer) {
                        return;
                    }

                    var gradeSum = 0,
                        gradeCount = 0;

                    var gradeZones = this.prepareZonesForDistribComputation(this.userSettings.zones.grade);
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

                    var upFlatDownDistanceData = {
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

                                var gradeZoneId = this.getZoneId(this.userSettings.zones.grade, gradeArray[i]);

                                if (!_.isUndefined(gradeZoneId) && !_.isUndefined(gradeZones[gradeZoneId])) {
                                    gradeZones[gradeZoneId].s += durationInSeconds;
                                }

                                durationCount += durationInSeconds;

                                // Compute DOWN/FLAT/UP duration
                                if (gradeArray[i] > self.constants.gradeClimbingLimit) { // UPHILL
                                    // time
                                    upFlatDownInSeconds.up += durationInSeconds;
                                    // distance
                                    upFlatDownDistanceData.up += distance;

                                } else if (gradeArray[i] < self.constants.gradeDownHillLimit) { // DOWNHILL
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
                    var gradeProfile;
                    if ((upFlatDownInSeconds.flat / upFlatDownInSeconds.total * 100) >= self.constants.gradeProfileFlatPercentageDetected) {
                        gradeProfile = self.constants.gradeProfileFlat;
                    } else {
                        gradeProfile = self.constants.gradeProfileHilly;
                    }

                    // Compute speed while up, flat down
                    upFlatDownMoveData.up = upFlatDownDistanceData.up / upFlatDownInSeconds.up * 3.6;
                    upFlatDownMoveData.down = upFlatDownDistanceData.down / upFlatDownInSeconds.down * 3.6;
                    upFlatDownMoveData.flat = upFlatDownDistanceData.flat / upFlatDownInSeconds.flat * 3.6;

                    // Convert distance to KM
                    upFlatDownDistanceData.up = upFlatDownDistanceData.up / 1000;
                    upFlatDownDistanceData.down = upFlatDownDistanceData.down / 1000;
                    upFlatDownDistanceData.flat = upFlatDownDistanceData.flat / 1000;

                    var avgGrade = gradeSum / gradeCount;

                    // Update zone distribution percentage
                    gradeZones = this.finalizeDistribComputationZones(gradeZones);

                    var percentiles = Helper.weightedPercentiles(gradeArrayMoving, gradeArrayDistance, [0.25, 0.5, 0.75]);

                    return {
                        'avgGrade': avgGrade,
                        'lowerQuartileGrade': percentiles[0],
                        'medianGrade': percentiles[1],
                        'upperQuartileGrade': percentiles[2],
                        'gradeZones': gradeZones,
                        'upFlatDownInSeconds': upFlatDownInSeconds,
                        'upFlatDownMoveData': upFlatDownMoveData,
                        'upFlatDownDistanceData': upFlatDownDistanceData,
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

                    var skipAscentSpeedCompute = !_.isEmpty(this.params.bounds);

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
                    var elevationZones = this.prepareZonesForDistribComputation(this.userSettings.zones.elevation);
                    var ascentSpeedZones = this.prepareZonesForDistribComputation(this.userSettings.zones.ascent);
                    var durationInSeconds = 0;
                    var distance = 0;
                    var ascentDurationInSeconds = 0;

                    for (var i = 0; i < altitudeArray.length; i++) { // Loop on samples

                        // Compute distribution for graph/table
                        if (i > 0 && velocityArray[i] * 3.6 > self.constants.movingThresholdKph) {

                            durationInSeconds = (timeArray[i] - timeArray[i - 1]); // Getting deltaTime in seconds (current sample and previous one)
                            distance = distanceArray[i] - distanceArray[i - 1];

                            // Compute average and normalized

                            // average elevation over distance
                            accumulatedElevation += this.valueForSum_(altitudeArray[i], altitudeArray[i - 1], distance);
                            elevationSampleCount += distance;
                            elevationSamples.push(altitudeArray[i]);
                            elevationSamplesDistance.push(distance);

                            var elevationZoneId = this.getZoneId(this.userSettings.zones.elevation, altitudeArray[i]);

                            if (!_.isUndefined(elevationZoneId) && !_.isUndefined(elevationZones[elevationZoneId])) {
                                elevationZones[elevationZoneId].s += durationInSeconds;
                            }

                            // Meters climbed between current and previous
                            var elevationDiff = altitudeArray[i] - altitudeArray[i - 1];

                            // If previous altitude lower than current then => climbing
                            if (elevationDiff > 0) {

                                accumulatedElevationAscent += elevationDiff;
                                ascentDurationInSeconds = timeArray[i] - timeArray[i - 1];

                                var ascentSpeedMeterPerHour = elevationDiff / ascentDurationInSeconds * 3600; // m climbed / seconds

                                // Only if grade is > "ascentSpeedGradeLimit"
                                if (distance > 0 && (elevationDiff / distance * 100) > self.constants.ascentSpeedGradeLimit) {
                                    accumulatedDistance += distanceArray[i] - distanceArray[i - 1];
                                    ascentSpeedMeterPerHourSamples.push(ascentSpeedMeterPerHour);
                                    ascentSpeedMeterPerHourDistance.push(accumulatedDistance);
                                    ascentSpeedMeterPerHourTime.push(ascentDurationInSeconds);
                                    ascentSpeedMeterPerHourSum += ascentSpeedMeterPerHour;

                                    var ascentSpeedZoneId = this.getZoneId(this.userSettings.zones.ascent, ascentSpeedMeterPerHour);
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
                    var avgElevation = accumulatedElevation / elevationSampleCount;

                    var ascentSpeedMeterPerHourSamplesSorted = ascentSpeedMeterPerHourSamples.sort(function(a, b) {
                        return a - b;
                    });

                    var avgAscentSpeed = ascentSpeedMeterPerHourSum / ascentSpeedMeterPerHourSamples.length;

                    // Update zone distribution percentage
                    elevationZones = this.finalizeDistribComputationZones(elevationZones);
                    ascentSpeedZones = this.finalizeDistribComputationZones(ascentSpeedZones);

                    var percentilesElevation = Helper.weightedPercentiles(elevationSamples, elevationSamplesDistance, [0.25, 0.5, 0.75]);
                    var percentilesAscent = Helper.weightedPercentiles(ascentSpeedMeterPerHourSamples, ascentSpeedMeterPerHourDistance, [0.25, 0.5, 0.75]);

                    var result = {
                        'avgElevation': avgElevation.toFixed(0),
                        'accumulatedElevationAscent': accumulatedElevationAscent,
                        'accumulatedElevationDescent': accumulatedElevationDescent,
                        'lowerQuartileElevation': percentilesElevation[0].toFixed(0),
                        'medianElevation': percentilesElevation[1].toFixed(0),
                        'upperQuartileElevation': percentilesElevation[2].toFixed(0),
                        'elevationZones': elevationZones, // Only while moving
                        'ascentSpeedZones': ascentSpeedZones, // Only while moving
                        'ascentSpeed': {
                            'avg': _.isFinite(avgAscentSpeed) ? avgAscentSpeed : -1,
                            'lowerQuartile': percentilesAscent[0].toFixed(0),
                            'median': percentilesAscent[1].toFixed(0),
                            'upperQuartile': percentilesAscent[2].toFixed(0)
                        }
                    };

                    if (skipAscentSpeedCompute) {
                        result = _.omit(result, 'ascentSpeedZones');
                        result = _.omit(result, 'ascentSpeed');
                    }

                    return result;
                },

                /**
                 * ...
                 */
                smoothAltitude: function(activityStream, stravaElevation) {

                    if (!activityStream.altitude) {
                        return null;
                    }

                    var activityAltitudeArray = activityStream.altitude;
                    var distanceArray = activityStream.distance;
                    //  var timeArray = activityStream.time;  // for smoothing by time
                    var velocityArray = activityStream.velocity_smooth;
                    var smoothingL = 10;
                    var smoothingH = 600;
                    var smoothing;
                    var altitudeArray;
                    while (smoothingH - smoothingL >= 1) {
                        smoothing = smoothingL + (smoothingH - smoothingL) / 2;
                        altitudeArray = this.lowPassDataSmoothing(activityAltitudeArray, distanceArray, smoothing); // smoothing by distance
                        // altitudeArray = this.lowPassDataSmoothing(activityAltitudeArray, timeArray, smoothing);  // smoothing by time
                        var totalElevation = 0;
                        for (var i = 0; i < altitudeArray.length; i++) { // Loop on samples
                            if (i > 0 && velocityArray[i] * 3.6 > self.constants.movingThresholdKph) {
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

                /**
                 * ...
                 */
                lowPassDataSmoothing: function(data, distance, smoothing) {
                    // Below algorithm is applied in this method
                    // http://phrogz.net/js/framerate-independent-low-pass-filter.html
                    // value += (currentValue - value) / (smoothing / timeSinceLastSample);
                    // it is adapted for stability - if (smoothing / timeSinceLastSample) is less then 1, set it to 1 -> no smoothing for that sample
                    if (data && distance) {
                        var smooth_factor = 0;
                        var result = [];
                        result[0] = data[0];
                        for (i = 1, max = data.length; i < max; i++) {
                            if (smoothing === 0) {
                                result[i] = data[i];
                            } else {
                                smooth_factor = smoothing / (distance[i] - distance[i - 1]);
                                // only apply filter if smooth_factor > 1, else this leads to instability !!!
                                result[i] = result[i - 1] + (data[i] - result[i - 1]) / (smooth_factor > 1 ? smooth_factor : 1); // low limit smooth_factor to 1!!!
                                // result[i] = result[i - 1] + (data[i] - result[i - 1]) / ( smooth_factor ); // no stability check
                            }
                        }
                        return result;
                    }
                }

            };
        });

        // Lets exec activity processing on extended stats
        var analysisComputer = new AnalysisActivityComputer(
            mainThreadEvent.data.activityType,
            mainThreadEvent.data.isTrainer,
            mainThreadEvent.data.userSettings,
            mainThreadEvent.data.params);

        var result = analysisComputer.compute();

        // Result to main thread
        postMessage(result);
    };

    this.importRequiredLibraries = function(libsFromExtensionPath, chromeExtensionId) {
        for (var i = 0; i < libsFromExtensionPath.length; i++) {
            importScripts('chrome-extension://' + chromeExtensionId + libsFromExtensionPath[i]);
        }
    };
}
