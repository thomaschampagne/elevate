import { gzip, ungzip } from "pako";
import { Base64 } from "./base64";

export class Gzip {
  /**
   * Gzip compress an object to base 64
   */
  public static pack64<T>(object: T): string {
    return Gzip.encode64(gzip(JSON.stringify(object), { to: "string" }));
  }

  /**
   * Gzip decompress a base 64 string to an object
   */
  public static unpack64<T>(base64: string): T {
    return JSON.parse(ungzip(Gzip.decode64(base64), { to: "string" }));
  }

  /**
   * Gzip compress an object to bytes array
   */
  public static packAsBytes<T>(object: T): Uint8Array {
    return gzip(JSON.stringify(object));
  }

  /**
   * Gzip decompress an object to bytes array
   */
  public static unpackFromBytes<T>(bytes: Uint8Array): T {
    return JSON.parse(ungzip(bytes, { to: "string" }));
  }

  /**
   * Encode string to base64
   */
  private static encode64(data: string): string {
    if (typeof Buffer === "undefined") {
      return Base64.encode(data);
    } else {
      return Buffer.from(data).toString("base64");
    }
  }

  /**
   * Encode string to base64
   */
  private static decode64(data: string): string {
    if (typeof Buffer === "undefined") {
      return Base64.decode(data);
    } else {
      return Buffer.from(data, "base64").toString();
    }
  }
}
