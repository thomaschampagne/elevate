import { Inject, Injectable } from "@angular/core";
import { ActivityService } from "../activity.service";
import { ActivityDao } from "../../../dao/activity/activity.dao";
import { AthleteSnapshotResolverService } from "../../athlete-snapshot-resolver/athlete-snapshot-resolver.service";
import { LoggerService } from "../../logging/logger.service";
import { Subject } from "rxjs";
import { StreamsService } from "../../streams/streams.service";
import { IPC_TUNNEL_SERVICE } from "../../../../desktop/ipc/ipc-tunnel-service.token";
import { DesktopInsightsService } from "../../../../desktop/insights/desktop-insights.service";
import { Activity } from "@elevate/shared/models/sync/activity.model";
import { IpcMessage } from "@elevate/shared/electron/ipc-message";
import { WarningException } from "@elevate/shared/exceptions/warning.exception";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { ElevateException } from "@elevate/shared/exceptions/elevate.exception";
import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { AthleteSnapshot } from "@elevate/shared/models/athlete/athlete-snapshot.model";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { Channel } from "@elevate/shared/electron/channels.enum";
import DesktopUserSettings = UserSettings.DesktopUserSettings;

export class ActivityRecalculateNotification {
  private constructor(
    public activity: Activity,
    public currentlyProcessed: number,
    public toProcessCount: number,
    public started: boolean,
    public ended: boolean
  ) {}

  public static create(
    activity: Activity,
    currentlyProcessed: number,
    toProcessCount: number,
    started: boolean,
    ended: boolean
  ): ActivityRecalculateNotification {
    return new ActivityRecalculateNotification(activity, currentlyProcessed, toProcessCount, started, ended);
  }
}

@Injectable()
export class DesktopActivityService extends ActivityService {
  constructor(
    @Inject(IPC_TUNNEL_SERVICE) public readonly ipcTunnelService: IpcTunnelService,
    @Inject(ActivityDao) public readonly activityDao: ActivityDao,
    @Inject(AthleteSnapshotResolverService) public readonly athleteSnapshotResolver: AthleteSnapshotResolverService,
    @Inject(StreamsService) public readonly streamsService: StreamsService,
    @Inject(DesktopInsightsService) private readonly insightsService: DesktopInsightsService,
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
    activity: Activity,
    athleteSnapshotModel: AthleteSnapshot,
    streams: Streams,
    userSettings: DesktopUserSettings
  ): Promise<Activity> {
    const computeActivityMessage = new IpcMessage(
      Channel.computeActivity,
      activity,
      athleteSnapshotModel,
      streams,
      userSettings
    );

    return this.ipcTunnelService.send<IpcMessage, Activity>(computeActivityMessage);
  }

  public recalculateSingle(activity: Activity, userSettings: UserSettings.DesktopUserSettings): Promise<Activity> {
    let athleteSnapshot: AthleteSnapshot = null;

    return this.athleteSnapshotResolver
      .update()
      .then(() => {
        return this.athleteSnapshotResolver.resolve(new Date(activity.startTime));
      })
      .then((athleteSnapshotModel: AthleteSnapshot) => {
        athleteSnapshot = athleteSnapshotModel;
        return this.streamsService.getInflatedById(activity.id);
      })
      .then(streams => {
        return this.compute(activity, athleteSnapshot, streams, userSettings).then(computedActivity => {
          computedActivity.lastEditTime = new Date().toISOString();
          return this.put(computedActivity);
        });
      });
  }

  public recalculate(activities: Activity[], userSettings: UserSettings.DesktopUserSettings): Promise<void> {
    if (this.isRecalculating) {
      return Promise.reject(new WarningException(DesktopActivityService.JOB_ALREADY_RUNNING_MESSAGE));
    }

    this.isRecalculating = true;

    return activities
      .reduce((previousRefreshDone: Promise<void>, activity: Activity, index: number) => {
        return previousRefreshDone.then(() => {
          return this.recalculateSingle(activity, userSettings).then(activityRefreshed => {
            const recalculateNotification = ActivityRecalculateNotification.create(
              activityRefreshed,
              index + 1,
              activities.length,
              index === 0,
              index === activities.length - 1
            );
            this.recalculate$.next(recalculateNotification);
            return Promise.resolve();
          });
        });
      }, Promise.resolve())
      .then(() => {
        this.isRecalculating = false;
        this.verifyActivitiesWithSettingsLacking();
        return this.activityDao.persist(true);
      })
      .then(() => {
        // Push insight activities and continue without wait for success or error
        this.find().then(activities => this.insightsService.registerActivities(activities, true));
        return Promise.resolve();
      })
      .catch(err => {
        return Promise.reject(new ElevateException(err));
      });
  }

  public recalculateFromIds(
    activityIds: (number | string)[],
    userSettings: UserSettings.DesktopUserSettings
  ): Promise<void> {
    if (this.isRecalculating) {
      return Promise.reject(new WarningException(DesktopActivityService.JOB_ALREADY_RUNNING_MESSAGE));
    }

    this.isRecalculating = true;

    return activityIds
      .reduce((previousRefreshDone: Promise<void>, activityId: number | string, index: number) => {
        return previousRefreshDone.then(() => {
          return this.getById(activityId)
            .then(activity => {
              return this.recalculateSingle(activity, userSettings);
            })
            .then(activityRefreshed => {
              const recalculateNotification = ActivityRecalculateNotification.create(
                activityRefreshed,
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
      .then(() => {
        // Push insight activities and continue without wait for success or error
        this.findByIds(activityIds).then(activities => this.insightsService.registerActivities(activities, false));
        return Promise.resolve();
      })
      .catch(err => {
        return Promise.reject(new ElevateException(err));
      });
  }

  public recalculateAll(userSettings: UserSettings.DesktopUserSettings): Promise<void> {
    if (this.isRecalculating) {
      return Promise.reject(new WarningException(DesktopActivityService.JOB_ALREADY_RUNNING_MESSAGE));
    }

    return this.fetch().then(activities => {
      return this.recalculate(activities, userSettings);
    });
  }

  public removeById(id: number | string): Promise<void> {
    return super.removeById(id).then(() => {
      return this.streamsService.removeById(id);
    });
  }
}
