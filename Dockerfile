# ベースイメージとしてNode.jsのslimバージョンを使用
FROM node:20-slim AS base
WORKDIR /app

# 依存関係のインストールステージ
FROM base AS deps
# インストール
COPY package.json package-lock.json* ./
RUN npm ci --prod --frozen-lockfile

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

# USER nonroot:nonroot

EXPOSE 8080
ENV PORT=8080
CMD ["./node_modules/@remix-run/serve/dist/cli", "./build/server/index.js"]