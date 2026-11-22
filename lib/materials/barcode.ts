import { Prisma } from "@prisma/client";

/**
 * Normalizes the QR / barcode sent by a client: trimmed, max 100 characters,
 * empty -> null. `undefined` means "not provided" (leave unchanged on update).
 */
export function parseBarcode(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const code = String(value).trim();
  if (!code) return null;
  return code.slice(0, 100);
}

/** True when a Prisma unique-constraint error comes from the (company, barcode) index. */
export function isDuplicateBarcodeError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return false;
  const target = (error.meta as { target?: unknown } | undefined)?.target;
  const text = Array.isArray(target) ? target.join(",") : String(target ?? "");
  return text.includes("barcode");
}

export const DUPLICATE_BARCODE_MESSAGE = "Ce code est déjà utilisé par un autre matériau.";
