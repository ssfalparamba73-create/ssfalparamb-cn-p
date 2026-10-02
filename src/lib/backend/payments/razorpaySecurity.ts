import { createHmac, timingSafeEqual } from "node:crypto";

const SHA256_HEX = /^[a-f0-9]{64}$/i;

export function createRazorpaySignature(secret: string, message: string): string {
  return createHmac("sha256", secret).update(message, "utf8").digest("hex");
}

export function verifyRazorpaySignature(
  secret: string,
  message: string,
  suppliedSignature: string
): boolean {
  if (!secret || !SHA256_HEX.test(suppliedSignature)) return false;

  const expected = Buffer.from(createRazorpaySignature(secret, message), "hex");
  const supplied = Buffer.from(suppliedSignature, "hex");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
