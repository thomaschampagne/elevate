import { gzip, inflate } from "pako";

export class Gzip {

	/**
	 * Gzip compress an object to base 64
	 * @param object
	 * @return base64 string
	 */
	public static toBase64<T>(object: T): string {
		return Gzip.encode64(gzip(JSON.stringify(object), {to: "string"}));
	}

	/**
	 * Gzip decompress a base 64 string to an object
	 * @param base64
	 * @return object of type {T}
	 */
	public static fromBase64<T>(base64: string): T {
		return JSON.parse(inflate(Gzip.decode64(base64), {to: "string"}));
	}

	/**
	 * Encode string to base64
	 * @param data
	 */
	public static encode64(data: string): string {
		if (typeof btoa !== "undefined") {
			return btoa(data);
		} else {
			return Buffer.from(data).toString("base64");
		}
	}

	/**
	 * Encode string to base64
	 * @param data
	 */
	public static decode64(data: string): string {
		if (typeof atob !== "undefined") {
			return atob(data);
		} else {
			return Buffer.from(data, "base64").toString();
		}
	}

	/**
	 * Gzip compress an object to binary
	 * @param object
	 * @return Uint8Array bin
	 */
	public static toBin<T>(object: T): Uint8Array {
		return gzip(JSON.stringify(object));
	}

	/**
	 * Gzip decompress binary to an object
	 * @param binary
	 * @return object of type {T}
	 */
	public static fromBin<T>(binary: Uint8Array): Uint8Array {
		// return inflate(binary);
		return null; // TODO !!
	}
}
