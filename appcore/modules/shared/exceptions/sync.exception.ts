import { ElevateException } from "./elevate.exception";
import { ErrorSyncEvent } from "../sync/events/error-sync.event";

export class SyncException extends ElevateException {
  public errorSyncEvent: ErrorSyncEvent;

  constructor(message: string, errorSyncEvent: ErrorSyncEvent = null) {
    super(message);
    this.errorSyncEvent = errorSyncEvent;
  }

  public static fromError(error: Error): SyncException {
    const syncException = new SyncException(error.message);
    syncException.stack = error.stack;
    return syncException;
  }
}
