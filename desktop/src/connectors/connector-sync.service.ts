import { container, inject, InjectionToken, singleton } from "tsyringe";
import {
  ActivityComputer,
  ActivitySyncEvent,
  CompleteSyncEvent,
  ConnectorInfo,
  ConnectorType,
  ErrorSyncEvent,
  SyncEvent,
  SyncEventType
} from "@elevate/shared/sync";
import { BaseConnector } from "./base.connector";
import { StravaConnector } from "./strava/strava.connector";
import { FileConnector } from "./file/file.connector";
import { ConnectorConfig } from "./connector-config.model";
import {
  AthleteModel,
  AthleteSnapshotModel,
  ConnectorSyncDateTime,
  Streams,
  SyncedActivityModel,
  UserSettings
} from "@elevate/shared/models";
import _ from "lodash";
import { IpcSyncMessageSender } from "../senders/ipc-sync-message.sender";
import { Logger } from "../logger";
import UserSettingsModel = UserSettings.UserSettingsModel;
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

@singleton()
export class ConnectorSyncService {
  private static readonly TOKENS_MAP = new Map<ConnectorType, InjectionToken<BaseConnector>>([
    [ConnectorType.STRAVA, StravaConnector],
    [ConnectorType.FILE, FileConnector]
  ]);

  public currentConnector: BaseConnector;

  constructor(
    @inject(IpcSyncMessageSender) private readonly ipcSyncMessageSender: IpcSyncMessageSender,
    @inject(Logger) private readonly logger: Logger
  ) {}

  /**
   * Start connector sync
   * @return Promise started
   */
  public sync(
    connectorType: ConnectorType,
    connectorSyncDateTime: ConnectorSyncDateTime,
    connectorInfo: ConnectorInfo,
    athleteModel: AthleteModel,
    userSettingsModel: UserSettingsModel
  ): Promise<string> {
    if (this.currentConnector && this.currentConnector.isSyncing) {
      return Promise.reject(
        `Impossible to start a new sync. Another sync is already running on connector ${this.currentConnector.type}`
      );
    }

    // Find out which connector token to inject
    const connectorToken = ConnectorSyncService.TOKENS_MAP.get(connectorType);

    // Build connector config from startSyncMessage
    const connectorConfig: ConnectorConfig = {
      athleteModel: athleteModel,
      userSettingsModel: userSettingsModel,
      connectorSyncDateTime: connectorSyncDateTime,
      info: connectorInfo
    };

    // Resolve connector instance
    this.currentConnector = container.resolve(connectorToken);

    // And configure it
    this.currentConnector.configure(connectorConfig);

    // Sync !!
    this.currentConnector.sync().subscribe(
      (syncEvent: SyncEvent) => {
        this.ipcSyncMessageSender.forwardSyncEvent(syncEvent);

        if (syncEvent.type === SyncEventType.ACTIVITY) {
          const activitySyncEvent = syncEvent as ActivitySyncEvent;
          this.logger.debug(
            "[Connector (" + connectorType + ")]",
            `Notify to insert or update activity name: "${activitySyncEvent.activity.name}", started on "${activitySyncEvent.activity.start_time}", isNew: "${activitySyncEvent.isNew}"`
          );
        } else if (syncEvent.type === SyncEventType.ERROR) {
          this.logger.error("[Connector (" + connectorType + ")]", syncEvent);
        } else {
          this.logger.debug("[Connector (" + connectorType + ")]", syncEvent);
        }
      },
      (errorSyncEvent: ErrorSyncEvent) => {
        this.logger.error("[Connector (" + connectorType + ")]", errorSyncEvent);

        this.currentConnector = null;

        this.ipcSyncMessageSender.forwardSyncEvent(errorSyncEvent);
      },
      () => {
        this.logger.info("[Connector (" + connectorType + ")]", "Sync done");

        this.currentConnector = null;

        const completeSyncEvent = new CompleteSyncEvent(connectorType, "Sync done");
        this.ipcSyncMessageSender.forwardSyncEvent(completeSyncEvent);
      }
    );

    return Promise.resolve(`Started sync of connector ${connectorType}`);
  }

  public stop(requestConnectorType: ConnectorType): Promise<string> {
    if (_.isEmpty(this.currentConnector)) {
      const errorMessage = "No existing connector found to stop sync";
      this.logger.error(errorMessage);
      return Promise.reject(errorMessage);
    } else {
      if (this.currentConnector.type === requestConnectorType) {
        return this.currentConnector.stop().then(
          () => {
            const successMessage = "Sync of connector '" + requestConnectorType + "' has been cancelled";
            this.logger.info(successMessage);
            return Promise.resolve(successMessage);
          },
          error => {
            this.logger.error(error);
            return Promise.reject(error);
          }
        );
      } else {
        return Promise.reject(
          `Trying to stop a sync on ${requestConnectorType} connector but current connector synced type is: ${this.currentConnector.type}`
        );
      }
    }
  }

  public computeActivity(
    syncedActivityModel: SyncedActivityModel,
    userSettingsModel: DesktopUserSettingsModel,
    athleteSnapshotModel: AthleteSnapshotModel,
    streams: Streams
  ): Promise<SyncedActivityModel> {
    try {
      const analysisDataModel = ActivityComputer.calculate(
        syncedActivityModel,
        athleteSnapshotModel,
        userSettingsModel,
        streams,
        false,
        null,
        true,
        null
      );

      // Compute bary center from lat/lng stream
      syncedActivityModel.latLngCenter = BaseConnector.geoBaryCenter(streams);

      // Update synced activity with new AthleteSnapshotModel & stats results
      syncedActivityModel.athleteSnapshot = athleteSnapshotModel;
      syncedActivityModel.extendedStats = analysisDataModel;
      syncedActivityModel = BaseConnector.updatePrimitiveStatsFromComputation(syncedActivityModel, streams);

      // Check if user missed some athlete settings. Goal: avoid missing stress scores because of missing settings.
      syncedActivityModel.settingsLack = ActivityComputer.hasAthleteSettingsLacks(
        syncedActivityModel.distance_raw,
        syncedActivityModel.moving_time_raw,
        syncedActivityModel.elapsed_time_raw,
        syncedActivityModel.type,
        syncedActivityModel.extendedStats,
        syncedActivityModel.athleteSnapshot.athleteSettings,
        streams
      );

      // Compute activity hash
      syncedActivityModel.hash = BaseConnector.activityHash(syncedActivityModel);

      return Promise.resolve(syncedActivityModel);
    } catch (error) {
      this.logger.error(error);
      return Promise.reject(error);
    }
  }
}
