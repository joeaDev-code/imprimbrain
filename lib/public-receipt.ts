import crypto from "crypto";

function getSecret() {
  const secret = process.env.PUBLIC_RECEIPT_SECRET;

  if (!secret) {
    throw new Error(
      "PUBLIC_RECEIPT_SECRET est manquant.",
    );
  }

  return secret;
}

function sign(value: string) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(value)
    .digest("base64url");
}

export function createPublicReceiptToken(
  orderId: string,
) {
  const payload = Buffer.from(JSON.stringify({
    orderId,
    expiresAt: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  })).toString(
    "base64url",
  );

  const signature = sign(payload);

  return `${payload}.${signature}`;
}

export function verifyPublicReceiptToken(
  token: string,
) {
  const [payload, signature, extra] = token.split(".");

  if (!payload || !signature || extra) {
    return null;
  }

  const expected = sign(payload);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (
    a.length !== b.length ||
    !crypto.timingSafeEqual(a, b)
  ) {
    return null;
  }

  try {
    const decoded: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    if (
      !decoded ||
      typeof decoded !== "object" ||
      !("orderId" in decoded) ||
      typeof decoded.orderId !== "string" ||
      !decoded.orderId ||
      !("expiresAt" in decoded) ||
      typeof decoded.expiresAt !== "number" ||
      decoded.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return decoded.orderId;
  } catch {
    return null;
  }
}