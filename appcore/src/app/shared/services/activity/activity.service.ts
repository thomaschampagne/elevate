import { ActivityDao } from "../../dao/activity/activity.dao";
import { SyncedActivityModel } from "@elevate/shared/models";
import _ from "lodash";
import { AthleteSnapshotResolverService } from "../athlete-snapshot-resolver/athlete-snapshot-resolver.service";
import { Subject } from "rxjs";
import { LoggerService } from "../logging/logger.service";
import { Inject } from "@angular/core";

export abstract class ActivityService {
  public athleteSettingsConsistency$: Subject<boolean>;
  public activitiesWithSettingsLacks$: Subject<boolean>;

  protected constructor(
    @Inject(ActivityDao) public readonly activityDao: ActivityDao,
    @Inject(AthleteSnapshotResolverService)
    public readonly athleteSnapshotResolverService: AthleteSnapshotResolverService,
    @Inject(LoggerService) protected readonly logger: LoggerService
  ) {
    this.athleteSettingsConsistency$ = new Subject<boolean>();
    this.activitiesWithSettingsLacks$ = new Subject<boolean>();
  }

  public fetch(): Promise<SyncedActivityModel[]> {
    return this.activityDao.findSortStartDate(false);
  }

  public findSortStartDate(descending: boolean): Promise<SyncedActivityModel[]> {
    return this.activityDao.findSortStartDate(descending);
  }

  public insertMany(syncedActivities: SyncedActivityModel[], persistImmediately: boolean = false): Promise<void> {
    return this.activityDao.insertMany(syncedActivities, persistImmediately);
  }

  public getById(id: number | string): Promise<SyncedActivityModel> {
    return this.activityDao.getById(id);
  }

  public removeById(id: number | string): Promise<void> {
    return this.activityDao.removeById(id, true);
  }

  public update(
    syncedActivityModel: SyncedActivityModel,
    persistImmediately: boolean = false
  ): Promise<SyncedActivityModel> {
    return this.activityDao.update(syncedActivityModel, persistImmediately);
  }

  public put(
    syncedActivityModel: SyncedActivityModel,
    persistImmediately: boolean = false
  ): Promise<SyncedActivityModel> {
    return this.activityDao.put(syncedActivityModel, persistImmediately);
  }

  public clear(persistImmediately: boolean = false): Promise<void> {
    return this.activityDao.clear(persistImmediately);
  }

  public count(): Promise<number> {
    return this.activityDao.count();
  }

  public findByDatedSession(startTime: string, activityDurationSeconds: number): Promise<SyncedActivityModel[]> {
    return this.activityDao.findByDatedSession(startTime, activityDurationSeconds);
  }

  public removeByManyIds(activitiesToDelete: (string | number)[]): Promise<void> {
    return this.activityDao.removeByManyIds(activitiesToDelete, true);
  }

  /**
   * Tells if local synced activities is compliant with current athlete settings
   */
  public isAthleteSettingsConsistent(): Promise<boolean> {
    return this.athleteSnapshotResolverService
      .update()
      .then(() => {
        return this.activityDao.find();
      })
      .then((syncedActivityModels: SyncedActivityModel[]) => {
        let isCompliant = true;
        _.forEachRight(syncedActivityModels, (syncedActivityModel: SyncedActivityModel) => {
          const athleteModelFound = this.athleteSnapshotResolverService.resolve(
            new Date(syncedActivityModel.start_time)
          );
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
    return this.athleteSnapshotResolverService
      .update()
      .then(() => {
        return this.fetch();
      })
      .then((syncedActivityModels: SyncedActivityModel[]) => {
        const nonConsistentIds = [];
        _.forEachRight(syncedActivityModels, (syncedActivityModel: SyncedActivityModel) => {
          const athleteModelFound = this.athleteSnapshotResolverService.resolve(
            new Date(syncedActivityModel.start_time)
          );
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
