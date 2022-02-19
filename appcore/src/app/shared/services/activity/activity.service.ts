import { ActivityDao } from "../../dao/activity/activity.dao";
import _ from "lodash";
import { AthleteSnapshotResolverService } from "../athlete-snapshot-resolver/athlete-snapshot-resolver.service";
import { Subject } from "rxjs";
import { LoggerService } from "../logging/logger.service";
import { Inject } from "@angular/core";
import { ActivityCountByType } from "../../models/activity/activity-count-by-type.model";
import { Activity, PaceStats, SpeedStats } from "@elevate/shared/models/sync/activity.model";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { Constant } from "@elevate/shared/constants/constant";
import { Movement } from "@elevate/shared/tools/movement";
import { sha256 } from "@elevate/shared/tools/hash";
import { MeasureSystem } from "@elevate/shared/enums/measure-system.enum";

export abstract class ActivityService {
  public athleteSettingsConsistency$: Subject<boolean>;
  public activitiesWithSettingsLacks$: Subject<boolean>;

  protected constructor(
    @Inject(ActivityDao) public readonly activityDao: ActivityDao,
    @Inject(AthleteSnapshotResolverService) public readonly athleteSnapshotResolver: AthleteSnapshotResolverService,
    @Inject(LoggerService) protected readonly logger: LoggerService
  ) {
    this.athleteSettingsConsistency$ = new Subject<boolean>();
    this.activitiesWithSettingsLacks$ = new Subject<boolean>();
  }

  public fetch(): Promise<Activity[]> {
    return this.activityDao.findSorted(false);
  }

  public find(
    query?: LokiQuery<Activity & LokiObj>,
    sort?: { propName: keyof Activity; options: Partial<SimplesortOptions> }
  ): Promise<Activity[]> {
    return this.activityDao.find(query, sort);
  }

  public findMostRecent(): Promise<Activity> {
    return this.findSorted(true).then(activities => {
      return activities && activities.length ? Promise.resolve(activities[0]) : Promise.resolve(null);
    });
  }

  public findByIds(ids: (number | string)[]): Promise<Activity[]> {
    return this.activityDao.find({ id: { $in: ids } });
  }

  public findSince(dateTime: number): Promise<Activity[]> {
    return this.activityDao.find({ startTimestamp: { $gt: Math.floor(dateTime / 1000) } }); // Divide by 1000 to match the db
  }

  public findSorted(descending: boolean = false): Promise<Activity[]> {
    return this.activityDao.findSorted(descending);
  }

  public insertMany(activities: Activity[]): Promise<void> {
    return this.activityDao.insertMany(activities);
  }

  public getById(id: number | string): Promise<Activity> {
    return this.activityDao.getById(id);
  }

  public removeById(id: number | string): Promise<void> {
    return this.activityDao.removeById(id);
  }

  public update(activity: Activity): Promise<Activity> {
    return this.activityDao.update(activity);
  }

  public insert(activity: Activity): Promise<Activity> {
    return this.activityDao.insert(activity);
  }

  public put(activity: Activity): Promise<Activity> {
    return this.activityDao.put(activity);
  }

  public clear(): Promise<void> {
    return this.activityDao.clear();
  }

  public count(): Promise<number> {
    return this.activityDao.count();
  }

  public countWithConnector(): Promise<number> {
    return this.activityDao.count({ connector: { $ne: null } });
  }

  public countByType(): ActivityCountByType[] {
    return this.activityDao
      .chain()
      .find()
      .mapReduce(
        activity => activity.type,
        sports => {
          const countBy = sports.reduce<{}>((results, sport: ElevateSport) => {
            results[sport] ? results[sport]++ : (results[sport] = 1);
            return results;
          }, {});
          return _.chain(countBy)
            .toPairs()
            .map(x => {
              return { type: x[0], count: x[1] } as ActivityCountByType;
            })
            .orderBy("count", "desc")
            .value();
        }
      );
  }

  public findByDatedSession(startTime: string, endTime: string): Promise<Activity[]> {
    return this.activityDao.findByDatedSession(startTime, endTime);
  }

  public removeByManyIds(activitiesToDelete: (string | number)[]): Promise<void> {
    return this.activityDao.removeByManyIds(activitiesToDelete);
  }

  /**
   * Tells if local activities is compliant with current athlete settings
   */
  public isAthleteSettingsConsistent(): Promise<boolean> {
    return this.athleteSnapshotResolver
      .update()
      .then(() => {
        return this.activityDao.find();
      })
      .then((activities: Activity[]) => {
        let isCompliant = true;
        _.forEachRight(activities, (activity: Activity) => {
          const athleteModelFound = this.athleteSnapshotResolver.resolve(new Date(activity.startTime));
          if (!athleteModelFound.equals(activity.athleteSnapshot)) {
            isCompliant = false;
            return false;
          }
        });
        return Promise.resolve(isCompliant);
      });
  }

  /**
   * Ask for athleteSettings consistency check and notify athleteSettingsConsistency subscribers of consistency
   */
  public verifyConsistencyWithAthleteSettings(): void {
    this.logger.debug("checking athlete settings consistency");
    this.isAthleteSettingsConsistent().then(
      isConsistent => {
        this.athleteSettingsConsistency$.next(isConsistent);
        this.logger.debug("Athlete settings consistent: " + isConsistent);
      },
      error => this.athleteSettingsConsistency$.error(error)
    );
  }

  /**
   * Provide local activity ids which are not compliant with current athlete settings
   */
  public nonConsistentActivitiesWithAthleteSettings(): Promise<number[]> {
    return this.athleteSnapshotResolver
      .update()
      .then(() => {
        return this.fetch();
      })
      .then((activities: Activity[]) => {
        const nonConsistentIds = [];
        _.forEachRight(activities, (activity: Activity) => {
          const athleteModelFound = this.athleteSnapshotResolver.resolve(new Date(activity.startTime));
          if (!athleteModelFound.equals(activity.athleteSnapshot)) {
            nonConsistentIds.push(activity.id);
          }
        });
        return Promise.resolve(nonConsistentIds);
      });
  }

  /**
   * Ask to check activities having settings lacks (missing FTPs)
   */
  public verifyActivitiesWithSettingsLacking(): void {
    this.logger.debug("checking activities with settings lacks");
    this.hasActivitiesWithSettingsLacks().then(
      hasSettingsLack => {
        this.activitiesWithSettingsLacks$.next(hasSettingsLack);
        this.logger.debug("Activities with settings lacks: " + hasSettingsLack);
      },
      error => this.activitiesWithSettingsLacks$.error(error)
    );
  }

  public hasActivitiesWithSettingsLacks(): Promise<boolean> {
    return this.activityDao.hasActivitiesWithSettingsLacks();
  }

  public findActivitiesWithSettingsLacks(): Promise<Activity[]> {
    return this.activityDao.findActivitiesWithSettingsLacks();
  }

  public createManualEntry(
    userSourceActivity: Activity,
    userMeasureSystem: MeasureSystem,
    startDate: Date,
    duration: number
  ): Promise<Activity> {
    userSourceActivity = _.cloneDeep(userSourceActivity);

    const today = new Date();
    userSourceActivity.creationTime = today.toISOString();
    userSourceActivity.lastEditTime = today.toISOString();

    // Setup start time
    userSourceActivity.startTime = startDate.toISOString();
    userSourceActivity.startTimestamp = Math.floor(startDate.getTime() / 1000);

    // Setup duration
    userSourceActivity.stats.movingTime = duration;
    userSourceActivity.stats.elapsedTime = duration;
    userSourceActivity.stats.moveRatio = 1;

    // Setup end time
    const endDate = new Date((userSourceActivity.startTimestamp + duration) * 1000);
    userSourceActivity.endTime = endDate.toISOString();
    userSourceActivity.endTimestamp = Math.floor(endDate.getTime() / 1000);

    return this.findByDatedSession(userSourceActivity.startTime, userSourceActivity.endTime)
      .then(results => {
        if (results.length > 0) {
          return Promise.reject("One or several activities already exist at given time");
        }

        return this.athleteSnapshotResolver.update();
      })
      .then(() => {
        userSourceActivity.athleteSnapshot = this.athleteSnapshotResolver.resolve(startDate);

        // Setup elevation gain
        if (Number.isFinite(userSourceActivity.stats.elevationGain)) {
          userSourceActivity.stats.elevationGain =
            userMeasureSystem === MeasureSystem.IMPERIAL
              ? userSourceActivity.stats.elevationGain / Constant.METER_TO_FEET_FACTOR
              : userSourceActivity.stats.elevationGain;

          userSourceActivity.stats.elevation.ascent = userSourceActivity.stats.elevationGain;
        }

        // Try to compute avg speed/pace
        if (userSourceActivity.stats?.distance > 0) {
          // Convert distance according user measurement system
          userSourceActivity.stats.distance =
            userMeasureSystem === MeasureSystem.IMPERIAL
              ? userSourceActivity.stats.distance / Constant.KM_TO_MILE_FACTOR
              : userSourceActivity.stats.distance;

          // Convert kilometers to meters
          userSourceActivity.stats.distance = _.round(userSourceActivity.stats.distance * 1000);

          userSourceActivity.stats.speed = {
            avg: (userSourceActivity.stats.distance / userSourceActivity.stats.movingTime) * Constant.MPS_KPH_FACTOR
          } as SpeedStats;
          userSourceActivity.stats.pace = {
            avg: Movement.speedToPace(userSourceActivity.stats.speed.avg)
          } as PaceStats;
        }

        // Update stress scores per hour
        if (Number.isFinite(userSourceActivity.stats.scores.stress.hrss)) {
          userSourceActivity.stats.scores.stress.hrssPerHour =
            (userSourceActivity.stats.scores.stress.hrss / userSourceActivity.stats.movingTime) *
            Constant.SEC_HOUR_FACTOR;
        }
        if (Number.isFinite(userSourceActivity.stats.scores.stress.pss)) {
          userSourceActivity.stats.scores.stress.pssPerHour =
            (userSourceActivity.stats.scores.stress.pss / userSourceActivity.stats.movingTime) *
            Constant.SEC_HOUR_FACTOR;
        }
        if (Number.isFinite(userSourceActivity.stats.scores.stress.rss)) {
          userSourceActivity.stats.scores.stress.rssPerHour =
            (userSourceActivity.stats.scores.stress.rss / userSourceActivity.stats.movingTime) *
            Constant.SEC_HOUR_FACTOR;
        }
        if (Number.isFinite(userSourceActivity.stats.scores.stress.sss)) {
          userSourceActivity.stats.scores.stress.sssPerHour =
            (userSourceActivity.stats.scores.stress.sss / userSourceActivity.stats.movingTime) *
            Constant.SEC_HOUR_FACTOR;
        }

        // Generate activity id
        return sha256(
          `${today.toISOString()}:${userSourceActivity.startTime}:${userSourceActivity.endTime}:${Math.random()}`,
          true
        );
      })
      .then(id => {
        userSourceActivity.id = id;

        // Generate activity hash
        return sha256(
          JSON.stringify({
            type: userSourceActivity.type,
            startTime: userSourceActivity.startTime,
            endTime: userSourceActivity.endTime,
            trainer: userSourceActivity.trainer,
            distance: userSourceActivity.stats.distance
          }),
          true
        );
      })
      .then(hash => {
        userSourceActivity.hash = hash;
        return this.insert(userSourceActivity);
      });
  }
}
