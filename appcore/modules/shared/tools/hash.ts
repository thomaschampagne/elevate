const hash = (data: string, algorithm = "SHA-256", asObjectId: boolean = false): Promise<string> => {
  const utf8 = new TextEncoder().encode(data);
  return crypto.subtle.digest(algorithm, utf8).then(hashBuffer => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashed = hashArray.map(bytes => bytes.toString(16).padStart(2, "0")).join("");
    return asObjectId ? hashed.slice(0, 24) : hashed;
  });
};

export const sha256 = (data: string, asObjectId: boolean = false): Promise<string> => {
  return hash(data, "SHA-256", asObjectId);
};
