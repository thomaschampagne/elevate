import * as _ from "lodash";
import * as Q from "q";
import { ActivityStatsMapModel, AnalysisDataModel } from "../../../common/scripts/models/ActivityData";
import { StreamActivityModel, SyncedActivityModel, SyncNotifyModel } from "../../../common/scripts/models/Sync";
import { UserSettingsModel } from "../../../common/scripts/models/UserSettings";
import { IAppResources } from "../interfaces/IAppResources";
import { IComputeActivityThreadMessage } from "../interfaces/IComputeActivityThreadMessage";
import { ComputeAnalysisWorker } from "./workers/ComputeAnalysisWorker";

export class MultipleActivityProcessor {

    protected appResources: IAppResources;
	protected userSettings: UserSettingsModel;

	constructor(appResources: IAppResources, userSettings: UserSettingsModel) {
        this.appResources = appResources;
        this.userSettings = userSettings;
    }

    public static outputFields: string[] = ["id", "name", "type", "display_type", "private", "bike_id", "start_time", "distance_raw", "short_unit", "moving_time_raw", "elapsed_time_raw", "trainer", "commute", "elevation_unit", "elevation_gain_raw", "calories", "hasPowerMeter"];

    /**
     * @return Activities array with computed stats
     */
	public compute(activitiesWithStream: StreamActivityModel[]): Q.IPromise<SyncedActivityModel[]> {

		const deferred = Q.defer<SyncedActivityModel[]>();

        let computedActivitiesPercentageCount: number = 0;

		let activitiesComputedResults: AnalysisDataModel[] = [];

		const queue: Q.Promise<any> = activitiesWithStream.reduce((promise: Q.Promise<any>, activityWithStream: StreamActivityModel, index: number) => {

            return promise.then(() => {

				return this.computeActivity(activityWithStream).then((activityComputed: AnalysisDataModel) => {

                    activitiesComputedResults.push(activityComputed);

					const notify: SyncNotifyModel = {
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

				let activitiesComputed: SyncedActivityModel[] = [];

				_.forEach(activitiesComputedResults, (computedResult: AnalysisDataModel, index: number) => {

					const activityComputed: SyncedActivityModel = _.pick(activitiesWithStream[index], MultipleActivityProcessor.outputFields) as SyncedActivityModel;
                    activityComputed.extendedStats = computedResult;
                    activitiesComputed.push(activityComputed);

                });

                // Sort computedActivities by start date ascending before resolve
				activitiesComputed = _.sortBy(activitiesComputed, (item: SyncedActivityModel) => {
                    return (new Date(item.start_time)).getTime();
                });

                // Finishing... force progress @ 100% for compute progress callback
				const notify: SyncNotifyModel = {
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

	protected createActivityStatMap(activityWithStream: StreamActivityModel): ActivityStatsMapModel {

		const statsMap: ActivityStatsMapModel = {
            distance: parseInt(activityWithStream.distance),
            elevation: parseInt(activityWithStream.elevation_gain),
            avgPower: null, // Toughness Score will not be computed
            averageSpeed: null, // Toughness Score will not be computed
        };

        return statsMap;
    }

	protected computeActivity(activityWithStream: StreamActivityModel): Q.IPromise<AnalysisDataModel> {

		const deferred = Q.defer<AnalysisDataModel>();

        // Lets create that worker/thread!
        const computeAnalysisThread: Worker = new Worker(URL.createObjectURL(new Blob(["(", ComputeAnalysisWorker.toString(), ")()"], {
            type: "application/javascript",
        })));

        // Create activity stats map from given activity
		const activityStatsMap: ActivityStatsMapModel = this.createActivityStatMap(activityWithStream);

        const threadMessage: IComputeActivityThreadMessage = {
            activityType: activityWithStream.type,
            isTrainer: activityWithStream.trainer,
            appResources: this.appResources,
            userSettings: this.userSettings,
            isActivityAuthor: true, // While syncing and processing activities, stravistix user is always author of the activity
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
