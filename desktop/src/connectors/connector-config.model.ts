import { ConnectorInfo, FileConnectorInfo, StravaConnectorInfo } from "@elevate/shared/sync";
import { AthleteModel, UserSettings } from "@elevate/shared/models";
import UserSettingsModel = UserSettings.UserSettingsModel;

export interface ConnectorConfig {
  athleteModel: AthleteModel;
  userSettingsModel: UserSettingsModel;
  syncFromDateTime: number;
  info: ConnectorInfo;
}

export interface StravaConnectorConfig extends ConnectorConfig {
  info: StravaConnectorInfo;
}

export interface FileConnectorConfig extends ConnectorConfig {
  info: FileConnectorInfo;
}
