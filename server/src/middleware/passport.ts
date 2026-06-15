import passport from "passport";
import { Strategy as GoogleStrategy, type Profile } from "passport-google-oauth20";
import { env, googleConfigured } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { resolveGoogleLogin } from "../modules/auth/auth.service.js";

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
      async (_accessToken: string, _refreshToken: string, profile: Profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(null, false);
          const hd = (profile._json as { hd?: string } | undefined)?.hd;
          const userId = await resolveGoogleLogin({
            sub: profile.id,
            email,
            name: profile.displayName ?? email,
            picture: profile.photos?.[0]?.value,
            hd,
          });
          return done(null, { id: userId });
        } catch {
          // Rejected by the domain/allowlist gate → treat as auth failure (redirect).
          return done(null, false);
        }
      },
    ),
  );
}
