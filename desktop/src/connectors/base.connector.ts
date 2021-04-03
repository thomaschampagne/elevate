import { of, ReplaySubject, Subject } from "rxjs";
import { ActivityComputer, ConnectorType, StoppedSyncEvent, SyncEvent, SyncEventType } from "@elevate/shared/sync";
import {
  AnalysisDataModel,
  AthleteSnapshotModel,
  BareActivityModel,
  Streams,
  SyncedActivityModel,
  UserSettings
} from "@elevate/shared/models";
import { AppService } from "../app-service";
import { catchError, filter, timeout } from "rxjs/operators";
import { AthleteSnapshotResolver } from "@elevate/shared/resolvers";
import _ from "lodash";
import { ConnectorConfig } from "./connector-config.model";
import { Hash } from "../tools/hash";
import { IpcSyncMessageSender } from "../senders/ipc-sync-message.sender";
import { Logger } from "../logger";
import UserSettingsModel = UserSettings.UserSettingsModel;

/**
 * Primitive data provided by the input source plugged on connector (e.g. Strava, activity files)
 */
export class PrimitiveSourceData {
  public elapsedTimeRaw: number;
  public movingTimeRaw: number;
  public distanceRaw: number;
  public elevationGainRaw: number;

  constructor(elapsedTimeRaw: number, movingTimeRaw: number, distanceRaw: number, elevationGainRaw: number) {
    this.elapsedTimeRaw = elapsedTimeRaw;
    this.movingTimeRaw = movingTimeRaw;
    this.distanceRaw = distanceRaw;
    this.elevationGainRaw = elevationGainRaw;
  }
}

export abstract class BaseConnector {
  protected constructor(
    protected readonly appService: AppService,
    protected readonly ipcSyncMessageSender: IpcSyncMessageSender,
    protected readonly logger: Logger
  ) {}

  private static readonly WAIT_FOR_SYNC_STOP_EVENT_TIMEOUT: number = 3000;

  public type: ConnectorType;
  public enabled: boolean;
  public connectorConfig: ConnectorConfig;
  public athleteSnapshotResolver: AthleteSnapshotResolver;
  public isSyncing: boolean;
  public stopRequested: boolean;
  public syncFromDateTime: number;
  public syncEvents$: ReplaySubject<SyncEvent>;

  public static updatePrimitiveStatsFromComputation(
    syncedActivityModel: SyncedActivityModel,
    streams: Streams,
    primitiveSourceData: PrimitiveSourceData = null
  ): SyncedActivityModel {
    if (syncedActivityModel.extendedStats) {
      // Time
      syncedActivityModel.elapsed_time_raw = _.isNumber(syncedActivityModel.extendedStats.elapsedTime)
        ? syncedActivityModel.extendedStats.elapsedTime
        : null;
      syncedActivityModel.moving_time_raw = _.isNumber(syncedActivityModel.extendedStats.movingTime)
        ? syncedActivityModel.extendedStats.movingTime
        : null;

      // Distance
      if (streams && streams.distance && streams.distance.length > 0) {
        syncedActivityModel.distance_raw = _.last(streams.distance);
      } else {
        syncedActivityModel.distance_raw = null;
      }

      // Elevation
      if (
        syncedActivityModel.extendedStats.elevationData &&
        _.isNumber(syncedActivityModel.extendedStats.elevationData.accumulatedElevationAscent)
      ) {
        syncedActivityModel.elevation_gain_raw = Math.round(
          syncedActivityModel.extendedStats.elevationData.accumulatedElevationAscent
        );
      } else {
        syncedActivityModel.elevation_gain_raw = null;
      }
    } else {
      syncedActivityModel.elapsed_time_raw = null;
      syncedActivityModel.moving_time_raw = null;
      syncedActivityModel.distance_raw = null;
      syncedActivityModel.elevation_gain_raw = null;

      if (syncedActivityModel.start_time && syncedActivityModel.end_time) {
        const startTime = new Date(syncedActivityModel.start_time).getTime();
        const endTime = new Date(syncedActivityModel.end_time).getTime();

        const deltaTime = (endTime - startTime) / 1000;

        if (Number.isFinite(deltaTime) && deltaTime > 0) {
          syncedActivityModel.elapsed_time_raw = deltaTime;
          syncedActivityModel.moving_time_raw = deltaTime;
        }
      }
    }

    if (primitiveSourceData) {
      if (_.isNull(syncedActivityModel.elapsed_time_raw) && _.isNumber(primitiveSourceData.elapsedTimeRaw)) {
        syncedActivityModel.elapsed_time_raw = primitiveSourceData.elapsedTimeRaw;
      }

      if (_.isNull(syncedActivityModel.moving_time_raw) && _.isNumber(primitiveSourceData.movingTimeRaw)) {
        syncedActivityModel.moving_time_raw = primitiveSourceData.movingTimeRaw;
      }

      if (_.isNull(syncedActivityModel.distance_raw) && _.isNumber(primitiveSourceData.distanceRaw)) {
        syncedActivityModel.distance_raw = primitiveSourceData.distanceRaw;
      }

      if (_.isNull(syncedActivityModel.elevation_gain_raw) && _.isNumber(primitiveSourceData.elevationGainRaw)) {
        syncedActivityModel.elevation_gain_raw = primitiveSourceData.elevationGainRaw;
      }
    }

    return syncedActivityModel;
  }

  public static geoBaryCenter(streams: Partial<Streams>): number[] {
    if (!streams) {
      return null;
    }

    const latLngStream: number[][] = streams.latlng;
    if (!latLngStream || !Array.isArray(latLngStream) || latLngStream.length === 0) {
      return null;
    }

    const lat = latLngStream.map(latLng => latLng[0]);
    const lng = latLngStream.map(latLng => latLng[1]);
    const cLat = (Math.min(...lat) + Math.max(...lat)) / 2;
    const cLng = (Math.min(...lng) + Math.max(...lng)) / 2;
    return [cLat, cLng];
  }

  public static activityHash(activity: Partial<SyncedActivityModel>): string {
    const activityUniqueRepresentation = _.pick(activity, [
      "id",
      "type",
      "start_time",
      "end_time",
      "distance_raw",
      "hasPowerMeter",
      "trainer",
      "elevation_gain_raw",
      "latLngCenter"
    ]) as any;

    if (activity.extendedStats?.speedData?.maxSpeed) {
      activityUniqueRepresentation.maxSpeed = activity.extendedStats.speedData.maxSpeed;
    }

    if (activity.extendedStats?.heartRateData?.maxHeartRate) {
      activityUniqueRepresentation.maxHr = activity.extendedStats.heartRateData.maxHeartRate;
    }

    if (activity.extendedStats?.cadenceData?.maxCadence) {
      activityUniqueRepresentation.maxCadence = activity.extendedStats.cadenceData.maxCadence;
    }

    return Hash.asObjectId(JSON.stringify(activityUniqueRepresentation));
  }

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

  public stop(): Promise<void> {
    this.stopRequested = true;

    return new Promise((resolve, reject) => {
      if (this.isSyncing) {
        const stopSubscription = this.syncEvents$
          .pipe(filter(syncEvent => syncEvent.type === SyncEventType.STOPPED))
          .pipe(
            timeout(BaseConnector.WAIT_FOR_SYNC_STOP_EVENT_TIMEOUT),
            catchError(() => {
              // Timeout for waiting a stop event reached, we have to emulated it...
              this.logger.warn("Request timed out after waiting for stop event from connector. Emulating one");
              this.isSyncing = false;
              this.syncEvents$.next(new StoppedSyncEvent(ConnectorType.STRAVA));
              resolve();
              return of();
            })
          )
          .subscribe(() => {
            stopSubscription.unsubscribe();
            this.stopRequested = false;
            resolve();
          });
      } else {
        setTimeout(() => {
          this.stopRequested = false;
          reject(this.type + " connector is not syncing currently.");
        });
      }
    });
  }

  public findSyncedActivityModels(
    activityStartDate: string,
    activityDurationSeconds: number
  ): Promise<SyncedActivityModel[]> {
    return this.ipcSyncMessageSender.findSyncedActivityModels(activityStartDate, activityDurationSeconds);
  }

  public findStreams(activityId: number | string): Promise<Streams> {
    return this.ipcSyncMessageSender.findStreams(activityId);
  }

  public computeExtendedStats(
    syncedActivityModel: Partial<SyncedActivityModel>,
    athleteSnapshotModel: AthleteSnapshotModel,
    userSettingsModel: UserSettingsModel,
    streams: Streams
  ): AnalysisDataModel {
    return ActivityComputer.calculate(
      syncedActivityModel as BareActivityModel,
      athleteSnapshotModel,
      userSettingsModel,
      streams,
      false,
      null,
      true,
      null
    );
  }
}
