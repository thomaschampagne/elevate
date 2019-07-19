import { ElevateException } from "./elevate.exception";

export class InconsistentParametersException extends ElevateException {

	public static readonly DEFAULT_MESSAGE: string = "InconsistentParametersException";

	constructor(message?: string) {
		message = !message ? InconsistentParametersException.DEFAULT_MESSAGE : InconsistentParametersException.DEFAULT_MESSAGE + ": " + message;
		super(message);
		Object.setPrototypeOf(this, InconsistentParametersException.prototype);
	}
}
