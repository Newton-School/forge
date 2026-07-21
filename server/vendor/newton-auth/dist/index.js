import {
  ConfigError,
  InvalidCallbackAssertionError,
  InvalidSessionError,
  InvalidStateError,
  NewtonAuthError,
  b64urlEncode,
  buildSessionCookieValue,
  buildStateCookieValue,
  decryptCallbackAssertion,
  deleteCookie,
  deriveIssuerFromBaseUrl,
  parseCookieHeader,
  parseSessionCookieValue,
  parseStateCookieValue,
  randomBytes,
  serializeCookie,
  setCookie
} from "./chunk-R3TUS3GG.js";

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
    const state = b64urlEncode(randomBytes(24));
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
export {
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
};
//# sourceMappingURL=index.js.map