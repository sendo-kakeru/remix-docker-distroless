# ベースイメージとしてNode.jsのslimバージョンを使用
FROM node:20-slim AS base
WORKDIR /app

# 依存関係のインストールステージ
FROM base AS deps
# インストール
RUN apt-get update -y && apt-get install -y openssl
COPY package.json package-lock.json* ./
RUN npm ci --prod --frozen-lockfile
COPY prisma ./
RUN npx prisma generate

# ビルドステージ
FROM base AS builder
# ビルド
COPY . .
RUN npm i --frozen-lockfile
RUN npm run build

FROM gcr.io/distroless/nodejs20-debian11 AS runner
ENV NODE_ENV=production
WORKDIR /app

# 実行に必要なファイルをコピー
COPY package.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/build/ ./build
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 8080
ENV PORT=8080
ENV DATABASE_URL='postgresql://dev:dev@host.docker.internal:5434/dev?schema-public'
CMD ["./node_modules/@remix-run/serve/dist/cli", "./build/server/index.js"]