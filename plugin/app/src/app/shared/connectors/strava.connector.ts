import { BaseConnector } from "./base.connector";
import { Subject } from "rxjs";
import { SyncEvent } from "../events/sync.event";

export class StravaConnector extends BaseConnector {

	public clientId: string;
	public clientSecret: string;
	public accessToken: string;
	public updateSyncedActivitiesNameAndType: boolean;

	public sync(): Subject<SyncEvent> {
		return undefined;
	}

}
