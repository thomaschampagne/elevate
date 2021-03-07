import { Inject, Injectable, OnDestroy } from "@angular/core";
import { SyncService } from "../sync.service";
import { VersionsProvider } from "../../versions/versions-provider";
import { AthleteService } from "../../athlete/athlete.service";
import { UserSettingsService } from "../../user-settings/user-settings.service";
import { LoggerService } from "../../logging/logger.service";
import { Subject, Subscription } from "rxjs";
import {
  ActivitySyncEvent,
  CompleteSyncEvent,
  ConnectorInfo,
  ConnectorType,
  ErrorSyncEvent,
  FileConnectorInfo,
  StravaConnectorInfo,
  SyncEvent,
  SyncEventType
} from "@elevate/shared/sync";
import { IpcSyncMessagesListener } from "../../../../desktop/ipc/ipc-sync-messages-listener.service";
import { StravaConnectorInfoService } from "../../strava-connector-info/strava-connector-info.service";
import {
  AthleteModel,
  BackupEvent,
  DeflatedActivityStreams,
  RestoreEvent,
  SyncedActivityModel,
  UserSettings
} from "@elevate/shared/models";
import { ActivityService } from "../../activity/activity.service";
import { ElevateException, SyncException, WarningException } from "@elevate/shared/exceptions";
import _ from "lodash";
import { SyncState } from "../sync-state.enum";
import { ConnectorSyncDateTime } from "@elevate/shared/models/sync";
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
import UserSettingsModel = UserSettings.UserSettingsModel;

@Injectable()
export class DesktopSyncService extends SyncService<ConnectorSyncDateTime[]> implements OnDestroy {
  public syncEvents$: Subject<SyncEvent>;
  public syncSubscription: Subscription;
  public currentConnectorType: ConnectorType;

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
      return new SyncException(JSON.stringify(error));
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
      fastSync ? this.getConnectorSyncDateTimeDesc() : Promise.resolve(null)
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
        const userSettingsModel: UserSettingsModel = result[1] as UserSettingsModel;
        const allConnectorsSyncDateTime: ConnectorSyncDateTime[] = result[2] as ConnectorSyncDateTime[];

        let startSyncParamPromise: Promise<{
          connectorType: ConnectorType;
          connectorSyncDateTime: ConnectorSyncDateTime;
          connectorInfo: ConnectorInfo;
          athleteModel: AthleteModel;
          userSettingsModel: UserSettingsModel;
        }>;

        const currentConnectorSyncDateTime = allConnectorsSyncDateTime
          ? _.find(allConnectorsSyncDateTime, { connectorType: this.currentConnectorType })
          : null;

        if (this.currentConnectorType === ConnectorType.STRAVA) {
          const stravaConnectorInfo: StravaConnectorInfo = result[3] as StravaConnectorInfo;

          // Create message to start sync on connector!
          startSyncParamPromise = Promise.resolve({
            connectorType: this.currentConnectorType,
            connectorSyncDateTime: currentConnectorSyncDateTime,
            connectorInfo: stravaConnectorInfo,
            athleteModel: athleteModel,
            userSettingsModel: userSettingsModel
          });
        } else if (this.currentConnectorType === ConnectorType.FILE) {
          const fileConnectorInfo: FileConnectorInfo = result[3] as FileConnectorInfo;

          // If source directory is missing or path is invalid then a throw warning
          startSyncParamPromise = this.fsConnectorInfoService
            .isSourceDirectoryValid(fileConnectorInfo.sourceDirectory)
            .then(valid => {
              if (valid) {
                return Promise.resolve({
                  connectorType: this.currentConnectorType,
                  connectorSyncDateTime: currentConnectorSyncDateTime,
                  connectorInfo: fileConnectorInfo,
                  athleteModel: athleteModel,
                  userSettingsModel: userSettingsModel
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
            startSyncParams.connectorSyncDateTime,
            startSyncParams.connectorInfo,
            startSyncParams.athleteModel,
            startSyncParams.userSettingsModel
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
        return this.upsertConnectorsSyncDateTimes([currentConnectorSyncDateTime]);
      })
      .then(() => {
        // Ensure all activities are well persisted before any reload
        return this.desktopDataStore.saveDataStore();
      })
      .then(() => {
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
        (response: string) => {
          this.logger.debug("Sync stopped. Response from main:", response);
          resolve();
          this.isSyncing$.next(false);
        },
        error => {
          const errorMessage = `Unable to stop sync on connector: ${
            this.currentConnectorType
          }. Connector replied with ${JSON.stringify(error)}`;
          this.logger.error(errorMessage);
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
      }" started on "${activitySyncEvent.activity.start_time}".`
    );

    this.activityService
      .put(activitySyncEvent.activity)
      .then((syncedActivityModel: SyncedActivityModel) => {
        this.logger.debug(`Activity "${syncedActivityModel.name}" saved`);

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
            upsertError.stack
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
        this.desktopMigrationService.clearRequiredRecalculation();

        this.isSyncing$.next(false);

        // Force app reload
        setTimeout(() => location.reload());
      }
    );

    return restoreEvent$;
  }

  public getSyncState(): Promise<SyncState> {
    return Promise.all([this.getSyncDateTime(), this.activityService.count()]).then((result: any[]) => {
      const connectorSyncDateTimes: ConnectorSyncDateTime[] = result[0] as ConnectorSyncDateTime[];
      const syncedActivitiesCount: number = result[1] as number;

      const hasASyncDateTime: boolean = connectorSyncDateTimes.length > 0;
      const hasSyncedActivityModels: boolean = syncedActivitiesCount > 0;

      let syncState: SyncState;
      if (!hasASyncDateTime && !hasSyncedActivityModels) {
        syncState = SyncState.NOT_SYNCED;
      } else if (!hasASyncDateTime && hasSyncedActivityModels) {
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
    return this.getSyncDateTime();
  }

  public getSyncDateTime(): Promise<ConnectorSyncDateTime[]> {
    // For desktop sort by syncDateTime DESC (recent first)
    return this.connectorSyncDateTimeDao.find(null, { options: { desc: true }, propName: "syncDateTime" });
  }

  public upsertConnectorsSyncDateTimes(
    connectorSyncDateTimes: ConnectorSyncDateTime[]
  ): Promise<ConnectorSyncDateTime[]> {
    if (!_.isArray(connectorSyncDateTimes)) {
      throw new Error("connectorSyncDateTimes param must be an array");
    }

    return connectorSyncDateTimes
      .reduce((previousPromise: Promise<void>, connectorSyncDateTime: ConnectorSyncDateTime) => {
        return previousPromise.then(() => {
          return this.connectorSyncDateTimeDao.put(connectorSyncDateTime, true).then(() => Promise.resolve());
        });
      }, Promise.resolve())
      .then(() => {
        return this.connectorSyncDateTimeDao.find();
      });
  }

  public updateSyncDateTime(connectorSyncDateTimes: ConnectorSyncDateTime[]): Promise<ConnectorSyncDateTime[]> {
    throw new ElevateException("Please use upsertSyncDateTimes() method when using DesktopSyncService");
  }

  public clearSyncTime(): Promise<void> {
    return this.connectorSyncDateTimeDao.clear(true);
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
