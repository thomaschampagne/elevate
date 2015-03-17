/**
 *   Contructor
 */
function VacuumProcessor() {

}

/**
 * Define prototype
 */
VacuumProcessor.prototype = {

    /**
     *  Get the strava athlete id connected
     *  @returns the strava athlete id
     */
    getAthleteId: function getAthleteId() {

        var athleteId = null;
        try {
            if (!_.isUndefined(currentAthlete) && !_.isUndefined(currentAthlete.id)) {
                athleteId = currentAthlete.id;
            }
        } catch (err) {
            if (env.debugMode) console.warn(err);
        }

        return athleteId;
    },

    /**
     *  Get the strava athlete name connected
     *  @returns the strava athlete id
     */
    getAthleteName: function getAthleteName() {
        var athleteName = null;
        try {
            if (!_.isUndefined(currentAthlete) && !_.isUndefined(currentAthlete.get('display_name'))) {
                athleteName = currentAthlete.get('display_name');
            }
        } catch (err) {
            if (env.debugMode) console.warn(err);
        }

        return athleteName;
    },

    /**
     *  Get the strava athlete id connected
     *  @returns the strava athlete id
     */
    getAthleteIdAuthorOfActivity: function getAthleteId() {

        if (_.isUndefined(window.pageView)) {
            return null;
        }

        if (!window.pageView.activityAthlete()) {
            return null;
        }

        if (_.isUndefined(window.pageView.activityAthlete().get('id'))) {
            return null;
        }

        return window.pageView.activityAthlete().get('id');
    },

    /**
     *  Get the strava athlete premium status
     *  @returns premium status
     */
    getPremiumStatus: function getPremiumStatus() {

        var premiumStatus = null;
        try {
            if (!_.isUndefined(currentAthlete)) {
                premiumStatus = currentAthlete.attributes.premium;
            }
        } catch (err) {
            if (env.debugMode) console.warn(err);
        }

        return premiumStatus;
    },

    /**
     *  Get the strava athlete pro status
     *  @returns the strava pro athlete id
     */
    getProStatus: function getProStatus() {

        var proStatus = null;

        try {

            if (!_.isUndefined(currentAthlete)) {

                if (!_.isUndefined(currentAthlete.attributes.pro)) {

                    proStatus = currentAthlete.attributes.pro;

                } else {
                    return null;
                }

            }
        } catch (err) {
            if (env.debugMode) console.warn(err);
        }

        return proStatus;
    },

    /**
     *  ...
     *  @returns ...
     */
    getActivityId: function getActivityId() {
        return (_.isUndefined(window.pageView)) ? null : pageView.activity().id;
    },

    /**
     *  ...
     *  @returns ...
     */
    getAthleteWeight: function getAthleteWeight() {
        return (_.isUndefined(window.pageView)) ? null : pageView.activityAthleteWeight();
    },

    /**
     * @returns Common activity stats given by Strava throught right panel
     */
    getActivityCommonStats: function getActivityStats() {

        var actStatsContainer = jQuery(".activity-summary-container");

        // Get Distance
        var distance = this.formatActivityDataValue_(
            actStatsContainer.find('.inline-stats.section').children().first().text(),
            false, false, true, false);

        // Get Moving Time
        var movingTime = this.formatActivityDataValue_(
            actStatsContainer.find('.inline-stats.section').children().first().next().text(),
            true, false, false, false);

        // Get Elevation
        var elevation = this.formatActivityDataValue_(
            actStatsContainer.find('.inline-stats.section').children().first().next().next().text(),
            false, true, false, false);

        // Get Estimated Average Power
        var avgPower = this.formatActivityDataValue_(
            jQuery('[data-glossary-term*=definition-average-power]').parent().parent().children().first().text(),
            false, false, false, false);

        var weightedPower = this.formatActivityDataValue_(
            jQuery('[data-glossary-term*=definition-weighted-average-power]').parent().parent().children().first().text(),
            false, false, false, false);

        // Get Energy Output
        var energyOutput = this.formatActivityDataValue_(
            actStatsContainer.find('.inline-stats.section.secondary-stats').children().first().next().children().first().text(),
            false, false, false, true);

        // Get Elapsed Time
        var elapsedTime = this.formatActivityDataValue_(
            jQuery('[data-glossary-term*=definition-elapsed-time]').parent().parent().children().last().text(),
            true, false, false, false);

        // Get Average speed
        var averageSpeed = this.formatActivityDataValue_(
            actStatsContainer.find('.section.more-stats').find('.unstyled').children().first().next().children().first().children().first().next().text(),
            false, false, false, false);

        // If no average speed found, try to get pace instead.
        if (!averageSpeed) {
            averageSpeed = this.formatActivityDataValue_(
                jQuery('[data-glossary-term*=definition-moving-time]').parent().parent().first().next().children().first().text(),
                true, false, false, false);

            averageSpeed = 1 / averageSpeed; // invert to km per seconds
            averageSpeed = averageSpeed * 60 * 60; // We are in KPH here

            var measurementPreference = currentAthlete.get('measurement_preference');
            var speedFactor = (measurementPreference == 'meters') ? 1 : 0.62137;
            averageSpeed = averageSpeed / speedFactor; // Always give PKH here
        }

        var averageHeartRate = this.formatActivityDataValue_(
            actStatsContainer.find('.section.more-stats').find('.unstyled').children().first().next().next().children().first().children().first().next().has('abbr').text(),
            false, false, false, false);

        var maxHeartRate = this.formatActivityDataValue_(
            actStatsContainer.find('.section.more-stats').find('.unstyled').children().first().next().next().children().first().children().first().next().next().text(),
            false, false, false, false);

        // Create activityData Map
        return {
            'distance': distance,
            'movingTime': movingTime,
            'elevation': elevation,
            'avgPower': avgPower,
            'weightedPower': weightedPower,
            'energyOutput': energyOutput,
            'elapsedTime': elapsedTime,
            'averageSpeed': averageSpeed,
            'averageHeartRate': averageHeartRate,
            'maxHeartRate': maxHeartRate,
        };
    },

    /**
     *
     */
    formatActivityDataValue_: function formatActivityDataValue_(dataIn, parsingTime, parsingElevation, parsingDistance, parsingEnergy) {

        if (dataIn == "") {
            return null;
        }
        // Common clean
        var cleanData = dataIn.replace(/\s/g, '').trim('string');
        cleanData = cleanData.replace(/[\n\r]/g, '');
        cleanData = cleanData.replace(/([a-z]|[A-Z])+/g, '').trim();


        if (parsingTime) {
            // Remove text from date, format time to hh:mm:ss
            cleanData = Helper.HHMMSStoSeconds(cleanData);
        } else if (parsingElevation) {
            cleanData = cleanData.replace(' ', '').replace(',', '');
        } else if (parsingDistance) {
            cleanData = cleanData.replace(',', '.');
        } else if (parsingEnergy) {
            cleanData = cleanData.replace(',', '.').replace('.', '');
        } else {
            cleanData = cleanData.replace(',', '.');
        }
        return parseFloat(cleanData);
    },

    /**
     * @returns activity stream in callback
     */
    getActivityStream: function getActivityStream(callback) {

        var url = "/activities/" + this.getActivityId() + "/streams?stream_types[]=watts_calc&stream_types[]=watts&stream_types[]=velocity_smooth&stream_types[]=time&stream_types[]=distance&stream_types[]=cadence&stream_types[]=heartrate";

        jQuery.ajax(url).done(function(jsonResponse) {

            var hasPowerMeter = true;

            if (_.isEmpty(jsonResponse.watts)) {
                jsonResponse.watts = jsonResponse.watts_calc;
                hasPowerMeter = false;
            }

            callback(this.getActivityCommonStats(), jsonResponse, this.getAthleteWeight(), hasPowerMeter);

            jsonResponse = null; // Memory clean

        }.bind(this));
    },

    /**
     * @returns
     */
    getSegmentsFromBounds: function getSegmentsFromBounds(vectorA, vectorB, callback) {

        var segmentsUnify = {
            cycling: null,
            running: null
        };

        jQuery.when(

            jQuery.ajax({
                url: '/api/v3/segments/search',
                data: {
                    bounds: vectorA + ',' + vectorB,
                    min_cat: '0',
                    max_cat: '5',
                    activity_type: 'cycling'
                },
                type: 'GET',
                crossDomain: true, // enable this
                dataType: 'jsonp',
                success: function(xhrResponseText) {
                    segmentsUnify.cycling = xhrResponseText;
                },
                error: function(err) {
                    console.error(err);
                }
            }),

            jQuery.ajax({
                url: '/api/v3/segments/search',
                data: {
                    bounds: vectorA + ',' + vectorB,
                    min_cat: '0',
                    max_cat: '5',
                    activity_type: 'running'
                },
                type: 'GET',
                crossDomain: true, // enable this
                dataType: 'jsonp',
                success: function(xhrResponseText) {
                    segmentsUnify.running = xhrResponseText;
                },
                error: function(err) {
                    console.error(err);
                }
            })

        ).then(function() {
            callback(segmentsUnify);
        });

    },

    /**
     * @returns
     */
    getSegmentStream: function getSegmentStream(segmentId, callback) {

        jQuery.ajax({
            url: '/stream/segments/' + segmentId,
            type: 'GET',
            success: function(xhrResponseText) {
                callback(xhrResponseText);
            },
            error: function(err) {
                console.error(err);
            }
        });
    },


    /**
     * @returns Array of bikes/odo
     */
    getBikeOdoOfAthlete: function(athleteId, callback) {

        if (_.isUndefined(window.pageView)) {
            callback(null);
            return;
        }

        if (pageView.activity().attributes.type != "Ride") {
            callback(null);
            return;
        }

        var url = location.protocol + "//www.strava.com/athletes/" + athleteId;

        jQuery.ajax(url).always(function(data) {

            var bikeOdoArray = {};
            _.each(jQuery(data.responseText).find('div.gear>table>tbody>tr'), function(element) {
                var bikeName = jQuery(element).find('td').first().text().trim();
                var bikeOdo = jQuery(element).find('td').last().text().trim();
                bikeOdoArray[btoa(bikeName)] = bikeOdo;
            });

            callback(bikeOdoArray);
        });
    },
};
