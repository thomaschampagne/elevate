import { ElevateException } from "./elevate.exception";

export class NotImplementedException extends ElevateException {

	public static readonly DEFAULT_MESSAGE: string = "NotImplementedException";

	constructor(message?: string) {
		message = !message ? NotImplementedException.DEFAULT_MESSAGE : NotImplementedException.DEFAULT_MESSAGE + ": " + message;
		super(message);
		Object.setPrototypeOf(this, NotImplementedException.prototype);
	}
}
