import crypto from "node:crypto";

/**
 * Pure Discord interaction helpers — Ed25519 signature verification + normalization.
 * No I/O, unit-tested. Discord signs each interaction with the application's public
 * key over `timestamp + rawBody`; we verify with Node's native Ed25519 (no deps).
 */

// DER/SPKI header for a raw 32-byte Ed25519 public key.
const SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function publicKeyFromHex(hex: string): crypto.KeyObject {
  const der = Buffer.concat([SPKI_PREFIX, Buffer.from(hex, "hex")]);
  return crypto.createPublicKey({ key: der, format: "der", type: "spki" });
}

/** Verify `X-Signature-Ed25519` over (`timestamp` + raw body) against the app public key. */
export function verifyDiscordSignature(
  publicKeyHex: string,
  timestamp: string | undefined,
  rawBody: Buffer | string,
  signatureHex: string | undefined,
): boolean {
  if (!publicKeyHex || !timestamp || !signatureHex) return false;
  try {
    const message = Buffer.concat([Buffer.from(timestamp), Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody)]);
    return crypto.verify(null, message, publicKeyFromHex(publicKeyHex), Buffer.from(signatureHex, "hex"));
  } catch {
    return false; // malformed key/signature hex
  }
}

// Discord interaction & response type constants.
export const INTERACTION_PING = 1;
export const INTERACTION_APP_COMMAND = 2;
export const INTERACTION_MESSAGE_COMPONENT = 3;
export const RESPONSE_PONG = 1;
export const RESPONSE_MESSAGE = 4;

export interface NormalizedInteraction {
  isPing: boolean;
  channelId: string | null;
  discordUserId: string | null;
  commandName: string | null;
}

/** Pull the fields we record from an interaction payload (PING carries none). */
export function normalizeInteraction(payload: unknown): NormalizedInteraction {
  const p = (payload ?? {}) as Record<string, any>;
  return {
    isPing: p.type === INTERACTION_PING,
    channelId: p.channel_id ?? null,
    discordUserId: p.member?.user?.id ?? p.user?.id ?? null,
    commandName: p.data?.name ?? null,
  };
}
