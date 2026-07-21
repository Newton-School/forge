// src/errors.ts
var NewtonAuthError = class extends Error {
  constructor(message) {
    super(message);
    this.name = new.target.name;
  }
};
var ConfigError = class extends NewtonAuthError {
};
var InvalidSessionError = class extends NewtonAuthError {
  constructor(message = "invalid session") {
    super(message);
  }
};
var InvalidStateError = class extends NewtonAuthError {
  constructor(message = "invalid state") {
    super(message);
  }
};
var InvalidCallbackAssertionError = class extends NewtonAuthError {
  constructor(message = "invalid callback assertion") {
    super(message);
  }
};

// src/crypto.ts
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual
} from "crypto";
var SESSION_WIRE_VERSION = "v2";
var GCM_TAG_LENGTH = 16;
function b64urlEncode(buf) {
  return Buffer.from(buf).toString("base64url");
}
function b64urlDecode(value) {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) throw new InvalidSessionError("invalid base64url");
  return Buffer.from(value, "base64url");
}
function keyFor(secret) {
  return createHash("sha256").update(secret).digest();
}
function encryptValue(payload, secret, aad) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFor(secret), nonce);
  cipher.setAAD(aad);
  const ct = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final(), cipher.getAuthTag()]);
  return `${SESSION_WIRE_VERSION}.${b64urlEncode(nonce)}.${b64urlEncode(ct)}`;
}
function decryptValue(value, secret, aad) {
  const parts = value.split(".");
  if (parts.length !== 3 || parts[0] !== SESSION_WIRE_VERSION) throw new InvalidSessionError();
  return gcmOpen(parts[1], parts[2], secret, aad, () => new InvalidSessionError());
}
function gcmOpen(nonceB64, ctB64, secret, aad, err) {
  let nonce;
  let ctWithTag;
  try {
    nonce = b64urlDecode(nonceB64);
    ctWithTag = b64urlDecode(ctB64);
  } catch {
    throw err();
  }
  if (ctWithTag.length < GCM_TAG_LENGTH) throw err();
  const ct = ctWithTag.subarray(0, ctWithTag.length - GCM_TAG_LENGTH);
  const tag = ctWithTag.subarray(ctWithTag.length - GCM_TAG_LENGTH);
  try {
    const decipher = createDecipheriv("aes-256-gcm", keyFor(secret), nonce);
    decipher.setAAD(aad);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]);
    return JSON.parse(plaintext.toString("utf8"));
  } catch {
    throw err();
  }
}
function signValue(payload, secret) {
  const payloadValue = b64urlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  const signature = createHmac("sha256", secret).update(payloadValue).digest("hex");
  return `${payloadValue}.${signature}`;
}
function verifySignedValue(value, secret) {
  const lastDot = value.lastIndexOf(".");
  if (!value || lastDot < 0) throw new InvalidSessionError();
  const payloadValue = value.slice(0, lastDot);
  const signature = Buffer.from(value.slice(lastDot + 1), "utf8");
  const expected = Buffer.from(createHmac("sha256", secret).update(payloadValue).digest("hex"), "utf8");
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) {
    throw new InvalidSessionError();
  }
  try {
    return JSON.parse(b64urlDecode(payloadValue).toString("utf8"));
  } catch {
    throw new InvalidSessionError();
  }
}
function decryptCallbackAssertion(identity, callbackSecret, clientId, expectedIssuer, nowSec = Math.floor(Date.now() / 1e3)) {
  if (!identity) throw new InvalidCallbackAssertionError();
  const parts = identity.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") throw new InvalidCallbackAssertionError();
  let aad;
  try {
    aad = b64urlDecode(parts[3]);
  } catch {
    throw new InvalidCallbackAssertionError();
  }
  if (aad.toString("utf8") !== clientId) {
    throw new InvalidCallbackAssertionError("assertion audience mismatch");
  }
  const assertion = gcmOpen(
    parts[1],
    parts[2],
    callbackSecret,
    aad,
    () => new InvalidCallbackAssertionError("assertion decryption failed")
  );
  if (assertion.aud !== clientId) throw new InvalidCallbackAssertionError("assertion aud mismatch");
  if (assertion.iss !== expectedIssuer) throw new InvalidCallbackAssertionError("assertion issuer mismatch");
  if (nowSec > assertion.exp) throw new InvalidCallbackAssertionError("assertion expired");
  if (assertion.iat > nowSec + 30) throw new InvalidCallbackAssertionError("assertion issued in future");
  if (assertion.authenticated && (!assertion.sub || !assertion.platform_token)) {
    throw new InvalidCallbackAssertionError("assertion missing required fields");
  }
  return assertion;
}
function deriveIssuerFromBaseUrl(baseUrl) {
  try {
    return new URL(baseUrl).origin;
  } catch {
    throw new ConfigError("invalid newton api base");
  }
}

// src/cookies.ts
var STATE_COOKIE_TTL_SECONDS = 300;
function nowSeconds() {
  return Math.floor(Date.now() / 1e3);
}
function buildStateCookieValue(state, redirectUri, secret, nowSec = nowSeconds()) {
  const payload = { state, redirect_uri: redirectUri, exp: nowSec + STATE_COOKIE_TTL_SECONDS };
  return signValue(payload, secret);
}
function parseStateCookieValue(value, secret, nowSec = nowSeconds()) {
  let payload;
  try {
    payload = verifySignedValue(value, secret);
  } catch {
    throw new InvalidStateError();
  }
  if (nowSec > payload.exp) throw new InvalidStateError();
  return payload;
}
function buildSessionCookieValue(uid, platformToken, authorized, sessionTtlSeconds, secret, clientId, nowSec = nowSeconds()) {
  const payload = {
    uid,
    platform_token: platformToken,
    authorized,
    session_ttl_seconds: sessionTtlSeconds,
    issued_at: nowSec,
    nonce: b64urlEncode(randomBytes(16))
  };
  return encryptValue(payload, secret, Buffer.from(clientId, "utf8"));
}
function parseSessionCookieValue(value, secret, clientId, nowSec = nowSeconds()) {
  const payload = decryptValue(value, secret, Buffer.from(clientId, "utf8"));
  if (payload.session_ttl_seconds <= 0 || nowSec > payload.issued_at + payload.session_ttl_seconds) {
    throw new InvalidSessionError();
  }
  if (!payload.uid || !payload.platform_token) throw new InvalidSessionError();
  return payload;
}
function setCookie(name, value, maxAge) {
  return { name, value, maxAge };
}
function deleteCookie(name) {
  return { name, value: "", maxAge: 0 };
}
function serializeCookie(cookie) {
  const parts = [`${cookie.name}=${cookie.value}`, "Path=/", `Max-Age=${Math.max(cookie.maxAge, 0)}`];
  if (cookie.maxAge <= 0) parts.push("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  parts.push("HttpOnly", "Secure", "SameSite=Lax");
  return parts.join("; ");
}
function parseCookieHeader(header) {
  const cookies = {};
  if (!header) return cookies;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const name = part.slice(0, eq).trim();
    if (!name) continue;
    cookies[name] = part.slice(eq + 1).trim();
  }
  return cookies;
}

export {
  NewtonAuthError,
  ConfigError,
  InvalidSessionError,
  InvalidStateError,
  InvalidCallbackAssertionError,
  randomBytes,
  b64urlEncode,
  decryptCallbackAssertion,
  deriveIssuerFromBaseUrl,
  buildStateCookieValue,
  parseStateCookieValue,
  buildSessionCookieValue,
  parseSessionCookieValue,
  setCookie,
  deleteCookie,
  serializeCookie,
  parseCookieHeader
};
//# sourceMappingURL=chunk-R3TUS3GG.js.map