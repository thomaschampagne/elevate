import * as _ from "lodash";
import * as Q from "q";
import {IActivityStatsMap, IAnalysisData} from "../../../common/scripts/interfaces/IActivityData";
import {IAppResources} from "../interfaces/IAppResources";
import {IComputeActivityThreadMessage} from "../interfaces/IComputeActivityThreadMessage";
import {ISyncActivityComputed, ISyncActivityWithStream, ISyncNotify} from "../../../common/scripts/interfaces/ISync";
import {IUserSettings} from "../../../common/scripts/interfaces/IUserSettings";
import {ComputeAnalysisWorker} from "./workers/ComputeAnalysisWorker";

export class ActivitiesProcessor {

    protected appResources: IAppResources;
    protected userSettings: IUserSettings;

    constructor(appResources: IAppResources, userSettings: IUserSettings) {
        this.appResources = appResources;
        this.userSettings = userSettings;
    }

    public static outputFields: string[] = ["id", "name", "type", "display_type", "private", "bike_id", "start_time", "distance_raw", "short_unit", "moving_time_raw", "elapsed_time_raw", "trainer", "commute", "elevation_unit", "elevation_gain_raw", "calories", "hasPowerMeter"];

    /**
     * @return Activities array with computed stats
     */
    public compute(activitiesWithStream: ISyncActivityWithStream[]): Q.IPromise<ISyncActivityComputed[]> {

        const deferred = Q.defer<ISyncActivityComputed[]>();

        let computedActivitiesPercentageCount: number = 0;

        let activitiesComputedResults: IAnalysisData[] = [];

        const queue: Q.Promise<any> = activitiesWithStream.reduce((promise: Q.Promise<any>, activityWithStream: ISyncActivityWithStream, index: number) => {

            return promise.then(() => {

                return this.computeActivity(activityWithStream).then((activityComputed: IAnalysisData) => {

                    activitiesComputedResults.push(activityComputed);

                    const notify: ISyncNotify = {
                        step: "computedActivitiesPercentage",
                        progress: computedActivitiesPercentageCount / activitiesWithStream.length * 100,
                        index,
                        activityId: activityWithStream.id,
                    };

                    deferred.notify(notify);

                    computedActivitiesPercentageCount++;

                });

            });

        }, Q.resolve({}));

        // Queue Finished
        queue.then(() => {

            if (activitiesComputedResults.length !== activitiesWithStream.length) {

                const errMessage: string = "activitiesComputedResults length mismatch with activitiesWithStream length: " + activitiesComputedResults.length + " != " + activitiesWithStream.length + ")";
                deferred.reject(errMessage);

            } else {

                let activitiesComputed: ISyncActivityComputed[] = [];

                _.forEach(activitiesComputedResults, (computedResult: IAnalysisData, index: number) => {

                    const activityComputed: ISyncActivityComputed = _.pick(activitiesWithStream[index], ActivitiesProcessor.outputFields) as ISyncActivityComputed;
                    activityComputed.extendedStats = computedResult;
                    activitiesComputed.push(activityComputed);

                });

                // Sort computedActivities by start date ascending before resolve
                activitiesComputed = _.sortBy(activitiesComputed, (item: ISyncActivityComputed) => {
                    return (new Date(item.start_time)).getTime();
                });

                // Finishing... force progress @ 100% for compute progress callback
                const notify: ISyncNotify = {
                    step: "computedActivitiesPercentage",
                    progress: 100,
                };

                deferred.notify(notify);

                deferred.resolve(activitiesComputed);

                // Free mem for garbage collector!
                activitiesComputedResults = null;
                activitiesWithStream = null;
                activitiesComputed = null;
            }

        }).catch((error: any) => {
            console.error(error);
            deferred.reject(error);
        });

        return deferred.promise;
    }

    protected createActivityStatMap(activityWithStream: ISyncActivityWithStream): IActivityStatsMap {

        const statsMap: IActivityStatsMap = {
            distance: parseInt(activityWithStream.distance),
            elevation: parseInt(activityWithStream.elevation_gain),
            avgPower: null, // Toughness Score will not be computed
            averageSpeed: null, // Toughness Score will not be computed
        };

        return statsMap;
    }

    protected computeActivity(activityWithStream: ISyncActivityWithStream): Q.IPromise<IAnalysisData> {

        const deferred = Q.defer<IAnalysisData>();

        // Lets create that worker/thread!
        const computeAnalysisThread: Worker = new Worker(URL.createObjectURL(new Blob(["(", ComputeAnalysisWorker.toString(), ")()"], {
            type: "application/javascript",
        })));

        // Create activity stats map from given activity
        const activityStatsMap: IActivityStatsMap = this.createActivityStatMap(activityWithStream);

        const threadMessage: IComputeActivityThreadMessage = {
            activityType: activityWithStream.type,
            isTrainer: activityWithStream.trainer,
            appResources: this.appResources,
            userSettings: this.userSettings,
            athleteWeight: this.userSettings.userWeight,
            hasPowerMeter: activityWithStream.hasPowerMeter,
            activityStatsMap,
            activityStream: activityWithStream.stream,
            bounds: null,
            returnZones: false,
            systemJsConfig: SystemJS.getConfig(),
        };

        computeAnalysisThread.postMessage(threadMessage);

        // Listen messages from thread. Thread will send to us the result of computation
        computeAnalysisThread.onmessage = (messageFromThread: MessageEvent) => {

            // Notify upper compute method when an activity has been computed for progress percentage
            deferred.notify(activityWithStream.id);

            // Then resolve...
            deferred.resolve(messageFromThread.data);

            // Finish and kill thread
            computeAnalysisThread.terminate();

        };

        computeAnalysisThread.onerror = (err) => {

            const errorMessage: any = {
                errObject: err,
                activityId: activityWithStream.id,
            };

            // Push error uppper
            console.error(errorMessage);
            deferred.reject(errorMessage);

            // Finish and kill thread
            computeAnalysisThread.terminate();
        };

        return deferred.promise;
    }
}
