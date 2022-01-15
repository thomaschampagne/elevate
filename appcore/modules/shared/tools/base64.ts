export class Base64 {
  private static readonly characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

  public static encode(input: string): string {
    let result = "";
    let i = 0;
    do {
      let a = input.charCodeAt(i++);
      let b = input.charCodeAt(i++);
      let c = input.charCodeAt(i++);

      a = a ? a : 0;
      b = b ? b : 0;
      c = c ? c : 0;

      const b1 = (a >> 2) & 0x3f;
      const b2 = ((a & 0x3) << 4) | ((b >> 4) & 0xf);
      let b3 = ((b & 0xf) << 2) | ((c >> 6) & 0x3);
      let b4 = c & 0x3f;

      if (!b) {
        b3 = b4 = 64;
      } else if (!c) {
        b4 = 64;
      }

      result +=
        Base64.characters.charAt(b1) +
        Base64.characters.charAt(b2) +
        Base64.characters.charAt(b3) +
        Base64.characters.charAt(b4);
    } while (i < input.length);

    return result;
  }

  public static decode(input: string): string {
    let result = "";

    let i = 0;
    do {
      const b1 = Base64.characters.indexOf(input.charAt(i++));
      const b2 = Base64.characters.indexOf(input.charAt(i++));
      const b3 = Base64.characters.indexOf(input.charAt(i++));
      const b4 = Base64.characters.indexOf(input.charAt(i++));

      const a = ((b1 & 0x3f) << 2) | ((b2 >> 4) & 0x3);
      const b = ((b2 & 0xf) << 4) | ((b3 >> 2) & 0xf);
      const c = ((b3 & 0x3) << 6) | (b4 & 0x3f);

      result += String.fromCharCode(a) + (b ? String.fromCharCode(b) : "") + (c ? String.fromCharCode(c) : "");
    } while (i < input.length);

    return result;
  }
}
