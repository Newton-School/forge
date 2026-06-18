import passport from "passport";
import { Strategy as GoogleStrategy, type Profile, type VerifyCallback } from "passport-google-oauth20";
import { env, googleConfigured } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { resolveGoogleLogin, verifyGoogleIdToken } from "../modules/auth/auth.service.js";

/** Wire passport + the Google OAuth strategy. Session stores only the user id. */
export function configurePassport(): void {
  passport.serializeUser((user: Express.User, done) => done(null, user.id));
  passport.deserializeUser((id: string, done) => done(null, { id }));

  if (!googleConfigured) {
    logger.warn("Google OAuth not configured (GOOGLE_OAUTH_CLIENT_ID/SECRET) — /api/auth/google is disabled");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_OAUTH_CLIENT_ID!,
        clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET!,
        callbackURL: env.GOOGLE_OAUTH_REDIRECT_URI,
        scope: ["openid", "email", "profile"],
      },
      // 5-arg verify → `params` carries the OAuth token response (incl. the signed id_token).
      // We authenticate from the CRYPTOGRAPHICALLY VERIFIED id_token, not the userinfo profile.
      async (_accessToken: string, _refreshToken: string, params: { id_token?: string }, _profile: Profile, done: VerifyCallback) => {
        try {
          const idToken = params?.id_token;
          if (!idToken) return done(null, false); // openid scope always returns one — fail closed
          const verified = await verifyGoogleIdToken(idToken); // JWKS signature + iss + aud + exp
          const userId = await resolveGoogleLogin(verified); // hosted-domain + allowlist gate
          return done(null, { id: userId });
        } catch {
          // Rejected by token verification or the domain/allowlist gate → auth failure (redirect).
          return done(null, false);
        }
      },
    ),
  );
}
