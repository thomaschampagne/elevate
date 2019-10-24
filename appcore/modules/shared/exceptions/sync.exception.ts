import { ErrorSyncEvent } from "../sync/events";
import { ElevateException } from "./elevate.exception";

export class SyncException extends ElevateException {

	constructor(message: string, errorSyncEvent: ErrorSyncEvent = null) {
		super(message);
		this.name = SyncException.name;
		this.errorSyncEvent = errorSyncEvent;
	}

	public errorSyncEvent: ErrorSyncEvent;

	public static fromError(error: Error): SyncException {
		const syncException = new SyncException(error.message);
		syncException.stack = error.stack;
		return syncException;
	}
}
