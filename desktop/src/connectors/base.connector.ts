import { of, ReplaySubject, Subject } from "rxjs";
import { ActivityComputer, ConnectorType, StoppedSyncEvent, SyncEvent, SyncEventType } from "@elevate/shared/sync";
import {
  ActivityStreamsModel,
  AnalysisDataModel,
  AthleteSnapshotModel,
  BareActivityModel,
  SyncedActivityModel,
  UserSettings
} from "@elevate/shared/models";
import { AppService } from "../app-service";
import { catchError, filter, timeout } from "rxjs/operators";
import crypto, { BinaryLike } from "crypto";
import { AthleteSnapshotResolver } from "@elevate/shared/resolvers";
import { ElevateSport } from "@elevate/shared/enums";
import _ from "lodash";
import { ElevateException } from "@elevate/shared/exceptions";
import { CyclingPower } from "../estimators/cycling-power-estimator/cycling-power-estimator";
import { CaloriesEstimator } from "../estimators/calories-estimator/calories-estimator";
import { ConnectorConfig } from "./connector-config.model";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
import { IpcMessagesSender } from "../messages/ipc-messages.sender";
import logger from "electron-log";
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
    protected readonly ipcMessagesSender: IpcMessagesSender
  ) {}

  private static readonly WAIT_FOR_SYNC_STOP_EVENT_TIMEOUT: number = 3000;

  public type: ConnectorType;
  public enabled: boolean;
  public connectorConfig: ConnectorConfig;
  public athleteSnapshotResolver: AthleteSnapshotResolver;
  public isSyncing: boolean;
  public stopRequested: boolean;
  public syncDateTime: number;
  public syncEvents$: ReplaySubject<SyncEvent>;

  /**
   * Hash data
   */
  public static hashData(data: BinaryLike, divide: number = null): string {
    const sha1 = crypto.createHash("sha1").update(data).digest("hex");
    return sha1.slice(0, divide ? sha1.length / divide : sha1.length);
  }

  public static updatePrimitiveStatsFromComputation(
    syncedActivityModel: SyncedActivityModel,
    activityStreamsModel: ActivityStreamsModel,
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
      if (activityStreamsModel && activityStreamsModel.distance && activityStreamsModel.distance.length > 0) {
        syncedActivityModel.distance_raw =
          _.last(activityStreamsModel.distance) - _.first(activityStreamsModel.distance);
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

    syncedActivityModel.calories = CaloriesEstimator.calc(
      syncedActivityModel.type,
      syncedActivityModel.moving_time_raw,
      syncedActivityModel.athleteSnapshot.athleteSettings.weight
    );

    return syncedActivityModel;
  }

  public configure(connectorConfig: ConnectorConfig): this {
    this.connectorConfig = connectorConfig;
    this.athleteSnapshotResolver = new AthleteSnapshotResolver(this.connectorConfig.athleteModel);
    this.syncDateTime =
      this.connectorConfig.connectorSyncDateTime && this.connectorConfig.connectorSyncDateTime.syncDateTime >= 0
        ? Math.floor(this.connectorConfig.connectorSyncDateTime.syncDateTime / 1000)
        : null; // Convert timestamp to seconds instead of millis
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
              logger.warn("Request timed out after waiting for stop event from connector. Emulating one");
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
    const flaggedIpcMessage = new FlaggedIpcMessage(
      MessageFlag.FIND_ACTIVITY,
      activityStartDate,
      activityDurationSeconds
    );
    return this.ipcMessagesSender.send<SyncedActivityModel[]>(flaggedIpcMessage);
  }

  public computeExtendedStats(
    syncedActivityModel: Partial<SyncedActivityModel>,
    athleteSnapshotModel: AthleteSnapshotModel,
    userSettingsModel: UserSettingsModel,
    streams: ActivityStreamsModel
  ): AnalysisDataModel {
    return ActivityComputer.calculate(
      syncedActivityModel as BareActivityModel,
      athleteSnapshotModel,
      userSettingsModel,
      streams
    );
  }

  public estimateCyclingPowerStream(
    type: ElevateSport,
    velocityStream: number[],
    gradeStream: number[],
    riderWeight: number
  ): number[] {
    if (_.isEmpty(velocityStream)) {
      throw new ElevateException("Velocity stream cannot be empty to calculate grade stream");
    }

    if (_.isEmpty(gradeStream)) {
      throw new ElevateException("Grade stream cannot be empty to calculate grade stream");
    }

    if (type !== ElevateSport.Ride && type !== ElevateSport.VirtualRide) {
      throw new ElevateException(
        `Cannot compute estimated cycling power data on activity type: ${type}. Must be done with a bike.`
      );
    }

    if (!riderWeight || riderWeight < 0) {
      throw new ElevateException(`Cannot compute estimated cycling power with a rider weight of ${riderWeight}`);
    }

    const powerEstimatorParams: Partial<CyclingPower.Params> = {
      riderWeightKg: riderWeight
    };

    const estimatedPowerStream = [];

    for (let i = 0; i < velocityStream.length; i++) {
      const kph = velocityStream[i] * 3.6;
      powerEstimatorParams.gradePercentage = gradeStream[i];
      const power = CyclingPower.Estimator.calc(kph, powerEstimatorParams);
      estimatedPowerStream.push(power);
    }

    return estimatedPowerStream;
  }
}
