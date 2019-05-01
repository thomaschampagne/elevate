import { BaseConnector } from "./base.connector";
import { Subject } from "rxjs";
import { SyncEvent } from "../events";
import { NotImplementedException } from "../../exceptions";

export class StravaConnector extends BaseConnector {

	public static readonly ENABLED: boolean = true;
	public static readonly NAME: string = "STRAVA_CONNECTOR";

	public clientId: number;
	public clientSecret: string;
	public accessToken: string;
	public updateSyncedActivitiesNameAndType: boolean;

	constructor(priority: number, clientId: number, clientSecret: string, accessToken: string, updateSyncedActivitiesNameAndType: boolean) {
		super(StravaConnector.NAME, priority, StravaConnector.ENABLED);
		this.clientId = clientId;
		this.clientSecret = clientSecret;
		this.accessToken = accessToken;
		this.updateSyncedActivitiesNameAndType = updateSyncedActivitiesNameAndType;
	}

	public sync(): Subject<SyncEvent> {
		throw new NotImplementedException();
	}

}
