import { BaseConnector } from "./base.connector";
import { Subject } from "rxjs";
import { NotImplementedException } from "@elevate/shared/exceptions";
import { ConnectorType, SyncEvent } from "@elevate/shared/sync";

export class StravaConnector extends BaseConnector {

	public static readonly ENABLED: boolean = true;

	public clientId: number;
	public clientSecret: string;
	public accessToken: string;
	public updateSyncedActivitiesNameAndType: boolean;

	constructor(priority: number, clientId: number, clientSecret: string, accessToken: string, updateSyncedActivitiesNameAndType: boolean) {
		super(ConnectorType.STRAVA, priority, StravaConnector.ENABLED);
		this.clientId = clientId;
		this.clientSecret = clientSecret;
		this.accessToken = accessToken;
		this.updateSyncedActivitiesNameAndType = updateSyncedActivitiesNameAndType;
	}

	public sync(): Subject<SyncEvent> {
		throw new NotImplementedException();
	}

}
