import {
  parseCookieHeader,
  serializeCookie
} from "../chunk-R3TUS3GG.js";

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
export {
  createNextHandlers,
  requestDataFromWebRequest
};
//# sourceMappingURL=next.js.map