import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";
import { ConnectorInfo } from "@elevate/shared/sync/connectors/connector-info.model";
import { FileConnectorInfo } from "@elevate/shared/sync/connectors/file-connector-info.model";
import { StravaConnectorInfo } from "@elevate/shared/sync/connectors/strava-connector-info.model";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import BaseUserSettings = UserSettings.BaseUserSettings;

export interface ConnectorConfig {
  athleteModel: AthleteModel;
  userSettings: BaseUserSettings;
  syncFromDateTime: number;
  info: ConnectorInfo;
}

export interface StravaConnectorConfig extends ConnectorConfig {
  info: StravaConnectorInfo;
}

export interface FileConnectorConfig extends ConnectorConfig {
  info: FileConnectorInfo;
}
