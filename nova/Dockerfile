FROM oven/bun:1

WORKDIR /app

# Copy dependency descriptors
COPY package.json bun.lock* ./
COPY server/package.json server/package-lock.json* ./server/

# Install root dependencies
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --ignore-scripts

# Install backend dependencies
WORKDIR /app/server
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --ignore-scripts

# Reset working directory back to root
WORKDIR /app

EXPOSE 3000
EXPOSE 4000

CMD ["bun", "run", "dev:bun"]
