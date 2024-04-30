import { BaseConnector } from "../base.connector";
import { ReplaySubject, Subject } from "rxjs";
import { AppService } from "../../app-service";
import _ from "lodash";
import { inject, singleton } from "tsyringe";
import { ConnectorConfig, StravaConnectorConfig } from "../connector-config.model";
import { StravaApiClient } from "../../clients/strava-api.client";
import { IpcSyncMessageSender } from "../../senders/ipc-sync-message.sender";
import { Logger } from "../../logger";
import moment from "moment";
import { WorkerService } from "../../worker-service";
import { Movement } from "@elevate/shared/tools/movement";
import { countdown } from "@elevate/shared/tools/countdown";
import { Environment, EnvironmentToken } from "../../environments/environment.interface";
import { HttpClient } from "../../clients/http.client";
import fs from "fs";
import os from "os";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { SyncEvent } from "@elevate/shared/sync/events/sync.event";
import {
  Activity,
  ActivityExtras,
  ActivityStats,
  ElevationStats,
  Lap,
  PaceStats,
  Scores,
  SpeedStats
} from "@elevate/shared/models/sync/activity.model";
import { StoppedSyncEvent } from "@elevate/shared/sync/events/stopped-sync.event";
import { Constant } from "@elevate/shared/constants/constant";
import { StravaCredentialsUpdateSyncEvent } from "@elevate/shared/sync/events/strava-credentials-update-sync.event";
import { StravaConnectorInfo } from "@elevate/shared/sync/connectors/strava-connector-info.model";
import { ErrorSyncEvent } from "@elevate/shared/sync/events/error-sync.event";
import { BareActivity } from "@elevate/shared/models/sync/bare-activity.model";
import { SyncEventType } from "@elevate/shared/sync/events/sync-event-type";
import { ActivitySyncEvent } from "@elevate/shared/sync/events/activity-sync.event";
import { ActivityComputer } from "@elevate/shared/sync/compute/activity-computer";
import { GenericSyncEvent } from "@elevate/shared/sync/events/generic-sync.event";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { StartedSyncEvent } from "@elevate/shared/sync/events/started-sync.event";

export interface StravaBareActivity {
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  id: number;
  external_id: string;
  start_date: string;
  start_date_local: string;
  timezone: string;
  utc_offset: number;
  start_latlng: number[];
  end_latlng: number[];
  location_city: string;
  location_state: string;
  location_country: string;
  trainer: boolean;
  commute: boolean;
  manual: boolean;
  private: boolean;
  flagged: boolean;
  gear_id: number;
  from_accepted_tag: boolean;
  device_watts: boolean;
  upload_id_str: string;
  average_speed: number;
  max_speed: number;
  has_heartrate: boolean;
  average_heartrate: number;
  max_heartrate: number;
  heartrate_opt_out: boolean;
  display_hide_heartrate_option: boolean;
  elev_high: number;
  elev_low: number;
}

export interface StravaActivity extends StravaBareActivity {
  average_speed: number;
  max_speed: number;
  average_cadence: number;
  average_watts: number;
  max_heartrate: number;
  calories: number;
  device_name: string;
  description: string;
  laps: StravaLap[];
}

export interface StravaLap {
  name: string;
  elapsed_time: number;
  moving_time: number;
  start_date: string;
  start_date_local: string;
  distance: number;
  start_index: number;
  end_index: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  average_cadence: number;
  device_watts: boolean;
  average_watts: number;
  average_heartrate: number;
  max_heartrate: number;
  lap_index: number;
  split: number;
}

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

  public stravaConnectorConfig: StravaConnectorConfig;

  constructor(
    @inject(AppService) protected readonly appService: AppService,
    @inject(EnvironmentToken) protected readonly environment: Environment,
    @inject(IpcSyncMessageSender) protected readonly ipcSyncMessageSender: IpcSyncMessageSender,
    @inject(StravaApiClient) public readonly stravaApiClient: StravaApiClient,
    @inject(WorkerService) protected readonly workerService: WorkerService,
    @inject(HttpClient) protected readonly httpClient: HttpClient,
    @inject(Logger) protected readonly logger: Logger
  ) {
    super(appService, environment, ipcSyncMessageSender, workerService, httpClient, logger);
    this.type = ConnectorType.STRAVA;
    this.enabled = StravaConnector.ENABLED;
  }

  public static generateActivityEndpoint(activityId: number): string {
    return `https://www.strava.com/api/v3/activities/${activityId}`;
  }

  public static generateFetchStreamsEndpoint(activityId: number): string {
    return `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=time,distance,latlng,altitude,velocity_smooth,heartrate,cadence,watts,temp,grade_adjusted_distance`;
  }

  public static generateFetchBareActivitiesPageEndpoint(page: number, perPage: number, afterTimestamp: number): string {
    const after = _.isNumber(afterTimestamp) ? "after=" + Math.floor(afterTimestamp / 1000) : "";
    return `https://www.strava.com/api/v3/athlete/activities?before&${after}&page=${page}&per_page=${perPage}`;
  }

  public configure(connectorConfig: ConnectorConfig): this {
    super.configure(connectorConfig);
    this.stravaConnectorConfig = this.connectorConfig as StravaConnectorConfig;
    return this;
  }

  public sync(): Subject<SyncEvent> {
    if (this.isSyncing) {
      this.syncEvents$.next(ErrorSyncEvent.SYNC_ALREADY_STARTED.create(ConnectorType.STRAVA));
    } else {
      // Start a new sync
      this.syncEvents$ = new ReplaySubject<SyncEvent>();
      this.syncEvents$.next(new StartedSyncEvent(ConnectorType.STRAVA));
      this.isSyncing = true;

      this.logger.info(`Starting new sync on '${this.type}' connector`);

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
            this.syncEvents$.next(new StoppedSyncEvent(this.type));
            this.syncEvents$.error(syncEvent);
            this.logger.error(syncEvent);
          }
        }
      );
    }

    return this.syncEvents$;
  }

  public syncPages(
    syncEvents$: Subject<SyncEvent>,
    stravaPageId = 1,
    perPage: number = StravaConnector.ACTIVITIES_PER_PAGES
  ): Promise<void> {
    // Check for stop request and stop sync
    if (this.stopRequested) {
      return Promise.reject(new StoppedSyncEvent(this.type));
    }

    return new Promise((resolve, reject) => {
      this.syncEvents$.next(
        new GenericSyncEvent(this.type, `Scanning ${stravaPageId * StravaConnector.ACTIVITIES_PER_PAGES} activities...`)
      );

      this.getStravaBareActivityModels(stravaPageId, perPage, this.syncFromDateTime).then(
        (stravaBareActivities: StravaBareActivity[]) => {
          if (stravaBareActivities.length > 0) {
            this.processBareActivities(syncEvents$, stravaBareActivities).then(
              () => {
                // Increment page and handle next page
                stravaPageId = stravaPageId + 1;
                resolve(this.syncPages(syncEvents$, stravaPageId, perPage));
              },
              error => reject(error)
            );
          } else {
            resolve();
          }
        },
        error => reject(error)
      );
    });
  }

  public processBareActivities(
    syncEvents$: Subject<SyncEvent>,
    stravaBareActivities: StravaBareActivity[]
  ): Promise<void> {
    return stravaBareActivities.reduce((previousPromise: Promise<void>, stravaBareActivity: StravaBareActivity) => {
      return previousPromise.then(() => {
        // Check for stop request and stop sync
        if (this.stopRequested) {
          return Promise.reject(new StoppedSyncEvent(this.type));
        }

        const bareActivity = this.prepareBareActivity(stravaBareActivity);

        // Does bare activity has been already synced before?
        return this.findLocalActivities(bareActivity.startTime, bareActivity.endTime).then(
          (localActivities: Activity[]) => {
            if (_.isEmpty(localActivities) || this.environment.allowActivitiesOverLapping) {
              // Fetch stream of the activity
              return Promise.all([
                this.fetchRemoteAndMapStreams(bareActivity.id as number),
                this.fetchRemoteStravaActivity(bareActivity.id as number)
              ]).then(
                (stravaApiResults: [Streams, StravaActivity]) => {
                  // Retrieve results
                  const [streams, stravaActivity] = stravaApiResults;

                  // Prepare final activity object
                  let activity: Partial<Activity> = bareActivity;

                  // Set common activity properties
                  activity = this.assignBaseProperties(activity, streams);

                  // Assign reference to strava activity
                  activity.extras = {
                    strava: {
                      activityId: stravaBareActivity.id
                    }
                  };

                  // Resolve athlete snapshot for current activity date
                  const athleteSnapshot = this.athleteSnapshotResolver.resolve(activity.startTime);

                  // Fetch source stats coming from files.
                  // These stats will override the computed stats to display what the user had seen on his device
                  activity.srcStats = this.getSourceStats(activity.type, stravaActivity, streams);

                  // Process laps
                  activity.laps = this.extractLaps(activity.type, stravaActivity);

                  // Fetch device name if exists
                  activity.device = stravaActivity.device_name?.match(/unknown/gi) ? null : stravaActivity.device_name;

                  // Track notes
                  activity.notes = stravaActivity.description || null;

                  // Compute activity
                  return this.computeActivity(
                    activity,
                    athleteSnapshot,
                    this.connectorConfig.userSettings,
                    streams,
                    true
                  )
                    .then(results => {
                      const { computedActivity, deflatedStreams } = results;

                      // Notify the new activity
                      syncEvents$.next(new ActivitySyncEvent(this.type, null, computedActivity, true, deflatedStreams));

                      return Promise.resolve(); // Continue to next activity
                    })
                    .catch(error => {
                      const errorSyncEvent =
                        error instanceof Error
                          ? ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(this.type, error.message, bareActivity, error)
                          : ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(this.type, error.toString(), bareActivity);

                      syncEvents$.next(errorSyncEvent); // Notify error

                      return Promise.resolve(); // Continue to next activity
                    });
                },
                (errorSyncEvent: ErrorSyncEvent) => {
                  return Promise.reject(errorSyncEvent); // Every error here will stop the sync
                }
              );
            } else {
              // Activities exists
              if (_.isArray(localActivities) && localActivities.length === 1) {
                // One activity found
                if (this.stravaConnectorConfig.info.updateExistingNamesTypesCommutes) {
                  let localActivity: Activity = localActivities[0];

                  // Update name
                  localActivity.name = bareActivity.name;

                  // Commute state
                  localActivity.commute = bareActivity.commute;

                  // Add strava extras infos to existing ones
                  localActivity.extras = _.merge<ActivityExtras, ActivityExtras>(localActivity.extras, {
                    strava: {
                      activityId: bareActivity.id as number
                    }
                  });

                  // Does type change from strava?
                  const hasTypeChanged = bareActivity.type !== localActivity.type;

                  if (hasTypeChanged) {
                    // Update activity with the new type coming from strava
                    localActivity.type = bareActivity.type;

                    // If sport type has changed. We have to loose source stats to rely on computed stats instead once computed.
                    // For instance if an activity is flagged as "Ride" is changed to "Run", then the "moving time source stat"
                    // will be wrong since speed thresholds to compute the moving time are different.
                    localActivity.srcStats = null;

                    return this.findStreams(localActivity.id).then(streams => {
                      const computePromise = streams
                        ? this.computeActivity(
                            localActivity,
                            localActivity.athleteSnapshot,
                            this.connectorConfig.userSettings,
                            streams,
                            false
                          )
                        : Promise.resolve();

                      return computePromise.then(results => {
                        if (results) {
                          const { computedActivity } = results;
                          localActivity = computedActivity;

                          this.logger.info(
                            `Recalculated activity ${localActivity.id} after type change to ${localActivity.type}`
                          );
                        }

                        // Notify synced model updated
                        syncEvents$.next(new ActivitySyncEvent(this.type, null, localActivity, false));
                        return Promise.resolve(); // Continue to next activity
                      });
                    });
                  }

                  // Notify synced model updated
                  syncEvents$.next(new ActivitySyncEvent(this.type, null, localActivity, false));
                }
              } else {
                // More than 1 activity found, trigger ErrorSyncEvent...

                const activitiesFound = [];
                _.forEach(localActivities, (activity: Activity) => {
                  activitiesFound.push(
                    `<${activity.name} from ${moment(activity.startTime).format("LLL")} to ${moment(
                      activity.endTime
                    ).format("LLL")}>`
                  );
                });

                const errorSyncEvent = ErrorSyncEvent.MULTIPLE_ACTIVITIES_FOUND.create(
                  this.type,
                  bareActivity.name,
                  new Date(bareActivity.startTime),
                  new Date(bareActivity.endTime),
                  activitiesFound
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

  private extractLaps(sport: ElevateSport, stravaActivity: StravaActivity): Lap[] {
    if (!stravaActivity.laps || stravaActivity.laps.length <= 1) {
      return null;
    }

    return stravaActivity.laps.map((stravaLap: StravaLap, lapIndex: number) => {
      const lap: Lap = {
        id: lapIndex + 1,
        active: !!(stravaLap.distance || stravaLap.average_speed),
        indexes: [stravaLap.start_index, stravaLap.end_index]
      };

      if (stravaLap.distance) {
        lap.distance = stravaLap.distance;
      }

      if (stravaLap.total_elevation_gain) {
        lap.elevationGain = stravaLap.total_elevation_gain;
      }

      if (stravaLap.elapsed_time) {
        lap.elapsedTime = stravaLap.elapsed_time;
      }

      if (stravaLap.moving_time) {
        lap.movingTime = stravaLap.moving_time;
      }

      if (stravaLap.average_speed) {
        lap.avgSpeed = _.round(stravaLap.average_speed * Constant.MPS_KPH_FACTOR, ActivityComputer.RND);
        lap.avgPace = _.round(Movement.speedToPace(lap.avgSpeed));
      }

      if (stravaLap.max_speed) {
        lap.maxSpeed = _.round(stravaLap.max_speed * Constant.MPS_KPH_FACTOR, ActivityComputer.RND);
        lap.maxPace = _.round(Movement.speedToPace(lap.maxSpeed));
      }

      if (stravaLap.average_cadence) {
        lap.avgCadence = stravaLap.average_cadence;
      }

      if (stravaLap.average_heartrate) {
        lap.avgHr = stravaLap.average_heartrate;
      }

      if (stravaLap.max_heartrate) {
        lap.maxHr = stravaLap.max_heartrate;
      }

      if (stravaActivity.device_watts && stravaLap.average_watts) {
        lap.avgWatts = _.round(stravaLap.average_watts);
      }

      if (lap.active && Activity.isSwim(sport) && lap.avgSpeed && lap.avgCadence) {
        lap.swolf25m = ActivityComputer.computeSwimSwolf(Movement.speedToSwimPace(lap.avgSpeed), lap.avgCadence, 25);
        lap.swolf50m = ActivityComputer.computeSwimSwolf(Movement.speedToSwimPace(lap.avgSpeed), lap.avgCadence, 50);
      }

      return lap;
    });
  }

  public prepareBareActivity(stravaBareActivity: StravaBareActivity): BareActivity {
    const bareActivity: BareActivity = new BareActivity();

    // Fields re-mapping
    const startTimestamp = Math.floor(new Date(stravaBareActivity.start_date).getTime() / 1000);
    const endTimestamp = startTimestamp + stravaBareActivity.elapsed_time;

    bareActivity.id = stravaBareActivity.id;
    bareActivity.name = stravaBareActivity.name;
    bareActivity.type = stravaBareActivity.type as ElevateSport;
    bareActivity.startTime = new Date(startTimestamp * 1000).toISOString();
    bareActivity.endTime = new Date(endTimestamp * 1000).toISOString();
    bareActivity.startTimestamp = startTimestamp;
    bareActivity.endTimestamp = endTimestamp;
    bareActivity.hasPowerMeter = stravaBareActivity.device_watts;
    bareActivity.trainer = stravaBareActivity.trainer;
    bareActivity.commute = stravaBareActivity.commute;
    bareActivity.manual = stravaBareActivity.manual;

    return bareActivity;
  }

  public getSourceStats(
    sport: ElevateSport,
    source: Partial<StravaActivity>,
    streams: Streams
  ): Partial<ActivityStats> {
    const srcStats: Partial<ActivityStats> = {
      speed: {} as SpeedStats,
      pace: {} as PaceStats,
      elevation: {} as ElevationStats
    };

    // Timings
    srcStats.movingTime = source.moving_time || null;
    srcStats.elapsedTime = source.elapsed_time || null;
    srcStats.pauseTime =
      srcStats.movingTime && srcStats.elapsedTime ? srcStats.elapsedTime - srcStats.movingTime : null;
    srcStats.moveRatio =
      srcStats.movingTime && srcStats.elapsedTime
        ? _.round(srcStats.movingTime / srcStats.elapsedTime, ActivityComputer.RND)
        : null;

    if (source.distance > 0) {
      srcStats.distance = _.round(source.distance, ActivityComputer.RND);
    }

    if (source.calories > 0) {
      srcStats.calories = _.round(source.calories, ActivityComputer.RND);
      srcStats.caloriesPerHour =
        srcStats.calories > 0 && srcStats.elapsedTime > 0
          ? _.round((srcStats.calories / srcStats.elapsedTime) * Constant.SEC_HOUR_FACTOR, ActivityComputer.RND)
          : null;
    }

    if (source.total_elevation_gain > 0) {
      srcStats.elevation.ascent = _.round(source.total_elevation_gain);
      srcStats.elevationGain = srcStats.elevation.ascent;
    }

    if (source.average_speed > 0) {
      srcStats.speed.avg = _.round(source.average_speed * Constant.MPS_KPH_FACTOR, ActivityComputer.RND);
      srcStats.pace.avg = Movement.speedToPace(srcStats.speed.avg);

      // When running, compute grade adjusted pace from 'grade_adjusted_distance' stream if exists
      if (Activity.isRun(sport) && streams?.grade_adjusted_distance?.length > 0) {
        const gradeAdjDistance = _.last(streams?.grade_adjusted_distance);
        const gradeAdjSpeed = (gradeAdjDistance / srcStats.movingTime) * Constant.MPS_KPH_FACTOR;
        srcStats.pace.gapAvg = _.round(Movement.speedToPace(gradeAdjSpeed));

        // Once calculated, drop the 'grade_adjusted_distance' since we compute the grade, speed/pace ourselves
        delete streams.grade_adjusted_distance;
      }
    }

    // Swim SWOLF when swim activity and required available
    if (Activity.isSwim(sport) && srcStats?.speed?.avg && source.average_cadence) {
      if (!srcStats.scores) {
        srcStats.scores = {} as Scores;
      }

      // Try to compute if unavailable
      srcStats.scores.swolf = {
        25: ActivityComputer.computeSwimSwolf(Movement.speedToSwimPace(srcStats.speed.avg), source.average_cadence, 25),
        50: ActivityComputer.computeSwimSwolf(Movement.speedToSwimPace(srcStats.speed.avg), source.average_cadence, 50)
      };
    }

    return srcStats;
  }

  public getStravaBareActivityModels(page: number, perPage: number, after: number): Promise<StravaBareActivity[]> {
    return this.fetchRemoteStravaBareActivityModels(page, perPage, after);
  }

  public fetchRemoteAndMapStreams(activityId: number): Promise<Streams> {
    return new Promise<Streams>((resolve, reject) => {
      this.fetchRemoteStravaStreams(activityId).then(
        (stravaApiStreamTypes: StravaApiStreamType[]) => {
          const streams: Partial<Streams> = {};
          _.forEach(stravaApiStreamTypes, (stravaApiStreamType: StravaApiStreamType) => {
            (streams[stravaApiStreamType.type] as number[]) = stravaApiStreamType.data;
          });

          // Remove "empty like" streams
          // Is distance always equal to zero?
          if (streams.distance?.length && _.mean(streams.distance) === 0) {
            delete streams.distance;
          }
          // Is speed always equal to zero?
          if (streams.velocity_smooth?.length && _.mean(streams.velocity_smooth) === 0) {
            delete streams.velocity_smooth;
          }

          // Is gas always equal to zero?
          if (streams.grade_adjusted_speed?.length && _.mean(streams.grade_adjusted_speed) === 0) {
            delete streams.grade_adjusted_speed;
          }

          resolve(streams as Streams);
        },
        (errorSyncEvent: ErrorSyncEvent) => {
          if (errorSyncEvent) {
            if (errorSyncEvent.code === ErrorSyncEvent.STRAVA_API_RESOURCE_NOT_FOUND.code) {
              this.logger.warn(`No streams found for activity "${activityId}". ${errorSyncEvent.description}`);
              resolve(null);
            } else {
              reject(errorSyncEvent);
            }
          }
        }
      );
    });
  }

  public fetchRemoteStravaActivity(activityId: number): Promise<StravaActivity> {
    return this.stravaApiClient.get(
      this.stravaConnectorConfig.info,
      StravaConnector.generateActivityEndpoint(activityId),
      stravaConnectorInfo => this.onStravaConnectorInfoUpdate(stravaConnectorInfo),
      retryMillis => this.onQuotaReachedRetry(retryMillis)
    );
  }

  public fetchRemoteStravaStreams(activityId: number): Promise<StravaApiStreamType[]> {
    return this.stravaApiClient.get(
      this.stravaConnectorConfig.info,
      StravaConnector.generateFetchStreamsEndpoint(activityId),
      stravaConnectorInfo => this.onStravaConnectorInfoUpdate(stravaConnectorInfo),
      retryMillis => this.onQuotaReachedRetry(retryMillis)
    );
  }

  public fetchRemoteStravaBareActivityModels(
    page: number,
    perPage: number,
    after: number
  ): Promise<StravaBareActivity[]> {
    return this.stravaApiClient.get(
      this.stravaConnectorConfig.info,
      StravaConnector.generateFetchBareActivitiesPageEndpoint(page, perPage, after),
      stravaConnectorInfo => this.onStravaConnectorInfoUpdate(stravaConnectorInfo),
      retryMillis => this.onQuotaReachedRetry(retryMillis)
    );
  }

  public onStravaConnectorInfoUpdate(stravaConnectorInfo: StravaConnectorInfo): void {
    this.syncEvents$.next(new StravaCredentialsUpdateSyncEvent(stravaConnectorInfo));
  }

  public onQuotaReachedRetry(retryMillis: number): void {
    const retrySeconds = retryMillis / 1000;
    const subscription = countdown(retrySeconds).subscribe(remainingSec => {
      if (!this.isSyncing) {
        subscription.unsubscribe();
      } else {
        this.syncEvents$.next(
          new GenericSyncEvent(
            this.type,
            `Strava wants you to slow down...🐌 Resuming sync in ${remainingSec} seconds...`
          )
        );
      }
    });
  }
}
