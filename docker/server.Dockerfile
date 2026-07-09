# ── Server (Express) — multi-stage, security-hardened, non-root ───────────────
# Build context: ./server

# ---- base ----
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat dumb-init

# ---- deps (prod only, for the runner) ----
FROM base AS deps
COPY package.json package-lock.json* ./
COPY vendor ./vendor
RUN npm ci --omit=dev

# ---- dev (docker-compose hot reload) ----
FROM base AS dev
ENV NODE_ENV=development
COPY package.json package-lock.json* ./
COPY vendor ./vendor
RUN npm install
COPY . .
EXPOSE 8000
# Prisma 7 has no built-in engine — generate the client against the (bind-mounted)
# schema at each start before launching the watcher.
CMD ["sh", "-c", "npx prisma generate && npm run dev"]

# ---- builder (compile TS + generate prisma client) ----
FROM base AS builder
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
COPY vendor ./vendor
RUN npm ci
COPY . .
# Prisma 7's config reads DIRECT_URL/DATABASE_URL at generate time (env() throws if unset).
# These placeholders satisfy codegen ONLY — the runtime gets real values from Secrets Manager.
RUN DIRECT_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    npm run build

# ---- runner (production) ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8000
RUN apk add --no-cache dumb-init \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 express
COPY --from=deps   --chown=express:nodejs /app/node_modules ./node_modules
# The vendored newton-auth SDK is symlinked from node_modules → keep its target present.
COPY --from=deps   --chown=express:nodejs /app/vendor ./vendor
COPY --from=builder --chown=express:nodejs /app/dist ./dist
COPY --from=builder --chown=express:nodejs /app/prisma ./prisma
COPY --chown=express:nodejs package.json ./
USER express
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8000/api/health >/dev/null 2>&1 || exit 1
# dumb-init = proper PID 1 / signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
