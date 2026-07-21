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

// src/adapters/next.ts
var next_exports = {};
__export(next_exports, {
  createNextHandlers: () => createNextHandlers,
  requestDataFromWebRequest: () => requestDataFromWebRequest
});
module.exports = __toCommonJS(next_exports);

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

// src/adapters/next.ts
function firstForwardedValue(header) {
  return header ? (header.split(",")[0] ?? "").trim() : "";
}
function requestDataFromWebRequest(request) {
  const url = new URL(request.url);
  const query = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });
  return {
    path: url.pathname,
    query,
    cookies: parseCookieHeader(request.headers.get("cookie") ?? void 0),
    host: firstForwardedValue(request.headers.get("x-forwarded-host")) || url.host,
    proto: firstForwardedValue(request.headers.get("x-forwarded-proto")) || url.protocol.replace(":", "")
  };
}
function withCookies(response, cookies) {
  for (const cookie of cookies) {
    response.headers.append("set-cookie", serializeCookie(cookie));
  }
  return response;
}
function redirect(location, cookies) {
  return withCookies(new Response(null, { status: 302, headers: { location } }), cookies);
}
function text(status, message, cookies = []) {
  return withCookies(
    new Response(message, { status, headers: { "content-type": "text/plain; charset=utf-8" } }),
    cookies
  );
}
function createNextHandlers(auth) {
  const loginGET = async (request) => {
    const data = requestDataFromWebRequest(request);
    const next = data.query["next"] || "/";
    try {
      auth.validateLoginRedirectTarget(next);
    } catch (err) {
      return text(400, err instanceof Error ? err.message : "invalid login redirect target");
    }
    try {
      const { location, stateCookie } = auth.buildLoginRedirect(data, next);
      return redirect(location, [stateCookie]);
    } catch {
      return text(500, "failed to start login");
    }
  };
  const callbackGET = async (request) => {
    try {
      const result = await auth.handleCallback(requestDataFromWebRequest(request));
      if (!result.authenticated) {
        return text(401, "account_not_found", [result.clearStateCookie, ...auth.clearSessionCookies()]);
      }
      return redirect(result.redirectUri, [result.sessionCookie, result.clearStateCookie]);
    } catch {
      return text(400, "invalid auth callback", auth.clearSessionCookies());
    }
  };
  const withAuth = (handler, opts = {}) => {
    return async (request) => {
      let result;
      try {
        result = await auth.authenticate(requestDataFromWebRequest(request));
      } catch {
        return text(500, "authentication failed");
      }
      if (!result.authenticated) {
        if (opts.onUnauthenticated) return opts.onUnauthenticated(request, result);
        return text(401, "authentication required", result.shouldClearSession ? auth.clearSessionCookies() : []);
      }
      if (!result.authorized && !opts.authenticatedOnly) {
        if (opts.onUnauthorized) return opts.onUnauthorized(request, result);
        return text(403, "forbidden", result.shouldClearSession ? auth.clearSessionCookies() : []);
      }
      return handler(request, result.user);
    };
  };
  return { loginGET, callbackGET, withAuth };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createNextHandlers,
  requestDataFromWebRequest
});
//# sourceMappingURL=next.cjs.map