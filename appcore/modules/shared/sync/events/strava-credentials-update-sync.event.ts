import { SyncEventType } from "./sync-event-type";
import { ConnectorType } from "../connectors";
import { SyncEvent } from "./sync.event";
import { StravaApiCredentials } from "../strava";

export class StravaCredentialsUpdateSyncEvent extends SyncEvent {

	public stravaApiCredentials: StravaApiCredentials;

	constructor(stravaApiCredentials: StravaApiCredentials, description: string = null) {
		super(SyncEventType.STRAVA_CREDENTIALS_UPDATE, ConnectorType.STRAVA, description);
		this.stravaApiCredentials = stravaApiCredentials;
	}
}
