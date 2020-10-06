import { SyncEventType } from "./sync-event-type";
import { ConnectorType } from "../connectors";
import { SyncEvent } from "./sync.event";
import { StravaConnectorInfo } from "../strava";

export class StravaCredentialsUpdateSyncEvent extends SyncEvent {
  public stravaConnectorInfo: StravaConnectorInfo;

  constructor(stravaConnectorInfo: StravaConnectorInfo, description: string = null) {
    super(SyncEventType.STRAVA_CREDENTIALS_UPDATE, ConnectorType.STRAVA, description);
    this.stravaConnectorInfo = stravaConnectorInfo;
  }
}
