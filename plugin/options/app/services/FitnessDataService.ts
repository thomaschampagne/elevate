import Moment = moment.Moment;
import IPromise = angular.IPromise;

interface IActivitiesWithFitness {
    id: number;
    date: Date; // TODO Store Moment instead?!
    timestamp: number;
    dayOfYear: number;
    year: number;
    type: string;
    activityName: string;
    trimpScore?: number;
    powerStressScore?: number;
    swimStressScore?: number;
}

interface IActivitiesWithFitnessDaysOff {
    ids: Array<number>;
    date: Date;
    timestamp: number;
    type: Array<string>;
    activitiesName: Array<string>;
    trimpScore?: number;
    powerStressScore?: number;
    swimStressScore?: number;
    finalStressScore: number;
    previewDay: boolean;
}

interface IFitnessActivity {
    ids: Array<number>;
    date: string;
    timestamp: number;
    type: Array<string>;
    activitiesName: Array<string>;
    trimpScore?: number;
    powerStressScore?: number;
    swimStressScore?: number;
    finalStressScore?: number;
    ctl: number;
    atl: number;
    tsb: number;
    previewDay: boolean;
}

interface IFitnessActivityTable extends IFitnessActivity {
    activitiesNameStr: string;
}

class FitnessDataService {

    public static FUTURE_DAYS_PREVIEW: number = 14;

    protected onGetComputedActivitiesTimeStart: number;
    protected onGetFitnessDataTimeDone: number;

    protected $q: IQService;
    protected chromeStorageService: ChromeStorageService;
    protected fitnessData: Array<IFitnessActivity>;
    protected usePowerMeter: boolean = false;
    protected userFTP: number = -1;
    protected useSwimStressScore: boolean = false;
    protected userSwimFTP: number = -1;

    constructor(q: IQService, chromeStorageService: ChromeStorageService) {
        this.$q = q;
        this.chromeStorageService = chromeStorageService;
    }

    /**
     * @return computed activities cleaned
     */
    protected getCleanedComputedActivities(): IPromise<Array<IActivitiesWithFitness>> {

        if (this.userFTP === -1) {
            console.error("userFTP must be set before calling this method");
            return;
        }

        if (this.userSwimFTP === -1) {
            console.error("userFTP must be set before calling this method");
            return;
        }

        this.onGetComputedActivitiesTimeStart = performance.now();

        let deferred = this.$q.defer<Array<IActivitiesWithFitness>>();

        this.chromeStorageService.fetchComputedActivities().then((computedActivities: Array<ISyncActivityComputed>) => {

            let cleanedActivities: Array<IActivitiesWithFitness> = [];

            _.each(computedActivities, (activity: ISyncActivityComputed) => {

                let hasHeartRateData: boolean = (activity.extendedStats && !_.isEmpty(activity.extendedStats.heartRateData) && _.isNumber(activity.extendedStats.heartRateData.TRIMP));

                let isPowerMeterUsePossible: boolean = (activity.type === "Ride" || activity.type === "VirtualRide")
                    && this.usePowerMeter && _.isNumber(this.userFTP)
                    && activity.extendedStats && activity.extendedStats.powerData
                    && activity.extendedStats.powerData.hasPowerMeter && _.isNumber(activity.extendedStats.powerData.weightedPower);

                let hasSwimmingData: boolean = this.useSwimStressScore && _.isNumber(this.userSwimFTP) && this.userSwimFTP > 0 && activity.type === "Swim" && _.isNumber(activity.distance_raw) && _.isNumber(activity.moving_time_raw) && activity.moving_time_raw > 0;

                if (hasHeartRateData || isPowerMeterUsePossible || hasSwimmingData) {

                    let momentStartTime: Moment = moment(activity.start_time);

                    let activityWithFitness: IActivitiesWithFitness = {
                        id: activity.id,
                        date: momentStartTime.toDate(),
                        timestamp: momentStartTime.toDate().getTime(),
                        dayOfYear: momentStartTime.dayOfYear(),
                        year: momentStartTime.year(),
                        type: activity.type,
                        activityName: activity.name,

                    };

                    if (hasHeartRateData) {
                        activityWithFitness.trimpScore = activity.extendedStats.heartRateData.TRIMP;
                    }

                    if (isPowerMeterUsePossible) {
                        activityWithFitness.powerStressScore = (activity.moving_time_raw * activity.extendedStats.powerData.weightedPower * (activity.extendedStats.powerData.weightedPower / this.userFTP) / (this.userFTP * 3600) * 100);
                    }

                    if (hasSwimmingData) {
                        let normalizedSwimSpeed = activity.distance_raw / (activity.moving_time_raw / 60); // Normalized_Swim_Speed (m/min) = distance(m) / timeInMinutesNoRest
                        let swimIntensity = normalizedSwimSpeed / this.userSwimFTP; // Intensity = Normalized_Swim_Speed / Swim FTP
                        activityWithFitness.swimStressScore = Math.pow(swimIntensity, 3) * (activity.elapsed_time_raw / 3600) * 100; // Swim Stress Score = Intensity^3 * TotalTimeInHours * 100
                    }

                    cleanedActivities.push(activityWithFitness);
                }
            });

            deferred.resolve(cleanedActivities);

        }, (err: any) => {
            deferred.reject(err);
        });

        return deferred.promise;
    }

    /**
     * @return Fitness object of computed activities including days off (= rest day)
     */
    protected  getFitnessObjectsWithDaysOff(): IPromise<Array<IActivitiesWithFitnessDaysOff>> {

        let deferred = this.$q.defer<Array<IActivitiesWithFitnessDaysOff>>();

        console.log('Fetch fitnessObjectsWithDaysOff from fitnessDataService.getFitnessObjectsWithDaysOff');

        this.getCleanedComputedActivities().then((cleanedActivities: Array<IActivitiesWithFitness>) => {

            if (_.isEmpty(cleanedActivities)) {
                deferred.reject('No ready activities');
                return;
            }

            // From date is the first activity done in history
            // Subtract 1 day to from date (to show graph point with 1 day before) and on day start
            let fromMoment = moment(_.first(cleanedActivities).date).subtract(1, 'days').startOf('day');

            let todayMoment: Moment = moment().endOf('day'); // Today end of day

            // Now inject days off/resting
            let everyDayFitnessObjects: Array<IActivitiesWithFitnessDaysOff> = [];

            let currentDayMoment = moment(fromMoment);

            while (currentDayMoment.isSameOrBefore(todayMoment)) {

                let activitiesWithFitnessThatDay: Array<IActivitiesWithFitness> = _.where(cleanedActivities, {
                    year: currentDayMoment.year(),
                    dayOfYear: currentDayMoment.dayOfYear()
                });

                let fitnessObjectOnCurrentDay: IActivitiesWithFitnessDaysOff = {
                    ids: [],
                    date: currentDayMoment.toDate(),
                    timestamp: currentDayMoment.toDate().getTime(),
                    type: [],
                    activitiesName: [],
                    previewDay: false,
                    finalStressScore: 0
                };

                if (activitiesWithFitnessThatDay.length) {

                    // Handle all activities done that day
                    for (let count: number = 0; count < activitiesWithFitnessThatDay.length; count++) {

                        let fitnessActivity: IActivitiesWithFitness = activitiesWithFitnessThatDay[count];

                        fitnessObjectOnCurrentDay.ids.push(fitnessActivity.id);
                        fitnessObjectOnCurrentDay.activitiesName.push(fitnessActivity.activityName);
                        fitnessObjectOnCurrentDay.type.push(fitnessActivity.type);

                        // Apply scores for that day
                        // PSS
                        if (fitnessActivity.powerStressScore) {

                            if (!fitnessObjectOnCurrentDay.powerStressScore) { // Initialize value if not exists
                                fitnessObjectOnCurrentDay.powerStressScore = 0;
                            }
                            fitnessObjectOnCurrentDay.powerStressScore += fitnessActivity.powerStressScore;
                        }

                        // TRIMP
                        if (fitnessActivity.trimpScore) { // Check for TRIMP score if available
                            if (!fitnessObjectOnCurrentDay.trimpScore) { // Initialize value if not exists
                                fitnessObjectOnCurrentDay.trimpScore = 0;
                            }
                            fitnessObjectOnCurrentDay.trimpScore += fitnessActivity.trimpScore;
                        }

                        // SwimSS
                        if (fitnessActivity.swimStressScore) { // Check for TRIMP score if available
                            if (!fitnessObjectOnCurrentDay.swimStressScore) { // Initialize value if not exists
                                fitnessObjectOnCurrentDay.swimStressScore = 0;
                            }
                            fitnessObjectOnCurrentDay.swimStressScore += fitnessActivity.swimStressScore;
                        }

                        // Apply final stress score for that day
                        if (fitnessActivity.powerStressScore) { // Use PSS has priority over TRIMP

                            fitnessObjectOnCurrentDay.finalStressScore += fitnessActivity.powerStressScore;

                        } else if (fitnessActivity.trimpScore) {

                            fitnessObjectOnCurrentDay.finalStressScore += fitnessActivity.trimpScore;

                        } else if (fitnessActivity.swimStressScore) {

                            fitnessObjectOnCurrentDay.finalStressScore += fitnessActivity.swimStressScore;

                        }
                    }
                }

                everyDayFitnessObjects.push(fitnessObjectOnCurrentDay);

                currentDayMoment.add(1, 'days'); // Add a day until todayMoment
            }

            // Add 14 days as future "preview".
            for (let i: number = 1; i <= FitnessDataService.FUTURE_DAYS_PREVIEW; i++) {

                let futureDate: Date = moment().add(i, 'days').startOf('day').toDate();

                let fitnessObjectOnCurrentDay: IActivitiesWithFitnessDaysOff = {
                    ids: [],
                    date: futureDate,
                    timestamp: futureDate.getTime(),
                    type: [],
                    activitiesName: [],
                    trimpScore: 0,
                    previewDay: true,
                    finalStressScore: 0
                };

                everyDayFitnessObjects.push(fitnessObjectOnCurrentDay)
            }

            deferred.resolve(everyDayFitnessObjects);

        }, (err: any) => {
            deferred.reject(err);
        });

        return deferred.promise;
    }

    /**
     * @return Compute CTl, ATL, TSB results with days off (= rest day)
     */
    protected computeChronicAcuteBalanceTrainingLoad(fitnessObjectsWithDaysOff: Array<IActivitiesWithFitnessDaysOff>): Array<IFitnessActivity> {

        let ctl: number = 0;
        let atl: number = 0;
        let tsb: number = 0;
        let results: Array<IFitnessActivity> = [];

        _.each(fitnessObjectsWithDaysOff, (trimpObject: IActivitiesWithFitnessDaysOff, index: number, list: Array<IActivitiesWithFitnessDaysOff>) => {

            ctl = ctl + (trimpObject.finalStressScore - ctl) * (1 - Math.exp(-1 / 42));
            atl = atl + (trimpObject.finalStressScore - atl) * (1 - Math.exp(-1 / 7));
            tsb = ctl - atl;

            let result: IFitnessActivity = {
                ids: trimpObject.ids,
                date: trimpObject.date.toLocaleDateString(),
                timestamp: trimpObject.timestamp,
                activitiesName: trimpObject.activitiesName,
                type: trimpObject.type,
                ctl: ctl,
                atl: atl,
                tsb: tsb,
                previewDay: trimpObject.previewDay,
            };

            if (_.isNumber(trimpObject.trimpScore) && trimpObject.trimpScore > 0) {
                result.trimpScore = trimpObject.trimpScore;
            }

            if (_.isNumber(trimpObject.powerStressScore) && trimpObject.powerStressScore > 0) {
                result.powerStressScore = trimpObject.powerStressScore;
            }

            if (_.isNumber(trimpObject.swimStressScore) && trimpObject.swimStressScore > 0) {
                result.swimStressScore = trimpObject.swimStressScore;
            }

            if (_.isNumber(trimpObject.finalStressScore) && trimpObject.finalStressScore > 0) {
                result.finalStressScore = trimpObject.finalStressScore;
            }

            // Test if we are switching from today to the first preview day
            // This test is positive just 1 time !
            if (list[index - 1] && list[index - 1].previewDay !== list[index].previewDay) {

                // First preview day here !
                console.log('First preview day is', list[index].date);

                let lastResult = _.last(results);

                // Create a new result to fill the gap !
                let fillTheCurvesGapWithFakeResult: IFitnessActivity = {
                    ids: null,
                    date: lastResult.date,
                    timestamp: lastResult.timestamp,
                    activitiesName: null,
                    type: null,
                    // trimpScore: null,
                    // finalStressScore: trimpObject.finalStressScore,
                    ctl: lastResult.ctl,
                    atl: lastResult.atl,
                    tsb: lastResult.tsb,
                    previewDay: true,
                };

                results.push(fillTheCurvesGapWithFakeResult);
            }

            results.push(result);
        });

        return results;
    }

    /**
     * @return Fitness data objects including CTl, ATL, TSB results with days off (= rest day)
     */
    public getFitnessData(usePowerMeter: boolean, userFTP: number, useSwimStressScore: boolean, userSwimFTP: number): IPromise<Array<IFitnessActivity>> {

        this.usePowerMeter = usePowerMeter;
        this.userFTP = userFTP;

        this.useSwimStressScore = useSwimStressScore;
        this.userSwimFTP = userSwimFTP;

        let deferred = this.$q.defer<Array<IFitnessActivity>>();

        console.log('Fetch fitnessData from fitnessDataService.getFitnessData');

        this.getFitnessObjectsWithDaysOff().then((fitnessObjectsWithDaysOff: Array<IActivitiesWithFitnessDaysOff>) => {

            this.fitnessData = this.computeChronicAcuteBalanceTrainingLoad(fitnessObjectsWithDaysOff);

            deferred.resolve(this.fitnessData);

            this.onGetFitnessDataTimeDone = performance.now(); // track time
            console.log("Generating FitnessData from storage took " + (this.onGetFitnessDataTimeDone - this.onGetComputedActivitiesTimeStart).toFixed(0) + " ms.")

        }, (err: any) => {
            deferred.reject(err);
        });

        return deferred.promise;
    }
}

app.factory('FitnessDataService', ['$q', 'ChromeStorageService', ($q: IQService, chromeStorageService: ChromeStorageService) => {
    return new FitnessDataService($q, chromeStorageService);
}]);

/**
 * @return
 */
/*
 DO NOT REMOVE FUNCTION
 fitnessDataService.computeRestLooseGain = (fitnessData) => {

 // Find the date and loos
 var lastResult = _.clone(_.last(fitnessData));

 var dayCountLostCtl = 1;
 var dayCountLostAtl = 1;
 var dayCountInForm = 0;
 var dayCountLostForm = 0;

 lastResult.ctl = parseInt(lastResult.ctl);
 lastResult.atl = parseInt(lastResult.atl);

 var ctlLooseTriggerPercentage = 5;
 var ctlLooseTrigger = ctlLooseTriggerPercentage / 100 * lastResult.ctl;

 var atlLooseTriggerPercentage = 5;
 var atlLooseTrigger = atlLooseTriggerPercentage / 100 * lastResult.atl;

 while (lastResult.ctl > ctlLooseTrigger) {

 lastResult.ctl = lastResult.ctl + (0 - lastResult.ctl) * (1 - Math.exp(-1 / 42));
 lastResult.atl = lastResult.atl + (0 - lastResult.atl) * (1 - Math.exp(-1 / 7));
 lastResult.tsb = lastResult.ctl - lastResult.atl;

 if (lastResult.ctl > ctlLooseTrigger) {
 dayCountLostCtl++;
 }
 if (lastResult.atl > atlLooseTrigger) {
 dayCountLostAtl++;
 }

 if (lastResult.tsb <= 0) {
 dayCountInForm++;
 } else { // Positive
 dayCountLostForm++;
 }
 }

 return {
 lostCtl: {
 percentageTrigger: 100 - ctlLooseTriggerPercentage,
 dayCount: dayCountLostCtl,
 date: new Date((new Date().getTime() + dayCountLostCtl * fitnessDataService.const.DAY_LONG_MILLIS)) // TODO Use moment.add(x, 'days')
 },
 lostAtl: {
 percentageTrigger: 100 - atlLooseTriggerPercentage,
 dayCount: dayCountLostAtl,
 date: new Date((new Date().getTime() + dayCountLostAtl * fitnessDataService.const.DAY_LONG_MILLIS))
 },
 gainForm: {
 dayCount: dayCountInForm,
 date: new Date((new Date().getTime() + dayCountInForm * fitnessDataService.const.DAY_LONG_MILLIS))
 },
 lostForm: {
 dayCount: dayCountLostForm,
 date: new Date((new Date().getTime() + dayCountLostForm * fitnessDataService.const.DAY_LONG_MILLIS))
 },
 };
 };*/

