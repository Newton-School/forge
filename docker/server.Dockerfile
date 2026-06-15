# ── Server (Express) — multi-stage, security-hardened, non-root ───────────────
# Build context: ./server

# ---- base ----
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat dumb-init

# ---- deps (prod only, for the runner) ----
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ---- dev (docker-compose hot reload) ----
FROM base AS dev
ENV NODE_ENV=development
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]

# ---- builder (compile TS + generate prisma client) ----
FROM base AS builder
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npx prisma generate || true
RUN npm run build

# ---- runner (production) ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
RUN apk add --no-cache dumb-init \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 express
COPY --from=deps   --chown=express:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=express:nodejs /app/dist ./dist
COPY --from=builder --chown=express:nodejs /app/prisma ./prisma
COPY --chown=express:nodejs package.json ./
USER express
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/api/health >/dev/null 2>&1 || exit 1
# dumb-init = proper PID 1 / signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
