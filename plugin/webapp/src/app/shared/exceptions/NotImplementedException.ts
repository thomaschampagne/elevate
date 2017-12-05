export class NotImplementedException extends Error {
	constructor() {
		super("Not implemented");
		Object.setPrototypeOf(this, NotImplementedException.prototype); // Set the prototype explicitly.
	}
}
