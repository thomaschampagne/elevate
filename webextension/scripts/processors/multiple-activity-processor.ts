import _ from "lodash";
import * as Q from "q";
import { AppResourcesModel } from "../models/app-resources.model";
import { ComputeActivityThreadMessageModel } from "../models/compute-activity-thread-message.model";
import { StreamActivityModel } from "../models/sync/stream-activity.model";
import { SyncNotifyModel } from "../models/sync/sync-notify.model";
import * as hash from "hash.js";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { Activity, ActivityStats } from "@elevate/shared/models/sync/activity.model";
import { ActivityEssentials } from "@elevate/shared/models/activity-data/activity-essentials.model";
import { Constant } from "@elevate/shared/constants/constant";
import { ActivityComputer } from "@elevate/shared/sync/compute/activity-computer";
import { AthleteSnapshotResolver } from "@elevate/shared/resolvers/athlete-snapshot.resolver";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import ExtensionUserSettings = UserSettings.ExtensionUserSettings;

const ComputeAnalysisWorker = require("worker-loader?inline!./workers/compute-analysis.worker");

export class MultipleActivityProcessor {
  protected appResources: AppResourcesModel;
  protected userSettings: ExtensionUserSettings;
  protected athleteModelResolver: AthleteSnapshotResolver;

  constructor(
    appResources: AppResourcesModel,
    userSettings: ExtensionUserSettings,
    athleteModelResolver: AthleteSnapshotResolver
  ) {
    this.appResources = appResources;
    this.userSettings = userSettings;
    this.athleteModelResolver = athleteModelResolver;
  }

  /**
   * @return Activities array with computed stats
   */
  public compute(activitiesWithStream: StreamActivityModel[]): Q.IPromise<Activity[]> {
    const deferred = Q.defer<Activity[]>();

    let activitiesPercentageCount = 0;

    let activitiesComputedResults: ActivityStats[] = [];

    const queue: Q.Promise<any> = activitiesWithStream.reduce(
      (promise: Q.Promise<any>, activityWithStream: StreamActivityModel, index: number) => {
        return promise.then(() => {
          // Find athlete model to compute with activity
          activityWithStream.athleteSnapshot = this.athleteModelResolver.resolve(
            new Date(activityWithStream.start_time)
          );

          return this.computeActivity(activityWithStream).then((activityComputed: ActivityStats) => {
            activitiesComputedResults.push(activityComputed);

            const notify: SyncNotifyModel = {
              step: "activitiesPercentage",
              progress: (activitiesPercentageCount / activitiesWithStream.length) * 100,
              index: index,
              activityId: activityWithStream.id
            };

            deferred.notify(notify);

            activitiesPercentageCount++;
          });
        });
      },
      Q.resolve({})
    );

    // Queue Finished
    queue
      .then(() => {
        if (activitiesComputedResults.length !== activitiesWithStream.length) {
          const errMessage: string =
            "activitiesComputedResults length mismatch with activitiesWithStream length: " +
            activitiesComputedResults.length +
            " != " +
            activitiesWithStream.length +
            ")";
          deferred.reject(errMessage);
        } else {
          let activitiesComputed: Activity[] = [];

          _.forEach(activitiesComputedResults, (activityStats: ActivityStats, index: number) => {
            const streamActivityModel = _.cloneDeep(activitiesWithStream[index]);
            const nowIsoDate = new Date().toISOString();
            const startTimestamp = Math.floor(new Date(streamActivityModel.start_time).getTime() / 1000);
            const endTimestamp = startTimestamp + streamActivityModel.elapsed_time_raw;

            const activityComputed: Activity = new Activity();
            activityComputed.id = streamActivityModel.id;
            activityComputed.name = streamActivityModel.name;
            activityComputed.type = streamActivityModel.sport_type as ElevateSport;
            activityComputed.startTimestamp = startTimestamp;
            activityComputed.endTimestamp = endTimestamp;
            activityComputed.startTime = streamActivityModel.start_time;
            activityComputed.endTime = new Date(endTimestamp * 1000).toISOString();
            activityComputed.hasPowerMeter = streamActivityModel.hasPowerMeter;
            activityComputed.trainer = streamActivityModel.trainer;
            activityComputed.commute = streamActivityModel.commute;
            activityComputed.creationTime = nowIsoDate;
            activityComputed.lastEditTime = nowIsoDate;
            activityComputed.stats = activityStats;

            activityComputed.stats.movingTime = streamActivityModel.moving_time_raw;
            activityComputed.stats.elapsedTime = streamActivityModel.elapsed_time_raw;
            activityComputed.stats.distance = streamActivityModel.distance_raw;
            activityComputed.stats.moveRatio = activityComputed.stats.movingTime / activityComputed.stats.elapsedTime;
            // activityComputed.stats.calories = streamActivityModel.calories;
            activityComputed.stats.caloriesPerHour =
              activityComputed.stats.calories !== null
                ? (activityComputed.stats.calories / activityComputed.stats.elapsedTime) * Constant.SEC_HOUR_FACTOR
                : null;
            activityComputed.stats.elevationGain = streamActivityModel.elevation_gain_raw;

            if (activityComputed.stats.elevation) {
              activityComputed.stats.elevation.ascent = streamActivityModel.elevation_gain_raw;
            }

            activityComputed.athleteSnapshot = activitiesWithStream[index].athleteSnapshot;
            activityComputed.settingsLack = ActivityComputer.hasAthleteSettingsLacks(
              activityComputed.stats.distance,
              activityComputed.stats.movingTime,
              activityComputed.stats.elapsedTime,
              activityComputed.type,
              activityComputed.stats,
              activityComputed.athleteSnapshot.athleteSettings
            );

            const activityUnitForHashing = {
              id: activityComputed.id,
              type: activityComputed.type,
              startTime: activityComputed.startTime,
              endTime: activityComputed.endTime,
              hasPowerMeter: activityComputed.hasPowerMeter,
              trainer: activityComputed.trainer,
              distance: _.floor(activityComputed.stats?.distance) || null
            };

            activityComputed.hash = hash
              .sha256()
              .update(JSON.stringify(activityUnitForHashing))
              .digest("hex")
              .slice(0, 24);

            activitiesComputed.push(activityComputed);
          });

          // Sort activities by start date ascending before resolve
          activitiesComputed = _.sortBy(activitiesComputed, (item: Activity) => {
            return new Date(item.startTime).getTime();
          });

          // Finishing... force progress @ 100% for compute progress callback
          const notify: SyncNotifyModel = {
            step: "activitiesPercentage",
            progress: 100
          };

          deferred.notify(notify);

          deferred.resolve(activitiesComputed);

          // Free mem for garbage collector!
          activitiesComputedResults = null;
          activitiesWithStream = null;
          activitiesComputed = null;
        }
      })
      .catch((error: any) => {
        console.error(error);
        deferred.reject(error);
      });

    return deferred.promise;
  }

  protected provideActivityEssentials(activityWithStream: StreamActivityModel): ActivityEssentials {
    return {
      elevation: parseInt(activityWithStream.elevation_gain, 10),
      movingTime: activityWithStream.moving_time_raw,
      distance: activityWithStream.distance_raw
    };
  }

  protected computeActivity(activityWithStream: StreamActivityModel): Q.IPromise<ActivityStats> {
    const deferred = Q.defer<ActivityStats>();

    // Lets create that worker/thread!
    const computeAnalysisThread: Worker = new ComputeAnalysisWorker();

    // Create activity stats map from given activity
    const activityEssentials: ActivityEssentials = this.provideActivityEssentials(activityWithStream);

    const threadMessage: ComputeActivityThreadMessageModel = {
      activityType: activityWithStream.sport_type as ElevateSport,
      supportsGap: activityWithStream.sport_type === "Run",
      isTrainer: activityWithStream.trainer,
      appResources: this.appResources,
      userSettings: this.userSettings,
      isOwner: true, // While syncing and processing activities, elevate user is always author of the activity
      athleteSnapshot: activityWithStream.athleteSnapshot,
      hasPowerMeter: activityWithStream.hasPowerMeter,
      activityEssentials: activityEssentials,
      streams: activityWithStream.stream,
      bounds: null,
      returnPeaks: false,
      returnZones: false
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

    computeAnalysisThread.onerror = err => {
      const errorMessage: any = {
        errObject: err,
        activityId: activityWithStream.id
      };

      // Push error upper
      console.error(errorMessage);
      deferred.reject(errorMessage);

      // Finish and kill thread
      computeAnalysisThread.terminate();
    };

    return deferred.promise;
  }
}
