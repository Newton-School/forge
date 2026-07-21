import { IncomingMessage, ServerResponse } from 'node:http';
import { A as AuthResult, C as CookieInstruction, a as NewtonAuth, N as NewtonUser, b as AuthRequestData } from '../core-DyRZHWRK.cjs';

interface NodeHandlerOptions {
    onUnauthenticated?: (req: IncomingMessage, res: ServerResponse, result: AuthResult) => void;
    onUnauthorized?: (req: IncomingMessage, res: ServerResponse, result: AuthResult) => void;
    /**
     * Gate on authentication alone. When true, an authenticated but unauthorized
     * user is allowed through instead of being rejected with 403 — for apps that
     * manage their own authorization and use this SDK purely to identify the user.
     * Unauthenticated users are still rejected with 401.
     */
    authenticatedOnly?: boolean;
}
type NodeHandler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;
/** Returns the authenticated user attached by requireAuth. */
declare function getUser(req: IncomingMessage): NewtonUser | undefined;
declare function requestData(req: IncomingMessage): AuthRequestData;
declare function applyCookies(res: ServerResponse, cookies: CookieInstruction[]): void;
declare function createNodeHandlers(auth: NewtonAuth): {
    loginHandler: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
    callbackHandler: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
    requireAuth: (handler: NodeHandler, opts?: NodeHandlerOptions) => NodeHandler;
    middleware: (next: NodeHandler) => NodeHandler;
    getUser: typeof getUser;
};

export { type NodeHandlerOptions, applyCookies, createNodeHandlers, getUser, requestData };
