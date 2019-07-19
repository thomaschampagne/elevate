import { ErrorSyncEvent } from "../sync/events";
import { ElevateException } from "./elevate.exception";

export class SyncException extends ElevateException {

	constructor(message: string, errorSyncEvent: ErrorSyncEvent = null) {
		super(message);
		this.errorSyncEvent = errorSyncEvent;
		Object.setPrototypeOf(this, SyncException.prototype);
	}

	public errorSyncEvent: ErrorSyncEvent;

	public static fromError(error: Error): SyncException {
		const syncException = new SyncException(error.message);
		syncException.name = error.name;
		syncException.stack = error.stack;
		syncException.stack = error.stack;
		return syncException;
	}
}
