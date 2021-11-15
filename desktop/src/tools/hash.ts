import crypto, { BinaryLike } from "crypto";

export class Hash {
  public static readonly SHA256: string = "sha256";
  public static readonly SHA512: string = "sha512";

  public static apply(
    data: BinaryLike,
    algorithm: string = Hash.SHA256,
    options: { cut?: number; divide?: number } = {}
  ): string {
    const sha256 = crypto.createHash(algorithm).update(data).digest("hex");

    const hasCut = options.cut && options.cut > 0;
    const hasDivide = options.divide && options.divide > 0;

    if (hasCut && hasDivide) {
      throw new Error("Cannot cut and divide hash all at once. Choose 1 of these options only.");
    }

    if (hasCut) {
      return sha256.slice(0, options.cut);
    }

    if (hasDivide) {
      return sha256.slice(0, sha256.length / options.divide);
    }

    return sha256;
  }

  public static asObjectId(data: BinaryLike, algorithm: string = Hash.SHA256): string {
    return Hash.apply(data, algorithm, { cut: 24 });
  }
}
