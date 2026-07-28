FROM node:20-alpine AS frontend-builder

ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

COPY ./client /app

WORKDIR /app

RUN npm ci --legacy-peer-deps

RUN npm run build

FROM node:20-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

ENV NODE_ENV=production
ENV PORT=3000

COPY ./server /app

WORKDIR /app

RUN npm ci --omit=dev

COPY --from=frontend-builder /app/dist /app/public

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r => process.exit(r.ok?0:1)).catch(() => process.exit(1))"

CMD ["node", "src/server.js"]
