import { SyncEventType } from "./sync-event-type";
import { ConnectorType, StravaConnectorInfo } from "../connectors";
import { SyncEvent } from "./sync.event";

export class StravaCredentialsUpdateSyncEvent extends SyncEvent {
  public stravaConnectorInfo: StravaConnectorInfo;

  constructor(stravaConnectorInfo: StravaConnectorInfo, description: string = null) {
    super(SyncEventType.STRAVA_CREDENTIALS_UPDATE, ConnectorType.STRAVA, description);
    this.stravaConnectorInfo = stravaConnectorInfo;
  }
}
