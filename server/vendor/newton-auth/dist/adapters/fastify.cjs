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

// src/adapters/fastify.ts
var fastify_exports = {};
__export(fastify_exports, {
  newtonAuthPlugin: () => newtonAuthPlugin,
  requireAuth: () => requireAuth
});
module.exports = __toCommonJS(fastify_exports);

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

// src/adapters/fastify.ts
function firstForwardedValue(header) {
  if (!header) return "";
  const value = Array.isArray(header) ? header[0] ?? "" : header;
  return (value.split(",")[0] ?? "").trim();
}
function requestDataFromFastify(req) {
  const url = new URL(req.url, "http://placeholder");
  const query = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });
  const headers = req.raw.headers;
  const encrypted = req.raw.socket.encrypted === true;
  return {
    path: url.pathname,
    query,
    cookies: parseCookieHeader(headers.cookie),
    host: firstForwardedValue(headers["x-forwarded-host"]) || headers.host || "localhost",
    proto: firstForwardedValue(headers["x-forwarded-proto"]) || (encrypted ? "https" : "http")
  };
}
function applyReplyCookies(reply, cookies) {
  const existing = reply.getHeader("set-cookie");
  const headers = Array.isArray(existing) ? existing.map(String) : existing ? [String(existing)] : [];
  headers.push(...cookies.map(serializeCookie));
  reply.header("set-cookie", headers);
}
function requireAuth(opts) {
  const { auth } = opts;
  return async function(req, reply) {
    let result;
    try {
      result = await auth.authenticate(requestDataFromFastify(req));
    } catch {
      await reply.status(500).send("authentication failed");
      return;
    }
    if (!result.authenticated) {
      if (result.shouldClearSession) applyReplyCookies(reply, auth.clearSessionCookies());
      if (opts.onUnauthenticated) await opts.onUnauthenticated(req, reply, result);
      else await reply.status(401).send("authentication required");
      return;
    }
    if (!result.authorized && !opts.authenticatedOnly) {
      if (result.shouldClearSession) applyReplyCookies(reply, auth.clearSessionCookies());
      if (opts.onUnauthorized) await opts.onUnauthorized(req, reply, result);
      else await reply.status(403).send("forbidden");
      return;
    }
    req.newtonUser = result.user;
  };
}
async function newtonAuthPlugin(fastify, opts) {
  const { auth } = opts;
  if (!fastify.hasRequestDecorator("newtonUser")) {
    fastify.decorateRequest("newtonUser", null);
  }
  fastify.get(auth.config.loginPath, async (req, reply) => {
    const data = requestDataFromFastify(req);
    const next = data.query["next"] || "/";
    try {
      auth.validateLoginRedirectTarget(next);
    } catch (err) {
      await reply.status(400).send(err instanceof Error ? err.message : "invalid login redirect target");
      return;
    }
    try {
      const { location, stateCookie } = auth.buildLoginRedirect(data, next);
      applyReplyCookies(reply, [stateCookie]);
      await reply.redirect(location, 302);
    } catch {
      await reply.status(500).send("failed to start login");
    }
  });
  fastify.get(auth.config.callbackPath, async (req, reply) => {
    try {
      const result = await auth.handleCallback(requestDataFromFastify(req));
      if (!result.authenticated) {
        applyReplyCookies(reply, [result.clearStateCookie, ...auth.clearSessionCookies()]);
        await reply.status(401).send("account_not_found");
        return;
      }
      applyReplyCookies(reply, [result.sessionCookie, result.clearStateCookie]);
      await reply.redirect(result.redirectUri, 302);
    } catch {
      applyReplyCookies(reply, auth.clearSessionCookies());
      await reply.status(400).send("invalid auth callback");
    }
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  newtonAuthPlugin,
  requireAuth
});
//# sourceMappingURL=fastify.cjs.map