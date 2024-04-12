import { AppService } from "../app-service";
import { filter } from "rxjs/operators";
import { ConnectorConfig } from "./connector-config.model";
import { IpcSyncMessageSender } from "../senders/ipc-sync-message.sender";
import { Logger } from "../logger";
import { WorkerService } from "../worker-service";
import { ActivityComputeWorkerParams } from "../workers/activity-compute.worker";
import { WorkerType } from "../enum/worker-type.enum";
import { Hash } from "../tools/hash";
import FormData from "form-data";
import fs from "fs";
import normalizeUrl from "normalize-url";
import { Environment } from "../environments/environment.interface";
import { HttpClient } from "../clients/http.client";
import { ReplaySubject, Subject } from "rxjs";
import pDefer, { DeferredPromise } from "p-defer";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { SyncEvent } from "@elevate/shared/sync/events/sync.event";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { Activity, ActivityStats } from "@elevate/shared/models/sync/activity.model";
import { SyncEventType } from "@elevate/shared/sync/events/sync-event-type";
import { AthleteSnapshotResolver } from "@elevate/shared/resolvers/athlete-snapshot.resolver";
import { AthleteSnapshot } from "@elevate/shared/models/athlete/athlete-snapshot.model";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { BareActivity } from "@elevate/shared/models/sync/bare-activity.model";
import { GenericSyncEvent } from "@elevate/shared/sync/events/generic-sync.event";
import BaseUserSettings = UserSettings.BaseUserSettings;

export abstract class BaseConnector {
  protected constructor(
    protected readonly appService: AppService,
    protected readonly environment: Environment,
    protected readonly ipcSyncMessageSender: IpcSyncMessageSender,
    protected readonly workerService: WorkerService,
    protected readonly httpClient: HttpClient,
    protected readonly logger: Logger
  ) {
    this.connectorErrorsReasonsIds = [];
  }

  public type: ConnectorType;
  public enabled: boolean;
  public connectorConfig: ConnectorConfig;
  public athleteSnapshotResolver: AthleteSnapshotResolver;
  public isSyncing: boolean;
  public stopRequested: boolean;
  public syncFromDateTime: number;
  public syncEvents$: ReplaySubject<SyncEvent>;

  private readonly connectorErrorsReasonsIds: string[];

  public configure(connectorConfig: ConnectorConfig): this {
    this.connectorConfig = connectorConfig;
    this.athleteSnapshotResolver = new AthleteSnapshotResolver(this.connectorConfig.athleteModel);
    this.syncFromDateTime = Number.isFinite(this.connectorConfig.syncFromDateTime)
      ? this.connectorConfig.syncFromDateTime
      : null;
    this.isSyncing = false;
    this.stopRequested = false;
    return this;
  }

  public abstract sync(): Subject<SyncEvent>;

  public abstract getSourceStats<T>(sport: ElevateSport, source: Partial<T>, streams: Streams): Partial<ActivityStats>;

  public stop(): Promise<void> {
    this.stopRequested = true;
    const stopPromise: DeferredPromise<void> = pDefer();

    this.syncEvents$.next(new GenericSyncEvent(this.type, `Stop requested. Finishing current activity computation...`));

    if (this.isSyncing) {
      const stopSubscription = this.syncEvents$
        .pipe(filter(syncEvent => syncEvent.type === SyncEventType.STOPPED))
        .subscribe(() => {
          stopSubscription.unsubscribe();
          this.stopRequested = false;
          stopPromise.resolve();
        });
    } else {
      this.stopRequested = false;
      stopPromise.reject(`Unable to stop connector ${this.type} because not syncing currently.`);
    }

    return stopPromise.promise;
  }

  public findLocalActivities(activityStartDate: string, activityEndDate: string): Promise<Activity[]> {
    return this.ipcSyncMessageSender.findLocalActivities(activityStartDate, activityEndDate);
  }

  public findStreams(activityId: number | string): Promise<Streams> {
    return this.ipcSyncMessageSender.findDeflatedActivityStreams(activityId).then(deflated => {
      if (deflated) {
        return Promise.resolve(Streams.inflate(deflated.deflatedStreams));
      } else {
        return Promise.resolve(null);
      }
    });
  }

  private generateActivityId(bareActivity: BareActivity): string {
    return Hash.asObjectId(
      `${new Date().toISOString()}:${bareActivity.startTime}:${bareActivity.endTime}:${Math.random()}`
    );
  }

  protected assignBaseProperties(activity: Partial<Activity>, streams: Streams): Partial<Activity> {
    // Generate activity id
    activity.id = this.generateActivityId(activity as BareActivity);

    // Track connector type
    activity.connector = this.type;

    // Set created activity dates
    const now = new Date().toISOString();
    activity.creationTime = now;
    activity.lastEditTime = now;

    // Sport type not detected (not supported yet)
    activity.autoDetectedType = false;

    // If swim activity and no position data, it's considered as a pool swim activity
    if (Activity.isSwim(activity.type)) {
      activity.isSwimPool = Activity.isSwimPool(activity.type, streams);
    }

    return activity;
  }

  public computeActivity(
    activity: Partial<Activity>,
    athleteSnapshot: AthleteSnapshot,
    userSettings: BaseUserSettings,
    streams: Streams,
    deflateStreams: boolean
  ): Promise<{ computedActivity: Activity; deflatedStreams: string | null }> {
    const workerParams: ActivityComputeWorkerParams = {
      activity: activity,
      athleteSnapshot: athleteSnapshot,
      userSettings: userSettings,
      streams: streams,
      deflateStreams: deflateStreams,
      returnPeaks: true,
      returnZones: false,
      bounds: null,
      isOwner: true,
      activityEssentials: null
    };

    return this.workerService.exec<
      ActivityComputeWorkerParams,
      { computedActivity: Activity; deflatedStreams: string | null }
    >(WorkerType.ACTIVITY_COMPUTE, workerParams);
  }
}
