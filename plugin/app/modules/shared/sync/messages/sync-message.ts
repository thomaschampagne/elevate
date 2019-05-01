export class SyncMessage {

	public static readonly FLAG_LINK_STRAVA_CONNECTOR: string = "LINK_STRAVA";
	public static readonly FLAG_START_SYNC: string = "START_SYNC";
	public static readonly FLAG_SYNC_EVENT: string = "SYNC_EVENT";
	public static readonly FLAG_GET_ACTIVITY: string = "GET_ACTIVITY";

	public flag: string;
	public payload: unknown[];

	constructor(flag: string, ...payload: unknown[]) {
		this.flag = flag;
		this.payload = payload;
	}
}
