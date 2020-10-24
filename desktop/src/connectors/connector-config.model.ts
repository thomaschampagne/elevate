import { ConnectorInfo, FileSystemConnectorInfo, StravaConnectorInfo } from "@elevate/shared/sync";
import { AthleteModel, ConnectorSyncDateTime, UserSettings } from "@elevate/shared/models";
import UserSettingsModel = UserSettings.UserSettingsModel;

export interface ConnectorConfig {
  athleteModel: AthleteModel;
  userSettingsModel: UserSettingsModel;
  connectorSyncDateTime: ConnectorSyncDateTime;
  info: ConnectorInfo;
}

export interface StravaConnectorConfig extends ConnectorConfig {
  info: StravaConnectorInfo;
}

export interface FileSystemConnectorConfig extends ConnectorConfig {
  info: FileSystemConnectorInfo;
}
