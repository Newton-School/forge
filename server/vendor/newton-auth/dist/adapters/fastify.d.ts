import { FastifyRequest, FastifyReply, FastifyInstance, preHandlerHookHandler } from 'fastify';
import { N as NewtonUser, a as NewtonAuth, A as AuthResult } from '../core-DyRZHWRK.js';

declare module "fastify" {
    interface FastifyRequest {
        newtonUser: NewtonUser | null;
    }
}
interface FastifyNewtonAuthOptions {
    auth: NewtonAuth;
    onUnauthenticated?: (req: FastifyRequest, reply: FastifyReply, result: AuthResult) => void | Promise<void>;
    onUnauthorized?: (req: FastifyRequest, reply: FastifyReply, result: AuthResult) => void | Promise<void>;
    /**
     * Gate on authentication alone. When true, an authenticated but unauthorized
     * user is allowed through instead of being rejected with 403 — for apps that
     * manage their own authorization. Unauthenticated users are still rejected with 401.
     */
    authenticatedOnly?: boolean;
}
declare function requireAuth(opts: FastifyNewtonAuthOptions): preHandlerHookHandler;
declare function newtonAuthPlugin(fastify: FastifyInstance, opts: FastifyNewtonAuthOptions): Promise<void>;

export { type FastifyNewtonAuthOptions, newtonAuthPlugin, requireAuth };
