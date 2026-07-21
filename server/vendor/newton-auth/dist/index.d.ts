import { C as CookieInstruction } from './core-DyRZHWRK.js';
export { c as AuthCheckResponse, b as AuthRequestData, A as AuthResult, d as CallbackResult, L as LoginRedirect, a as NewtonAuth, e as NewtonAuthConfig, N as NewtonUser, R as ResolvedConfig } from './core-DyRZHWRK.js';

declare class NewtonAuthError extends Error {
    constructor(message: string);
}
declare class ConfigError extends NewtonAuthError {
}
declare class InvalidSessionError extends NewtonAuthError {
    constructor(message?: string);
}
declare class InvalidStateError extends NewtonAuthError {
    constructor(message?: string);
}
declare class InvalidCallbackAssertionError extends NewtonAuthError {
    constructor(message?: string);
}

declare function setCookie(name: string, value: string, maxAge: number): CookieInstruction;
declare function deleteCookie(name: string): CookieInstruction;
declare function serializeCookie(cookie: CookieInstruction): string;
declare function parseCookieHeader(header: string | undefined): Record<string, string>;

export { ConfigError, CookieInstruction, InvalidCallbackAssertionError, InvalidSessionError, InvalidStateError, NewtonAuthError, deleteCookie, parseCookieHeader, serializeCookie, setCookie };
