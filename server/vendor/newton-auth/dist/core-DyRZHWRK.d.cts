interface NewtonAuthConfig {
    clientId: string;
    clientSecret: string;
    callbackSecret: string;
    newtonApiBase: string;
    sessionSigningSecret?: string;
    loginPath?: string;
    callbackPath?: string;
    sessionCookieName?: string;
    stateCookieName?: string;
    cacheMaxMb?: number;
    authTimeoutMs?: number;
    fetch?: typeof fetch;
}
interface ResolvedConfig {
    clientId: string;
    clientSecret: string;
    callbackSecret: string;
    newtonApiBase: string;
    sessionSigningSecret: string;
    loginPath: string;
    callbackPath: string;
    sessionCookieName: string;
    stateCookieName: string;
    cacheMaxMb: number;
    authTimeoutMs: number;
    fetch: typeof fetch;
    issuer: string;
}

interface NewtonUser {
    uid: string;
    authorized: boolean;
    firstName: string;
    lastName: string;
    email: string;
}
interface AuthResult {
    authenticated: boolean;
    authorized: boolean;
    shouldClearSession: boolean;
    user: NewtonUser | null;
    clientCacheTtlSeconds: number;
    sessionTtlSeconds: number;
}
/** A cookie to set (or delete when maxAge <= 0). Always Path=/; HttpOnly; Secure; SameSite=Lax. */
interface CookieInstruction {
    name: string;
    value: string;
    maxAge: number;
}
/** Framework-agnostic request data. Adapters resolve host/proto from X-Forwarded-* headers. */
interface AuthRequestData {
    path: string;
    query: Record<string, string>;
    cookies: Record<string, string>;
    host: string;
    proto: string;
}
interface LoginRedirect {
    location: string;
    stateCookie: CookieInstruction;
}
interface CallbackResult {
    /** False when the login completed but the user is not authenticated (e.g. no Newton account). */
    authenticated: boolean;
    redirectUri: string;
    /** Null when not authenticated. */
    user: NewtonUser | null;
    clientCacheTtlSeconds: number;
    sessionTtlSeconds: number;
    /** Null when not authenticated (no session is established). */
    sessionCookie: CookieInstruction | null;
    clearStateCookie: CookieInstruction;
}
interface AuthCheckResponse {
    authenticated: boolean;
    authorized: boolean;
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
    clientCacheTtlSeconds: number;
    sessionTtlSeconds: number;
    shouldClearSession: boolean;
}

declare class NewtonAuth {
    readonly config: ResolvedConfig;
    private readonly httpClient;
    private readonly cache;
    constructor(cfg: NewtonAuthConfig);
    authenticate(req: AuthRequestData): Promise<AuthResult>;
    buildLoginRedirect(req: AuthRequestData, redirectUri?: string): LoginRedirect;
    handleCallback(req: AuthRequestData): Promise<CallbackResult>;
    clearSessionCookies(): CookieInstruction[];
    validateLoginRedirectTarget(next: string): void;
}

export { type AuthResult as A, type CookieInstruction as C, type LoginRedirect as L, type NewtonUser as N, type ResolvedConfig as R, NewtonAuth as a, type AuthRequestData as b, type AuthCheckResponse as c, type CallbackResult as d, type NewtonAuthConfig as e };
