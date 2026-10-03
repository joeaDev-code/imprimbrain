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
  const payload = Buffer.from(orderId).toString(
    "base64url",
  );

  const signature = sign(payload);

  return `${payload}.${signature}`;
}

export function verifyPublicReceiptToken(
  token: string,
) {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
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
    return Buffer.from(payload, "base64url").toString(
      "utf8",
    );
  } catch {
    return null;
  }
}