import { BaseConnector } from "../base.connector";
import { ReplaySubject, Subject } from "rxjs";
import _ from "lodash";
import fs from "fs";
import os from "os";
import path from "path";
import moment from "moment";
import { inject, singleton } from "tsyringe";
import { AppService } from "../../app-service";
import { ConnectorConfig, GarminConnectorConfig } from "../connector-config.model";
import { IpcSyncMessageSender } from "../../senders/ipc-sync-message.sender";
import { Logger } from "../../logger";
import { WorkerService } from "../../worker-service";
import { Environment, EnvironmentToken } from "../../environments/environment.interface";
import { HttpClient } from "../../clients/http.client";
import { GarminActivitySummary, GarminApiClient, GarminRequestOptions } from "../../clients/garmin-api.client";
import { UnArchiver } from "../file/un-archiver";
import { SportsLibActivityMapper } from "../sports-lib/sports-lib-activity.mapper";
import { WorkerType } from "../../enum/worker-type.enum";
import { SportsLibWorkerParams } from "../../workers/sports-lib.worker";
import { ActivityTypes } from "@thomaschampagne/sports-lib/lib/activities/activity.types";
import { ActivityJSONInterface } from "@thomaschampagne/sports-lib/lib/activities/activity.json.interface";
import { EventJSONInterface } from "@thomaschampagne/sports-lib/lib/events/event.json.interface";
import { Movement } from "@elevate/shared/tools/movement";
import { countdown } from "@elevate/shared/tools/countdown";
import { Constant } from "@elevate/shared/constants/constant";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { SyncEvent } from "@elevate/shared/sync/events/sync.event";
import {
  Activity,
  ActivityExtras,
  ActivityStats,
  ElevationStats,
  PaceStats,
  SpeedStats
} from "@elevate/shared/models/sync/activity.model";
import { StoppedSyncEvent } from "@elevate/shared/sync/events/stopped-sync.event";
import { ErrorSyncEvent } from "@elevate/shared/sync/events/error-sync.event";
import { BareActivity } from "@elevate/shared/models/sync/bare-activity.model";
import { SyncEventType } from "@elevate/shared/sync/events/sync-event-type";
import { ActivitySyncEvent } from "@elevate/shared/sync/events/activity-sync.event";
import { ActivityComputer } from "@elevate/shared/sync/compute/activity-computer";
import { GenericSyncEvent } from "@elevate/shared/sync/events/generic-sync.event";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { StartedSyncEvent } from "@elevate/shared/sync/events/started-sync.event";

/**
 * Sync activities from Garmin Connect using the Garmin "Personal API" (user's own personal API key).
 *
 * For each activity found:
 * 1. Skip/update it if an activity already exists locally at the same time (any connector).
 * 2. Download the original activity file archive (FIT for device recorded activities), extract and parse it with
 *    sports-lib, like the File connector does.
 * 3. Activities without file (manually entered on Garmin Connect) are created from the summary, without streams.
 */
@singleton()
export class GarminConnector extends BaseConnector {
  public static readonly ENABLED: boolean = true;
  public static readonly ACTIVITIES_PER_PAGE: number = 20;

  /**
   * On "sync new activities", search from the last sync date minus this margin. Activities synced to Garmin Connect
   * late (watch synced days after the activity) are then still found. Already synced ones are skipped.
   */
  public static readonly FAST_SYNC_MARGIN_DAYS: number = 7;

  public static readonly ACTIVITY_FILE_EXTENSIONS: string[] = ["fit", "tcx", "gpx"];

  /**
   * Garmin Connect activity type keys to Elevate sports.
   * Used to apply the type chosen on Garmin Connect (which the user may have edited).
   * Unmapped keys fall back on the sport found in the activity file.
   */
  public static readonly GARMIN_TYPES_TO_ELEVATE_SPORTS_MAP: Map<string, ElevateSport> = new Map<string, ElevateSport>([
    // Running
    ["running", ElevateSport.Run],
    ["street_running", ElevateSport.Run],
    ["trail_running", ElevateSport.Run],
    ["treadmill_running", ElevateSport.Run],
    ["track_running", ElevateSport.Run],
    ["indoor_running", ElevateSport.Run],
    ["ultra_run", ElevateSport.Run],
    ["obstacle_run", ElevateSport.Run],
    ["virtual_run", ElevateSport.VirtualRun],
    // Cycling
    ["cycling", ElevateSport.Ride],
    ["road_biking", ElevateSport.Ride],
    ["gravel_cycling", ElevateSport.Ride],
    ["mountain_biking", ElevateSport.Ride],
    ["cyclocross", ElevateSport.Ride],
    ["track_cycling", ElevateSport.Ride],
    ["recumbent_cycling", ElevateSport.Ride],
    ["downhill_biking", ElevateSport.Ride],
    ["bmx", ElevateSport.Ride],
    ["indoor_cycling", ElevateSport.Ride],
    ["virtual_ride", ElevateSport.VirtualRide],
    ["e_bike_fitness", ElevateSport.EBikeRide],
    ["e_bike_mountain", ElevateSport.EBikeRide],
    ["hand_cycling", ElevateSport.Handcycle],
    ["indoor_hand_cycling", ElevateSport.Handcycle],
    // Swimming
    ["swimming", ElevateSport.Swim],
    ["lap_swimming", ElevateSport.Swim],
    ["open_water_swimming", ElevateSport.Swim],
    // Walking & hiking
    ["walking", ElevateSport.Walk],
    ["casual_walking", ElevateSport.Walk],
    ["speed_walking", ElevateSport.Walk],
    ["hiking", ElevateSport.Hike],
    ["mountaineering", ElevateSport.Mountaineering],
    // Gym & fitness
    ["strength_training", ElevateSport.WeightTraining],
    ["cardio_training", ElevateSport.Cardio],
    ["hiit", ElevateSport.Workout],
    ["fitness_equipment", ElevateSport.Workout],
    ["elliptical", ElevateSport.Elliptical],
    ["stair_climbing", ElevateSport.StairStepper],
    ["indoor_rowing", ElevateSport.Rowing],
    ["rowing", ElevateSport.Rowing],
    ["yoga", ElevateSport.Yoga],
    ["pilates", ElevateSport.Yoga],
    // Winter sports
    ["resort_skiing_snowboarding_ws", ElevateSport.AlpineSki],
    ["resort_skiing", ElevateSport.AlpineSki],
    ["resort_snowboarding", ElevateSport.Snowboard],
    ["backcountry_skiing_snowboarding_ws", ElevateSport.BackcountrySki],
    ["backcountry_skiing", ElevateSport.BackcountrySki],
    ["cross_country_skiing_ws", ElevateSport.NordicSki],
    ["skate_skiing_ws", ElevateSport.NordicSki],
    ["snow_shoe_ws", ElevateSport.Snowshoe],
    // Water sports
    ["stand_up_paddleboarding", ElevateSport.StandUpPaddling],
    ["kayaking", ElevateSport.Kayaking],
    ["surfing", ElevateSport.Surfing],
    ["kiteboarding", ElevateSport.Kitesurf],
    ["windsurfing", ElevateSport.Windsurf],
    ["sailing", ElevateSport.Sailing],
    ["wakeboarding", ElevateSport.Wakeboarding],
    // Others
    ["golf", ElevateSport.Golf],
    ["tennis", ElevateSport.Tennis],
    ["rock_climbing", ElevateSport.RockClimbing],
    ["bouldering", ElevateSport.RockClimbing],
    ["indoor_climbing", ElevateSport.Climbing],
    ["inline_skating", ElevateSport.InlineSkate]
  ]);

  public garminConnectorConfig: GarminConnectorConfig;

  constructor(
    @inject(AppService) protected readonly appService: AppService,
    @inject(EnvironmentToken) protected readonly environment: Environment,
    @inject(IpcSyncMessageSender) protected readonly ipcSyncMessageSender: IpcSyncMessageSender,
    @inject(GarminApiClient) public readonly garminApiClient: GarminApiClient,
    @inject(UnArchiver) public readonly unArchiver: UnArchiver,
    @inject(SportsLibActivityMapper) public readonly sportsLibActivityMapper: SportsLibActivityMapper,
    @inject(WorkerService) protected readonly workerService: WorkerService,
    @inject(HttpClient) protected readonly httpClient: HttpClient,
    @inject(Logger) protected readonly logger: Logger
  ) {
    super(appService, environment, ipcSyncMessageSender, workerService, httpClient, logger);
    this.type = ConnectorType.GARMIN;
    this.enabled = GarminConnector.ENABLED;
  }

  /**
   * Parse a Garmin "YYYY-MM-DD HH:mm:ss" GMT date (or ISO date) into a Date
   */
  public static parseGmtDate(gmtDate: string): Date {
    if (!gmtDate) {
      return null;
    }
    const parsed = moment.utc(gmtDate, ["YYYY-MM-DD HH:mm:ss", "YYYY-MM-DD HH:mm:ss.S", moment.ISO_8601], true);
    return parsed.isValid() ? parsed.toDate() : null;
  }

  public static resolveElevateSport(garminSummary: Partial<GarminActivitySummary>): ElevateSport {
    const typeKey = garminSummary?.activityType?.typeKey;
    return typeKey ? GarminConnector.GARMIN_TYPES_TO_ELEVATE_SPORTS_MAP.get(typeKey) || null : null;
  }

  public configure(connectorConfig: ConnectorConfig): this {
    super.configure(connectorConfig);
    this.garminConnectorConfig = this.connectorConfig as GarminConnectorConfig;
    return this;
  }

  public sync(): Subject<SyncEvent> {
    if (this.isSyncing) {
      this.syncEvents$.next(ErrorSyncEvent.SYNC_ALREADY_STARTED.create(ConnectorType.GARMIN));
    } else {
      this.syncEvents$ = new ReplaySubject<SyncEvent>();
      this.syncEvents$.next(new StartedSyncEvent(ConnectorType.GARMIN));
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

  public getSearchStartDate(): Date {
    return Number.isFinite(this.syncFromDateTime)
      ? moment.utc(this.syncFromDateTime).subtract(GarminConnector.FAST_SYNC_MARGIN_DAYS, "days").toDate()
      : null;
  }

  public getRequestOptions(): GarminRequestOptions {
    return {
      onQuotaReachedRetry: retryMillis => this.onQuotaReachedRetry(retryMillis),
      shouldStop: () => this.stopRequested
    };
  }

  public syncPages(
    syncEvents$: Subject<SyncEvent>,
    start = 0,
    perPage: number = GarminConnector.ACTIVITIES_PER_PAGE,
    previousPageFirstId: number = null
  ): Promise<void> {
    if (this.stopRequested) {
      return Promise.reject(new StoppedSyncEvent(this.type));
    }

    syncEvents$.next(new GenericSyncEvent(this.type, `Scanning ${start + perPage} activities...`));

    const searchStartDate = this.getSearchStartDate();

    return this.garminApiClient
      .searchActivities(
        this.garminConnectorConfig.info.apiKey,
        start,
        perPage,
        searchStartDate,
        this.getRequestOptions()
      )
      .then((summaries: GarminActivitySummary[]) => {
        if (summaries.length === 0) {
          return Promise.resolve();
        }

        // Guard: same page served again means paging is not honored, stop here
        if (previousPageFirstId !== null && summaries[0].activityId === previousPageFirstId) {
          this.logger.warn(`Garmin returned the same activities page twice (start=${start}). Stopping scan.`);
          return Promise.resolve();
        }

        // Activities are listed newest first: keep those in the searched period (in case the date filter is ignored)
        const inPeriodSummaries = searchStartDate
          ? summaries.filter(summary => {
              const startDate = GarminConnector.parseGmtDate(summary.startTimeGMT);
              return !startDate || startDate.getTime() >= searchStartDate.getTime();
            })
          : summaries;

        const reachedPeriodStart = inPeriodSummaries.length < summaries.length;

        return this.processActivitySummaries(syncEvents$, inPeriodSummaries).then(() => {
          // A partial page means we reached the end of the activities list
          if (summaries.length < perPage || reachedPeriodStart) {
            return Promise.resolve();
          }
          return this.syncPages(syncEvents$, start + perPage, perPage, summaries[0].activityId);
        });
      });
  }

  public processActivitySummaries(syncEvents$: Subject<SyncEvent>, summaries: GarminActivitySummary[]): Promise<void> {
    return summaries.reduce((previousPromise: Promise<void>, summary: GarminActivitySummary) => {
      return previousPromise.then(() => {
        if (this.stopRequested) {
          return Promise.reject(new StoppedSyncEvent(this.type));
        }
        return this.processActivitySummary(syncEvents$, summary);
      });
    }, Promise.resolve());
  }

  public processActivitySummary(syncEvents$: Subject<SyncEvent>, summary: GarminActivitySummary): Promise<void> {
    const bareActivity = this.prepareBareActivity(summary);

    if (!bareActivity) {
      this.logger.warn(`Skipping Garmin activity ${summary?.activityId}: missing or invalid start time`, summary);
      return Promise.resolve();
    }

    return this.findLocalActivities(bareActivity.startTime, bareActivity.endTime).then(
      (localActivities: Activity[]) => {
        if (_.isEmpty(localActivities) || this.environment.allowActivitiesOverLapping) {
          return this.importNewActivity(syncEvents$, summary, bareActivity);
        }

        if (localActivities.length === 1) {
          return this.updateExistingActivity(syncEvents$, summary, bareActivity, localActivities[0]);
        }

        // Multisport activity (e.g. triathlon) already synced as several activities from this Garmin activity
        const allFromThisGarminActivity = localActivities.every(
          activity => activity.extras?.garmin?.activityId === summary.activityId
        );
        if (allFromThisGarminActivity) {
          return Promise.resolve();
        }

        // More than 1 activity found at this time
        const activitiesFound = localActivities.map(
          (activity: Activity) =>
            `<${activity.name} from ${moment(activity.startTime).format("LLL")} to ${moment(activity.endTime).format(
              "LLL"
            )}>`
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

        return Promise.resolve();
      }
    );
  }

  /**
   * Build the bare activity used to search for existing local activities, from the Garmin summary
   */
  public prepareBareActivity(summary: GarminActivitySummary): BareActivity {
    const startDate = GarminConnector.parseGmtDate(summary?.startTimeGMT);
    if (!startDate) {
      return null;
    }

    const durationSeconds = Math.round(summary.elapsedDuration || summary.duration || 0);
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = startTimestamp + durationSeconds;

    const bareActivity: BareActivity = new BareActivity();
    bareActivity.id = summary.activityId;
    bareActivity.name = summary.activityName || null;
    bareActivity.type = GarminConnector.resolveElevateSport(summary) || ElevateSport.Other;
    bareActivity.startTime = new Date(startTimestamp * 1000).toISOString();
    bareActivity.endTime = new Date(endTimestamp * 1000).toISOString();
    bareActivity.startTimestamp = startTimestamp;
    bareActivity.endTimestamp = endTimestamp;
    bareActivity.hasPowerMeter = false;
    bareActivity.trainer = false;
    bareActivity.commute = null;
    bareActivity.manual = !!summary.manualActivity;
    return bareActivity;
  }

  public importNewActivity(
    syncEvents$: Subject<SyncEvent>,
    summary: GarminActivitySummary,
    bareActivity: BareActivity
  ): Promise<void> {
    let workDir: string = null;

    return Promise.resolve()
      .then(() => {
        // Manual activities entered on Garmin Connect have no file: skip the download
        if (summary.manualActivity) {
          return null;
        }
        workDir = this.createWorkDir(summary.activityId);
        return this.fetchActivityFile(summary.activityId, workDir);
      })
      .then(activityFilePath => {
        if (!activityFilePath) {
          // No file attached (e.g. manual activity entered on Garmin Connect): build from summary only
          return [this.buildActivityFromSummary(summary, bareActivity)];
        }

        return this.parseActivityFile(activityFilePath).then(sportsLibActivities =>
          sportsLibActivities.map(sportsLibActivity =>
            this.buildActivityFromFile(summary, sportsLibActivity, sportsLibActivities.length)
          )
        );
      })
      .then((builds: Array<{ activity: Partial<Activity>; streams: Streams }>) => {
        return builds.reduce((previous: Promise<void>, build) => {
          return previous.then(() => this.computeAndNotify(syncEvents$, build.activity, build.streams, bareActivity));
        }, Promise.resolve());
      })
      .catch(error => {
        // Errors stopping the whole sync (auth, quota, connection, stop requested...)
        if (this.isSyncBreakingError(error)) {
          return Promise.reject(error);
        }

        // Errors specific to this activity: notify and continue with next one
        this.logger.error(`Unable to import Garmin activity ${summary.activityId}: ${error?.description || error}`);
        syncEvents$.next(this.toActivityErrorEvent(error, bareActivity));
        return Promise.resolve();
      })
      .finally(() => this.removeWorkDir(workDir));
  }

  public buildActivityFromFile(
    summary: GarminActivitySummary,
    sportsLibActivity: ActivityJSONInterface,
    activitiesInFile: number
  ): { activity: Partial<Activity>; streams: Streams } {
    const isSingleActivityFile = activitiesInFile === 1;

    // Prefer sport type from Garmin Connect (user may have edited it) unless file is a multisport one
    const garminSport = isSingleActivityFile ? GarminConnector.resolveElevateSport(summary) : null;
    const elevateSportResult = garminSport
      ? { type: garminSport, autoDetected: false }
      : this.sportsLibActivityMapper.convertToElevateSport(sportsLibActivity);

    let activity: Partial<Activity> = this.sportsLibActivityMapper.createBareActivity(
      sportsLibActivity,
      elevateSportResult
    );

    if (summary.activityName) {
      activity.name = isSingleActivityFile ? summary.activityName : `${summary.activityName} - ${activity.type}`;
    }

    const streams = this.sportsLibActivityMapper.mapStreams(sportsLibActivity);

    activity = this.assignBaseProperties(activity, streams);
    activity.extras = { garmin: { activityId: summary.activityId } } as ActivityExtras;
    activity.srcStats = this.sportsLibActivityMapper.getSourceStats(activity.type, sportsLibActivity, streams);
    activity.laps = this.sportsLibActivityMapper.processLaps(activity.type, sportsLibActivity.laps);
    activity.device = sportsLibActivity.creator?.name?.match(/unknown/i)
      ? null
      : sportsLibActivity.creator?.name || null;
    activity.notes = summary.description || null;

    return { activity: activity, streams: streams };
  }

  public buildActivityFromSummary(
    summary: GarminActivitySummary,
    bareActivity: BareActivity
  ): { activity: Partial<Activity>; streams: Streams } {
    let activity: Partial<Activity> = _.cloneDeep(bareActivity);
    delete activity.id; // Garmin id is tracked in extras. Elevate generates its own id
    activity.name = summary.activityName || `${activity.type}`;
    activity.manual = true;

    activity = this.assignBaseProperties(activity, null);
    activity.extras = { garmin: { activityId: summary.activityId } } as ActivityExtras;
    activity.srcStats = this.getSourceStats(activity.type, summary, null);
    activity.laps = null;
    activity.device = null;
    activity.notes = summary.description || null;

    return { activity: activity, streams: null };
  }

  public computeAndNotify(
    syncEvents$: Subject<SyncEvent>,
    activity: Partial<Activity>,
    streams: Streams,
    bareActivity: BareActivity
  ): Promise<void> {
    const athleteSnapshot = this.athleteSnapshotResolver.resolve(activity.startTime);

    return this.computeActivity(activity, athleteSnapshot, this.connectorConfig.userSettings, streams, true)
      .then(results => {
        const { computedActivity, deflatedStreams } = results;
        syncEvents$.next(new ActivitySyncEvent(this.type, null, computedActivity, true, deflatedStreams));
        return Promise.resolve();
      })
      .catch(error => {
        const errorSyncEvent =
          error instanceof Error
            ? ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(this.type, error.message, bareActivity, error)
            : ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(this.type, `${error}`, bareActivity);
        syncEvents$.next(errorSyncEvent);
        return Promise.resolve(); // Continue to next activity
      });
  }

  public updateExistingActivity(
    syncEvents$: Subject<SyncEvent>,
    summary: GarminActivitySummary,
    bareActivity: BareActivity,
    localActivity: Activity
  ): Promise<void> {
    if (!this.garminConnectorConfig.info.updateExistingNamesTypes) {
      return Promise.resolve();
    }

    // Track Garmin reference on existing activity
    localActivity.extras = _.merge<ActivityExtras, ActivityExtras>(localActivity.extras || {}, {
      garmin: { activityId: summary.activityId }
    });

    if (summary.activityName) {
      localActivity.name = summary.activityName;
    }

    const garminSport = GarminConnector.resolveElevateSport(summary);
    const hasTypeChanged = !!garminSport && garminSport !== localActivity.type;

    if (!hasTypeChanged) {
      syncEvents$.next(new ActivitySyncEvent(this.type, null, localActivity, false));
      return Promise.resolve();
    }

    // Type changed: drop source stats (they depend on sport, e.g. moving time thresholds) and recompute
    localActivity.type = garminSport;
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
        const activityToNotify = results ? results.computedActivity : localActivity;
        if (results) {
          this.logger.info(`Recalculated activity ${localActivity.id} after type change to ${localActivity.type}`);
        }
        syncEvents$.next(new ActivitySyncEvent(this.type, null, activityToNotify, false));
        return Promise.resolve();
      });
    });
  }

  /**
   * Download and extract activity archive into work dir
   * @return path of the activity file found, or null when Garmin holds no file for this activity
   */
  public fetchActivityFile(activityId: number, workDir: string): Promise<string> {
    return this.garminApiClient
      .downloadActivityArchive(this.garminConnectorConfig.info.apiKey, activityId, this.getRequestOptions())
      .then(archive => {
        if (!archive || archive.length === 0) {
          return Promise.resolve(null);
        }

        const archivePath = path.join(workDir, `${activityId}.zip`);
        this.getFs().writeFileSync(archivePath, archive);

        const extractDir = path.join(workDir, "extracted");
        this.getFs().mkdirSync(extractDir, { recursive: true });

        return this.unArchiver.unpack(archivePath, extractDir).then(() => {
          const activityFiles = this.findActivityFiles(extractDir);
          if (activityFiles.length > 1) {
            this.logger.warn(`Garmin activity ${activityId} archive holds ${activityFiles.length} files. Using first.`);
          }
          return Promise.resolve(activityFiles[0] || null);
        });
      })
      .catch(error => {
        if (error?.code === ErrorSyncEvent.GARMIN_API_RESOURCE_NOT_FOUND.code) {
          this.logger.info(`No file available on Garmin for activity ${activityId}`);
          return Promise.resolve(null);
        }
        return Promise.reject(error);
      });
  }

  public findActivityFiles(directory: string): string[] {
    const files: string[] = [];
    this.getFs()
      .readdirSync(directory)
      .forEach(entry => {
        const absolutePath = path.join(directory, entry);
        if (this.getFs().statSync(absolutePath).isDirectory()) {
          files.push(...this.findActivityFiles(absolutePath));
        } else if (GarminConnector.ACTIVITY_FILE_EXTENSIONS.includes(path.extname(entry).slice(1).toLowerCase())) {
          files.push(absolutePath);
        }
      });
    // Prefer FIT files (richest data) when several formats exist
    return _.sortBy(files, file => (path.extname(file).toLowerCase() === ".fit" ? 0 : 1));
  }

  public parseActivityFile(activityFilePath: string): Promise<ActivityJSONInterface[]> {
    return this.workerService
      .exec<SportsLibWorkerParams, { event: EventJSONInterface; logsInfo: string[] }>(WorkerType.SPORTS_LIB, {
        path: activityFilePath
      })
      .then(result => {
        result.logsInfo?.forEach(log => this.logger.info(log));
        // Skip transitions activities (e.g. between swim and bike on triathlon)
        const activities = (result.event?.activities || []).filter(
          activity => activity && activity.type !== ActivityTypes.Transition
        );
        return Promise.resolve(activities);
      });
  }

  /**
   * Source stats for activities built from Garmin summary only (without activity file)
   */
  public getSourceStats(
    sport: ElevateSport,
    source: Partial<GarminActivitySummary>,
    streams: Streams
  ): Partial<ActivityStats> {
    const srcStats: Partial<ActivityStats> = {
      speed: {} as SpeedStats,
      pace: {} as PaceStats,
      elevation: {} as ElevationStats
    };

    srcStats.elapsedTime = source.elapsedDuration || source.duration || null;
    srcStats.movingTime = source.movingDuration || srcStats.elapsedTime || null;
    srcStats.pauseTime =
      srcStats.movingTime && srcStats.elapsedTime ? Math.max(srcStats.elapsedTime - srcStats.movingTime, 0) : null;
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
        srcStats.elapsedTime > 0
          ? _.round((srcStats.calories / srcStats.elapsedTime) * Constant.SEC_HOUR_FACTOR, ActivityComputer.RND)
          : null;
    }

    if (source.elevationGain > 0) {
      srcStats.elevation.ascent = _.round(source.elevationGain);
      srcStats.elevationGain = srcStats.elevation.ascent;
    }

    if (source.elevationLoss > 0) {
      srcStats.elevation.descent = _.round(source.elevationLoss);
    }

    if (source.averageSpeed > 0) {
      srcStats.speed.avg = _.round(source.averageSpeed * Constant.MPS_KPH_FACTOR, ActivityComputer.RND);
      srcStats.pace.avg = Movement.speedToPace(srcStats.speed.avg);
    }

    if (source.maxSpeed > 0) {
      srcStats.speed.max = _.round(source.maxSpeed * Constant.MPS_KPH_FACTOR, ActivityComputer.RND);
    }

    return srcStats;
  }

  public isSyncBreakingError(error: any): boolean {
    if (error?.type === SyncEventType.STOPPED) {
      return true;
    }
    // Per activity issues (403, 404, 5xx, timeouts, broken files...) are notified and the sync continues
    const breakingCodes = [
      ErrorSyncEvent.GARMIN_API_UNAUTHORIZED.code,
      ErrorSyncEvent.GARMIN_API_QUOTA_REACHED.code,
      ErrorSyncEvent.UNHANDLED_ERROR_SYNC.code // Garmin unreachable
    ];
    return error?.type === SyncEventType.ERROR && breakingCodes.includes(error.code);
  }

  public toActivityErrorEvent(error: any, bareActivity: BareActivity): ErrorSyncEvent {
    const activityInError = _.cloneDeep(bareActivity) as BareActivity & { extras: ActivityExtras };
    activityInError.extras = { garmin: { activityId: bareActivity.id as number } };

    if (error?.type === SyncEventType.ERROR) {
      (error as ErrorSyncEvent).activity = activityInError;
      return error as ErrorSyncEvent;
    }

    const description = `Unable to import Garmin activity "${bareActivity.name}" of ${moment(
      bareActivity.startTime
    ).format("LLL")}`;

    return ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(
      this.type,
      description,
      activityInError,
      error instanceof Error ? error : new Error(`${error}`)
    );
  }

  public createWorkDir(activityId: number): string {
    return this.getFs().mkdtempSync(path.join(this.getTempRoot(), `elevate-garmin-${activityId}-`));
  }

  public removeWorkDir(workDir: string): void {
    try {
      if (workDir && this.getFs().existsSync(workDir)) {
        this.getFs().rmSync(workDir, { recursive: true, force: true });
      }
    } catch (err) {
      this.logger.warn(`Unable to remove temporary folder ${workDir}`, err);
    }
  }

  public onQuotaReachedRetry(retryMillis: number): void {
    const subscription = countdown(Math.round(retryMillis / 1000)).subscribe(remainingSec => {
      if (!this.isSyncing) {
        subscription.unsubscribe();
      } else {
        this.syncEvents$.next(
          new GenericSyncEvent(
            this.type,
            `Garmin wants you to slow down...🐌 Resuming sync in ${remainingSec} seconds...`
          )
        );
      }
    });
  }

  public getTempRoot(): string {
    return os.tmpdir();
  }

  public getFs(): typeof fs {
    return fs;
  }
}
