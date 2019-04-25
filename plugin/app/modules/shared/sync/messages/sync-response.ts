import { SyncRequest } from "./sync-request";

export class SyncResponse<T> {

	public request: SyncRequest;
	public body: T;

	constructor(request: SyncRequest, body: T) {
		this.request = request;
		this.body = body;
	}
}
