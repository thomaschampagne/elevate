import { ActivityDao } from "../../dao/activity/activity.dao";
import { SyncedActivityModel } from "@elevate/shared/models";
import _ from "lodash";
import { AthleteSnapshotResolverService } from "../athlete-snapshot-resolver/athlete-snapshot-resolver.service";
import { Subject } from "rxjs";
import { LoggerService } from "../logging/logger.service";
import { Inject } from "@angular/core";
import { ElevateSport } from "@elevate/shared/enums";
import { ActivityCountByType } from "../../models/activity/activity-count-by-type.model";

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

  public fetch(): Promise<SyncedActivityModel[]> {
    return this.activityDao.findSortStartDate(false);
  }

  public find(
    query?: LokiQuery<SyncedActivityModel & LokiObj>,
    sort?: { propName: keyof SyncedActivityModel; options: Partial<SimplesortOptions> }
  ): Promise<SyncedActivityModel[]> {
    return this.activityDao.find(query, sort);
  }

  public findMostRecent(): Promise<SyncedActivityModel> {
    return this.findSortStartDate(true).then(activities => {
      return activities && activities.length ? Promise.resolve(activities[0]) : Promise.resolve(null);
    });
  }

  public findSortStartDate(descending: boolean): Promise<SyncedActivityModel[]> {
    return this.activityDao.findSortStartDate(descending);
  }

  public insertMany(syncedActivities: SyncedActivityModel[]): Promise<void> {
    return this.activityDao.insertMany(syncedActivities);
  }

  public getById(id: number | string): Promise<SyncedActivityModel> {
    return this.activityDao.getById(id);
  }

  public removeById(id: number | string): Promise<void> {
    return this.activityDao.removeById(id);
  }

  public update(syncedActivityModel: SyncedActivityModel): Promise<SyncedActivityModel> {
    return this.activityDao.update(syncedActivityModel);
  }

  public put(syncedActivityModel: SyncedActivityModel): Promise<SyncedActivityModel> {
    return this.activityDao.put(syncedActivityModel);
  }

  public clear(): Promise<void> {
    return this.activityDao.clear();
  }

  public count(): Promise<number> {
    return this.activityDao.count();
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

  public findByDatedSession(startTime: string, activityDurationSeconds: number): Promise<SyncedActivityModel[]> {
    return this.activityDao.findByDatedSession(startTime, activityDurationSeconds);
  }

  public removeByManyIds(activitiesToDelete: (string | number)[]): Promise<void> {
    return this.activityDao.removeByManyIds(activitiesToDelete);
  }

  /**
   * Tells if local synced activities is compliant with current athlete settings
   */
  public isAthleteSettingsConsistent(): Promise<boolean> {
    return this.athleteSnapshotResolver
      .update()
      .then(() => {
        return this.activityDao.find();
      })
      .then((syncedActivityModels: SyncedActivityModel[]) => {
        let isCompliant = true;
        _.forEachRight(syncedActivityModels, (syncedActivityModel: SyncedActivityModel) => {
          const athleteModelFound = this.athleteSnapshotResolver.resolve(new Date(syncedActivityModel.start_time));
          if (!athleteModelFound.equals(syncedActivityModel.athleteSnapshot)) {
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
   * Provide local synced activity ids which are not compliant with current athlete settings
   */
  public nonConsistentActivitiesWithAthleteSettings(): Promise<number[]> {
    return this.athleteSnapshotResolver
      .update()
      .then(() => {
        return this.fetch();
      })
      .then((syncedActivityModels: SyncedActivityModel[]) => {
        const nonConsistentIds = [];
        _.forEachRight(syncedActivityModels, (syncedActivityModel: SyncedActivityModel) => {
          const athleteModelFound = this.athleteSnapshotResolver.resolve(new Date(syncedActivityModel.start_time));
          if (!athleteModelFound.equals(syncedActivityModel.athleteSnapshot)) {
            nonConsistentIds.push(syncedActivityModel.id);
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

  public findActivitiesWithSettingsLacks(): Promise<SyncedActivityModel[]> {
    return this.activityDao.findActivitiesWithSettingsLacks();
  }
}
