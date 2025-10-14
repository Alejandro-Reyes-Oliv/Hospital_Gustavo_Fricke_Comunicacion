import crypto from "crypto";

export function verifyMetaSignature({ appSecret, rawBody, signatureHeader }) {
  if (!appSecret || !signatureHeader || !rawBody) return false;
  const raw = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, "utf8");
  const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(raw).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}
