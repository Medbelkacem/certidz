# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# CertiDZ web — multi-stage image for the Next.js 15 marketing + app frontend.
#
# Next.js is configured with `output: "standalone"` (see next.config.ts), so
# the final image ships only the traced server bundle + its node_modules.
#
# IMPORTANT: build from the *monorepo root* so pnpm can resolve the
# `@certidz/ui` workspace package:
#
#   docker build -f apps/web/Dockerfile -t certidz-web .
#   docker run -p 3000:3000 certidz-web
# ---------------------------------------------------------------------------

FROM node:22-alpine AS base
# libc compat for some native deps; enable pnpm via corepack.
RUN apk add --no-cache libc6-compat
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

# ---------------------------------------------------------------------------
# 1. Install dependencies (cached on lockfile + manifests only)
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# 2. Build the standalone server bundle
# ---------------------------------------------------------------------------
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
RUN pnpm --filter @certidz/web build

# ---------------------------------------------------------------------------
# 3. Minimal runtime image, non-root
# ---------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# The standalone output preserves the monorepo layout under apps/web.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
