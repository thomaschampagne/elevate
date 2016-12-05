import Moment = moment.Moment;
interface IFitnessDataService {
    fitnessData: Array<IFitnessTrimpObject>;
    getComputedActivities: Function;
    getCleanedComputedActivitiesWithHeartRateData: Function;
    getFitnessObjectsWithDaysOff: Function;
    computeChronicAcuteBalanceTrainingLoad: (fitnessObjectsWithDaysOff: Array<IFitnessActivitiesWithHRDaysOff>) => Array<IFitnessTrimpObject>;
    getFitnessData: () => Q.Promise<Array<IFitnessTrimpObject>>;
}

interface IFitnessActivitiesWithHR {
    id: number;
    date: Date;
    timestamp: number;
    dayOfYear: number;
    type: string;
    activityName: string;
    trimp: number;
}

interface IFitnessActivitiesWithHRDaysOff {
    ids: Array<number>;
    date: Date;
    timestamp: number;
    type: Array<string>;
    activitiesName: Array<string>;
    trimp: number;
    previewDay: boolean;
}

interface IFitnessTrimpObject {
    ids: Array<number>;
    date: string;
    timestamp: number;
    type: Array<string>;
    activitiesName: Array<string>;
    trimp: number;
    ctl: number;
    atl: number;
    tsb: number;
    previewDay: boolean;
}

interface IFitnessTrimpObjectTable extends IFitnessTrimpObject {
    activitiesNameStr: string;
}

app.factory('FitnessDataService', ['$q', 'ChromeStorageService', ($q: IQService, chromeStorageService: ChromeStorageService) => {

    let onGetComputedActivitiesTimeStart: number;
    let onGetFitnessDataTimeDone: number;

    const FUTURE_DAYS_PREVIEW = 14;

    let fitnessDataService: IFitnessDataService = {
        fitnessData: null,
        getComputedActivities: null,
        getCleanedComputedActivitiesWithHeartRateData: null,
        getFitnessObjectsWithDaysOff: null,
        computeChronicAcuteBalanceTrainingLoad: null,
        getFitnessData: null,
    };

    /**
     * @return Computed synced activities
     */
    fitnessDataService.getComputedActivities = () => {

        let deferred = $q.defer();

        onGetComputedActivitiesTimeStart = performance.now(); // track time

        console.log('Fetch computedActivities from chromeStorageService');

        chromeStorageService.fetchComputedActivities().then((computedActivities: Array<ISyncActivityComputed>) => {
            deferred.resolve(computedActivities);
        }, (err: any) => {
            deferred.reject(err);
        });

        return deferred.promise;
    };


    /**
     * @return computed activities with HR data only
     */
    fitnessDataService.getCleanedComputedActivitiesWithHeartRateData = () => {

        let deferred = $q.defer();

        console.log('Fetch computedActivitiesWithHR from fitnessDataService.getCleanedComputedActivitiesWithHeartRateData');

        fitnessDataService.getComputedActivities().then((computedActivities: Array<ISyncActivityComputed>) => {

            let cleanedActivitiesWithHRData: Array<IFitnessActivitiesWithHR> = [];
            _.each(computedActivities, (activity: ISyncActivityComputed) => {
                if (activity.extendedStats && activity.extendedStats.heartRateData) {

                    let date: Date = new Date(activity.start_time);

                    let activityHR: IFitnessActivitiesWithHR = {
                        id: activity.id,
                        date: date,
                        timestamp: date.getTime(),
                        dayOfYear: moment(date).dayOfYear(),
                        type: activity.display_type,
                        activityName: activity.name,
                        trimp: parseInt(activity.extendedStats.heartRateData.TRIMP.toFixed(0))
                    };

                    cleanedActivitiesWithHRData.push(activityHR);
                }
            });

            deferred.resolve(cleanedActivitiesWithHRData);

        }, (err: any) => {
            deferred.reject(err);
        });

        return deferred.promise;
    };

    /**
     * @return Fitness object of computed activities including days off (= rest day)
     */
    fitnessDataService.getFitnessObjectsWithDaysOff = () => {

        let deferred = $q.defer();


        console.log('Fetch fitnessObjectsWithDaysOff from fitnessDataService.getFitnessObjectsWithDaysOff');

        fitnessDataService.getCleanedComputedActivitiesWithHeartRateData().then((cleanedActivitiesWithHRData: Array<IFitnessActivitiesWithHR>) => {

            // From date is the first activity done in history
            let fromDate: Date = _.first(cleanedActivitiesWithHRData).date;

            // Subtract 1 day to from date (to show graph point with 1 day before)
            fromDate = moment(fromDate).subtract(1, 'days').toDate();

            // Now inject days off/resting
            let daysDiffWithToday: number = moment.duration(moment().diff(moment(fromDate))).asDays();

            let everyDayFitnessObjects: Array<IFitnessActivitiesWithHRDaysOff> = [];

            for (let i: number = 0; i < daysDiffWithToday; i++) {

                let currentDayMoment = moment(fromDate).add(i, 'days');

                let foundOnToday: Array<IFitnessActivitiesWithHR> = _.filter(cleanedActivitiesWithHRData, (activity: IFitnessActivitiesWithHR) => {
                    return (activity.date.getFullYear() == currentDayMoment.year() && activity.dayOfYear == currentDayMoment.dayOfYear());
                });

                let fitnessObjectOnCurrentDay: IFitnessActivitiesWithHRDaysOff = {
                    ids: [],
                    date: currentDayMoment.toDate(),
                    timestamp: currentDayMoment.toDate().getTime(),
                    type: [],
                    activitiesName: [],
                    trimp: 0,
                    previewDay: false
                };

                if (foundOnToday.length) {

                    // Some trimp have beed found for that day
                    for (let j: number = 0; j < foundOnToday.length; j++) {
                        fitnessObjectOnCurrentDay.ids.push(foundOnToday[j].id);
                        fitnessObjectOnCurrentDay.trimp += foundOnToday[j].trimp;
                        fitnessObjectOnCurrentDay.activitiesName.push(foundOnToday[j].activityName);
                        fitnessObjectOnCurrentDay.type.push(foundOnToday[j].type);
                    }
                }

                everyDayFitnessObjects.push(fitnessObjectOnCurrentDay);
            }

            // Add 14 days as future "preview".
            for (let i: number = 1; i <= FUTURE_DAYS_PREVIEW; i++) {

                let futureDate: Date = moment().add(i, 'days').toDate();

                let fitnessObjectOnCurrentDay: IFitnessActivitiesWithHRDaysOff = {
                    ids: [],
                    date: futureDate,
                    timestamp: futureDate.getTime(),
                    type: [],
                    activitiesName: [],
                    trimp: 0,
                    previewDay: true
                };

                everyDayFitnessObjects.push(fitnessObjectOnCurrentDay)
            }

            deferred.resolve(everyDayFitnessObjects);

        }, (err: any) => {
            deferred.reject(err);
        });

        return deferred.promise;

    };

    /**
     * @return Compute CTl, ATL, TSB results with days off (= rest day)
     */
    fitnessDataService.computeChronicAcuteBalanceTrainingLoad = (fitnessObjectsWithDaysOff: Array<IFitnessActivitiesWithHRDaysOff>) => {

        let ctl: number = 0;
        let atl: number = 0;
        let tsb: number = 0;
        let results: Array<IFitnessTrimpObject> = [];

        _.each(fitnessObjectsWithDaysOff, (trimpObject: IFitnessActivitiesWithHRDaysOff) => {

            ctl = ctl + (trimpObject.trimp - ctl) * (1 - Math.exp(-1 / 42));
            atl = atl + (trimpObject.trimp - atl) * (1 - Math.exp(-1 / 7));
            tsb = ctl - atl;

            let result: IFitnessTrimpObject = {
                ids: trimpObject.ids,
                date: trimpObject.date.toLocaleDateString(),
                timestamp: trimpObject.timestamp,
                activitiesName: trimpObject.activitiesName,
                type: trimpObject.type,
                trimp: trimpObject.trimp,
                ctl: parseFloat(ctl.toFixed(1)),
                atl: parseFloat(atl.toFixed(1)),
                tsb: parseFloat(tsb.toFixed(1)),
                previewDay: trimpObject.previewDay
            };

            results.push(result);
        });
        return results;
    };

    /**
     * @return Fitness data objects including CTl, ATL, TSB results with days off (= rest day)
     */
    fitnessDataService.getFitnessData = () => {

        let deferred = $q.defer();

        if (!fitnessDataService.fitnessData) {

            console.log('Fetch fitnessData from fitnessDataService.getFitnessData');

            fitnessDataService.getFitnessObjectsWithDaysOff().then((fitnessObjectsWithDaysOff: Array<IFitnessActivitiesWithHRDaysOff>) => {

                fitnessDataService.fitnessData = fitnessDataService.computeChronicAcuteBalanceTrainingLoad(fitnessObjectsWithDaysOff);

                deferred.resolve(fitnessDataService.fitnessData);

                onGetFitnessDataTimeDone = performance.now(); // track time

                console.log("Generating FitnessData from storage took " + (onGetFitnessDataTimeDone - onGetComputedActivitiesTimeStart).toFixed(0) + " ms.")

            }, (err: any) => {
                deferred.reject(err);
            });

        } else {
            console.log('Fetch fitnessData from FitnessDataService local var');
            deferred.resolve(fitnessDataService.fitnessData);
        }

        return <Q.Promise<Array<IFitnessTrimpObject>>> deferred.promise;

    };

    return fitnessDataService;

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

