export class SyncRequest {

	public static readonly START_SYNC: string = "START_SYNC";

	public request: string;
	public params: any[];

	constructor(request: string, ...params: any[]) {
		this.request = request;
		this.params = params;
	}
}
