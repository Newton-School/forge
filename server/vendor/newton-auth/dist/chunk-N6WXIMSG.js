import {
  parseCookieHeader,
  serializeCookie
} from "./chunk-R3TUS3GG.js";

// src/adapters/http.ts
var userStore = /* @__PURE__ */ new WeakMap();
function getUser(req) {
  return userStore.get(req);
}
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
function respond(res, status, message) {
  res.statusCode = status;
  res.setHeader("content-type", "text/plain; charset=utf-8");
  res.end(message);
}
function redirect(res, location) {
  res.statusCode = 302;
  res.setHeader("location", location);
  res.end();
}
function createNodeHandlers(auth) {
  const loginHandler = async (req, res) => {
    const data = requestData(req);
    const next = data.query["next"] || "/";
    try {
      auth.validateLoginRedirectTarget(next);
    } catch (err) {
      respond(res, 400, err instanceof Error ? err.message : "invalid login redirect target");
      return;
    }
    try {
      const { location, stateCookie } = auth.buildLoginRedirect(data, next);
      applyCookies(res, [stateCookie]);
      redirect(res, location);
    } catch {
      respond(res, 500, "failed to start login");
    }
  };
  const callbackHandler = async (req, res) => {
    const data = requestData(req);
    try {
      const result = await auth.handleCallback(data);
      if (!result.authenticated) {
        applyCookies(res, [result.clearStateCookie, ...auth.clearSessionCookies()]);
        respond(res, 401, "account_not_found");
        return;
      }
      applyCookies(res, [result.sessionCookie, result.clearStateCookie]);
      redirect(res, result.redirectUri);
    } catch {
      applyCookies(res, auth.clearSessionCookies());
      respond(res, 400, "invalid auth callback");
    }
  };
  const requireAuth = (handler, opts = {}) => {
    return async (req, res) => {
      let result;
      try {
        result = await auth.authenticate(requestData(req));
      } catch {
        respond(res, 500, "authentication failed");
        return;
      }
      if (!result.authenticated) {
        if (result.shouldClearSession) applyCookies(res, auth.clearSessionCookies());
        const onUnauthenticated = opts.onUnauthenticated ?? ((rq, rs) => respond(rs, 401, "authentication required"));
        onUnauthenticated(req, res, result);
        return;
      }
      if (!result.authorized && !opts.authenticatedOnly) {
        if (result.shouldClearSession) applyCookies(res, auth.clearSessionCookies());
        const onUnauthorized = opts.onUnauthorized ?? ((rq, rs) => respond(rs, 403, "forbidden"));
        onUnauthorized(req, res, result);
        return;
      }
      userStore.set(req, result.user);
      await handler(req, res);
    };
  };
  const middleware = (next) => {
    return async (req, res) => {
      const path = new URL(req.url ?? "/", "http://placeholder").pathname;
      if (path === auth.config.loginPath) {
        await loginHandler(req, res);
        return;
      }
      if (path === auth.config.callbackPath) {
        await callbackHandler(req, res);
        return;
      }
      await next(req, res);
    };
  };
  return { loginHandler, callbackHandler, requireAuth, middleware, getUser };
}

export {
  getUser,
  requestData,
  applyCookies,
  createNodeHandlers
};
//# sourceMappingURL=chunk-N6WXIMSG.js.map