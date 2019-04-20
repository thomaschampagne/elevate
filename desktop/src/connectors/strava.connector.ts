import { BaseConnector } from "./base.connector";
import { SyncEvent } from "@elevate/shared/events";
import { Subject } from "rxjs";

export class StravaConnector extends BaseConnector {

	public clientId: string;
	public clientSecret: string;
	public accessToken: string;
	public updateSyncedActivitiesNameAndType: boolean;

	public sync(): Subject<SyncEvent> {
		return undefined;
	}

}
