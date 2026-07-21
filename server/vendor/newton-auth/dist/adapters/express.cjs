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

// src/adapters/express.ts
var express_exports = {};
__export(express_exports, {
  createExpressAdapter: () => createExpressAdapter
});
module.exports = __toCommonJS(express_exports);

// src/crypto.ts
var import_node_crypto = require("crypto");

// src/cookies.ts
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

// src/adapters/http.ts
function firstForwardedValue(header) {
  if (!header) return "";
  const value = Array.isArray(header) ? header[0] ?? "" : header;
  return (value.split(",")[0] ?? "").trim();
}
function requestData(req) {
  const url = new URL(req.url ?? "/", "http://placeholder");
  const query = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });
  const encrypted = req.socket.encrypted === true;
  return {
    path: url.pathname,
    query,
    cookies: parseCookieHeader(req.headers.cookie),
    host: firstForwardedValue(req.headers["x-forwarded-host"]) || req.headers.host || "localhost",
    proto: firstForwardedValue(req.headers["x-forwarded-proto"]) || (encrypted ? "https" : "http")
  };
}
function applyCookies(res, cookies) {
  const existing = res.getHeader("set-cookie");
  const headers = Array.isArray(existing) ? existing.map(String) : existing ? [String(existing)] : [];
  headers.push(...cookies.map(serializeCookie));
  res.setHeader("set-cookie", headers);
}

// src/adapters/express.ts
function createExpressAdapter(auth) {
  const loginHandler = (req, res) => {
    const data = requestData(req);
    const next = data.query["next"] || "/";
    try {
      auth.validateLoginRedirectTarget(next);
    } catch (err) {
      res.status(400).send(err instanceof Error ? err.message : "invalid login redirect target");
      return;
    }
    try {
      const { location, stateCookie } = auth.buildLoginRedirect(data, next);
      applyCookies(res, [stateCookie]);
      res.redirect(302, location);
    } catch {
      res.status(500).send("failed to start login");
    }
  };
  const callbackHandler = async (req, res) => {
    try {
      const result = await auth.handleCallback(requestData(req));
      if (!result.authenticated) {
        applyCookies(res, [result.clearStateCookie, ...auth.clearSessionCookies()]);
        res.status(401).send("account_not_found");
        return;
      }
      applyCookies(res, [result.sessionCookie, result.clearStateCookie]);
      res.redirect(302, result.redirectUri);
    } catch {
      applyCookies(res, auth.clearSessionCookies());
      res.status(400).send("invalid auth callback");
    }
  };
  const requireAuth = (opts = {}) => {
    return async (req, res, next) => {
      let result;
      try {
        result = await auth.authenticate(requestData(req));
      } catch {
        res.status(500).send("authentication failed");
        return;
      }
      if (!result.authenticated) {
        if (result.shouldClearSession) applyCookies(res, auth.clearSessionCookies());
        if (opts.onUnauthenticated) opts.onUnauthenticated(req, res, result);
        else res.status(401).send("authentication required");
        return;
      }
      if (!result.authorized && !opts.authenticatedOnly) {
        if (result.shouldClearSession) applyCookies(res, auth.clearSessionCookies());
        if (opts.onUnauthorized) opts.onUnauthorized(req, res, result);
        else res.status(403).send("forbidden");
        return;
      }
      req.newtonUser = result.user;
      next();
    };
  };
  const mount = (app) => {
    app.get(auth.config.loginPath, loginHandler);
    app.get(auth.config.callbackPath, callbackHandler);
  };
  return { loginHandler, callbackHandler, requireAuth, mount };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createExpressAdapter
});
//# sourceMappingURL=express.cjs.map