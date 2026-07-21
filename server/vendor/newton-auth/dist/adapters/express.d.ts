import * as qs from 'qs';
import * as express_serve_static_core from 'express-serve-static-core';
import { Request, Response, RequestHandler } from 'express';
import { N as NewtonUser, A as AuthResult, a as NewtonAuth } from '../core-DyRZHWRK.js';

declare global {
    namespace Express {
        interface Request {
            newtonUser?: NewtonUser;
        }
    }
}
interface ExpressHandlerOptions {
    onUnauthenticated?: (req: Request, res: Response, result: AuthResult) => void;
    onUnauthorized?: (req: Request, res: Response, result: AuthResult) => void;
    /**
     * Gate on authentication alone. When true, an authenticated but unauthorized
     * user is allowed through instead of being rejected with 403 — for apps that
     * manage their own authorization. Unauthenticated users are still rejected with 401.
     */
    authenticatedOnly?: boolean;
}
declare function createExpressAdapter(auth: NewtonAuth): {
    loginHandler: RequestHandler<express_serve_static_core.ParamsDictionary, any, any, qs.ParsedQs, Record<string, any>>;
    callbackHandler: RequestHandler<express_serve_static_core.ParamsDictionary, any, any, qs.ParsedQs, Record<string, any>>;
    requireAuth: (opts?: ExpressHandlerOptions) => RequestHandler;
    mount: (app: {
        get(path: string, handler: RequestHandler): unknown;
    }) => void;
};

export { type ExpressHandlerOptions, createExpressAdapter };
