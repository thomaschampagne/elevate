import { Inject, Injectable, OnDestroy } from "@angular/core";
import { SyncService } from "../sync.service";
import { VersionsProvider } from "../../versions/versions-provider";
import { AthleteService } from "../../athlete/athlete.service";
import { UserSettingsService } from "../../user-settings/user-settings.service";
import { LoggerService } from "../../logging/logger.service";
import { Subject, Subscription } from "rxjs";
import { IpcSyncMessagesListener } from "../../../../desktop/ipc/ipc-sync-messages-listener.service";
import { StravaConnectorInfoService } from "../../strava-connector-info/strava-connector-info.service";
import { ActivityService } from "../../activity/activity.service";
import _ from "lodash";
import { SyncState } from "../sync-state.enum";
import { ConnectorSyncDateTimeDao } from "../../../dao/sync/connector-sync-date-time.dao";
import { StreamsService } from "../../streams/streams.service";
import { FileConnectorInfoService } from "../../file-connector-info/file-connector-info.service";
import { DataStore } from "../../../data-store/data-store";
import { DesktopDataStore } from "../../../data-store/impl/desktop-data-store.service";
import { ElectronService } from "../../../../desktop/electron/electron.service";
import { Router } from "@angular/router";
import { AppRoutes } from "../../../models/app-routes";
import { DesktopMigrationService } from "../../../../desktop/migration/desktop-migration.service";
import { ActivityRecalculateNotification, DesktopActivityService } from "../../activity/impl/desktop-activity.service";
import { IpcSyncMessageSender } from "../../../../desktop/ipc/ipc-sync-messages-sender.service";
import { DesktopBackupService } from "../../../../desktop/backup/desktop-backup.service";
import { DesktopInsightsService } from "../../../../desktop/insights/desktop-insights.service";
import { SyncEvent } from "@elevate/shared/sync/events/sync.event";
import { ConnectorSyncDateTime } from "@elevate/shared/models/sync/connector-sync-date-time.model";
import { BackupEvent } from "@elevate/shared/models/backup/backup-event.int";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { ConnectorInfo } from "@elevate/shared/sync/connectors/connector-info.model";
import { WarningException } from "@elevate/shared/exceptions/warning.exception";
import { DeflatedActivityStreams } from "@elevate/shared/models/sync/deflated-activity.streams";
import { FileConnectorInfo } from "@elevate/shared/sync/connectors/file-connector-info.model";
import { Activity } from "@elevate/shared/models/sync/activity.model";
import { SyncException } from "@elevate/shared/exceptions/sync.exception";
import { RestoreEvent } from "@elevate/shared/models/backup/restore-event.int";
import { StravaConnectorInfo } from "@elevate/shared/sync/connectors/strava-connector-info.model";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";
import { ErrorSyncEvent } from "@elevate/shared/sync/events/error-sync.event";
import { SyncEventType } from "@elevate/shared/sync/events/sync-event-type";
import { ActivitySyncEvent } from "@elevate/shared/sync/events/activity-sync.event";
import { CompleteSyncEvent } from "@elevate/shared/sync/events/complete-sync.event";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import BaseUserSettings = UserSettings.BaseUserSettings;

@Injectable()
export class DesktopSyncService extends SyncService<ConnectorSyncDateTime[]> implements OnDestroy {
  public syncEvents$: Subject<SyncEvent>;
  public syncSubscription: Subscription;
  public currentConnectorType: ConnectorType;
  private previousLastActivityStartTime: number;

  public CONNECTOR_SYNC_FROM_DATE_TIME_MAP: Map<ConnectorType, () => Promise<number>> = new Map<
    ConnectorType,
    () => Promise<number>
  >([
    [
      ConnectorType.STRAVA,
      () => this.activityService.findMostRecent().then(activity => Promise.resolve(activity.startTimestamp * 1000))
    ],
    [
      ConnectorType.FILE,
      () =>
        this.connectorSyncDateTimeDao
          .findOne({ connectorType: ConnectorType.FILE })
          .then(connector => Promise.resolve(connector.syncDateTime))
    ]
  ]);

  constructor(
    @Inject(VersionsProvider) public readonly versionsProvider: VersionsProvider,
    @Inject(DataStore) public readonly desktopDataStore: DesktopDataStore<object>,
    @Inject(DesktopBackupService) public readonly desktopBackupService: DesktopBackupService,
    @Inject(ActivityService) public readonly activityService: DesktopActivityService,
    @Inject(StreamsService) public readonly streamsService: StreamsService,
    @Inject(AthleteService) public readonly athleteService: AthleteService,
    @Inject(UserSettingsService) public readonly userSettingsService: UserSettingsService,
    @Inject(DesktopMigrationService) private readonly desktopMigrationService: DesktopMigrationService,
    @Inject(IpcSyncMessagesListener) public readonly ipcSyncMessagesListener: IpcSyncMessagesListener,
    @Inject(IpcSyncMessageSender) public readonly ipcSyncMessageSender: IpcSyncMessageSender,
    @Inject(StravaConnectorInfoService) public readonly stravaConnectorInfoService: StravaConnectorInfoService,
    @Inject(FileConnectorInfoService) public readonly fsConnectorInfoService: FileConnectorInfoService,
    @Inject(DesktopInsightsService) private readonly insightsService: DesktopInsightsService,
    @Inject(LoggerService) public readonly logger: LoggerService,
    @Inject(ConnectorSyncDateTimeDao) public readonly connectorSyncDateTimeDao: ConnectorSyncDateTimeDao,
    @Inject(ElectronService) public readonly electronService: ElectronService,
    @Inject(Router) public readonly router: Router
  ) {
    super(
      versionsProvider,
      desktopDataStore,
      activityService,
      streamsService,
      athleteService,
      userSettingsService,
      logger
    );
    this.syncSubscription = null;
    this.currentConnectorType = null;
    this.previousLastActivityStartTime = null;
    this.syncEvents$ = new Subject<SyncEvent>(); // Starting new sync
    this.stravaConnectorInfoService.listenForCredentialsUpdates(this.syncEvents$);

    // Emulate a sync on activities recalculation (goal: disable UI actions which could compromise data integrity during recalculation)
    this.activityService.recalculate$.subscribe((notification: ActivityRecalculateNotification) => {
      if (notification.started) {
        this.isSyncing$.next(true);
      }

      if (notification.ended) {
        this.isSyncing$.next(false);
      }
    });
  }

  public static transformErrorToSyncException(error: Error | Error[] | string | string[]): SyncException {
    if (error instanceof SyncException) {
      return error as SyncException;
    } else if ((error as any).name === Error.name) {
      return SyncException.fromError(error as Error);
    } else if (_.isString(error)) {
      return new SyncException(error);
    } else {
      return new SyncException("An unknown sync exception occurred");
    }
  }

  public sync(fastSync: boolean = null, forceSync: boolean = null, connectorType: ConnectorType = null): Promise<void> {
    if (!connectorType) {
      throw new SyncException("ConnectorType param must be given");
    }

    this.currentConnectorType = connectorType;

    const promisedDataToSync: Promise<any>[] = [
      this.athleteService.fetch(),
      this.userSettingsService.fetch(),
      fastSync ? this.CONNECTOR_SYNC_FROM_DATE_TIME_MAP.get(this.currentConnectorType)() : Promise.resolve(null),
      this.activityService.findMostRecent()
    ];

    if (this.currentConnectorType === ConnectorType.STRAVA) {
      promisedDataToSync.push(this.stravaConnectorInfoService.fetch());
    } else if (this.currentConnectorType === ConnectorType.FILE) {
      promisedDataToSync.push(Promise.resolve(this.fsConnectorInfoService.fetch()));
    } else {
      const errorMessage = "Unknown connector type to sync";
      this.logger.error(errorMessage);
      throw new SyncException(errorMessage);
    }

    if (this.syncSubscription) {
      this.syncSubscription.unsubscribe();
    }

    // Subscribe for sync events
    this.syncSubscription = this.ipcSyncMessagesListener.syncEvents$.subscribe((syncEvent: SyncEvent) => {
      this.handleSyncEvents(this.syncEvents$, syncEvent);
    });

    return Promise.all(promisedDataToSync)
      .then(result => {
        const athleteModel: AthleteModel = result[0] as AthleteModel;
        const userSettings: BaseUserSettings = result[1] as BaseUserSettings;
        const connectorSyncFromDateTime: number = result[2] as number;
        const mostRecentActivity: SyncedActivityModel = result[3] as SyncedActivityModel;

        // When fast sync keep tracking of the most recent activity before syncing: we need it to get the activity delta added once done.
        this.previousLastActivityStartTime = mostRecentActivity && fastSync ? mostRecentActivity.start_timestamp : null;

        // Get timestamp on which we have to sync
        const syncFromDateTime = connectorSyncFromDateTime && fastSync ? connectorSyncFromDateTime : null;

        let startSyncParamPromise: Promise<{
          connectorType: ConnectorType;
          connectorInfo: ConnectorInfo;
          athleteModel: AthleteModel;
          userSettings: BaseUserSettings;
          syncFromDateTime: number;
        }>;

        if (this.currentConnectorType === ConnectorType.STRAVA) {
          const stravaConnectorInfo: StravaConnectorInfo = result[4] as StravaConnectorInfo;

          // Create message to start sync on connector!
          startSyncParamPromise = Promise.resolve({
            connectorType: this.currentConnectorType,
            connectorInfo: stravaConnectorInfo,
            athleteModel: athleteModel,
            userSettings: userSettings,
            syncFromDateTime: syncFromDateTime
          });
        } else if (this.currentConnectorType === ConnectorType.FILE) {
          const fileConnectorInfo: FileConnectorInfo = result[4] as FileConnectorInfo;

          // If source directory is missing or path is invalid then a throw warning
          startSyncParamPromise = this.fsConnectorInfoService
            .isSourceDirectoryValid(fileConnectorInfo.sourceDirectory)
            .then(valid => {
              if (valid) {
                return Promise.resolve({
                  connectorType: this.currentConnectorType,
                  connectorInfo: fileConnectorInfo,
                  athleteModel: athleteModel,
                  userSettings: userSettings,
                  syncFromDateTime: syncFromDateTime
                });
              } else {
                return this.fsConnectorInfoService.ensureSourceDirectoryCompliance().then(() => {
                  return Promise.reject(
                    new WarningException("File connector scan folder don't exists", null, "Go to connectors", () => {
                      this.router.navigate([AppRoutes.connectors]);
                    })
                  );
                });
              }
            });
        }

        // Trigger sync start
        return startSyncParamPromise;
      })
      .then(startSyncParams => {
        return this.ipcSyncMessageSender
          .startSync(
            startSyncParams.connectorType,
            startSyncParams.connectorInfo,
            startSyncParams.athleteModel,
            startSyncParams.userSettings,
            startSyncParams.syncFromDateTime
          )
          .then(
            (response: string) => {
              this.logger.debug("[Renderer] StartSync Main Response:", response);
              this.isSyncing$.next(true);
              return Promise.resolve();
            },
            error => {
              // e.g. Impossible to start a new sync. Another sync is already running on connector ...
              this.logger.error(error);
              return Promise.reject(error);
            }
          );
      });
  }

  public handleSyncEvents(syncEvents$: Subject<SyncEvent>, syncEvent: SyncEvent): void {
    switch (syncEvent.type) {
      case SyncEventType.STARTED:
        syncEvents$.next(syncEvent); // Forward for upward UI use.
        break;

      case SyncEventType.ACTIVITY:
        this.handleActivityUpsert(syncEvents$, syncEvent as ActivitySyncEvent);
        break;

      case SyncEventType.STOPPED:
        syncEvents$.next(syncEvent); // Forward for upward UI use.
        break;

      case SyncEventType.GENERIC:
        syncEvents$.next(syncEvent); // Forward for upward UI use.
        break;

      case SyncEventType.STRAVA_CREDENTIALS_UPDATE:
        syncEvents$.next(syncEvent); // Forward for upward UI use.
        break;

      case SyncEventType.COMPLETE:
        this.handleSyncCompleteEvents(syncEvents$, syncEvent as CompleteSyncEvent);
        break;

      case SyncEventType.ERROR:
        this.handleErrorSyncEvents(syncEvents$, syncEvent as ErrorSyncEvent);
        break;

      default:
        const errorMessage = "Unknown sync event type: " + JSON.stringify(syncEvent);
        this.logger.error(errorMessage);
        this.throwSyncError(new SyncException(errorMessage));
    }
  }

  public handleErrorSyncEvents(syncEvents$: Subject<SyncEvent>, errorSyncEvent: ErrorSyncEvent): void {
    this.logger.error(errorSyncEvent);

    if (!errorSyncEvent.code) {
      this.throwSyncError(new SyncException(errorSyncEvent.toString()));
      return;
    }

    if (
      errorSyncEvent.code === ErrorSyncEvent.UNHANDLED_ERROR_SYNC.code ||
      errorSyncEvent.code === ErrorSyncEvent.SYNC_ERROR_UPSERT_ACTIVITY_DATABASE.code ||
      errorSyncEvent.code === ErrorSyncEvent.STRAVA_API_UNAUTHORIZED.code ||
      errorSyncEvent.code === ErrorSyncEvent.STRAVA_API_FORBIDDEN.code ||
      errorSyncEvent.code === ErrorSyncEvent.STRAVA_INSTANT_QUOTA_REACHED.code ||
      errorSyncEvent.code === ErrorSyncEvent.STRAVA_DAILY_QUOTA_REACHED.code ||
      errorSyncEvent.code === ErrorSyncEvent.FS_SOURCE_DIRECTORY_DONT_EXISTS.code
    ) {
      syncEvents$.next(errorSyncEvent); // Forward for upward UI use.

      // Stop sync !!
      this.stop().catch(stopError => {
        this.throwSyncError(stopError); // Should be caught by Error Handler
      });
    } else if (
      errorSyncEvent.code === ErrorSyncEvent.SYNC_ERROR_COMPUTE.code ||
      errorSyncEvent.code === ErrorSyncEvent.MULTIPLE_ACTIVITIES_FOUND.code ||
      errorSyncEvent.code === ErrorSyncEvent.SYNC_ALREADY_STARTED.code ||
      errorSyncEvent.code === ErrorSyncEvent.STRAVA_API_RESOURCE_NOT_FOUND.code ||
      errorSyncEvent.code === ErrorSyncEvent.STRAVA_API_TIMEOUT.code
    ) {
      syncEvents$.next(errorSyncEvent); // Forward for upward UI use.
    } else {
      const syncException = new SyncException("Unknown ErrorSyncEvent", errorSyncEvent);
      this.throwSyncError(syncException);
    }
  }

  public handleSyncCompleteEvents(syncEvents$: Subject<SyncEvent>, completeSyncEvent: CompleteSyncEvent): void {
    let syncState = null;
    this.getSyncState()
      .then(userSyncState => {
        syncState = userSyncState;
        return this.connectorSyncDateTimeDao.getById(this.currentConnectorType);
      })
      .then((currentConnectorSyncDateTime: ConnectorSyncDateTime) => {
        if (currentConnectorSyncDateTime) {
          currentConnectorSyncDateTime.syncDateTime = Date.now();
        } else {
          currentConnectorSyncDateTime = new ConnectorSyncDateTime(this.currentConnectorType, Date.now());
        }
        return this.connectorSyncDateTimeDao.put(currentConnectorSyncDateTime);
      })
      .then(() => {
        // Ensure all activities are well persisted before any reload
        return this.desktopDataStore.persist(true);
      })
      .then(() => {
        // Push insight activities
        const findActivities = this.previousLastActivityStartTime
          ? this.activityService.findSince(this.previousLastActivityStartTime)
          : this.activityService.find();

        // Push insight activities: replace all on remote if no old activity given
        findActivities.then(activities =>
          this.insightsService.registerActivities(activities, !this.previousLastActivityStartTime)
        );

        this.logger.debug(completeSyncEvent);
        this.isSyncing$.next(false);
        syncEvents$.next(completeSyncEvent); // Forward for upward UI use.
      });
  }

  public stop(): Promise<void> {
    this.logger.debug(`Stop sync requested on connector ${this.currentConnectorType}`);

    return new Promise((resolve, reject) => {
      if (this.currentConnectorType === null) {
        reject();
        return;
      }

      this.ipcSyncMessageSender.stopSync(this.currentConnectorType).then(
        () => {
          this.logger.debug("Sync stopped");
          resolve();
          this.isSyncing$.next(false);
        },
        error => {
          const errorMessage = `Unable to stop sync on connector: ${this.currentConnectorType}. Error: ${error}`;
          this.logger.error(errorMessage, error);
          reject(errorMessage);
          this.isSyncing$.next(false);
        }
      );
    });
  }

  public handleActivityUpsert(syncEvents$: Subject<SyncEvent>, activitySyncEvent: ActivitySyncEvent): void {
    const errors = [];

    // Insert new activity or update an existing one to database
    this.logger.debug(
      `Trying to upsert activity ${activitySyncEvent.isNew ? "new" : "existing"} "${
        activitySyncEvent.activity.name
      }" started on "${activitySyncEvent.activity.startTime}".`
    );

    this.activityService
      .put(activitySyncEvent.activity)
      .then((activity: Activity) => {
        this.logger.debug(`Activity "${activity.name}" saved`);

        const promiseHandlePutStreams: Promise<void | DeflatedActivityStreams> = activitySyncEvent.deflatedStreams
          ? this.streamsService.put(
              new DeflatedActivityStreams(`${activitySyncEvent.activity.id}`, activitySyncEvent.deflatedStreams)
            )
          : Promise.resolve();

        promiseHandlePutStreams.then(() => {
          syncEvents$.next(activitySyncEvent); // Forward for upward UI use
        });
      })
      .catch((upsertError: Error) => {
        this.logger.error(upsertError);

        const stopSyncPromise = this.stop();

        syncEvents$.next(
          ErrorSyncEvent.SYNC_ERROR_UPSERT_ACTIVITY_DATABASE.create(
            ConnectorType.STRAVA,
            activitySyncEvent.activity,
            upsertError
          )
        );

        errors.push(upsertError);

        // Trigger sync stop
        return stopSyncPromise;
      })
      .then(
        () => {
          // Stopped properly, throw the upsert error
          if (errors.length > 0) {
            this.throwSyncError(errors); // Should be caught by Error Handler
          }
        },
        stopError => {
          this.logger.error(stopError);
          errors.push(stopError);
          this.throwSyncError(errors); // Should be caught by Error Handler
        }
      );
  }

  public throwSyncError(error: Error | Error[] | string | string[]): void {
    if (_.isArray(error)) {
      const syncExceptions = [];
      _.forEach(error, err => {
        const syncException = DesktopSyncService.transformErrorToSyncException(err as any);
        syncExceptions.push(syncException);
      });

      throw syncExceptions;
    } else {
      throw DesktopSyncService.transformErrorToSyncException(error as Error | Error[] | string | string[]);
    }
  }

  public backup(outputDirectory: string): Subject<BackupEvent> {
    const backupVersion = this.versionsProvider.getPackageVersion();
    return this.desktopBackupService.backup(outputDirectory, backupVersion);
  }

  public restore(path: string): Subject<RestoreEvent> {
    const restoreEvent$ = this.desktopBackupService.restore(path);

    // Notify syncing we restore started
    this.isSyncing$.next(true);

    // Notify not synced state on restore error or complete
    restoreEvent$.subscribe(
      () => {},
      () => this.isSyncing$.next(false),
      () => {
        // Clear any recalculation requirements with the new imported backup. Indeed new backup might not require recalculation...
        this.desktopMigrationService.clearRequiredRecalculation().then(() => {
          this.isSyncing$.next(false);

          // Force database save before reload
          this.desktopDataStore.persist(true).then(() => {
            // Force app reload at end of every executions
            setTimeout(() => location.reload());
          });
        });
      }
    );

    return restoreEvent$;
  }

  public getSyncState(): Promise<SyncState> {
    return Promise.all([this.getConnectorSyncDateTimeDesc(), this.activityService.count()]).then((result: any[]) => {
      const connectorSyncDateTimes: ConnectorSyncDateTime[] = result[0] as ConnectorSyncDateTime[];
      const activitiesCount: number = result[1] as number;

      const hasASyncDateTime: boolean = connectorSyncDateTimes.length > 0;
      const hasActivities: boolean = activitiesCount > 0;

      let syncState: SyncState;
      if (!hasASyncDateTime && !hasActivities) {
        syncState = SyncState.NOT_SYNCED;
      } else if (!hasASyncDateTime && hasActivities) {
        syncState = SyncState.PARTIALLY_SYNCED;
      } else {
        syncState = SyncState.SYNCED;
      }

      return Promise.resolve(syncState);
    });
  }

  public getMostRecentSyncedConnector(): Promise<ConnectorSyncDateTime> {
    return this.getConnectorSyncDateTimeDesc().then((connectorSyncDateTimes: ConnectorSyncDateTime[]) => {
      return Promise.resolve(connectorSyncDateTimes[0]); // Get first connectorSyncDateTime (because sorted DESC)
    });
  }

  public getSyncDateTimeByConnectorType(connectorType: ConnectorType): Promise<ConnectorSyncDateTime> {
    return this.connectorSyncDateTimeDao.getById(connectorType);
  }

  public getConnectorSyncDateTimeDesc(): Promise<ConnectorSyncDateTime[]> {
    return this.connectorSyncDateTimeDao.find(null, { options: { desc: true }, propName: "syncDateTime" });
  }

  public clearSyncTime(): Promise<void> {
    return this.connectorSyncDateTimeDao.clear();
  }

  public ngOnDestroy(): void {
    if (this.syncSubscription) {
      this.syncSubscription.unsubscribe();
    }
  }

  public redirect(): void {
    this.router.navigate([AppRoutes.connectors]);
  }
}
