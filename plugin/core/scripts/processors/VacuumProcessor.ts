/**
 *   Contructor
 */
class VacuumProcessor {

    public static cachePrefix: string = 'stravistix_activityStream_';

    /**
     *  Get the strava athlete id connected
     *  @returns the strava athlete id
     */
    public getAthleteId(): number {

        let athleteId: number = null;
        try {
            if (!_.isUndefined(window.currentAthlete) && !_.isUndefined(window.currentAthlete.id)) {
                athleteId = window.currentAthlete.id;
            }
        } catch (err) {
            if (env.debugMode) console.warn(err);
        }

        return athleteId;
    }

    /**
     *  Get the strava athlete name connected
     *  @returns the strava athlete id
     */
    public getAthleteName(): string {
        let athleteName: string = null;
        try {
            if (!_.isUndefined(window.currentAthlete) && !_.isUndefined(window.currentAthlete.get('display_name'))) {
                athleteName = window.currentAthlete.get('display_name');
            }
        } catch (err) {
            if (env.debugMode) console.warn(err);
        }
        return athleteName;
    }

    /**
     *  Get the strava athlete id connected
     *  @returns the strava athlete id
     */
    public getAthleteIdAuthorOfActivity(): number {

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
    }

    /**
     *  Get the strava athlete premium status
     *  @returns premium status
     */

    public getPremiumStatus(): boolean {
        let premiumStatus: boolean = null;
        try {
            if (!_.isUndefined(window.currentAthlete)) {
                premiumStatus = window.currentAthlete.attributes.premium;
            }
        } catch (err) {
            if (env.debugMode) console.warn(err);
        }

        return premiumStatus;
    }

    public getCurrentAthlete() {
        return window.currentAthlete;
    }

    /**
     *  Get the strava athlete pro status
     *  @returns the strava pro athlete id
     */
    public getProStatus(): boolean {

        let proStatus: boolean = false;
        let currentAthlete: any = this.getCurrentAthlete();

        try {
            if (currentAthlete && currentAthlete.attributes && currentAthlete.attributes.pro) {
                proStatus = currentAthlete.attributes.pro;
            }

        } catch (err) {
            if (env.debugMode) console.warn(err);
        }

        return proStatus;
    }


    /**
     *  ...
     *  @returns ...
     */
    public getActivityId(): number {
        return (_.isUndefined(window.pageView)) ? null : window.pageView.activity().id;
    }


    /**
     *  ...
     *  @returns ...
     */

    protected getAthleteWeight(): number {
        return (_.isUndefined(window.pageView)) ? null : window.pageView.activityAthleteWeight();
    }

    /**
     * @returns Common activity stats given by Strava throught right panel
     */
    protected getActivityStatsMap(): IActivityStatsMap {

        let actStatsContainer: JQuery = $(".activity-summary-container");

        // Get Distance
        let distance: number = this.formatActivityDataValue(
            actStatsContainer.find('.inline-stats.section').children().first().text(),
            false, false, true, false);

        // Get Moving Time
        let movingTime: number = this.formatActivityDataValue(
            actStatsContainer.find('.inline-stats.section').children().first().next().text(),
            true, false, false, false);

        // Get Elevation
        let elevation: number = this.formatActivityDataValue(
            actStatsContainer.find('.inline-stats.section').children().first().next().next().text(),
            false, true, false, false);

        // Get Estimated Average Power
        let avgPower: number = this.formatActivityDataValue(
            $('[data-glossary-term*=definition-average-power]').parent().parent().children().first().text(),
            false, false, false, false);

        let weightedPower: number = this.formatActivityDataValue(
            $('[data-glossary-term*=definition-weighted-average-power]').parent().parent().children().first().text(),
            false, false, false, false);

        // Get Energy Output
        let energyOutput: number = this.formatActivityDataValue(
            actStatsContainer.find('.inline-stats.section.secondary-stats').children().first().next().children().first().text(),
            false, false, false, true);

        // Get Elapsed Time
        let elapsedTime: number = this.formatActivityDataValue(
            $('[data-glossary-term*=definition-elapsed-time]').parent().parent().children().last().text(),
            true, false, false, false);

        // Try to get it another way. (Running races)
        if (!elapsedTime) {
            elapsedTime = this.formatActivityDataValue(
                $('.section.more-stats').children().last().text(),
                true, false, false, false);
        }

        // Invert movingTime and elapsedTime. Theses values seems to be inverted in running races (https://www.strava.com/activities/391338398)
        if (elapsedTime - movingTime < 0) {
            let elapsedTimeCopy: number = elapsedTime;
            elapsedTime = movingTime;
            movingTime = elapsedTimeCopy;
        }

        // Get Average speed
        let averageSpeed: number = this.formatActivityDataValue(
            actStatsContainer.find('.section.more-stats').find('.unstyled').children().first().next().children().first().children().first().next().text(),
            false, false, false, false);

        // If no average speed found, try to get pace instead.
        if (!averageSpeed) {
            averageSpeed = this.formatActivityDataValue(
                $('[data-glossary-term*=definition-moving-time]').parent().parent().first().next().children().first().text(),
                true, false, false, false);

            averageSpeed = 1 / averageSpeed; // invert to km per seconds
            averageSpeed = averageSpeed * 60 * 60; // We are in KPH here

            let measurementPreference: string = window.currentAthlete.get('measurement_preference');
            let speedFactor: number = (measurementPreference == 'meters') ? 1 : 0.62137;
            averageSpeed = averageSpeed / speedFactor; // Always give PKH here
        }

        let averageHeartRate: number = this.formatActivityDataValue(
            actStatsContainer.find('.section.more-stats').find('.unstyled').children().first().next().next().children().first().children().first().next().has('abbr').text(),
            false, false, false, false);

        let maxHeartRate: number = this.formatActivityDataValue(
            actStatsContainer.find('.section.more-stats').find('.unstyled').children().first().next().next().children().first().children().first().next().next().text(),
            false, false, false, false);

        // Create activityData Map
        let activityCommonStats: IActivityStatsMap = {
            distance: distance,
            // movingTime: movingTime,
            elevation: elevation,
            avgPower: avgPower,
            // weightedPower: weightedPower,
            // energyOutput: energyOutput,
            // elapsedTime: elapsedTime,
            averageSpeed: averageSpeed
            // averageHeartRate: averageHeartRate
            // maxHeartRate: maxHeartRate
        };

        return activityCommonStats;
    }

    protected formatActivityDataValue(dataIn: string, parsingTime: boolean, parsingElevation: boolean, parsingDistance: boolean, parsingEnergy: boolean): number {

        if (dataIn === "") {
            return null;
        }

        // Common clean
        let cleanData: string = dataIn.toLowerCase();
        cleanData = cleanData.replace(new RegExp(/\s/g), '');
        cleanData = cleanData.replace(new RegExp(/[àáâãäå]/g), '');
        cleanData = cleanData.replace(new RegExp(/æ/g), '');
        cleanData = cleanData.replace(new RegExp(/ç/g), '');
        cleanData = cleanData.replace(new RegExp(/[èéêë]/g), '');
        cleanData = cleanData.replace(new RegExp(/[ìíîï]/g), '');
        cleanData = cleanData.replace(new RegExp(/ñ/g), '');
        cleanData = cleanData.replace(new RegExp(/[òóôõö]/g), '');
        cleanData = cleanData.replace(new RegExp(/œ/g), "o");
        cleanData = cleanData.replace(new RegExp(/[ùúûü]/g), '');
        cleanData = cleanData.replace(new RegExp(/[ýÿ]/g), '');
        cleanData = cleanData.replace(/\s/g, '').trim();
        cleanData = cleanData.replace(/[\n\r]/g, '');
        cleanData = cleanData.replace(/([a-z]|[A-Z])+/g, '').trim();

        if (parsingTime) {
            // Remove text from date, format time to hh:mm:ss
            cleanData = Helper.HHMMSStoSeconds(cleanData);

            if (_.isNaN(cleanData)) {
                return null;
            }

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
    }

    /**
     * @returns activity stream in callback
     */
    public getActivityStream(callback: (activityCommonStats: IActivityStatsMap, activityStream: IActivityStream, athleteWeight: number, hasPowerMeter: boolean) => void): void {

        let cache: any = localStorage.getItem(VacuumProcessor.cachePrefix + this.getActivityId());

        if (cache) {
            cache = JSON.parse(cache);
            callback(cache.activityCommonStats, cache.stream, cache.athleteWeight, cache.hasPowerMeter);
            return;
        }

        let url: string = "/activities/" + this.getActivityId() + "/streams?stream_types[]=watts_calc&stream_types[]=watts&stream_types[]=velocity_smooth&stream_types[]=time&stream_types[]=distance&stream_types[]=cadence&stream_types[]=heartrate&stream_types[]=grade_smooth&stream_types[]=altitude&stream_types[]=latlng";

        $.ajax(url).done((activityStream: IActivityStream) => {

            let hasPowerMeter: boolean = true;

            if (_.isEmpty(activityStream.watts)) {
                activityStream.watts = activityStream.watts_calc;
                hasPowerMeter = false;
            }

            try {
                // Save result to cache
                localStorage.setItem(VacuumProcessor.cachePrefix + this.getActivityId(), JSON.stringify({
                    activityCommonStats: this.getActivityStatsMap(),
                    stream: activityStream,
                    athleteWeight: this.getAthleteWeight(),
                    hasPowerMeter: hasPowerMeter
                }));
            } catch (err) {
                console.warn(err);
                localStorage.clear();
            }

            callback(this.getActivityStatsMap(), activityStream, this.getAthleteWeight(), hasPowerMeter);
        });
    }

    /**
     * @returns
     */
    public getSegmentsFromBounds(vectorA: string, vectorB: string, callback: (segmentsUnify: any) => void): void {

        let segmentsUnify: any = {
            cycling: null,
            running: null
        };

        $.when(
            $.ajax({
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
                success: (xhrResponseText: any) => {
                    segmentsUnify.cycling = xhrResponseText;
                },
                error: (err: any) => {
                    console.error(err);
                }
            }),

            $.ajax({
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
                success: (xhrResponseText: any) => {
                    segmentsUnify.running = xhrResponseText;
                },
                error: (err: any) => {
                    console.error(err);
                }
            })
        ).then(() => {
            callback(segmentsUnify);
        });

    }

    /**
     * @returns
     */
    getSegmentStream(segmentId: number, callback: Function): void {

        $.ajax({
            url: '/stream/segments/' + segmentId,
            dataType: 'json',
            type: 'GET',
            success: (xhrResponseText: any) => {
                callback(xhrResponseText);
            },
            error: (err: any) => {
                console.error(err);
            }
        });
    }

    /**
     * @returns Array of bikes/odo
     */
    getBikeOdoOfAthlete(athleteId: number, callback: (bikeOdoArray: any) => void): void {

        if (_.isUndefined(window.pageView)) {
            callback(null);
            return;
        }

        if (window.pageView.activity().attributes.type != "Ride") {
            callback(null);
            return;
        }

        let url: string = location.protocol + "//www.strava.com/athletes/" + athleteId;

        $.ajax({
            url: url,
            dataType: 'json'
        }).always((data: any) => {

            let bikeOdoArray: any = {};

            _.each($(data.responseText).find('div.gear>table>tbody>tr'), (element: Element) => {

                let bikeName: string = $(element).find('td').first().text().trim();
                let bikeOdo: string = $(element).find('td').last().text().trim();

                bikeOdoArray[btoa(window.unescape(encodeURIComponent(bikeName)))] = bikeOdo;
            });

            callback(bikeOdoArray);
        });
    }

    getActivityTime(): string {
        let activityTime: string = $(".activity-summary-container").find('time').text().trim();
        return (activityTime) ? activityTime : null;
    }

    getActivityName(): string {
        let activityName: string = $(".activity-summary-container").find('.marginless.activity-name').text().trim();
        return (activityName) ? activityName : null;
    }
}
