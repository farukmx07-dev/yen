# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_BASE_URL=http://localhost:3000
ARG NEXT_IMAGE_UNOPTIMIZED=1
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_IMAGE_UNOPTIMIZED=$NEXT_IMAGE_UNOPTIMIZED

RUN NODE_ENV=production npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV BIND_HOST=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    apk add --no-cache libc6-compat

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/server.js ./server.js
COPY --from=builder --chown=nextjs:nodejs /app/lib/ws ./lib/ws
COPY --from=builder --chown=nextjs:nodejs /app/scripts/server-guards.js ./scripts/server-guards.js
COPY --from=builder --chown=nextjs:nodejs /app/scripts/admin-live-sync.js ./scripts/admin-live-sync.js
COPY --from=builder --chown=nextjs:nodejs /app/scripts/find-available-port.js ./scripts/find-available-port.js
COPY --from=builder --chown=nextjs:nodejs /app/scripts/wait-for-mysql.js ./scripts/wait-for-mysql.js
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrate-json-to-mysql.js ./scripts/migrate-json-to-mysql.js
COPY --from=builder --chown=nextjs:nodejs /app/scripts/copy-runtime-deps.js ./scripts/copy-runtime-deps.js
COPY --from=builder --chown=nextjs:nodejs /app/scripts/docker-entrypoint.sh ./docker-entrypoint.sh
COPY --from=builder --chown=nextjs:nodejs /app/data ./data

ENV NEXT_SHARP_PATH=/app/node_modules/sharp

RUN chmod +x /app/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
