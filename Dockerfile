# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies (кэшируется отдельным слоем)
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files (кэшируется отдельным слоем для ускорения)
COPY package.json package-lock.json* ./

# Install dependencies (кэш npm слоя переиспользуется если package.json не изменился)
# npm ci быстрее и надежнее для production, требует синхронизированный package-lock.json
RUN npm ci --legacy-peer-deps --no-audit && \
    npm install react-is --legacy-peer-deps --no-audit || true

# Copy source code (копируется последним для лучшего кэширования)
COPY . .

# Build the application
RUN npm run build

# Verify standalone output exists
RUN test -d .next/standalone || (echo "ERROR: standalone output not found" && exit 1)

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install runtime dependencies
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create necessary directories
RUN mkdir -p /app/uploads /app/logs && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

