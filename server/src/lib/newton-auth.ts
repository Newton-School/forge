import { NewtonAuth } from "newton-auth";
import { env, newtonConfigured } from "../config/env.js";

/**
 * Newton School auth SDK singleton. We use the CORE (buildLoginRedirect / handleCallback)
 * only — NOT the adapter's session cookie — so the Newton flow verifies identity and then
 * hands off to Forge's own Redis session + RBAC (see modules/auth/newton.routes.ts).
 *
 * loginPath/callbackPath are mounted at the app ROOT (/newton/*, outside /api) to match
 * the Newton-registered redirect URI. The SDK derives the redirect_uri from the request's
 * proto+host + callbackPath, so behind the ALB it becomes https://<domain>/newton/callback.
 *
 * null when the credentials aren't configured — the routes degrade gracefully.
 */
export const newtonAuth = newtonConfigured
  ? new NewtonAuth({
      clientId: env.NEWTON_AUTH_CLIENT_ID!,
      clientSecret: env.NEWTON_AUTH_CLIENT_SECRET!,
      callbackSecret: env.NEWTON_AUTH_CALLBACK_SECRET!,
      newtonApiBase: env.NEWTON_AUTH_BASE_URL,
      loginPath: "/newton/login",
      callbackPath: "/newton/callback",
    })
  : null;
