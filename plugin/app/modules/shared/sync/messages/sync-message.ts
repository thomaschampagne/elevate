export class SyncMessage {

	public static readonly START_SYNC: string = "START_SYNC";
	public static readonly SYNC_EVENT: string = "SYNC_EVENT";
	public static readonly GET_ACTIVITY: string = "GET_ACTIVITY";

	public flag: string;
	public payload: unknown[];

	constructor(flag: string, ...payload: unknown[]) {
		this.flag = flag;
		this.payload = payload;
	}
}
