import { container, inject, InjectionToken, singleton } from "tsyringe";
import { BaseConnector } from "./base.connector";
import { StravaConnector } from "./strava/strava.connector";
import { FileConnector } from "./file/file.connector";
import { ConnectorConfig } from "./connector-config.model";
import _ from "lodash";
import { IpcSyncMessageSender } from "../senders/ipc-sync-message.sender";
import { Logger } from "../logger";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { SyncEvent } from "@elevate/shared/sync/events/sync.event";
import { ConnectorInfo } from "@elevate/shared/sync/connectors/connector-info.model";
import { SyncEventType } from "@elevate/shared/sync/events/sync-event-type";
import { ActivitySyncEvent } from "@elevate/shared/sync/events/activity-sync.event";
import { CompleteSyncEvent } from "@elevate/shared/sync/events/complete-sync.event";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";
import { ErrorSyncEvent } from "@elevate/shared/sync/events/error-sync.event";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import BaseUserSettings = UserSettings.BaseUserSettings;

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
    connectorInfo: ConnectorInfo,
    athleteModel: AthleteModel,
    userSettings: BaseUserSettings,
    syncFromDateTime: number
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
      userSettings: userSettings,
      syncFromDateTime: syncFromDateTime,
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
            `Upsert of activity id: ${activitySyncEvent.activity.id}, name: ${activitySyncEvent.activity.name}, on: ${activitySyncEvent.activity.startTime}, isNew: ${activitySyncEvent.isNew}`
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
}
