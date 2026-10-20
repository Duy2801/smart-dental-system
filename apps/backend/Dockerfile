# Build context: thư mục gốc monorepo
#   docker build -f apps/backend/Dockerfile -t smart-dental-backend .

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# ---------- Build ----------
FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/package.json apps/backend/
RUN pnpm install --frozen-lockfile --filter backend...

COPY apps/backend apps/backend
# prisma generate không cần kết nối DB, chỉ cần biến tồn tại
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" pnpm --filter backend build

# ---------- Production deps ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/package.json apps/backend/
RUN pnpm install --frozen-lockfile --prod --filter backend...

# ---------- Runtime ----------
FROM node:22-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder --chown=node:node /app/apps/backend/dist ./apps/backend/dist

USER node
WORKDIR /app/apps/backend
# Cloud Run cấp biến PORT (mặc định 8080)
EXPOSE 8080
CMD ["node", "dist/src/main"]
