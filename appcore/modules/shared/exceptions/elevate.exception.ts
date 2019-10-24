export class ElevateException extends Error {

	constructor(message: string) {
		super(message);
		this.name = ElevateException.name;
	}
}
