import crypto from "crypto";

const ALGO = "aes-256-gcm";

const getKey = () => {
  const source = process.env.PAYMENT_CONFIG_ENCRYPTION_KEY;
  if (!source) {
    throw new Error("Missing PAYMENT_CONFIG_ENCRYPTION_KEY");
  }
  return crypto.createHash("sha256").update(source).digest();
};

type Payload = {
  iv: string;
  tag: string;
  data: string;
};

export function encryptConfigObject(input: Record<string, string | undefined | null>) {
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGO, key, iv);

  const plaintext = JSON.stringify(input || {});
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  const payload: Payload = {
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  };

  return JSON.stringify(payload);
}

export function decryptConfigObject(encryptedText: string | null | undefined): Record<string, string> {
  if (!encryptedText) return {};

  const payload = JSON.parse(encryptedText) as Payload;
  if (!payload?.iv || !payload?.tag || !payload?.data) {
    return {};
  }

  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(payload.iv, "base64"));
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.data, "base64")),
    decipher.final(),
  ]).toString("utf8");

  return JSON.parse(decrypted) as Record<string, string>;
}
