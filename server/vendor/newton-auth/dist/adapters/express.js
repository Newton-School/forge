import {
  applyCookies,
  requestData
} from "../chunk-N6WXIMSG.js";
import "../chunk-R3TUS3GG.js";

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
export {
  createExpressAdapter
};
//# sourceMappingURL=express.js.map