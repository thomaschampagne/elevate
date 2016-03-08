/**
 *   Contructor
 */
function ActivityProcessor(appResources, vacuumProcessor, userHrrZones, zones) {
    this.appResources = appResources;
    this.vacuumProcessor = vacuumProcessor;
    this.userHrrZones = userHrrZones;
    this.zones = zones;
}

ActivityProcessor.cachePrefix = 'stravistix_activity_';

/**
 * Define prototype
 */
ActivityProcessor.prototype = {

    /**
     *
     */
    setActivityType: function(activityType) {
        this.activityType = activityType;
    },

    /**
     *
     */
    setTrainer: function(isTrainer) {
        if (isTrainer) {
            if (_.isBoolean(isTrainer)) {
                this.isTrainer = isTrainer;
            } else {
                console.error("isTrainer(boolean): required boolean param");
            }
        }
    },

    /**
     *
     */
    getAnalysisData: function(activityId, userGender, userRestHr, userMaxHr, userFTP, bounds, callback) {

        if (!this.activityType) {
            console.error('No activity type set for ActivityProcessor');
        }

        // We are not using cache when bounds are given
        var useCache = true;
        if (!_.isEmpty(bounds)) {
            useCache = false;
        }

        if (useCache) {
            // Find in cache first is data exist
            var cacheResult = JSON.parse(localStorage.getItem(ActivityProcessor.cachePrefix + activityId));

            if (!_.isNull(cacheResult) && env.useActivityStreamCache) {
                console.log("Using existing activity cache mode");
                callback(cacheResult);
                return;
            }
        }

        userFTP = parseInt(userFTP);

        // Else no cache... then call VacuumProcessor for getting data, compute them and cache them
        this.vacuumProcessor.getActivityStream(function(activityStatsMap, activityStream, athleteWeight, hasPowerMeter) { // Get stream on page

            // Compute data in a background thread to avoid UI locking
            this.computeAnalysisThroughDedicatedThread(userGender, userRestHr, userMaxHr, userFTP, athleteWeight, hasPowerMeter, activityStatsMap, activityStream, bounds, function(resultFromThread) {

                callback(resultFromThread);

                // Cache the result from thread to localStorage
                if (useCache) {
                    console.log("Creating activity cache");
                    try {
                        localStorage.setItem(ActivityProcessor.cachePrefix + activityId, JSON.stringify(resultFromThread)); // Cache the result to local storage
                    } catch (err) {
                        console.warn(err);
                        localStorage.clear();
                    }
                }

            });

        }.bind(this));
    },

    /**
     *
     */

    computeAnalysisThroughDedicatedThread: function(userGender, userRestHr, userMaxHr, userFTP, athleteWeight, hasPowerMeter, activityStatsMap, activityStream, bounds, callback) {

        // Create worker blob URL if not exist
        if (!this.computeAnalysisWorkerBlobURL) {
            // Create a blob from 'ComputeAnalysisWorker' function variable as a string
            var blob = new Blob(['(', ComputeAnalysisWorker.toString(), ')()'], { type: 'application/javascript' });

            // Keep track of blob URL to reuse it
            this.computeAnalysisWorkerBlobURL = URL.createObjectURL(blob);
        }

        // Lets create that worker/thread!
        this.computeAnalysisThread = new Worker(this.computeAnalysisWorkerBlobURL);

        // Send user and activity data to the thread
        // He will compute them in the background
        this.computeAnalysisThread.postMessage({
            activityType: this.activityType,
            isTrainer: this.isTrainer,
            appResources: this.appResources,
            userSettings: {
                userGender: userGender,
                userRestHr: userRestHr,
                userMaxHr: userMaxHr,
                userFTP: userFTP,
                zones: this.zones,
                userHrrZones: this.userHrrZones,
            },
            params: {
                athleteWeight: athleteWeight,
                hasPowerMeter: hasPowerMeter,
                activityStatsMap: activityStatsMap,
                activityStream: activityStream,
                bounds: bounds
            }
        });

        // Listen messages from thread. Thread will send to us the result of computation
        this.computeAnalysisThread.onmessage = function(messageFromThread) {

            callback(messageFromThread.data);

            // Finish and kill thread
            this.computeAnalysisThread.terminate();

        }.bind(this);
    }
};
