# newton-auth-nodejs

Backend-only Newton School authentication SDK for Node.js.

The SDK is a framework-agnostic core with thin adapters for `node:http`, Express, Fastify, and Next.js (App Router). It owns:

- `/newton/login` to start the Newton login redirect flow
- `/newton/callback` to complete the callback flow

Protected application routes stay explicit. They return `401` (unauthenticated) or `403` (unauthorized); they do not redirect automatically.

This SDK is not intended for frontend-only applications: it holds the app's `client_secret` and `callback_secret` and sets `HttpOnly` cookies. It mirrors [`newton-auth-golang`](https://github.com/Newton-School/newton-auth-golang) and [`newton-auth-python`](https://github.com/Newton-School/newton-auth-python) and is wire-compatible with both.

## Installation

Install from a Git tag so consumers get an immutable version instead of a moving branch head.

```bash
npm install github:Newton-School/newton-auth-nodejs#v0.1.0
```

The package builds itself on install via the `prepare` script. Requires Node `>=18`. Zero runtime dependencies.

## Compatibility

- Node `>= 18`
- Adapters: `node:http`, Express 4, Fastify 4, Next.js App Router (any runtime with Web `Request`/`Response`)

## Usage

### Core setup

```js
import { NewtonAuth } from "newton-auth"

const auth = new NewtonAuth({
  clientId: process.env.NEWTON_AUTH_CLIENT_ID,
  clientSecret: process.env.NEWTON_AUTH_CLIENT_SECRET,
  callbackSecret: process.env.NEWTON_AUTH_CALLBACK_SECRET,
  newtonApiBase: process.env.NEWTON_AUTH_BASE_URL ?? "https://my.newtonschool.co/api/v1",
})
```

### Express

```js
import express from "express"
import { createExpressAdapter } from "newton-auth/express"

const app = express()
const newton = createExpressAdapter(auth)

newton.mount(app) // registers GET /newton/login and GET /newton/callback

app.get("/protected", newton.requireAuth(), (req, res) => {
  const user = req.newtonUser
  res.json({
    uid: user.uid,
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email,
    authorized: user.authorized,
  })
})

app.listen(8080)
```

### node:http

```js
import { createServer } from "node:http"
import { createNodeHandlers, getUser } from "newton-auth/http"

const handlers = createNodeHandlers(auth)

const server = createServer(
  handlers.middleware( // dispatches /newton/login and /newton/callback
    handlers.requireAuth((req, res) => {
      res.end(JSON.stringify(getUser(req)))
    }),
  ),
)
server.listen(8080)
```

### Fastify

```js
import Fastify from "fastify"
import { newtonAuthPlugin, requireAuth } from "newton-auth/fastify"

const app = Fastify()
await app.register(newtonAuthPlugin, { auth })

app.get("/protected", { preHandler: requireAuth({ auth }) }, async (req) => req.newtonUser)
```

### Next.js (App Router)

```ts
// app/newton/login/route.ts
import { createNextHandlers } from "newton-auth/next"
import { auth } from "@/lib/newton-auth"

export const GET = createNextHandlers(auth).loginGET
```

```ts
// app/newton/callback/route.ts
export const GET = createNextHandlers(auth).callbackGET
```

```ts
// app/api/me/route.ts
const { withAuth } = createNextHandlers(auth)
export const GET = withAuth(async (request, user) => Response.json(user))
```

To start login, the frontend navigates the browser to:

```text
/newton/login?next=/protected
```

After a successful callback, the SDK sets a `newton_session` cookie and redirects to the original `next` path.

## User fields

The authenticated user carries:

- `uid` — opaque user identifier
- `authorized` — whether the user is authorized for this app
- `firstName`, `lastName`, `email` — strings (empty `""` if unset on the Newton profile, never `null`/`undefined`)

Profile fields refresh every `clientCacheTtlSeconds` (default 60s) via the auth-check call to newton-api. Treat them as eventually-consistent, not live: an email change on the Newton side propagates within one cache TTL window, not immediately.

## Unauthenticated callbacks (no Newton account)

If a user completes Google login but has no Newton account, newton-api returns a signed `authenticated=false` assertion. The SDK does **not** establish a session for it; the callback route responds `401 account_not_found` (and clears the state cookie) instead of the generic `invalid auth callback` 400. `handleCallback` surfaces this as `result.authenticated === false` with `user`/`sessionCookie` both `null`, so a custom callback route can render whatever "no account" experience it wants.

## Authentication-only mode

The guards reject an authenticated-but-unauthorized user with `403`. If your app manages its own authorization and only needs Newton to identify the user, pass `authenticatedOnly: true` so unauthorized users are let through (unauthenticated users are still rejected with `401`). It's supported on every adapter:

```js
// express
app.get("/me", newton.requireAuth({ authenticatedOnly: true }), handler)
// node:http
handlers.requireAuth(handler, { authenticatedOnly: true })
// fastify
requireAuth({ auth, authenticatedOnly: true })
// next.js
withAuth(handler, { authenticatedOnly: true })
```

This pairs with binding the Newton OAuth application without a `required_permission`, in which case `authorized` is already `true` for every authenticated user.

## Authorization

The SDK handles authentication and Newton platform access verification. Application-level authorization remains application-owned. Use the authenticated Newton `uid` to scope your own data:

```js
const agents = await repo.listAgentsByOwnerUid(req.newtonUser.uid)
```

Custom unauthenticated/unauthorized responses can be supplied per adapter, e.g. `requireAuth({ onUnauthorized: (req, res, result) => res.status(403).json({ error: "forbidden" }) })`.

## Callback URL Contract

The callback path is client-configurable, but it must exactly match the redirect URI registered for the Newton OAuth application in the backend. The backend validates `redirect_uri` strictly. Behind a proxy or load balancer, the SDK derives the callback URL from `X-Forwarded-Proto` / `X-Forwarded-Host` (first value), falling back to the request's own host.

## Wire Compatibility

Two independent guarantees:

- `tests/vectors.test.ts` decrypts **frozen wire vectors generated by the real Python SDK** (fixtures adopted from the earlier `newton-auth-node` port) on every test run.
- `scripts/wire-compat-check.mjs` cross-checks assertion decryption and session cookie round-trips against a local `newton-auth-python` checkout:

```bash
npm run build
node scripts/wire-compat-check.mjs ../newton-auth-python python3
```

## Development

```bash
npm install
npm test          # vitest
npm run typecheck # tsc --noEmit
npm run build     # tsup -> dist/ (esm + cjs + d.ts)
```

## Release Process

This repository uses semantic versioning and Git tags. See [RELEASING.md](./RELEASING.md).
