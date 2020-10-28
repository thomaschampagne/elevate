import { container, inject, InjectionToken, singleton } from "tsyringe";
import {
  ActivityComputer,
  ActivitySyncEvent,
  CompleteSyncEvent,
  ConnectorType,
  ErrorSyncEvent,
  SyncEvent,
  SyncEventType
} from "@elevate/shared/sync";
import { BaseConnector } from "./base.connector";
import { StravaConnector } from "./strava/strava.connector";
import { FileSystemConnector } from "./filesystem/file-system.connector";
import { IpcMessagesSender } from "../messages/ipc-messages.sender";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
import { ConnectorConfig } from "./connector-config.model";
import {
  ActivityStreamsModel,
  AthleteModel,
  AthleteSnapshotModel,
  ConnectorSyncDateTime,
  SyncedActivityModel,
  UserSettings
} from "@elevate/shared/models";
import { PromiseTronReply } from "promise-tron";
import logger from "electron-log";
import _ from "lodash";
import UserSettingsModel = UserSettings.UserSettingsModel;
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

@singleton()
export class ConnectorSyncService {
  private static readonly TOKENS_MAP = new Map<ConnectorType, InjectionToken<BaseConnector>>([
    [ConnectorType.STRAVA, StravaConnector],
    [ConnectorType.FILE_SYSTEM, FileSystemConnector]
  ]);

  public currentConnector: BaseConnector;

  constructor(@inject(IpcMessagesSender) private readonly ipcMessagesSender: IpcMessagesSender) {}

  public sync(startSyncMessage: FlaggedIpcMessage, replyWith: (promiseTronReply: PromiseTronReply) => void): void {
    if (this.currentConnector && this.currentConnector.isSyncing) {
      replyWith({
        success: null,
        error: `Impossible to start a new sync. Another sync is already running on connector ${this.currentConnector.type}`
      });
      return;
    }

    // Extract connector type
    const connectorType: ConnectorType = startSyncMessage.payload[0] as ConnectorType;

    // Find out which connector token to inject
    const connectorToken = ConnectorSyncService.TOKENS_MAP.get(connectorType);

    // Build connector config from startSyncMessage
    const connectorConfig: ConnectorConfig = this.buildConnectorConfig(startSyncMessage);

    // Resolve connector instance
    this.currentConnector = container.resolve(connectorToken);

    // And configure it
    this.currentConnector.configure(connectorConfig);

    // Sync !!
    this.currentConnector.sync().subscribe(
      (syncEvent: SyncEvent) => {
        const syncEventMessage: FlaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.SYNC_EVENT, syncEvent);
        this.ipcMessagesSender.send(syncEventMessage).then((renderedResponse: string) => {
          logger.debug(renderedResponse);
        });

        if (syncEvent.type === SyncEventType.ACTIVITY) {
          const activitySyncEvent = syncEvent as ActivitySyncEvent;
          logger.info(
            "[Connector (" + connectorType + ")]",
            `Notify to insert or update activity name: "${activitySyncEvent.activity.name}", started on "${activitySyncEvent.activity.start_time}", isNew: "${activitySyncEvent.isNew}"`
          );
        } else if (syncEvent.type === SyncEventType.ERROR) {
          logger.error("[Connector (" + connectorType + ")]", syncEvent);
        } else {
          logger.debug("[Connector (" + connectorType + ")]", syncEvent);
        }
      },
      (errorSyncEvent: ErrorSyncEvent) => {
        logger.error("[Connector (" + connectorType + ")]", errorSyncEvent);

        this.currentConnector = null;

        const errorSyncEventMessage: FlaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.SYNC_EVENT, errorSyncEvent);
        this.ipcMessagesSender.send(errorSyncEventMessage).then((renderedResponse: string) => {
          logger.debug(renderedResponse);
        });
      },
      () => {
        logger.info("[Connector (" + connectorType + ")]", "Sync done");

        this.currentConnector = null;

        const completeSyncEventMessage: FlaggedIpcMessage = new FlaggedIpcMessage(
          MessageFlag.SYNC_EVENT,
          new CompleteSyncEvent(connectorType, "Sync done")
        );
        this.ipcMessagesSender.send(completeSyncEventMessage).then((renderedResponse: string) => {
          logger.debug(renderedResponse);
        });
      }
    );

    replyWith({
      success: "Started sync of connector " + connectorType,
      error: null
    });
  }

  public stop(stopSyncMessage: FlaggedIpcMessage, replyWith: (promiseTronReply: PromiseTronReply) => void): void {
    const requestConnectorType = stopSyncMessage.payload[0] as ConnectorType;

    if (_.isEmpty(this.currentConnector)) {
      const errorMessage = "No existing connector found to stop sync";

      replyWith({
        success: null,
        error: errorMessage
      });

      logger.error(errorMessage);
    } else {
      if (this.currentConnector.type === requestConnectorType) {
        this.currentConnector.stop().then(
          () => {
            const successMessage = "Sync of connector '" + requestConnectorType + "' has been cancelled";
            replyWith({
              success: successMessage,
              error: null
            });

            logger.info(successMessage);
          },
          error => {
            replyWith({
              success: null,
              error: error
            });

            logger.error(error);
          }
        );
      } else {
        replyWith({
          success: null,
          error: `Trying to stop a sync on ${requestConnectorType} connector but current connector synced type is: ${this.currentConnector.type}`
        });
      }
    }
  }

  public computeActivity(
    computeActivityMessage: FlaggedIpcMessage,
    replyWith: (promiseTronReply: PromiseTronReply) => void
  ): void {
    let syncedActivityModel = computeActivityMessage.payload[0] as SyncedActivityModel;
    const athleteSnapshotModel = computeActivityMessage.payload[1] as AthleteSnapshotModel;
    const userSettingsModel = computeActivityMessage.payload[2] as DesktopUserSettingsModel;
    const streams = (computeActivityMessage.payload[3]
      ? computeActivityMessage.payload[3]
      : null) as ActivityStreamsModel;

    try {
      const analysisDataModel = ActivityComputer.calculate(
        syncedActivityModel,
        athleteSnapshotModel,
        userSettingsModel,
        streams
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

      replyWith({
        success: syncedActivityModel,
        error: null
      });
    } catch (error) {
      replyWith({
        success: null,
        error: error
      });
      logger.error(error);
    }
  }

  private buildConnectorConfig(startSyncMessage: FlaggedIpcMessage): ConnectorConfig {
    return {
      connectorSyncDateTime: startSyncMessage.payload[1] as ConnectorSyncDateTime,
      info: startSyncMessage.payload[2],
      athleteModel: startSyncMessage.payload[3] as AthleteModel,
      userSettingsModel: startSyncMessage.payload[4] as UserSettingsModel
    };
  }
}
