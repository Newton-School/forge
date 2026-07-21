"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ConfigError: () => ConfigError,
  InvalidCallbackAssertionError: () => InvalidCallbackAssertionError,
  InvalidSessionError: () => InvalidSessionError,
  InvalidStateError: () => InvalidStateError,
  NewtonAuth: () => NewtonAuth,
  NewtonAuthError: () => NewtonAuthError,
  deleteCookie: () => deleteCookie,
  parseCookieHeader: () => parseCookieHeader,
  serializeCookie: () => serializeCookie,
  setCookie: () => setCookie
});
module.exports = __toCommonJS(index_exports);

// src/cache.ts
function approximateEntrySize(key, value) {
  return 128 + key.length + value.uid.length + value.firstName.length + value.lastName.length + value.email.length + 64;
}
var LruCache = class {
  maxBytes;
  size = 0;
  entries = /* @__PURE__ */ new Map();
  constructor(maxMb) {
    this.maxBytes = Math.max(maxMb, 0) * 1024 * 1024;
  }
  get(key, nowMs = Date.now()) {
    const entry = this.entries.get(key);
    if (!entry) return null;
    const ttl = entry.value.clientCacheTtlSeconds;
    if (ttl <= 0 || nowMs - entry.cachedAtMs > ttl * 1e3) {
      this.remove(key, entry);
      return null;
    }
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }
  set(key, value, nowMs = Date.now()) {
    const existing = this.entries.get(key);
    if (existing) this.remove(key, existing);
    const entry = { value, cachedAtMs: nowMs, approxSize: approximateEntrySize(key, value) };
    this.entries.set(key, entry);
    this.size += entry.approxSize;
    this.evict();
  }
  evict() {
    while (this.size > this.maxBytes && this.entries.size > 0) {
      const oldestKey = this.entries.keys().next().value;
      this.remove(oldestKey, this.entries.get(oldestKey));
    }
  }
  remove(key, entry) {
    this.entries.delete(key);
    this.size -= entry.approxSize;
  }
};

// src/crypto.ts
var import_node_crypto = require("crypto");

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
  return (0, import_node_crypto.createHash)("sha256").update(secret).digest();
}
function encryptValue(payload, secret, aad) {
  const nonce = (0, import_node_crypto.randomBytes)(12);
  const cipher = (0, import_node_crypto.createCipheriv)("aes-256-gcm", keyFor(secret), nonce);
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
    const decipher = (0, import_node_crypto.createDecipheriv)("aes-256-gcm", keyFor(secret), nonce);
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
  const signature = (0, import_node_crypto.createHmac)("sha256", secret).update(payloadValue).digest("hex");
  return `${payloadValue}.${signature}`;
}
function verifySignedValue(value, secret) {
  const lastDot = value.lastIndexOf(".");
  if (!value || lastDot < 0) throw new InvalidSessionError();
  const payloadValue = value.slice(0, lastDot);
  const signature = Buffer.from(value.slice(lastDot + 1), "utf8");
  const expected = Buffer.from((0, import_node_crypto.createHmac)("sha256", secret).update(payloadValue).digest("hex"), "utf8");
  if (signature.length !== expected.length || !(0, import_node_crypto.timingSafeEqual)(signature, expected)) {
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

// src/config.ts
function resolveConfig(cfg) {
  const resolved = {
    clientId: cfg.clientId,
    clientSecret: cfg.clientSecret,
    callbackSecret: cfg.callbackSecret,
    newtonApiBase: (cfg.newtonApiBase ?? "").replace(/\/+$/, ""),
    sessionSigningSecret: cfg.sessionSigningSecret || cfg.clientSecret,
    loginPath: cfg.loginPath ?? "/newton/login",
    callbackPath: cfg.callbackPath ?? "/newton/callback",
    sessionCookieName: cfg.sessionCookieName ?? "newton_session",
    stateCookieName: cfg.stateCookieName ?? "newton_state",
    cacheMaxMb: cfg.cacheMaxMb ?? 1,
    authTimeoutMs: cfg.authTimeoutMs ?? 1e4,
    fetch: cfg.fetch ?? globalThis.fetch,
    issuer: ""
  };
  if (!resolved.clientId) throw new ConfigError("client id is required");
  if (!resolved.clientSecret) throw new ConfigError("client secret is required");
  if (!resolved.callbackSecret) throw new ConfigError("callback secret is required");
  if (!resolved.newtonApiBase) throw new ConfigError("newton api base is required");
  if (!resolved.loginPath.startsWith("/")) throw new ConfigError("login path must start with /");
  if (!resolved.callbackPath.startsWith("/")) throw new ConfigError("callback path must start with /");
  if (resolved.cacheMaxMb < 0) throw new ConfigError("cache max mb must be >= 0");
  if (resolved.authTimeoutMs <= 0) throw new ConfigError("auth timeout must be > 0");
  resolved.issuer = deriveIssuerFromBaseUrl(resolved.newtonApiBase);
  return resolved;
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
    nonce: b64urlEncode((0, import_node_crypto.randomBytes)(16))
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

// src/http-client.ts
var AuthHttpClient = class {
  constructor(config) {
    this.config = config;
  }
  config;
  async authCheck(uid, platformToken) {
    const { newtonApiBase, clientId, clientSecret, authTimeoutMs, fetch } = this.config;
    const response = await fetch(`${newtonApiBase}/platform-auth/auth/check/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64")
      },
      body: JSON.stringify({ uid, platform_token: platformToken }),
      signal: AbortSignal.timeout(authTimeoutMs)
    });
    if (response.status === 401) {
      return {
        authenticated: false,
        authorized: false,
        uid,
        firstName: "",
        lastName: "",
        email: "",
        clientCacheTtlSeconds: 60,
        sessionTtlSeconds: 86400,
        shouldClearSession: true
      };
    }
    if (response.status < 200 || response.status >= 300) {
      throw new NewtonAuthError(`auth check failed with status ${response.status}`);
    }
    const wire = await response.json();
    return {
      authenticated: wire.authenticated ?? false,
      authorized: wire.authorized ?? false,
      uid: wire.uid ?? "",
      firstName: wire.first_name ?? "",
      lastName: wire.last_name ?? "",
      email: wire.email ?? "",
      clientCacheTtlSeconds: wire.client_cache_ttl_seconds ?? 0,
      sessionTtlSeconds: wire.session_ttl_seconds ?? 0,
      shouldClearSession: wire.should_clear_session ?? false
    };
  }
};

// src/core.ts
var NewtonAuth = class {
  config;
  httpClient;
  cache;
  constructor(cfg) {
    this.config = resolveConfig(cfg);
    this.httpClient = new AuthHttpClient(this.config);
    this.cache = new LruCache(this.config.cacheMaxMb);
  }
  async authenticate(req) {
    const cookieValue = req.cookies[this.config.sessionCookieName];
    if (!cookieValue) {
      return emptyResult(false);
    }
    let session;
    try {
      session = parseSessionCookieValue(cookieValue, this.config.sessionSigningSecret, this.config.clientId);
    } catch {
      return emptyResult(true);
    }
    const cached = this.cache.get(session.uid);
    if (cached) {
      return authCheckToResult(cached, session);
    }
    const authCheck = await this.httpClient.authCheck(session.uid, session.platform_token);
    this.cache.set(session.uid, authCheck);
    return authCheckToResult(authCheck, session);
  }
  buildLoginRedirect(req, redirectUri) {
    const state = b64urlEncode((0, import_node_crypto.randomBytes)(24));
    const postLoginRedirect = redirectUri || currentPath(req);
    const stateCookieValue = buildStateCookieValue(state, postLoginRedirect, this.config.sessionSigningSecret);
    const location = new URL(`${this.config.newtonApiBase}/platform-auth/login`);
    location.searchParams.set("client_id", this.config.clientId);
    location.searchParams.set("state", state);
    location.searchParams.set("redirect_uri", `${req.proto}://${req.host}${this.config.callbackPath}`);
    return {
      location: location.toString(),
      stateCookie: setCookie(this.config.stateCookieName, stateCookieValue, 300)
    };
  }
  async handleCallback(req) {
    const stateParam = req.query["state"] ?? "";
    const identity = req.query["identity"] ?? "";
    const stateCookieValue = req.cookies[this.config.stateCookieName];
    if (!stateCookieValue) throw new InvalidStateError();
    const stateData = parseStateCookieValue(stateCookieValue, this.config.sessionSigningSecret);
    if (!stateParam || stateParam !== stateData.state) throw new InvalidStateError();
    const assertion = decryptCallbackAssertion(
      identity,
      this.config.callbackSecret,
      this.config.clientId,
      this.config.issuer
    );
    if (!assertion.authenticated) {
      return {
        authenticated: false,
        redirectUri: stateData.redirect_uri,
        user: null,
        clientCacheTtlSeconds: assertion.client_cache_ttl_seconds,
        sessionTtlSeconds: assertion.session_ttl_seconds,
        sessionCookie: null,
        clearStateCookie: deleteCookie(this.config.stateCookieName)
      };
    }
    const sessionCookieValue = buildSessionCookieValue(
      assertion.sub,
      assertion.platform_token,
      assertion.authorized,
      assertion.session_ttl_seconds,
      this.config.sessionSigningSecret,
      this.config.clientId
    );
    this.cache.set(assertion.sub, {
      authenticated: assertion.authenticated,
      authorized: assertion.authorized,
      uid: assertion.sub,
      firstName: assertion.first_name ?? "",
      lastName: assertion.last_name ?? "",
      email: assertion.email ?? "",
      clientCacheTtlSeconds: assertion.client_cache_ttl_seconds,
      sessionTtlSeconds: assertion.session_ttl_seconds,
      shouldClearSession: false
    });
    return {
      authenticated: true,
      redirectUri: stateData.redirect_uri,
      user: {
        uid: assertion.sub,
        authorized: assertion.authorized,
        firstName: assertion.first_name ?? "",
        lastName: assertion.last_name ?? "",
        email: assertion.email ?? ""
      },
      clientCacheTtlSeconds: assertion.client_cache_ttl_seconds,
      sessionTtlSeconds: assertion.session_ttl_seconds,
      sessionCookie: setCookie(this.config.sessionCookieName, sessionCookieValue, assertion.session_ttl_seconds),
      clearStateCookie: deleteCookie(this.config.stateCookieName)
    };
  }
  clearSessionCookies() {
    return [deleteCookie(this.config.sessionCookieName), deleteCookie(this.config.stateCookieName)];
  }
  validateLoginRedirectTarget(next) {
    if (next === this.config.loginPath) {
      throw new NewtonAuthError("invalid login redirect target");
    }
  }
};
function emptyResult(shouldClearSession) {
  return {
    authenticated: false,
    authorized: false,
    shouldClearSession,
    user: null,
    clientCacheTtlSeconds: 0,
    sessionTtlSeconds: 0
  };
}
function authCheckToResult(data, session) {
  return {
    authenticated: data.authenticated,
    authorized: data.authorized,
    shouldClearSession: data.shouldClearSession,
    clientCacheTtlSeconds: data.clientCacheTtlSeconds,
    sessionTtlSeconds: data.sessionTtlSeconds || session.session_ttl_seconds,
    user: data.authenticated ? {
      uid: session.uid,
      authorized: data.authorized,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email
    } : null
  };
}
function currentPath(req) {
  const qs = new URLSearchParams(req.query).toString();
  return qs ? `${req.path}?${qs}` : req.path;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ConfigError,
  InvalidCallbackAssertionError,
  InvalidSessionError,
  InvalidStateError,
  NewtonAuth,
  NewtonAuthError,
  deleteCookie,
  parseCookieHeader,
  serializeCookie,
  setCookie
});
//# sourceMappingURL=index.cjs.map