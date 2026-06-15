import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { normalizeInteraction, verifyDiscordSignature } from "./discord.webhook.js";

// Generate an Ed25519 keypair and expose the raw public key as hex (as Discord does).
function keypair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const rawPub = publicKey.export({ format: "der", type: "spki" }).subarray(-32).toString("hex");
  return { rawPub, privateKey };
}
function sign(privateKey: crypto.KeyObject, timestamp: string, body: string) {
  return crypto.sign(null, Buffer.from(timestamp + body), privateKey).toString("hex");
}

describe("verifyDiscordSignature", () => {
  const { rawPub, privateKey } = keypair();
  const ts = "1700000000";
  const body = JSON.stringify({ type: 1 });

  it("accepts a valid Ed25519 signature over timestamp+body", () => {
    expect(verifyDiscordSignature(rawPub, ts, body, sign(privateKey, ts, body))).toBe(true);
  });

  it("rejects a tampered body, wrong timestamp, or missing parts", () => {
    const sig = sign(privateKey, ts, body);
    expect(verifyDiscordSignature(rawPub, ts, body + "x", sig)).toBe(false);
    expect(verifyDiscordSignature(rawPub, "1700000001", body, sig)).toBe(false);
    expect(verifyDiscordSignature(rawPub, ts, body, undefined)).toBe(false);
    expect(verifyDiscordSignature(rawPub, undefined, body, sig)).toBe(false);
  });

  it("rejects a signature from a different key", () => {
    const other = keypair();
    expect(verifyDiscordSignature(rawPub, ts, body, sign(other.privateKey, ts, body))).toBe(false);
  });

  it("does not throw on malformed hex", () => {
    expect(verifyDiscordSignature("zz", ts, body, "zz")).toBe(false);
  });
});

describe("normalizeInteraction", () => {
  it("flags PING and extracts channel/user/command otherwise", () => {
    expect(normalizeInteraction({ type: 1 }).isPing).toBe(true);
    const n = normalizeInteraction({ type: 2, channel_id: "c1", member: { user: { id: "u1" } }, data: { name: "status" } });
    expect(n).toMatchObject({ isPing: false, channelId: "c1", discordUserId: "u1", commandName: "status" });
  });
});
