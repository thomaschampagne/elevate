import { SyncMessage } from "./sync-message";

export class SyncMessageResponse<T> {

	public message: SyncMessage;
	public body: T;

	constructor(message: SyncMessage, body: T) {
		this.message = message;
		this.body = body;
	}
}
