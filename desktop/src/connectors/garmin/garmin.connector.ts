import { BaseConnector } from "../base.connector";
import { ReplaySubject, Subject } from "rxjs";
import { AppService } from "../../app-service";
import { inject, singleton } from "tsyringe";
import { GarminConnectorConfig } from "../connector-config.model";
import { IpcSyncMessageSender } from "../../senders/ipc-sync-message.sender";
import { Logger } from "../../logger";
import { WorkerService } from "../../worker-service";
import { Environment, EnvironmentToken } from "../../environments/environment.interface";
import { HttpClient } from "../../clients/http.client";
import fs from "fs";
import os from "os";
import path from "path";
import _ from "lodash";
import { FileConnector } from "../file/file.connector";
import { GarminConnectClient, GarminActivitySummary } from "./garmin-connect.client";
import { ActivityFile } from "../file/activity-file.model";
import { SportsLibWorkerParams } from "../../workers/sports-lib.worker";
import { WorkerType } from "../../enum/worker-type.enum";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { SyncEvent } from "@elevate/shared/sync/events/sync.event";
import { Activity, ActivityExtras, ActivityStats } from "@elevate/shared/models/sync/activity.model";
import { StoppedSyncEvent } from "@elevate/shared/sync/events/stopped-sync.event";
import { GenericSyncEvent } from "@elevate/shared/sync/events/generic-sync.event";
import { StartedSyncEvent } from "@elevate/shared/sync/events/started-sync.event";
import { ActivitySyncEvent } from "@elevate/shared/sync/events/activity-sync.event";
import { ErrorSyncEvent } from "@elevate/shared/sync/events/error-sync.event";
import { SyncEventType } from "@elevate/shared/sync/events/sync-event-type";
import { ActivityFileType } from "@elevate/shared/sync/connectors/activity-file-type.enum";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { ActivityJSONInterface } from "@thomaschampagne/sports-lib/lib/activities/activity.json.interface";
import { EventJSONInterface } from "@thomaschampagne/sports-lib/lib/events/event.json.interface";

/**
 * Connector syncing activities from a Garmin Connect account.
 *
 * Strategy: Garmin Connect has no public OAuth application flow. We therefore
 * authenticate once with the user credentials (in the electron main process),
 * persist the resulting OAuth tokens, then for every sync we:
 *   1. restore the session from tokens
 *   2. list activities (paged, most recent first) filtered by the "sync from" date
 *   3. download the original FIT file of each new activity (a zip wrapping the .fit)
 *   4. reuse the exact same "sports-lib" pipeline as the FileConnector to compute
 *      and store the activity locally.
 */
@singleton()
export class GarminConnector extends BaseConnector {
  public static readonly ENABLED: boolean = true;
  private static readonly SLEEP_TIME_BETWEEN_ACTIVITY: number = 5;

  public garminConnectorConfig: GarminConnectorConfig;

  /**
   * True when the current sync is incremental ("sync new"): in that case Garmin returns
   * activities most-recent-first, so we stop as soon as we reach an already-synced activity.
   */
  public incrementalSync: boolean;

  /**
   * Set to true once an already-synced activity is reached during an incremental sync.
   * Every remaining (older) activity is then known to be already synced and is skipped.
   */
  public caughtUp: boolean;

  constructor(
    @inject(AppService) protected readonly appService: AppService,
    @inject(EnvironmentToken) protected readonly environment: Environment,
    @inject(IpcSyncMessageSender) protected readonly ipcSyncMessageSender: IpcSyncMessageSender,
    @inject(WorkerService) protected readonly workerService: WorkerService,
    @inject(HttpClient) protected readonly httpClient: HttpClient,
    @inject(Logger) protected readonly logger: Logger,
    @inject(FileConnector) public readonly fileConnector: FileConnector,
    @inject(GarminConnectClient) public readonly garminConnectClient: GarminConnectClient
  ) {
    super(appService, environment, ipcSyncMessageSender, workerService, httpClient, logger);
    this.type = ConnectorType.GARMIN;
    this.enabled = GarminConnector.ENABLED;
  }

  public configure(garminConnectorConfig: GarminConnectorConfig): this {
    super.configure(garminConnectorConfig);
    this.garminConnectorConfig = garminConnectorConfig;
    // A "sync from" date time means we only want activities newer than the last sync ("sync new").
    this.incrementalSync = Number.isFinite(this.syncFromDateTime);
    this.caughtUp = false;
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

      this.syncGarminActivities(this.syncEvents$).then(
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

  /**
   * Restore the Garmin session from persisted tokens (password is never stored).
   */
  private ensureSession(): void {
    if (this.garminConnectClient.isAuthenticated()) {
      return;
    }

    const info = this.garminConnectorConfig.info;
    if (!info || !info.oauth1Token || !info.oauth2Token) {
      throw ErrorSyncEvent.UNHANDLED_ERROR_SYNC.create(
        ConnectorType.GARMIN,
        "Garmin Connect is not linked. Please connect your Garmin account first."
      );
    }

    this.garminConnectClient.restore(info.oauth1Token, info.oauth2Token);
  }

  private syncGarminActivities(syncEvents$: Subject<SyncEvent>): Promise<void> {
    return Promise.resolve()
      .then(() => {
        this.ensureSession();
        syncEvents$.next(new GenericSyncEvent(ConnectorType.GARMIN, "Listing Garmin Connect activities..."));
        return this.listActivitiesToSync();
      })
      .then((activities: GarminActivitySummary[]) => {
        this.logger.info(`Found ${activities.length} Garmin activities to sync.`);
        syncEvents$.next(new GenericSyncEvent(ConnectorType.GARMIN, `Found ${activities.length} activities to sync.`));

        const downloadDir = path.join(os.tmpdir(), `elevate-garmin-${Date.now()}`);

        return activities
          .reduce(
            (previousPromise: Promise<void>, activity: GarminActivitySummary) =>
              previousPromise.then(() => this.syncNextActivity(activity, downloadDir, syncEvents$)),
            Promise.resolve()
          )
          .then(() => this.cleanupDirectory(downloadDir));
      });
  }

  /**
   * Handle the sync loop step for a single activity: stop requested, incremental
   * "caught up" short-circuit, then delegate to the actual activity sync.
   */
  private syncNextActivity(
    activity: GarminActivitySummary,
    downloadDir: string,
    syncEvents$: Subject<SyncEvent>
  ): Promise<void> {
    if (this.stopRequested) {
      return Promise.reject(new StoppedSyncEvent(ConnectorType.GARMIN));
    }

    // On an incremental sync, Garmin returns activities most-recent-first: as soon
    // as we reach an already-synced activity, every older one is synced too. Stop.
    if (this.incrementalSync && this.caughtUp) {
      this.logger.info("Reached already synced Garmin activities. Stopping incremental sync.");
      syncEvents$.next(new GenericSyncEvent(ConnectorType.GARMIN, "Reached already synced activities. Stopping sync."));
      return Promise.resolve();
    }

    return this.syncActivity(activity, downloadDir, syncEvents$).then(alreadyExisted => {
      // Remember we hit an already-synced activity so the next iteration can stop.
      if (alreadyExisted) {
        this.caughtUp = true;
      }
      return this.wait();
    });
  }

  /**
   * Page through Garmin activities (most recent first) and stop as soon as we
   * reach activities older than the configured "sync from" date.
   */
  private listActivitiesToSync(): Promise<GarminActivitySummary[]> {
    const syncFromDateTime = this.syncFromDateTime;
    const perPage = GarminConnectClient.ACTIVITIES_PER_PAGE;

    const collected: GarminActivitySummary[] = [];

    const fetchPage = (start: number): Promise<GarminActivitySummary[]> => {
      return this.garminConnectClient.listActivities(start, perPage).then(page => {
        if (!page || page.length === 0) {
          return collected;
        }

        for (const activity of page) {
          const activityTime = this.activityStartTime(activity);

          // Activities are ordered most recent first: stop paging once older than sync date
          if (syncFromDateTime && activityTime && activityTime < syncFromDateTime) {
            return collected;
          }
          collected.push(activity);
        }

        // A partial page means we reached the end
        if (page.length < perPage) {
          return collected;
        }

        return fetchPage(start + perPage);
      });
    };

    return fetchPage(0);
  }

  private activityStartTime(activity: GarminActivitySummary): number | null {
    if (_.isNumber(activity.beginTimestamp) && activity.beginTimestamp > 0) {
      return activity.beginTimestamp;
    }
    const parsed = activity.startTimeGMT ? Date.parse(`${activity.startTimeGMT} UTC`) : NaN;
    return Number.isNaN(parsed) ? null : parsed;
  }

  /**
   * Sync a single Garmin activity.
   *
   * Existence is checked from the (cheap) Garmin activity metadata *before* downloading
   * the original FIT file, so an already-synced activity is never re-downloaded.
   *
   * @returns a promise resolving to `true` when the activity already existed locally
   *          (nothing downloaded), `false` when it has been freshly synced.
   */
  private syncActivity(
    activity: GarminActivitySummary,
    downloadDir: string,
    syncEvents$: Subject<SyncEvent>
  ): Promise<boolean> {
    this.logger.debug(`Syncing Garmin activity id: ${activity.activityId}`);

    // Check existence from metadata first to avoid a useless FIT download.
    return this.activityAlreadyExists(activity).then((alreadyExisted: boolean) => {
      if (alreadyExisted) {
        this.logger.debug(`Garmin activity id ${activity.activityId} already exists locally. Skipping download.`);
        return Promise.resolve(true);
      }

      syncEvents$.next(
        new GenericSyncEvent(ConnectorType.GARMIN, `Downloading activity "${activity.activityName}"...`)
      );

      return this.downloadAndProcessActivity(activity, downloadDir, syncEvents$).then(() => Promise.resolve(false));
    });
  }

  /**
   * Download the original FIT file of a Garmin activity and process it through the
   * sports-lib pipeline. Never rejects: failures are reported as sync error events.
   */
  private downloadAndProcessActivity(
    activity: GarminActivitySummary,
    downloadDir: string,
    syncEvents$: Subject<SyncEvent>
  ): Promise<void> {
    return this.garminConnectClient
      .downloadOriginalActivityData(activity.activityId, downloadDir)
      .then(zipPath => this.extractFitFromZip(zipPath, downloadDir))
      .then((fitPath: string | null) => {
        if (!fitPath) {
          this.logger.warn(`No FIT file found for Garmin activity ${activity.activityId}. Skipping.`);
          return Promise.resolve();
        }

        const activityFile = new ActivityFile(ActivityFileType.FIT, fitPath, new Date(activity.beginTimestamp));

        return this.computeSportsLibEvent(activityFile).then((result: { event: EventJSONInterface }) => {
          return result.event.activities.reduce(
            (previousActivityProcessed: Promise<void>, sportsLibActivity: ActivityJSONInterface) =>
              previousActivityProcessed.then(() =>
                this.processActivity(activity.activityId, sportsLibActivity, activityFile, syncEvents$)
              ),
            Promise.resolve()
          );
        });
      })
      .then(() => this.cleanupDirectory(path.join(downloadDir, String(activity.activityId))))
      .catch(error => {
        this.reportActivitySyncError(activity, error, syncEvents$);
        return Promise.resolve();
      });
  }

  /**
   * Report a Garmin activity sync failure through the sync events stream.
   */
  private reportActivitySyncError(
    activity: GarminActivitySummary,
    error: Error | SyncEvent,
    syncEvents$: Subject<SyncEvent>
  ): void {
    this.logger.error(error);

    if ("type" in error && error.type === SyncEventType.ERROR) {
      syncEvents$.next(error);
    } else {
      syncEvents$.next(
        ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(
          ConnectorType.GARMIN,
          `Unable to sync Garmin activity "${activity.activityName}" (id ${activity.activityId})`,
          null,
          error instanceof Error ? error : null
        )
      );
    }
  }

  /**
   * Cheap existence check based on Garmin activity metadata (start time + duration),
   * performed before downloading the original FIT file. Reuses the same time-overlap
   * query as the FileConnector/Strava connectors.
   */
  private activityAlreadyExists(activity: GarminActivitySummary): Promise<boolean> {
    const startMs = this.activityStartTime(activity);

    if (startMs === null) {
      // Without a reliable start time we cannot check cheaply: assume it does not exist
      // and let the precise check (after download) decide.
      return Promise.resolve(false);
    }

    const durationMs = _.isNumber(activity.duration) && activity.duration > 0 ? activity.duration * 1000 : 0;
    const startDate = new Date(startMs);
    const endDate = new Date(startMs + durationMs);

    return this.findLocalActivities(startDate.toISOString(), endDate.toISOString()).then(
      (localActivities: Activity[]) => {
        return !_.isEmpty(localActivities) && !this.environment.allowActivitiesOverLapping;
      }
    );
  }

  /**
   * Compute a single sports-lib activity into an Elevate Activity, reusing the
   * FileConnector conversion helpers, and notify the sync event.
   */
  private processActivity(
    garminActivityId: number,
    sportsLibActivity: ActivityJSONInterface,
    activityFile: ActivityFile,
    syncEvents$: Subject<SyncEvent>
  ): Promise<void> {
    // Skip transition activities (e.g. swim -> bike for a triathlon)
    if (sportsLibActivity && (sportsLibActivity.type as unknown) === "transition") {
      return Promise.resolve();
    }

    const startDate = new Date(sportsLibActivity.startDate);
    const endDate = new Date(sportsLibActivity.endDate);

    return this.findLocalActivities(startDate.toISOString(), endDate.toISOString()).then(
      (localActivities: Activity[]) => {
        if (!_.isEmpty(localActivities) && !this.environment.allowActivitiesOverLapping) {
          if (_.isArray(localActivities) && localActivities.length === 1) {
            syncEvents$.next(new ActivitySyncEvent(ConnectorType.GARMIN, null, localActivities[0], false));
          } else {
            this.logger.debug(
              `Garmin activity starting at ${startDate.toISOString()} already exists locally. Skipping.`
            );
          }
          return this.wait();
        }

        // Create bare activity from "sports-lib" activity (reuse FileConnector logic)
        let activity: Partial<Activity> = this.fileConnector.createBareActivity(sportsLibActivity);

        // Extract streams
        const streams: Streams = this.fileConnector.mapStreams(sportsLibActivity);

        // Set common activity properties
        activity = this.assignBaseProperties(activity, streams);

        // Keep tracking of the Garmin source activity
        activity.extras = {
          garmin: {
            activityId: garminActivityId
          }
        } as ActivityExtras;

        // Resolve athlete snapshot for current activity date
        const athleteSnapshot = this.athleteSnapshotResolver.resolve(activity.startTime);

        // Fetch source stats coming from the FIT file (overrides computed stats)
        activity.srcStats = this.fileConnector.getSourceStats(
          activity.type as ElevateSport,
          sportsLibActivity,
          streams
        ) as ActivityStats;

        // Process laps
        activity.laps = this.fileConnector.processLaps(activity.type as ElevateSport, sportsLibActivity.laps);

        // Fetch device name if any
        activity.device = this.fileConnector.fetchAndHandleDeviceName(activityFile, sportsLibActivity.creator);

        // Set comment to null at the moment
        activity.notes = null;

        // Compute activity
        return this.computeActivity(activity, athleteSnapshot, this.garminConnectorConfig.userSettings, streams, true)
          .then(results => {
            const { computedActivity, deflatedStreams } = results;

            syncEvents$.next(
              new ActivitySyncEvent(ConnectorType.GARMIN, null, computedActivity, true, deflatedStreams)
            );

            return this.wait();
          })
          .catch(error => {
            this.logger.error(error);
            return Promise.reject(
              ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(
                ConnectorType.GARMIN,
                `Unable to compute Garmin activity "${activity.name}"`,
                activity as Activity,
                error
              )
            );
          });
      }
    );
  }

  /**
   * Reuse the sports-lib worker used by the FileConnector to parse the FIT file.
   */
  public computeSportsLibEvent(activityFile: ActivityFile): Promise<{ event: EventJSONInterface }> {
    return this.workerService.exec<SportsLibWorkerParams, { event: EventJSONInterface }>(WorkerType.SPORTS_LIB, {
      path: activityFile.location.path
    });
  }

  /**
   * The downloaded "original activity data" is a zip wrapping the .fit file.
   * Extract it next to the zip and return the .fit path.
   */
  private extractFitFromZip(zipPath: string, destDir: string): Promise<string | null> {
    const extractDir = path.join(destDir, `extract-${path.basename(zipPath, ".zip")}`);

    return this.fileConnector.unArchiver
      .unpack(zipPath, extractDir)
      .then(() => {
        const fitPath = this.findFitFile(extractDir);
        if (!fitPath) {
          return null;
        }
        // Copy the .fit next to the zip so it survives cleanup of the extract dir
        const finalFitPath = path.join(destDir, path.basename(fitPath));
        fs.copyFileSync(fitPath, finalFitPath);
        return finalFitPath;
      })
      .catch(error => {
        this.logger.error("Unable to extract Garmin activity zip", error);
        return null;
      });
  }

  private findFitFile(dir: string): string | null {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = this.findFitFile(fullPath);
        if (found) {
          return found;
        }
      } else if (entry.name.toLowerCase().endsWith(".fit")) {
        return fullPath;
      }
    }
    return null;
  }

  private cleanupDirectory(dir: string): Promise<void> {
    return Promise.resolve().then(() => {
      try {
        if (fs.existsSync(dir)) {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      } catch (error) {
        this.logger.warn(`Unable to cleanup Garmin temp directory "${dir}"`, error);
      }
    });
  }

  public wait(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, GarminConnector.SLEEP_TIME_BETWEEN_ACTIVITY));
  }

  /**
   * Delegate source stats extraction to the FileConnector (identical FIT handling).
   */
  public getSourceStats<T>(sport: ElevateSport, source: Partial<T>, streams: Streams): Partial<ActivityStats> {
    return this.fileConnector.getSourceStats(sport, source as Partial<ActivityJSONInterface>, streams);
  }
}
