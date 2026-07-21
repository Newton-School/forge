import {
  parseCookieHeader,
  serializeCookie
} from "../chunk-R3TUS3GG.js";

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
export {
  newtonAuthPlugin,
  requireAuth
};
//# sourceMappingURL=fastify.js.map