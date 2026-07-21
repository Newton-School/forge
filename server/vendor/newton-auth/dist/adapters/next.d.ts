import { A as AuthResult, a as NewtonAuth, N as NewtonUser, b as AuthRequestData } from '../core-DyRZHWRK.js';

interface NextHandlerOptions {
    onUnauthenticated?: (request: Request, result: AuthResult) => Response | Promise<Response>;
    onUnauthorized?: (request: Request, result: AuthResult) => Response | Promise<Response>;
    /**
     * Gate on authentication alone. When true, an authenticated but unauthorized
     * user is allowed through instead of being rejected with 403 — for apps that
     * manage their own authorization. Unauthenticated users are still rejected with 401.
     */
    authenticatedOnly?: boolean;
}
declare function requestDataFromWebRequest(request: Request): AuthRequestData;
declare function createNextHandlers(auth: NewtonAuth): {
    loginGET: (request: Request) => Promise<Response>;
    callbackGET: (request: Request) => Promise<Response>;
    withAuth: (handler: (request: Request, user: NewtonUser) => Response | Promise<Response>, opts?: NextHandlerOptions) => (request: Request) => Promise<Response>;
};

export { type NextHandlerOptions, createNextHandlers, requestDataFromWebRequest };
