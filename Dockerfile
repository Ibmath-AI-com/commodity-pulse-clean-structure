# syntax=docker/dockerfile:1

# 1) Install deps
FROM node:20-alpine AS deps
WORKDIR /app

# If you use native deps (sharp, etc.), you may need libc6-compat
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

# 2) Build
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js
RUN npm run build

# 3) Runtime (minimal)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Optional: run as non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy standalone server + minimal files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# If you rely on next.config.js at runtime (rare), include it:
# COPY --from=builder /app/next.config.js ./next.config.js

USER nextjs
EXPOSE 3000

# Next standalone provides server.js at root of copied output
CMD ["node", "server.js"]