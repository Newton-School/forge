import type { AuthContext } from "../rbac/types.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // passport stores only the user id on the session
    interface User {
      id: string;
    }
    interface Request {
      /** Full, freshly-loaded authorization context (set by attachAuth). */
      auth?: AuthContext;
      /** Raw request body bytes, captured for webhook HMAC verification. */
      rawBody?: Buffer;
    }
  }
}

export {};
