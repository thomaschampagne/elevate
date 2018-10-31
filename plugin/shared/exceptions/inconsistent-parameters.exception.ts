export class InconsistentParametersException extends Error {
    constructor(message?: string) {
		if (!message) {
			super("InconsistentParametersException");
        } else {
			super("InconsistentParametersException: " + message);
        }
    }
}
