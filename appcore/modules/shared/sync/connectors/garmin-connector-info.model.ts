import { ConnectorInfo } from "./connector-info.model";

/**
 * Settings of the Garmin connector, based on Garmin Connect "Personal API".
 *
 * The user creates a personal API key on Garmin Connect (Settings > Personal API Key) and pastes it here.
 * The key is exchanged by the desktop app for a 24h access token on each sync. Garmin issues no refresh token,
 * so the key itself is the only credential to keep. Keys expire after 30 days to 1 year (chosen by the user).
 */
export class GarminConnectorInfo extends ConnectorInfo {
  public static readonly DEFAULT_MODEL: GarminConnectorInfo = new GarminConnectorInfo(null);

  public apiKey: string | null;
  public updateExistingNamesTypes: boolean;

  constructor(apiKey: string | null, updateExistingNamesTypes: boolean = true) {
    super();
    this.apiKey = apiKey;
    this.updateExistingNamesTypes = updateExistingNamesTypes;
  }
}
