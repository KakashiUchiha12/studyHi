# Multi-stage build for production
FROM node:20-slim AS deps
# Install dependencies for canvas (Debian/Ubuntu version)
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    ghostscript \
    graphicsmagick

WORKDIR /app

# Install dependencies only when needed
COPY package*.json ./
RUN npm config set fetch-retries 5 && npm config set fetch-retry-mintimeout 20000 && npm config set fetch-retry-maxtimeout 120000
RUN npm install

# Rebuild the source code only when needed
FROM node:20-slim AS builder
# Install dependencies for canvas
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    openssl

WORKDIR /app
COPY . .

# Install all dependencies for building
RUN npm config set fetch-retries 5 && npm config set fetch-retry-mintimeout 20000 && npm config set fetch-retry-maxtimeout 120000
RUN npm install

# Generate Prisma Client
RUN npx prisma generate


# We need to set dummy environment variables so the build doesn't fail on validation
ENV DATABASE_URL="mysql://root:password@localhost:3306/studyhi"
ENV NEXTAUTH_SECRET="dummy_secret_for_build_must_be_32_chars_long"
ENV NEXTAUTH_URL="http://localhost:3000"

# Pass client-side env vars for build time
ARG NEXT_PUBLIC_PUSHER_KEY
ARG NEXT_PUBLIC_PUSHER_CLUSTER
ENV NEXT_PUBLIC_PUSHER_KEY=$NEXT_PUBLIC_PUSHER_KEY
ENV NEXT_PUBLIC_PUSHER_CLUSTER=$NEXT_PUBLIC_PUSHER_CLUSTER

RUN npm run build:production

# Production image, copy all the files and run next
FROM node:20-slim AS runner
# Install runtime dependencies for canvas
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    openssl \
    ghostscript \
    graphicsmagick

# Install Prisma CLI globally for migrations
RUN npm config set fetch-retries 5 && npm config set fetch-retry-mintimeout 20000 && npm config set fetch-retry-maxtimeout 120000
RUN npm install -g prisma@6.14.0

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the public folder
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
