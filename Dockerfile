# ---------- Builder ----------
FROM node:24-alpine AS builder

RUN corepack enable && \
    corepack prepare pnpm@11.15.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build


# ---------- Production ----------
FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/config.json ./config.json


# Create runtime user + writable folders
RUN addgroup -S nodejs && \
    adduser -S nodejs -G nodejs && \
    mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app


USER nodejs


EXPOSE 3000


HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
CMD node -e "require('http').get('http://localhost:3000/health',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"


CMD ["node", "dist/index.js"]