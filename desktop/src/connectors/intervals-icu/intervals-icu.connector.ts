import { BaseConnector } from "../base.connector";
import { ReplaySubject, Subject } from "rxjs";
import { AppService } from "../../app-service";
import _ from "lodash";
import moment from "moment";
import { inject, singleton } from "tsyringe";
import { ConnectorConfig, IntervalsIcuConnectorConfig } from "../connector-config.model";
import { IntervalsIcuApiClient } from "../../clients/intervals-icu-api.client";
import { IpcSyncMessageSender } from "../../senders/ipc-sync-message.sender";
import { Logger } from "../../logger";
import { WorkerService } from "../../worker-service";
import { Environment, EnvironmentToken } from "../../environments/environment.interface";
import { HttpClient } from "../../clients/http.client";
import { Movement } from "@elevate/shared/tools/movement";
import { countdown } from "@elevate/shared/tools/countdown";
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
import { ErrorSyncEvent } from "@elevate/shared/sync/events/error-sync.event";
import { BareActivity } from "@elevate/shared/models/sync/bare-activity.model";
import { SyncEventType } from "@elevate/shared/sync/events/sync-event-type";
import { ActivitySyncEvent } from "@elevate/shared/sync/events/activity-sync.event";
import { ActivityComputer } from "@elevate/shared/sync/compute/activity-computer";
import { GenericSyncEvent } from "@elevate/shared/sync/events/generic-sync.event";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { StartedSyncEvent } from "@elevate/shared/sync/events/started-sync.event";

export interface IntervalsIcuInterval {
  type: string; // e.g. "WORK", "RECOVERY"
  label: string;
  start_index: number;
  end_index: number;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  average_cadence: number;
  average_watts: number;
  average_heartrate: number;
  max_heartrate: number;
}

export interface IntervalsIcuActivity {
  id: string;
  name: string;
  description: string;
  type: string;
  source: string;
  start_date: string;
  start_date_local: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  trainer: boolean;
  commute: boolean;
  device_watts: boolean;
  device_name: string;
  average_speed: number;
  max_speed: number;
  average_cadence: number;
  average_heartrate: number;
  max_heartrate: number;
  calories: number;
  icu_intervals?: IntervalsIcuInterval[];
  // Set by intervals.icu when activity data can't be served through the api (e.g. Strava imported activities)
  _note?: string;
}

export interface IntervalsIcuStream {
  type: string;
  name: string;
  data: number[];
  data2?: number[]; // Longitudes when type is "latlng"
}

@singleton()
export class IntervalsIcuConnector extends BaseConnector {
  public static readonly ENABLED: boolean = true;
  public static readonly FULL_SYNC_OLDEST_DATE: string = "1970-01-01";
  public static readonly STREAMS_TYPES: string[] = [
    "time",
    "latlng",
    "distance",
    "altitude",
    "velocity_smooth",
    "heartrate",
    "cadence",
    "watts",
    "temp"
  ];

  // Intervals.icu activity types not matching an elevate sport name
  private static readonly INTERVALS_ICU_TO_ELEVATE_SPORTS_MAP: Map<string, ElevateSport> = new Map<
    string,
    ElevateSport
  >([
    ["MountainBikeRide", ElevateSport.Ride],
    ["GravelRide", ElevateSport.Ride],
    ["TrackRide", ElevateSport.Ride],
    ["EMountainBikeRide", ElevateSport.EBikeRide],
    ["TrailRun", ElevateSport.Run],
    ["OpenWaterSwim", ElevateSport.Swim],
    ["VirtualRow", ElevateSport.Rowing],
    ["VirtualSki", ElevateSport.NordicSki],
    ["Pilates", ElevateSport.Yoga],
    ["HighIntensityIntervalTraining", ElevateSport.Workout]
  ]);

  public intervalsIcuConnectorConfig: IntervalsIcuConnectorConfig;

  constructor(
    @inject(AppService) protected readonly appService: AppService,
    @inject(EnvironmentToken) protected readonly environment: Environment,
    @inject(IpcSyncMessageSender) protected readonly ipcSyncMessageSender: IpcSyncMessageSender,
    @inject(IntervalsIcuApiClient) public readonly intervalsIcuApiClient: IntervalsIcuApiClient,
    @inject(WorkerService) protected readonly workerService: WorkerService,
    @inject(HttpClient) protected readonly httpClient: HttpClient,
    @inject(Logger) protected readonly logger: Logger
  ) {
    super(appService, environment, ipcSyncMessageSender, workerService, httpClient, logger);
    this.type = ConnectorType.INTERVALS_ICU;
    this.enabled = IntervalsIcuConnector.ENABLED;
  }

  public static generateFetchActivitiesEndpoint(athleteId: string, oldest: string, newest: string): string {
    return `${IntervalsIcuApiClient.API_BASE_URL}/athlete/${encodeURIComponent(
      athleteId
    )}/activities?oldest=${oldest}&newest=${newest}`;
  }

  public static generateActivityEndpoint(activityId: string): string {
    return `${IntervalsIcuApiClient.API_BASE_URL}/activity/${encodeURIComponent(activityId)}?intervals=true`;
  }

  public static generateFetchStreamsEndpoint(activityId: string): string {
    return `${IntervalsIcuApiClient.API_BASE_URL}/activity/${encodeURIComponent(
      activityId
    )}/streams.json?types=${IntervalsIcuConnector.STREAMS_TYPES.join(",")}`;
  }

  public static toElevateSport(intervalsIcuType: string): ElevateSport {
    if (!intervalsIcuType) {
      return ElevateSport.Other;
    }

    if (Object.values(ElevateSport).includes(intervalsIcuType as ElevateSport)) {
      return intervalsIcuType as ElevateSport;
    }

    return IntervalsIcuConnector.INTERVALS_ICU_TO_ELEVATE_SPORTS_MAP.get(intervalsIcuType) || ElevateSport.Other;
  }

  /**
   * Replace null/non-finite samples by previous (or next for leading ones) valid sample.
   * Returns null if stream has no valid sample at all.
   */
  public static fillGaps<T>(samples: T[], isValid: (sample: T) => boolean): T[] {
    const firstValid = _.find(samples, isValid);
    if (firstValid === undefined) {
      return null;
    }

    let lastValid = firstValid;
    return samples.map(sample => {
      if (isValid(sample)) {
        lastValid = sample;
        return sample;
      }
      return lastValid;
    });
  }

  public configure(connectorConfig: ConnectorConfig): this {
    super.configure(connectorConfig);
    this.intervalsIcuConnectorConfig = this.connectorConfig as IntervalsIcuConnectorConfig;
    return this;
  }

  public sync(): Subject<SyncEvent> {
    if (this.isSyncing) {
      this.syncEvents$.next(ErrorSyncEvent.SYNC_ALREADY_STARTED.create(ConnectorType.INTERVALS_ICU));
    } else {
      // Start a new sync
      this.syncEvents$ = new ReplaySubject<SyncEvent>();
      this.syncEvents$.next(new StartedSyncEvent(ConnectorType.INTERVALS_ICU));
      this.isSyncing = true;

      this.logger.info(`Starting new sync on '${this.type}' connector`);

      this.syncActivities(this.syncEvents$).then(
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

  public syncActivities(syncEvents$: Subject<SyncEvent>): Promise<void> {
    syncEvents$.next(new GenericSyncEvent(this.type, "Fetching activities list from intervals.icu..."));

    // Intervals.icu filters on local dates: widen by one day on both sides to not miss any activity due to timezones
    const oldest = this.syncFromDateTime
      ? moment(this.syncFromDateTime).subtract(1, "day").format("YYYY-MM-DD")
      : IntervalsIcuConnector.FULL_SYNC_OLDEST_DATE;
    const newest = moment().add(1, "day").format("YYYY-MM-DD");

    return this.fetchRemoteActivities(oldest, newest).then(intervalsIcuActivities => {
      const [syncable, unavailable] = _.partition(intervalsIcuActivities || [], activity =>
        this.isAvailableThroughApi(activity)
      );

      // Process oldest activities first
      const sortedActivities = _.sortBy(syncable, activity => new Date(activity.start_date).getTime());

      syncEvents$.next(
        new GenericSyncEvent(this.type, `Found ${sortedActivities.length} activities to scan on intervals.icu`)
      );

      return this.processActivities(syncEvents$, sortedActivities).then(() => {
        if (unavailable.length > 0) {
          const message = `${unavailable.length} intervals.icu activities were skipped because they are not available through the intervals.icu api (e.g. activities imported from Strava).`;
          this.logger.warn(message);
          syncEvents$.next(new GenericSyncEvent(this.type, message));
        }
      });
    });
  }

  public isAvailableThroughApi(intervalsIcuActivity: IntervalsIcuActivity): boolean {
    return (
      !!intervalsIcuActivity?.start_date &&
      Number.isFinite(intervalsIcuActivity.elapsed_time) &&
      !intervalsIcuActivity._note
    );
  }

  public processActivities(
    syncEvents$: Subject<SyncEvent>,
    intervalsIcuActivities: IntervalsIcuActivity[]
  ): Promise<void> {
    return intervalsIcuActivities.reduce(
      (previousPromise: Promise<void>, intervalsIcuActivity: IntervalsIcuActivity, index: number) => {
        return previousPromise.then(() => {
          // Check for stop request and stop sync
          if (this.stopRequested) {
            return Promise.reject(new StoppedSyncEvent(this.type));
          }

          syncEvents$.next(
            new GenericSyncEvent(this.type, `Scanning activity ${index + 1}/${intervalsIcuActivities.length}...`)
          );

          const bareActivity = this.prepareBareActivity(intervalsIcuActivity);

          return this.findLocalActivities(bareActivity.startTime, bareActivity.endTime).then(
            (localActivities: Activity[]) => {
              if (_.isEmpty(localActivities) || this.environment.allowActivitiesOverLapping) {
                return this.syncNewActivity(syncEvents$, bareActivity);
              }

              if (localActivities.length === 1) {
                return this.syncExistingActivity(syncEvents$, bareActivity, localActivities[0]);
              }

              // More than 1 activity found, trigger ErrorSyncEvent...
              const activitiesFound = localActivities.map(
                (activity: Activity) =>
                  `<${activity.name} from ${moment(activity.startTime).format("LLL")} to ${moment(
                    activity.endTime
                  ).format("LLL")}>`
              );

              syncEvents$.next(
                ErrorSyncEvent.MULTIPLE_ACTIVITIES_FOUND.create(
                  this.type,
                  bareActivity.name,
                  new Date(bareActivity.startTime),
                  new Date(bareActivity.endTime),
                  activitiesFound
                )
              );

              return Promise.resolve(); // Continue to next activity
            }
          );
        });
      },
      Promise.resolve()
    );
  }

  private syncNewActivity(syncEvents$: Subject<SyncEvent>, bareActivity: BareActivity): Promise<void> {
    const intervalsIcuActivityId = bareActivity.id as string;

    return Promise.all([
      this.fetchRemoteAndMapStreams(intervalsIcuActivityId),
      this.fetchRemoteActivity(intervalsIcuActivityId)
    ]).then(([streams, intervalsIcuActivity]: [Streams, IntervalsIcuActivity]) => {
      // Prepare final activity object
      let activity: Partial<Activity> = bareActivity;

      // Set common activity properties
      activity = this.assignBaseProperties(activity, streams);

      // Assign reference to intervals.icu activity
      activity.extras = {
        intervalsIcu: {
          activityId: intervalsIcuActivityId
        }
      };

      // Resolve athlete snapshot for current activity date
      const athleteSnapshot = this.athleteSnapshotResolver.resolve(activity.startTime);

      // These stats will override the computed stats to display what the user had seen on intervals.icu
      activity.srcStats = this.getSourceStats(activity.type, intervalsIcuActivity, streams);

      // Process laps from intervals.icu intervals
      activity.laps = this.extractLaps(activity.type, intervalsIcuActivity);

      // Fetch device name if exists
      activity.device =
        !intervalsIcuActivity.device_name || intervalsIcuActivity.device_name.match(/unknown/gi)
          ? null
          : intervalsIcuActivity.device_name;

      // Track notes
      activity.notes = intervalsIcuActivity.description || null;

      return this.computeActivity(activity, athleteSnapshot, this.connectorConfig.userSettings, streams, true)
        .then(results => {
          const { computedActivity, deflatedStreams } = results;
          syncEvents$.next(new ActivitySyncEvent(this.type, null, computedActivity, true, deflatedStreams));
          return Promise.resolve(); // Continue to next activity
        })
        .catch(error => {
          const errorSyncEvent =
            error instanceof Error
              ? ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(this.type, error.message, bareActivity, error)
              : ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(this.type, `${error}`, bareActivity);

          syncEvents$.next(errorSyncEvent); // Notify error
          return Promise.resolve(); // Continue to next activity
        });
    });
  }

  private syncExistingActivity(
    syncEvents$: Subject<SyncEvent>,
    bareActivity: BareActivity,
    localActivity: Activity
  ): Promise<void> {
    if (!this.intervalsIcuConnectorConfig.info.updateExistingNamesTypesCommutes) {
      return Promise.resolve();
    }

    localActivity.name = bareActivity.name;
    localActivity.commute = bareActivity.commute;

    // Add intervals.icu extras infos to existing ones
    localActivity.extras = _.merge<ActivityExtras, ActivityExtras>(localActivity.extras, {
      intervalsIcu: {
        activityId: bareActivity.id as string
      }
    });

    const hasTypeChanged = bareActivity.type !== localActivity.type;

    if (!hasTypeChanged) {
      syncEvents$.next(new ActivitySyncEvent(this.type, null, localActivity, false));
      return Promise.resolve();
    }

    // Sport type changed: drop source stats to rely on computed ones (e.g. moving time thresholds differ by sport)
    localActivity.type = bareActivity.type;
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
        : Promise.resolve(null);

      return computePromise.then(results => {
        if (results) {
          localActivity = results.computedActivity;
          this.logger.info(`Recalculated activity ${localActivity.id} after type change to ${localActivity.type}`);
        }

        syncEvents$.next(new ActivitySyncEvent(this.type, null, localActivity, false));
        return Promise.resolve();
      });
    });
  }

  public prepareBareActivity(intervalsIcuActivity: IntervalsIcuActivity): BareActivity {
    const bareActivity: BareActivity = new BareActivity();

    const startTimestamp = Math.floor(new Date(intervalsIcuActivity.start_date).getTime() / 1000);
    const endTimestamp = startTimestamp + intervalsIcuActivity.elapsed_time;

    bareActivity.id = intervalsIcuActivity.id;
    bareActivity.type = IntervalsIcuConnector.toElevateSport(intervalsIcuActivity.type);
    bareActivity.name = intervalsIcuActivity.name || bareActivity.type;
    bareActivity.startTime = new Date(startTimestamp * 1000).toISOString();
    bareActivity.endTime = new Date(endTimestamp * 1000).toISOString();
    bareActivity.startTimestamp = startTimestamp;
    bareActivity.endTimestamp = endTimestamp;
    bareActivity.hasPowerMeter = !!intervalsIcuActivity.device_watts;
    bareActivity.trainer = !!intervalsIcuActivity.trainer;
    bareActivity.commute = !!intervalsIcuActivity.commute;
    bareActivity.manual = intervalsIcuActivity.source === "MANUAL";

    return bareActivity;
  }

  private extractLaps(sport: ElevateSport, intervalsIcuActivity: IntervalsIcuActivity): Lap[] {
    const intervals = intervalsIcuActivity.icu_intervals;

    if (!intervals || intervals.length <= 1) {
      return null;
    }

    return intervals.map((interval: IntervalsIcuInterval, index: number) => {
      const lap: Lap = {
        id: index + 1,
        active: interval.type ? interval.type !== "RECOVERY" : !!(interval.distance || interval.average_speed),
        indexes: [interval.start_index, interval.end_index]
      };

      if (interval.distance) {
        lap.distance = interval.distance;
      }

      if (interval.total_elevation_gain) {
        lap.elevationGain = interval.total_elevation_gain;
      }

      if (interval.elapsed_time) {
        lap.elapsedTime = interval.elapsed_time;
      }

      if (interval.moving_time) {
        lap.movingTime = interval.moving_time;
      }

      if (interval.average_speed) {
        lap.avgSpeed = _.round(interval.average_speed * Constant.MPS_KPH_FACTOR, ActivityComputer.RND);
        lap.avgPace = _.round(Movement.speedToPace(lap.avgSpeed));
      }

      if (interval.max_speed) {
        lap.maxSpeed = _.round(interval.max_speed * Constant.MPS_KPH_FACTOR, ActivityComputer.RND);
        lap.maxPace = _.round(Movement.speedToPace(lap.maxSpeed));
      }

      if (interval.average_cadence) {
        lap.avgCadence = interval.average_cadence;
      }

      if (interval.average_heartrate) {
        lap.avgHr = interval.average_heartrate;
      }

      if (interval.max_heartrate) {
        lap.maxHr = interval.max_heartrate;
      }

      if (intervalsIcuActivity.device_watts && interval.average_watts) {
        lap.avgWatts = _.round(interval.average_watts);
      }

      if (lap.active && Activity.isSwim(sport) && lap.avgSpeed && lap.avgCadence) {
        lap.swolf25m = ActivityComputer.computeSwimSwolf(Movement.speedToSwimPace(lap.avgSpeed), lap.avgCadence, 25);
        lap.swolf50m = ActivityComputer.computeSwimSwolf(Movement.speedToSwimPace(lap.avgSpeed), lap.avgCadence, 50);
      }

      return lap;
    });
  }

  public getSourceStats(
    sport: ElevateSport,
    source: Partial<IntervalsIcuActivity>,
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
    }

    // Swim SWOLF when swim activity and required available
    if (Activity.isSwim(sport) && srcStats.speed.avg && source.average_cadence) {
      srcStats.scores = {} as Scores;
      srcStats.scores.swolf = {
        25: ActivityComputer.computeSwimSwolf(Movement.speedToSwimPace(srcStats.speed.avg), source.average_cadence, 25),
        50: ActivityComputer.computeSwimSwolf(Movement.speedToSwimPace(srcStats.speed.avg), source.average_cadence, 50)
      };
    }

    return srcStats;
  }

  public fetchRemoteAndMapStreams(activityId: string): Promise<Streams> {
    return this.fetchRemoteStreams(activityId).then(
      (intervalsIcuStreams: IntervalsIcuStream[]) => this.mapStreams(intervalsIcuStreams),
      (errorSyncEvent: ErrorSyncEvent) => {
        if (errorSyncEvent?.code === ErrorSyncEvent.INTERVALS_ICU_API_RESOURCE_NOT_FOUND.code) {
          this.logger.warn(`No streams found for activity "${activityId}". ${errorSyncEvent.description}`);
          return Promise.resolve(null);
        }
        return Promise.reject(errorSyncEvent);
      }
    );
  }

  public mapStreams(intervalsIcuStreams: IntervalsIcuStream[]): Streams {
    if (_.isEmpty(intervalsIcuStreams)) {
      return null;
    }

    const isFiniteNumber = (value: number) => Number.isFinite(value);
    const streams: Partial<Streams> = {};

    intervalsIcuStreams.forEach((stream: IntervalsIcuStream) => {
      if (!IntervalsIcuConnector.STREAMS_TYPES.includes(stream.type) || _.isEmpty(stream.data)) {
        return;
      }

      if (stream.type === "latlng") {
        if (_.isEmpty(stream.data2)) {
          return;
        }
        const latLng = stream.data.map((lat, index) => [lat, stream.data2[index]]);
        const filled = IntervalsIcuConnector.fillGaps(latLng, point => point.every(isFiniteNumber));
        if (filled) {
          streams.latlng = filled;
        }
        return;
      }

      const filled = IntervalsIcuConnector.fillGaps(stream.data, isFiniteNumber);
      if (filled) {
        (streams[stream.type] as number[]) = filled;
      }
    });

    // Without time stream, others streams can't be exploited
    if (!streams.time?.length) {
      return null;
    }

    // Remove "empty like" streams
    if (streams.distance?.length && _.mean(streams.distance) === 0) {
      delete streams.distance;
    }

    if (streams.velocity_smooth?.length && _.mean(streams.velocity_smooth) === 0) {
      delete streams.velocity_smooth;
    }

    return streams as Streams;
  }

  public fetchRemoteActivities(oldest: string, newest: string): Promise<IntervalsIcuActivity[]> {
    return this.intervalsIcuApiClient.get(
      this.intervalsIcuConnectorConfig.info,
      IntervalsIcuConnector.generateFetchActivitiesEndpoint(
        this.intervalsIcuConnectorConfig.info.athleteId,
        oldest,
        newest
      ),
      retryMillis => this.onTooManyRequestsRetry(retryMillis)
    );
  }

  public fetchRemoteActivity(activityId: string): Promise<IntervalsIcuActivity> {
    return this.intervalsIcuApiClient.get(
      this.intervalsIcuConnectorConfig.info,
      IntervalsIcuConnector.generateActivityEndpoint(activityId),
      retryMillis => this.onTooManyRequestsRetry(retryMillis)
    );
  }

  public fetchRemoteStreams(activityId: string): Promise<IntervalsIcuStream[]> {
    return this.intervalsIcuApiClient.get(
      this.intervalsIcuConnectorConfig.info,
      IntervalsIcuConnector.generateFetchStreamsEndpoint(activityId),
      retryMillis => this.onTooManyRequestsRetry(retryMillis)
    );
  }

  public onTooManyRequestsRetry(retryMillis: number): void {
    const retrySeconds = Math.ceil(retryMillis / 1000);
    const subscription = countdown(retrySeconds).subscribe(remainingSec => {
      if (!this.isSyncing) {
        subscription.unsubscribe();
      } else {
        this.syncEvents$.next(
          new GenericSyncEvent(
            this.type,
            `Intervals.icu rate limit reached. Resuming sync in ${remainingSec} seconds...`
          )
        );
      }
    });
  }
}
