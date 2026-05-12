FROM node:20-bookworm-slim AS dev

WORKDIR /app
COPY package.json ./
RUN if [ -f package-lock.json ]; then npm ci --legacy-peer-deps; else npm install --legacy-peer-deps; fi
COPY nest-cli.json tsconfig*.json ./
COPY src ./src

FROM dev AS builder

COPY test ./test
RUN npm run build

FROM node:20-bookworm-slim AS runner

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev --legacy-peer-deps; \
    else \
      npm install --omit=dev --legacy-peer-deps; \
    fi && \
    npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN chown -R node:node /app
USER node
EXPOSE 3000

CMD ["node", "dist/main.js"]
