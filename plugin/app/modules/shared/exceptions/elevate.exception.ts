export class ElevateException extends Error {
	constructor(message: string) {
		super(message);
		Object.setPrototypeOf(this, ElevateException.prototype);
	}
}
