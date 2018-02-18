export class InconsistentParameters extends Error {
    constructor(message?: string) {
		if (!message) {
            super("InconsistentParameters");
        } else {
            super("InconsistentParameters: " + message);
        }
    }
}
