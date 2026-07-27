import { ConnectorInfo } from "./connector-info.model";
import { GarminAccount } from "../garmin/garmin-account";

/**
 * Persisted state for the Garmin connector.
 */
export class GarminConnectorInfo extends ConnectorInfo {
  public static readonly DEFAULT_MODEL: GarminConnectorInfo = new GarminConnectorInfo(null);

  constructor(
    public username: string | null,
    public garminAccount: GarminAccount | null = null,
    public updateExistingNames: boolean = true
  ) {
    super();
    this.username = username;
    this.garminAccount = garminAccount;
    this.updateExistingNames = updateExistingNames;
  }
}
