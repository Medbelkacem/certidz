# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# CertiDZ API — multi-stage build
#   deps   → install all deps (pnpm) + prisma generate
#   build  → compile TypeScript to dist/
#   runner → minimal, non-root runtime image
# ---------------------------------------------------------------------------

# --- deps -------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
# Prisma needs OpenSSL at generate/runtime on Alpine.
RUN apk add --no-cache openssl
COPY package.json pnpm-lock.yaml* .npmrc* ./
COPY prisma ./prisma
# Install all deps; the "postinstall" script runs `prisma generate`.
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# --- build ------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Regenerate the Prisma client against the copied schema, then compile.
RUN pnpm prisma generate
RUN pnpm build
# Drop dev dependencies for a lean runtime node_modules.
RUN pnpm prune --prod

# --- runner -----------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
ENV PORT=4000

# Run as the built-in unprivileged "node" user.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/package.json ./package.json
USER node

EXPOSE 4000

# Liveness probe hits the versioned health route (global prefix /api + v1).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/api/v1/health || exit 1

CMD ["node", "dist/main.js"]
