import pako from "pako";
import { Base64 } from "./base64";

export class Gzip {
  /**
   * Gzip compress an object to bytes array
   */
  public static pack<T>(object: T): Uint8Array {
    return pako.gzip(JSON.stringify(object));
  }

  /**
   * Gzip decompress an object to bytes array
   */
  public static unpack<T>(bytes: Uint8Array): T {
    return JSON.parse(pako.ungzip(bytes, { to: "string" }));
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
