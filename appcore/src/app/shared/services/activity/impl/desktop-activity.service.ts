import { Inject, Injectable } from "@angular/core";
import { ActivityService } from "../activity.service";
import { ActivityDao } from "../../../dao/activity/activity.dao";
import { AthleteSnapshotResolverService } from "../../athlete-snapshot-resolver/athlete-snapshot-resolver.service";
import { LoggerService } from "../../logging/logger.service";
import { ActivityStreamsModel, AthleteSnapshotModel, SyncedActivityModel, UserSettings } from "@elevate/shared/models";
import { IpcMessagesSender } from "../../../../desktop/ipc-messages/ipc-messages-sender.service";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
import { Subject } from "rxjs";
import { ElevateException } from "@elevate/shared/exceptions";
import { StreamsDao } from "../../../dao/streams/streams.dao";
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

export class BulkRefreshStatsNotification {
  public syncedActivityModel: SyncedActivityModel;
  public currentlyProcessed: number;
  public toProcessCount: number;
  public isFirst: boolean;
  public isLast: boolean;
  public error: any;

  private constructor(
    syncedActivityModel: SyncedActivityModel,
    currentlyProcessed: number,
    toProcessCount: number,
    isFirst: boolean,
    isLast: boolean,
    error: any = null
  ) {
    this.syncedActivityModel = syncedActivityModel;
    this.currentlyProcessed = currentlyProcessed;
    this.toProcessCount = toProcessCount;
    this.isFirst = isFirst;
    this.isLast = isLast;
    this.error = error;
  }

  public static create(
    syncedActivityModel: SyncedActivityModel,
    currentlyProcessed: number,
    toProcessCount: number,
    isFirst: boolean,
    isLast: boolean
  ): BulkRefreshStatsNotification {
    const bulkRefreshStatsNotification = new BulkRefreshStatsNotification(
      syncedActivityModel,
      currentlyProcessed,
      toProcessCount,
      isFirst,
      isLast
    );
    delete bulkRefreshStatsNotification.error;
    return bulkRefreshStatsNotification;
  }

  public static error(error: any): BulkRefreshStatsNotification {
    return {
      error: error
    } as BulkRefreshStatsNotification;
  }
}

@Injectable()
export class DesktopActivityService extends ActivityService {
  public static readonly JOB_ALREADY_RUNNING_MESSAGE: string =
    "A recalculation job is already running. Please wait for the end of the previous one to start a new one.";

  public refreshStats$: Subject<BulkRefreshStatsNotification>;
  public isProcessing: boolean;

  constructor(
    @Inject(IpcMessagesSender) public readonly ipcMessagesSender: IpcMessagesSender,
    @Inject(ActivityDao) public readonly activityDao: ActivityDao,
    @Inject(StreamsDao) public readonly streamsDao: StreamsDao,
    @Inject(AthleteSnapshotResolverService)
    public readonly athleteSnapshotResolverService: AthleteSnapshotResolverService,
    @Inject(LoggerService) protected readonly logger: LoggerService
  ) {
    super(activityDao, athleteSnapshotResolverService, logger);

    this.refreshStats$ = new Subject<BulkRefreshStatsNotification>();
    this.isProcessing = false;
  }

  public compute(
    syncedActivityModel: SyncedActivityModel,
    userSettingsModel: DesktopUserSettingsModel,
    athleteSnapshotModel: AthleteSnapshotModel,
    streams: ActivityStreamsModel
  ): Promise<SyncedActivityModel> {
    const computeActivityMessage = new FlaggedIpcMessage(
      MessageFlag.COMPUTE_ACTIVITY,
      syncedActivityModel,
      athleteSnapshotModel,
      userSettingsModel,
      streams
    );
    return this.ipcMessagesSender.send<SyncedActivityModel>(computeActivityMessage);
  }

  public refreshStats(
    syncedActivityModel: SyncedActivityModel,
    userSettingsModel: UserSettings.DesktopUserSettingsModel
  ): Promise<SyncedActivityModel> {
    let athleteSnapshot: AthleteSnapshotModel = null;
    let streams: ActivityStreamsModel = null;

    return this.athleteSnapshotResolverService
      .update()
      .then(() => {
        return this.athleteSnapshotResolverService.resolve(new Date(syncedActivityModel.start_time));
      })
      .then((athleteSnapshotModel: AthleteSnapshotModel) => {
        athleteSnapshot = athleteSnapshotModel;
        return this.streamsDao.getById(syncedActivityModel.id);
      })
      .then(compressedStreamModel => {
        if (compressedStreamModel) {
          streams = ActivityStreamsModel.deflate(compressedStreamModel.data);
        }
        return this.compute(syncedActivityModel, userSettingsModel, athleteSnapshot, streams).then(
          newSyncedActivityModel => {
            return this.put(newSyncedActivityModel);
          }
        );
      });
  }

  public bulkRefreshStats(
    syncedActivityModels: SyncedActivityModel[],
    userSettingsModel: UserSettings.DesktopUserSettingsModel
  ): void {
    if (this.isProcessing) {
      this.refreshStats$.next(
        BulkRefreshStatsNotification.error(new ElevateException(DesktopActivityService.JOB_ALREADY_RUNNING_MESSAGE))
      );
      return;
    }

    this.isProcessing = true;

    syncedActivityModels
      .reduce((previousRefreshDone: Promise<void>, syncedActivityModel: SyncedActivityModel, index: number) => {
        return previousRefreshDone.then(() => {
          return this.refreshStats(syncedActivityModel, userSettingsModel).then(syncedActivityRefreshed => {
            const bulkRefreshStatsNotification = BulkRefreshStatsNotification.create(
              syncedActivityRefreshed,
              index + 1,
              syncedActivityModels.length,
              index === 0,
              index === syncedActivityModels.length - 1
            );
            this.refreshStats$.next(bulkRefreshStatsNotification);
            return Promise.resolve();
          });
        });
      }, Promise.resolve())
      .then(() => {
        this.isProcessing = false;
        this.activityDao.saveDataStore();
      })
      .catch(err => {
        this.refreshStats$.next(BulkRefreshStatsNotification.error(err));
      });
  }

  public bulkRefreshStatsFromIds(
    activityIds: (number | string)[],
    userSettingsModel: UserSettings.DesktopUserSettingsModel
  ): void {
    if (this.isProcessing) {
      this.refreshStats$.next(
        BulkRefreshStatsNotification.error(new ElevateException(DesktopActivityService.JOB_ALREADY_RUNNING_MESSAGE))
      );
      return;
    }

    this.isProcessing = true;

    activityIds
      .reduce((previousRefreshDone: Promise<void>, activityId: number | string, index: number) => {
        return previousRefreshDone.then(() => {
          return this.getById(activityId)
            .then(syncedActivityModel => {
              return this.refreshStats(syncedActivityModel, userSettingsModel);
            })
            .then(syncedActivityRefreshed => {
              const bulkRefreshStatsNotification = BulkRefreshStatsNotification.create(
                syncedActivityRefreshed,
                index + 1,
                activityIds.length,
                index === 0,
                index === activityIds.length - 1
              );
              this.refreshStats$.next(bulkRefreshStatsNotification);
              return Promise.resolve();
            });
        });
      }, Promise.resolve())
      .then(() => {
        this.isProcessing = false;
      })
      .catch(err => {
        this.refreshStats$.next(BulkRefreshStatsNotification.error(err));
      });
  }

  public bulkRefreshStatsAll(userSettingsModel: UserSettings.DesktopUserSettingsModel): void {
    if (this.isProcessing) {
      this.refreshStats$.next(
        BulkRefreshStatsNotification.error(new ElevateException(DesktopActivityService.JOB_ALREADY_RUNNING_MESSAGE))
      );
      return;
    }

    this.fetch().then(syncedActivityModels => {
      this.bulkRefreshStats(syncedActivityModels, userSettingsModel);
    });
  }

  public removeById(id: number | string): Promise<void> {
    return super.removeById(id).then(() => {
      return this.streamsDao.removeById(id, true);
    });
  }
}
