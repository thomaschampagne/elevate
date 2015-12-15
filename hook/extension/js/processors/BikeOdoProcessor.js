/**
 *   BikeOdoProcessor is responsible of ...
 */
function BikeOdoProcessor(vacuumProcessor, athleteId) {
    this.vacuumProcessor_ = vacuumProcessor;
    this.cacheKey_ = 'stravistix_bikeOdo_' + athleteId + '_cache';
    this.cacheAgingTimeOfBikesInSeconds_ = 120 * 60; // 2 hours
    this.athleteId_ = athleteId;
}

/**
 * Define prototype
 */
BikeOdoProcessor.prototype = {


    /*
     *
     */
    getBikeOdoOfAthlete: function getBikeOdoOfAthlete(callback) {


        var bikeOdoOfAthleteFromCache = localStorage.getItem(this.cacheKey_);
        var bikeOdoOfAthleteFromCacheObject = JSON.parse(bikeOdoOfAthleteFromCache);

        // Test if cache is still valid
        var cacheDeprecated = false;
        var now = Math.floor(Date.now() / 1000);
        if (bikeOdoOfAthleteFromCacheObject && (now > bikeOdoOfAthleteFromCacheObject.cachedOnTimeStamp + this.cacheAgingTimeOfBikesInSeconds_)) {
            console.log('bike ode cache is deprecated');
            cacheDeprecated = true;
        }

        if (!_.isNull(bikeOdoOfAthleteFromCache) && !_.isEqual(bikeOdoOfAthleteFromCache, "null") && !cacheDeprecated) {
            if (env.debugMode) console.log("Using bike odo cache: " + bikeOdoOfAthleteFromCache);
            callback(bikeOdoOfAthleteFromCacheObject);
            return;
        }

        this.vacuumProcessor_.getBikeOdoOfAthlete(this.athleteId_, function(bikeOdoArray) {

            bikeOdoArray.cachedOnTimeStamp = Math.floor(Date.now() / 1000);

            // Cache result
            if (env.debugMode) console.log("Creating bike odo cache inside cookie " + this.cacheKey_);
            try {
                localStorage.setItem(this.cacheKey_, JSON.stringify(bikeOdoArray));
            } catch (err) {
                console.warn(err);
                localStorage.clear();
            }
            callback(bikeOdoArray);

        }.bind(this));
    },

    getCacheKey: function getCacheAgingTimeCookieKey() {
        return this.cacheKey_;
    }
};
