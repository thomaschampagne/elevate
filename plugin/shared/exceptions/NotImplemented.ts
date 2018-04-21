export class NotImplemented extends Error {
	constructor(message?: string) {
		super("Not implemented method" + (message) ? " " + message : "");
	}
}
