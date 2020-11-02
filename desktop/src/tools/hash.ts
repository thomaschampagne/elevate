import crypto, { BinaryLike } from "crypto";

export class Hash {
  public static readonly SHA1: string = "sha1";

  public static apply(
    data: BinaryLike,
    algorithm: string = Hash.SHA1,
    options: { cut?: number; divide?: number } = {}
  ): string {
    const sha1 = crypto.createHash(algorithm).update(data).digest("hex");

    const hasCut = options.cut && options.cut > 0;
    const hasDivide = options.divide && options.divide > 0;

    if (hasCut && hasDivide) {
      throw new Error("Cannot cut and divide hash all at once. Choose 1 of these options only.");
    }

    if (hasCut) {
      return sha1.slice(0, options.cut);
    }

    if (hasDivide) {
      return sha1.slice(0, sha1.length / options.divide);
    }

    return sha1;
  }

  public static asObjectId(data: BinaryLike, algorithm: string = Hash.SHA1): string {
    return Hash.apply(data, algorithm, { cut: 24 });
  }
}
