export class Identifier {
	/**
	 * Generate a unique id based on random and current time
	 */
	public static generate(length?: number): string {
		length = (length > 0) ? length : 16;
		return ((Math.random() * Date.now()).toString(36) + (Math.random()).toString(36)).replace(/\./g, "").slice(0, length);
	}
}
