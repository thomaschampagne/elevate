import { Inject, Injectable } from "@angular/core";
import { ActivityService } from "../activity.service";
import { ActivityDao } from "../../../dao/activity/activity.dao";
import { AthleteSnapshotResolverService } from "../../athlete-snapshot-resolver/athlete-snapshot-resolver.service";
import { LoggerService } from "../../logging/logger.service";
import { AthleteSnapshotModel, Streams, SyncedActivityModel, UserSettings } from "@elevate/shared/models";
import { Subject } from "rxjs";
import { ElevateException, WarningException } from "@elevate/shared/exceptions";
import { StreamsService } from "../../streams/streams.service";
import { Channel, IpcMessage, IpcTunnelService } from "@elevate/shared/electron";
import { IPC_TUNNEL_SERVICE } from "../../../../desktop/ipc/ipc-tunnel-service.token";
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

export class ActivityRecalculateNotification {
  private constructor(
    public syncedActivityModel: SyncedActivityModel,
    public currentlyProcessed: number,
    public toProcessCount: number,
    public started: boolean,
    public ended: boolean
  ) {}

  public static create(
    syncedActivityModel: SyncedActivityModel,
    currentlyProcessed: number,
    toProcessCount: number,
    started: boolean,
    ended: boolean
  ): ActivityRecalculateNotification {
    return new ActivityRecalculateNotification(syncedActivityModel, currentlyProcessed, toProcessCount, started, ended);
  }
}

@Injectable()
export class DesktopActivityService extends ActivityService {
  constructor(
    @Inject(IPC_TUNNEL_SERVICE) public readonly ipcTunnelService: IpcTunnelService,
    @Inject(ActivityDao) public readonly activityDao: ActivityDao,
    @Inject(AthleteSnapshotResolverService) public readonly athleteSnapshotResolver: AthleteSnapshotResolverService,
    @Inject(StreamsService) public readonly streamsService: StreamsService,
    @Inject(LoggerService) protected readonly logger: LoggerService
  ) {
    super(activityDao, athleteSnapshotResolver, logger);
    this.recalculate$ = new Subject<ActivityRecalculateNotification>();
    this.isRecalculating = false;
  }
  public static readonly JOB_ALREADY_RUNNING_MESSAGE: string =
    "A recalculation job is already running. Please wait for the end of the previous one to start a new one.";

  public recalculate$: Subject<ActivityRecalculateNotification>;

  public isRecalculating: boolean;
  /**
   * Single compute of an activity
   */
  public compute(
    syncedActivityModel: SyncedActivityModel,
    athleteSnapshotModel: AthleteSnapshotModel,
    streams: Streams,
    userSettingsModel: DesktopUserSettingsModel
  ): Promise<SyncedActivityModel> {
    const computeActivityMessage = new IpcMessage(
      Channel.computeActivity,
      syncedActivityModel,
      athleteSnapshotModel,
      streams,
      userSettingsModel
    );

    return this.ipcTunnelService.send<IpcMessage, SyncedActivityModel>(computeActivityMessage);
  }

  public recalculateSingle(
    syncedActivityModel: SyncedActivityModel,
    userSettingsModel: UserSettings.DesktopUserSettingsModel,
    persistImmediately: boolean = false
  ): Promise<SyncedActivityModel> {
    let athleteSnapshot: AthleteSnapshotModel = null;

    return this.athleteSnapshotResolver
      .update()
      .then(() => {
        return this.athleteSnapshotResolver.resolve(new Date(syncedActivityModel.start_time));
      })
      .then((athleteSnapshotModel: AthleteSnapshotModel) => {
        athleteSnapshot = athleteSnapshotModel;
        return this.streamsService.getInflatedById(syncedActivityModel.id);
      })
      .then(streams => {
        return this.compute(syncedActivityModel, athleteSnapshot, streams, userSettingsModel).then(
          newSyncedActivityModel => {
            return this.put(newSyncedActivityModel, persistImmediately);
          }
        );
      });
  }

  public recalculate(
    syncedActivityModels: SyncedActivityModel[],
    userSettingsModel: UserSettings.DesktopUserSettingsModel
  ): Promise<void> {
    if (this.isRecalculating) {
      return Promise.reject(new WarningException(DesktopActivityService.JOB_ALREADY_RUNNING_MESSAGE));
    }

    this.isRecalculating = true;

    return syncedActivityModels
      .reduce((previousRefreshDone: Promise<void>, syncedActivityModel: SyncedActivityModel, index: number) => {
        return previousRefreshDone.then(() => {
          return this.recalculateSingle(syncedActivityModel, userSettingsModel).then(syncedActivityRefreshed => {
            const recalculateNotification = ActivityRecalculateNotification.create(
              syncedActivityRefreshed,
              index + 1,
              syncedActivityModels.length,
              index === 0,
              index === syncedActivityModels.length - 1
            );
            this.recalculate$.next(recalculateNotification);
            return Promise.resolve();
          });
        });
      }, Promise.resolve())
      .then(() => {
        this.isRecalculating = false;
        this.activityDao.saveDataStore();
        this.verifyActivitiesWithSettingsLacking();
      })
      .catch(err => {
        return Promise.reject(new ElevateException(err));
      });
  }

  public recalculateFromIds(
    activityIds: (number | string)[],
    userSettingsModel: UserSettings.DesktopUserSettingsModel
  ): Promise<void> {
    if (this.isRecalculating) {
      return Promise.reject(new WarningException(DesktopActivityService.JOB_ALREADY_RUNNING_MESSAGE));
    }

    this.isRecalculating = true;

    return activityIds
      .reduce((previousRefreshDone: Promise<void>, activityId: number | string, index: number) => {
        return previousRefreshDone.then(() => {
          return this.getById(activityId)
            .then(syncedActivityModel => {
              return this.recalculateSingle(syncedActivityModel, userSettingsModel);
            })
            .then(syncedActivityRefreshed => {
              const recalculateNotification = ActivityRecalculateNotification.create(
                syncedActivityRefreshed,
                index + 1,
                activityIds.length,
                index === 0,
                index === activityIds.length - 1
              );
              this.recalculate$.next(recalculateNotification);
              return Promise.resolve();
            });
        });
      }, Promise.resolve())
      .then(() => {
        this.isRecalculating = false;
        this.verifyActivitiesWithSettingsLacking();
      })
      .catch(err => {
        return Promise.reject(new ElevateException(err));
      });
  }

  public recalculateAll(userSettingsModel: UserSettings.DesktopUserSettingsModel): Promise<void> {
    if (this.isRecalculating) {
      return Promise.reject(new WarningException(DesktopActivityService.JOB_ALREADY_RUNNING_MESSAGE));
    }

    return this.fetch().then(syncedActivityModels => {
      return this.recalculate(syncedActivityModels, userSettingsModel);
    });
  }

  public removeById(id: number | string): Promise<void> {
    return super.removeById(id).then(() => {
      return this.streamsService.removeById(id);
    });
  }
}
