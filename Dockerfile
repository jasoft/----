# Build stage
FROM node:24-slim AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and env files
COPY . .
COPY .env.production .env

# Build the application
ENV NODE_ENV=production
RUN npm run build

# Runtime stage
FROM node:24-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/pb ./pb
COPY --from=builder /app/.env ./.env

# Install pocketbase
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v0.28.1/pocketbase_0.28.1_linux_amd64.zip \
    && unzip pocketbase_0.28.1_linux_amd64.zip \
    && rm pocketbase_0.28.1_linux_amd64.zip \
    && chmod +x pocketbase \
    && mv pocketbase pb/pocketbase

# Expose the port
EXPOSE 3000

# Start pocketbase and next.js
CMD cd pb && ./pocketbase serve & cd .. && npm start
