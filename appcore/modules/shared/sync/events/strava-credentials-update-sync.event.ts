import { SyncEventType } from "./sync-event-type";
import { SyncEvent } from "./sync.event";
import { StravaConnectorInfo } from "../connectors/strava-connector-info.model";
import { ConnectorType } from "../connectors/connector-type.enum";

export class StravaCredentialsUpdateSyncEvent extends SyncEvent {
  public stravaConnectorInfo: StravaConnectorInfo;

  constructor(stravaConnectorInfo: StravaConnectorInfo, description: string = null) {
    super(SyncEventType.STRAVA_CREDENTIALS_UPDATE, ConnectorType.STRAVA, description);
    this.stravaConnectorInfo = stravaConnectorInfo;
  }
}
