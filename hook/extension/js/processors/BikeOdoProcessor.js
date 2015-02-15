/**
 *   BikeOdoProcessor is responsible of ...
 */
function BikeOdoProcessor(vacuumProcessor, athleteId) {
    this.vacuumProcessor_ = vacuumProcessor;
    this.cacheAgingTimeCookieKey_ = 'stravaplus_bikeOdoOfAthlete_' + athleteId + '_cache';
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

        var bikeOdoOfAthleteFromCache = StorageManager.getCookie(this.cacheAgingTimeCookieKey_);

        if (!_.isNull(bikeOdoOfAthleteFromCache) && !_.isEqual(bikeOdoOfAthleteFromCache, "null")) {
            if (env.debugMode) console.log("Using bike odo cache: " + bikeOdoOfAthleteFromCache);
            callback(JSON.parse(bikeOdoOfAthleteFromCache));
            return;
        }

        this.vacuumProcessor_.getBikeOdoOfAthlete(this.athleteId_, function(bikeOdoArray) {
            
            // Cache result
            if (env.debugMode) console.log("Creating bike odo cache inside cookie " + this.cacheAgingTimeCookieKey_);
            StorageManager.setCookieSeconds(this.cacheAgingTimeCookieKey_, JSON.stringify(bikeOdoArray), BikeOdoProcessor.cacheAgingTimeOfBikesInSeconds_);
            callback(bikeOdoArray);

        }.bind(this));
    },

    getCacheAgingTimeCookieKey: function getCacheAgingTimeCookieKey()  {
        return this.cacheAgingTimeCookieKey_;
    }
};
