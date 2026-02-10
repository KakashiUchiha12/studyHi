# Stage 1: Install dependencies
FROM node:20 AS deps
WORKDIR /app

# Install native dependencies for node-canvas
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    ghostscript \
    graphicsmagick

COPY package*.json ./
RUN npm install

# Stage 2: Build the application
FROM node:20 AS builder
WORKDIR /app

# Install native dependencies for build time
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Dummy env vars for build
ENV DATABASE_URL="mysql://root:password@localhost:3306/studyhi"
ENV NEXTAUTH_SECRET="dummy_secret_for_build_must_be_32_chars_long"
ENV NEXTAUTH_URL="http://localhost:3000"

# Optimization: Limit memory usage and disable source maps
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV NEXT_DISABLE_SOURCEMAPS=1
ENV GENERATE_SOURCEMAP=false

# Build strictly without swc patching errors
RUN npm run build
RUN npm run build:server

# Stage 3: Production runner
FROM node:20-slim AS runner
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    openssl \
    ghostscript \
    graphicsmagick \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Prisma CLI globally for migrations
RUN npm install -g prisma@6.19.2

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy essential files only
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib

# Set permissions
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "dist/server.js"]
