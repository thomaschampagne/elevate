import { BaseConnector, PrimitiveSourceData } from "../base.connector";
import { ReplaySubject, Subject, timer } from "rxjs";
import {
  ActivityComputer,
  ActivitySyncEvent,
  ConnectorType,
  ErrorSyncEvent,
  GenericSyncEvent,
  StartedSyncEvent,
  StoppedSyncEvent,
  StravaConnectorInfo,
  StravaCredentialsUpdateSyncEvent,
  SyncEvent,
  SyncEventType
} from "@elevate/shared/sync";
import { ActivityStreamsModel, BareActivityModel, SyncedActivityModel } from "@elevate/shared/models";
import logger from "electron-log";
import { AppService } from "../../app-service";
import _ from "lodash";
import { ElevateSport } from "@elevate/shared/enums";
import { inject, singleton } from "tsyringe";
import { ConnectorConfig, StravaConnectorConfig } from "../connector-config.model";
import { IpcMessagesSender } from "../../messages/ipc-messages.sender";
import { StravaApiClient } from "../../clients/strava-api.client";
import { scan, takeWhile } from "rxjs/operators";

export interface StravaApiStreamType {
  type:
    | "time"
    | "distance"
    | "latlng"
    | "altitude"
    | "velocity_smooth"
    | "heartrate"
    | "cadence"
    | "watts"
    | "watts_calc"
    | "grade_smooth"
    | "grade_adjusted_speed";
  data: number[];
  series_type: string;
  original_size: number;
  resolution: string;
}

@singleton()
export class StravaConnector extends BaseConnector {
  public static readonly ENABLED: boolean = true;
  public static readonly ACTIVITIES_PER_PAGES: number = 20;
  public static readonly STRAVA_OMIT_FIELDS: string[] = [
    "resource_state",
    "athlete",
    "external_id",
    "upload_id",
    "distance",
    "timezone",
    "utc_offset",
    "location_city",
    "location_state",
    "location_country",
    "start_latitude",
    "start_longitude",
    "achievement_count",
    "kudos_count",
    "comment_count",
    "athlete_count",
    "photo_count",
    "private",
    "visibility",
    "flagged",
    "gear_id",
    "from_accepted_tag",
    "elapsed_time",
    "moving_time",
    "start_date",
    "average_heartrate",
    "max_heartrate",
    "heartrate_opt_out",
    "display_hide_heartrate_option",
    "average_speed",
    "max_speed",
    "average_cadence",
    "average_watts",
    "pr_count",
    "elev_high",
    "elev_low",
    "has_kudoed",
    "total_elevation_gain",
    "map",
    "map_summary_polyline",
    "private",
    "bike_id",
    "short_unit",
    "elevation_unit",
    "upload_id_str",
    "total_photo_count",
    "start_latlng",
    "end_latlng",
    "has_heartrate",
    "max_watts"
  ];

  public stravaConnectorConfig: StravaConnectorConfig;

  constructor(
    @inject(AppService) protected readonly appService: AppService,
    @inject(IpcMessagesSender) protected readonly ipcMessagesSender: IpcMessagesSender,
    @inject(StravaApiClient) public readonly stravaApiClient: StravaApiClient
  ) {
    super(appService, ipcMessagesSender);
    this.type = ConnectorType.STRAVA;
    this.enabled = StravaConnector.ENABLED;
  }

  public static generateFetchStreamsEndpoint(activityId: number): string {
    return `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=time,distance,latlng,altitude,velocity_smooth,heartrate,cadence,watts,watts_calc,grade_smooth,grade_adjusted_speed`;
  }

  public static generateFetchBareActivitiesPageEndpoint(page: number, perPage: number, afterTimestamp: number): string {
    const after = _.isNumber(afterTimestamp) ? "after=" + afterTimestamp : "";
    return `https://www.strava.com/api/v3/athlete/activities?before&${after}&page=${page}&per_page=${perPage}`;
  }

  public configure(connectorConfig: ConnectorConfig): this {
    super.configure(connectorConfig);
    this.stravaConnectorConfig = this.connectorConfig as StravaConnectorConfig;
    return this;
  }

  public sync(): Subject<SyncEvent> {
    this.stravaApiClient.nextCallWaitTime = 0;
    if (this.isSyncing) {
      this.syncEvents$.next(ErrorSyncEvent.SYNC_ALREADY_STARTED.create(ConnectorType.STRAVA));
    } else {
      // Start a new sync
      this.syncEvents$ = new ReplaySubject<SyncEvent>();
      this.syncEvents$.next(new StartedSyncEvent(ConnectorType.STRAVA));
      this.isSyncing = true;

      this.syncPages(this.syncEvents$).then(
        () => {
          this.isSyncing = false;
          this.syncEvents$.complete();
        },
        (syncEvent: SyncEvent) => {
          this.isSyncing = false;

          const isCancelEvent = syncEvent.type === SyncEventType.STOPPED;

          if (isCancelEvent) {
            this.syncEvents$.next(syncEvent);
          } else {
            this.syncEvents$.error(syncEvent);
          }
        }
      );
    }

    return this.syncEvents$;
  }

  public syncPages(
    syncEvents$: Subject<SyncEvent>,
    stravaPageId: number = 1,
    perPage: number = StravaConnector.ACTIVITIES_PER_PAGES
  ): Promise<void> {
    // Check for stop request and stop sync
    if (this.stopRequested) {
      return Promise.reject(new StoppedSyncEvent(ConnectorType.STRAVA));
    }

    return new Promise((resolve, reject) => {
      this.getStravaBareActivityModels(stravaPageId, perPage, this.syncDateTime).then(
        (bareActivities: BareActivityModel[]) => {
          if (bareActivities.length > 0) {
            this.processBareActivities(syncEvents$, bareActivities).then(
              () => {
                // Increment page and handle next page
                stravaPageId = stravaPageId + 1;
                resolve(this.syncPages(syncEvents$, stravaPageId, perPage));
              },
              error => {
                reject(error);
              }
            );
          } else {
            resolve();
          }
        },
        error => {
          reject(error);
        }
      );
    });
  }

  public processBareActivities(syncEvents$: Subject<SyncEvent>, bareActivities: BareActivityModel[]): Promise<void> {
    return bareActivities.reduce((previousPromise: Promise<void>, bareActivity: BareActivityModel) => {
      return previousPromise.then(() => {
        // Check for stop request and stop sync
        if (this.stopRequested) {
          return Promise.reject(new StoppedSyncEvent(ConnectorType.STRAVA));
        }

        bareActivity = this.prepareBareActivity(bareActivity);

        // Does bare activity has been already synced before?
        return this.findSyncedActivityModels(bareActivity.start_time, bareActivity.elapsed_time_raw).then(
          (syncedActivityModels: SyncedActivityModel[]) => {
            if (_.isEmpty(syncedActivityModels)) {
              // Fetch stream of the activity
              return this.getStravaActivityStreams(bareActivity.id as number).then(
                (activityStreamsModel: ActivityStreamsModel) => {
                  try {
                    let syncedActivityModel: Partial<SyncedActivityModel> = bareActivity;
                    syncedActivityModel.start_timestamp = new Date(bareActivity.start_time).getTime() / 1000;

                    // Assign reference to strava activity
                    syncedActivityModel.extras = {
                      strava_activity_id: syncedActivityModel.id as number
                    }; // Keep tracking  of activity id
                    syncedActivityModel.id =
                      syncedActivityModel.id + "-" + BaseConnector.hashData(syncedActivityModel.start_time, 8);

                    // Resolve athlete snapshot for current activity date
                    syncedActivityModel.athleteSnapshot = this.athleteSnapshotResolver.resolve(
                      syncedActivityModel.start_time
                    );

                    // Compute activity
                    activityStreamsModel = this.appendPowerStream(
                      bareActivity,
                      activityStreamsModel,
                      syncedActivityModel.athleteSnapshot.athleteSettings.weight
                    );
                    syncedActivityModel.extendedStats = this.computeExtendedStats(
                      syncedActivityModel,
                      syncedActivityModel.athleteSnapshot,
                      this.connectorConfig.userSettingsModel,
                      activityStreamsModel
                    );

                    // Try to use primitive data from computation. Else use primitive data from source (strava) if exists
                    const primitiveSourceData = new PrimitiveSourceData(
                      bareActivity.elapsed_time_raw,
                      bareActivity.moving_time_raw,
                      bareActivity.distance_raw,
                      bareActivity.elevation_gain_raw
                    );
                    syncedActivityModel = BaseConnector.updatePrimitiveStatsFromComputation(
                      syncedActivityModel as SyncedActivityModel,
                      activityStreamsModel,
                      primitiveSourceData
                    );

                    // Track connector type
                    syncedActivityModel.sourceConnectorType = ConnectorType.STRAVA;

                    // Check if user missed some athlete settings. Goal: avoid missing stress scores because of missing settings.
                    syncedActivityModel.settingsLack = ActivityComputer.hasAthleteSettingsLacks(
                      syncedActivityModel.distance_raw,
                      syncedActivityModel.moving_time_raw,
                      syncedActivityModel.elapsed_time_raw,
                      syncedActivityModel.type,
                      syncedActivityModel.extendedStats,
                      syncedActivityModel.athleteSnapshot.athleteSettings,
                      activityStreamsModel
                    );

                    // Gunzip stream as base64
                    const compressedStream = activityStreamsModel
                      ? ActivityStreamsModel.inflate(activityStreamsModel)
                      : null;

                    // Notify the new SyncedActivityModel
                    syncEvents$.next(
                      new ActivitySyncEvent(
                        ConnectorType.STRAVA,
                        null,
                        syncedActivityModel as SyncedActivityModel,
                        true,
                        compressedStream
                      )
                    );
                  } catch (error) {
                    const errorSyncEvent =
                      error instanceof Error
                        ? ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(
                            ConnectorType.STRAVA,
                            error.message,
                            bareActivity,
                            error.stack
                          )
                        : ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(
                            ConnectorType.STRAVA,
                            error.toString(),
                            bareActivity
                          );

                    syncEvents$.next(errorSyncEvent); // Notify error
                  }

                  return Promise.resolve(); // Continue to next activity
                },
                (errorSyncEvent: ErrorSyncEvent) => {
                  return Promise.reject(errorSyncEvent); // Every error here will stop the sync
                }
              );
            } else {
              // Activities exists

              if (_.isArray(syncedActivityModels) && syncedActivityModels.length === 1) {
                // One activity found
                if (this.stravaConnectorConfig.info.updateSyncedActivitiesNameAndType) {
                  const syncedActivityModel = syncedActivityModels[0];
                  syncedActivityModel.name = bareActivity.name;
                  syncedActivityModel.type = bareActivity.type;
                  syncEvents$.next(new ActivitySyncEvent(ConnectorType.STRAVA, null, syncedActivityModel, false));
                }
              } else {
                // More than 1 activity found, trigger ErrorSyncEvent...

                const activitiesFound = [];
                _.forEach(syncedActivityModels, (activityModel: SyncedActivityModel) => {
                  activitiesFound.push(activityModel.name + " (" + new Date(activityModel.start_time).toString() + ")");
                });

                const errorSyncEvent = new ErrorSyncEvent(
                  ConnectorType.STRAVA,
                  ErrorSyncEvent.MULTIPLE_ACTIVITIES_FOUND.create(
                    ConnectorType.STRAVA,
                    bareActivity.name,
                    new Date(bareActivity.start_time),
                    activitiesFound
                  )
                );

                syncEvents$.next(errorSyncEvent);
              }

              return Promise.resolve(); // Continue to next activity
            }
          }
        );
      });
    }, Promise.resolve());
  }

  public prepareBareActivity(bareActivity: BareActivityModel): BareActivityModel {
    // Fields re-mapping
    bareActivity.elapsed_time_raw = (bareActivity as any).elapsed_time;
    bareActivity.moving_time_raw = (bareActivity as any).moving_time;
    bareActivity.distance_raw = (bareActivity as any).distance;
    bareActivity.elevation_gain_raw = (bareActivity as any).total_elevation_gain;
    bareActivity.hasPowerMeter = (bareActivity as any).device_watts;

    // Start/End time formatting
    bareActivity.start_time = new Date((bareActivity as any).start_date).toISOString();
    const endDate = new Date(bareActivity.start_time);
    endDate.setSeconds(endDate.getSeconds() + bareActivity.elapsed_time_raw);
    bareActivity.end_time = endDate.toISOString();

    // Bare activity cleaning
    return _.omit(bareActivity, StravaConnector.STRAVA_OMIT_FIELDS) as BareActivityModel;
  }

  public appendPowerStream(
    bareActivityModel: BareActivityModel,
    activityStreamsModel: ActivityStreamsModel,
    weight: number
  ): ActivityStreamsModel {
    if (!activityStreamsModel) {
      return null;
    }

    if (!bareActivityModel.hasPowerMeter) {
      if (!_.isEmpty(activityStreamsModel.watts_calc)) {
        activityStreamsModel.watts = activityStreamsModel.watts_calc;
      } else {
        // No power at all. Trying to estimated it on elevate side
        if (bareActivityModel.type === ElevateSport.Ride || bareActivityModel.type === ElevateSport.VirtualRide) {
          try {
            activityStreamsModel.watts = this.estimateCyclingPowerStream(
              bareActivityModel.type,
              activityStreamsModel.velocity_smooth,
              activityStreamsModel.grade_smooth,
              weight
            );
          } catch (err) {
            logger.error("Unable to estimated power on activity started at: " + bareActivityModel.start_time, err);
            delete activityStreamsModel.watts;
          }
        }
      }
    }

    delete activityStreamsModel.watts_calc;
    return activityStreamsModel;
  }

  public getStravaBareActivityModels(page: number, perPage: number, after: number): Promise<BareActivityModel[]> {
    return this.fetchRemoteStravaBareActivityModels(page, perPage, after);
  }

  public getStravaActivityStreams(activityId: number): Promise<ActivityStreamsModel> {
    return new Promise<ActivityStreamsModel>((resolve, reject) => {
      this.fetchRemoteStravaActivityStreams(activityId).then(
        (stravaApiStreamTypes: StravaApiStreamType[]) => {
          const activityStreamsModel: Partial<ActivityStreamsModel> = {};
          _.forEach(stravaApiStreamTypes, (stravaApiStreamType: StravaApiStreamType) => {
            (activityStreamsModel[stravaApiStreamType.type] as number[]) = stravaApiStreamType.data;
          });

          resolve(activityStreamsModel as ActivityStreamsModel);
        },
        (errorSyncEvent: ErrorSyncEvent) => {
          if (errorSyncEvent) {
            if (errorSyncEvent.code === ErrorSyncEvent.STRAVA_API_RESOURCE_NOT_FOUND.code) {
              logger.warn(`No streams found for activity "${activityId}". ${errorSyncEvent.description}`);
              resolve(null);
            } else {
              reject(errorSyncEvent);
            }
          }
        }
      );
    });
  }

  public fetchRemoteStravaActivityStreams(activityId: number): Promise<StravaApiStreamType[]> {
    return this.stravaApiClient.get(
      this.stravaConnectorConfig.info,
      StravaConnector.generateFetchStreamsEndpoint(activityId),
      stravaConnectorInfo => this.onStravaConnectorInfoUpdate(stravaConnectorInfo),
      retryMillis => this.onRetry(retryMillis)
    );
  }

  public fetchRemoteStravaBareActivityModels(
    page: number,
    perPage: number,
    after: number
  ): Promise<BareActivityModel[]> {
    return this.stravaApiClient.get(
      this.stravaConnectorConfig.info,
      StravaConnector.generateFetchBareActivitiesPageEndpoint(page, perPage, after),
      stravaConnectorInfo => this.onStravaConnectorInfoUpdate(stravaConnectorInfo),
      retryMillis => this.onRetry(retryMillis)
    );
  }

  public onStravaConnectorInfoUpdate(stravaConnectorInfo: StravaConnectorInfo): void {
    this.syncEvents$.next(new StravaCredentialsUpdateSyncEvent(stravaConnectorInfo));
  }

  public onRetry(retryMillis: number): void {
    const retrySeconds = retryMillis / 1000;
    const countDown = timer(0, 1000).pipe(
      scan(acc => --acc, retrySeconds),
      takeWhile(x => x >= 0)
    );

    countDown.subscribe(remainingSec => {
      this.syncEvents$.next(
        new GenericSyncEvent(
          ConnectorType.STRAVA,
          `Strava wants you to slow down...🐌 Resuming sync in ${remainingSec} seconds...`
        )
      );
    });
  }
}
