import { inject, injectable } from "tsyringe";
import os from "os";
import path from "path";
import fs from "fs";
import { ReplaySubject, Subject } from "rxjs";
import { BaseConnector } from "../base.connector";
import { FileConnector } from "../file/file.connector";
import { ActivityFile } from "../file/activity-file.model";
import { GarminApiClient, GarminActivitySummary } from "../../clients/garmin-api.client";
import { GarminAuthenticator } from "../../clients/garmin-authenticator";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { ActivityFileType } from "@elevate/shared/sync/connectors/activity-file-type.enum";
import { ConnectorConfig, GarminConnectorConfig } from "../connector-config.model";
import { GarminConnectorInfo } from "@elevate/shared/sync/connectors/garmin-connector-info.model";
import { AppService } from "../../app-service";
import { Environment, EnvironmentToken } from "../../environments/environment.interface";
import { Logger } from "../../logger";
import { Activity, ActivityExtras, ActivityStats } from "@elevate/shared/models/sync/activity.model";
import { ActivitySyncEvent } from "@elevate/shared/sync/events/activity-sync.event";
import { ErrorSyncEvent } from "@elevate/shared/sync/events/error-sync.event";
import { GenericSyncEvent } from "@elevate/shared/sync/events/generic-sync.event";
import { StartedSyncEvent } from "@elevate/shared/sync/events/started-sync.event";
import { StoppedSyncEvent } from "@elevate/shared/sync/events/stopped-sync.event";
import { SyncEventType } from "@elevate/shared/sync/events/sync-event-type";
import { SyncEvent } from "@elevate/shared/sync/events/sync.event";
import { IpcSyncMessageSender } from "src/senders/ipc-sync-message.sender";
import { WorkerService } from "src/worker-service";
import { HttpClient } from "src/clients/http.client";
import _ from "lodash";

@injectable()
export class GarminConnector extends BaseConnector {
  private static readonly ENABLED = true;

  public garminConnectorConfig: GarminConnectorConfig;

  constructor(
    @inject(AppService) protected readonly appService: AppService,
    @inject(EnvironmentToken) protected readonly environment: Environment,
    @inject(IpcSyncMessageSender) protected readonly ipcSyncMessageSender: IpcSyncMessageSender,
    @inject(WorkerService) protected readonly workerService: WorkerService,
    @inject(HttpClient) protected readonly httpClient: HttpClient,
    @inject(Logger) protected readonly logger: Logger,
    @inject(GarminApiClient) private readonly garminApiClient: GarminApiClient,
    @inject(GarminAuthenticator) private readonly garminAuthenticator: GarminAuthenticator,
    // Reused purely as a parsing/mapping delegate, never .sync()'d directly.
    @inject(FileConnector) private readonly fileConnector: FileConnector
  ) {
    super(appService, environment, ipcSyncMessageSender, workerService, httpClient, logger);
    this.type = ConnectorType.GARMIN;
    this.enabled = GarminConnector.ENABLED;
  }

  public configure(connectorConfig: ConnectorConfig): this {
    super.configure(connectorConfig);
    this.garminConnectorConfig = this.connectorConfig as GarminConnectorConfig;
    return this;
  }

  /**
   * Interactive first-time connect. Called from the UI when the user submits
   * their Garmin email/password. The bridge/garth persists the session to disk
   * (see GarminAuthenticator.tokenstoreDir) — GarminConnectorInfo only stores
   * the username + account display info for the UI, never the password.
   */
  public async authenticate(
    username: string,
    password: string,
    onMfaRequired: () => Promise<string>
  ): Promise<GarminConnectorInfo> {
    const garminAccount = await this.garminAuthenticator.login(username, password, onMfaRequired);
    return new GarminConnectorInfo(username, garminAccount);
  }

  public sync(): Subject<SyncEvent> {
    if (this.isSyncing) {
      this.syncEvents$.next(ErrorSyncEvent.SYNC_ALREADY_STARTED.create(ConnectorType.GARMIN));
    } else {
      this.syncEvents$ = new ReplaySubject<SyncEvent>();
      this.syncEvents$.next(new StartedSyncEvent(ConnectorType.GARMIN));
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

  private async syncActivities(syncEvents$: Subject<SyncEvent>): Promise<void> {
    const account = await this.garminAuthenticator.resume();
    if (!account) {
      throw ErrorSyncEvent.UNHANDLED_ERROR_SYNC.create(
        ConnectorType.GARMIN,
        "Garmin session expired or missing. Please reconnect your Garmin account."
      );
    }

    const afterDate = this.syncFromDateTime ? new Date(this.syncFromDateTime) : null;
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "elevate-garmin-"));

    // Full-history backfills page across many `garmin_sync.py` process
    // invocations (see GarminApiClient.BATCH_SIZE). Throttle between
    // activities to reduce the chance of hitting Garmin's (undocumented)
    // rate limits. Tune via env var if needed.
    const throttleMs = Number(process.env.GARMIN_SYNC_THROTTLE_MS || 800);

    try {
      for await (const summary of this.garminApiClient.iterateActivities(afterDate, tmpDir)) {
        if (this.stopRequested) {
          throw new StoppedSyncEvent(ConnectorType.GARMIN);
        }

        syncEvents$.next(new GenericSyncEvent(ConnectorType.GARMIN, `Processing "${summary.activityName}"...`));

        await this.processActivity(summary, syncEvents$);

        await new Promise(resolve => setTimeout(resolve, throttleMs));
      }
    } catch (error) {
      if (error instanceof SyncEvent) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[GarminConnector] Iteration error: ${errorMessage}`);
      throw ErrorSyncEvent.UNHANDLED_ERROR_SYNC.create(ConnectorType.GARMIN, errorMessage);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }

  /**
   * Check if activity just has default FileConnector Name
   */
  private isDefaultHumanizedName(localActivity: Activity): boolean {
    const startDate = new Date(localActivity.startTime);
    const dayMoment = FileConnector["HumanizedDayMoment"].resolve(startDate);
    const expectedDefaultName = `${dayMoment} ${localActivity.type}`;
    return localActivity.name?.trim() === expectedDefaultName;
  }

  /**
   * Hands an already-downloaded FIT file (summary.path, written by
   * garmin_sync.py) off to FileConnector's existing sports-lib-based
   * parsing/mapping pipeline instead of duplicating it.
   * Emits a GenericSyncEvent when an activity is skipped as a duplicate, so a
   * full-history backfill against an existing Strava-synced library is
   * auditable rather than silently dropping activities.
   */
  private async processActivity(summary: GarminActivitySummary, syncEvents$: Subject<SyncEvent>): Promise<void> {
    const filePath = summary.path;

    try {
      const activityFile = new ActivityFile(ActivityFileType.FIT, filePath, new Date(summary.startTimeLocal));

      const { event } = await this.fileConnector.computeSportsLibEvent(activityFile);

      const sportsLibActivity = event.activities.find(a => a.type !== "Transition");
      if (!sportsLibActivity) {
        fs.unlinkSync(filePath);
        return;
      }

      const startDate = new Date(sportsLibActivity.startDate);
      const endDate = new Date(sportsLibActivity.endDate);

      const localActivities = await this.findLocalActivities(startDate.toISOString(), endDate.toISOString());
      if (localActivities.length > 0 && !this.environment.allowActivitiesOverLapping) {
        const existing = localActivities[0];
        if (this.garminConnectorConfig.info.updateExistingNames && summary.activityName !== "Untitled") {
          const localActivity: Activity = existing;
          if (this.isDefaultHumanizedName(localActivity)) {
            // Update name
            localActivity.name = summary.activityName;
            localActivity.extras = _.merge<ActivityExtras, ActivityExtras>(localActivity.extras, {
              garmin: {
                activityId: summary.activityId as number
              }
            });
          }

          syncEvents$.next(new ActivitySyncEvent(this.type, null, localActivity, false));
        } else {
          syncEvents$.next(
            new GenericSyncEvent(
              ConnectorType.GARMIN,
              `Skipped "${summary.activityName}" (${summary.startTimeLocal}) — already synced as ` +
                `"${existing.name}" from ${startDate.toISOString()} to ${endDate.toISOString()}.`
            )
          );
        }
        fs.unlinkSync(filePath);
        return;
      }

      let activity: Partial<Activity> = this.fileConnector.createBareActivity(sportsLibActivity);
      const streams = this.fileConnector.mapStreams(sportsLibActivity);
      activity = this.assignBaseProperties(activity, streams);

      activity.extras = {
        garmin: { activityId: summary.activityId }
      };

      const athleteSnapshot = this.athleteSnapshotResolver.resolve(activity.startTime);
      activity.name = summary.activityName;
      activity.srcStats = this.fileConnector.getSourceStats(activity.type, sportsLibActivity, streams);
      activity.laps = this.fileConnector.processLaps(activity.type, sportsLibActivity.laps);
      activity.notes = null;

      const { computedActivity, deflatedStreams } = await this.computeActivity(
        activity,
        athleteSnapshot,
        this.garminConnectorConfig.userSettings,
        streams,
        true
      );

      fs.unlinkSync(filePath);

      syncEvents$.next(new ActivitySyncEvent(ConnectorType.GARMIN, null, computedActivity, true, deflatedStreams));
    } catch (error) {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {
          //Ignore temp file cleanup errors during failure recovery
        }
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorSyncEvent = ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(
        ConnectorType.GARMIN,
        `Failed to process ${summary.activityName} (${summary.activityId}): ${errorMessage}`
      );
      syncEvents$.next(errorSyncEvent);
    }
  }

  public getSourceStats(): Partial<ActivityStats> {
    // Delegated entirely to FileConnector during processActivity(); BaseConnector
    // requires this method to exist on the class.
    throw new Error("Use FileConnector.getSourceStats() via composition instead.");
  }
}
