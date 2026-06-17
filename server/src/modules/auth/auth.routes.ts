import { Router, type Request, type Response, type NextFunction } from "express";
import passport from "passport";
import { env, googleConfigured } from "../../config/env.js";
import { authRateLimit } from "../../middleware/security.js";

export const authRouter = Router();
const CLIENT = env.APP_BASE_URL;

/** Begin Google login. Restricts the chooser to the allowed hosted domain. */
authRouter.get("/google", authRateLimit, (req: Request, res: Response, next: NextFunction) => {
  if (!googleConfigured) return res.redirect(`${CLIENT}/login?error=oauth_unconfigured`);
  // `state: true` + `hostedDomain` are passport-google-oauth20 options not present
  // on the base AuthenticateOptions type — cast through unknown.
  passport.authenticate("google", {
    scope: ["openid", "email", "profile"],
    state: true,
    hostedDomain: env.ALLOWED_HOSTED_DOMAIN,
  } as unknown as passport.AuthenticateOptions)(req, res, next);
});

/** OAuth callback. Failure (domain/allowlist) → client login with an error. */
authRouter.get(
  "/google/callback",
  authRateLimit,
  (req: Request, res: Response, next: NextFunction) =>
    passport.authenticate("google", { failureRedirect: `${CLIENT}/login?error=denied` })(req, res, next),
  (req: Request, res: Response) => {
    req.session.loginAt = Date.now(); // anchor the absolute-timeout window
    res.redirect(`${CLIENT}/`);
  },
);

/** Current session's authenticated user (RBAC context). */
authRouter.get("/me", (req: Request, res: Response) => {
  if (!req.auth) {
    res.status(401).json({ error: { code: "unauthorized", message: "Not authenticated" } });
    return;
  }
  res.json({ user: req.auth });
});

/** Expose the CSRF token (set as a cookie by the csrf middleware) for the client to echo. */
authRouter.get("/csrf", (req: Request, res: Response) => {
  res.json({ csrfToken: (req.cookies?.forge_csrf as string | undefined) ?? null });
});

/** Destroy the session and clear cookies. */
authRouter.post("/logout", (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session?.destroy(() => {
      res.clearCookie("forge.sid");
      res.json({ ok: true });
    });
  });
});
