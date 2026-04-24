# ── Stage 1: Build TypeScript ────────────────────────────────────────────────
FROM oven/bun:1-alpine AS builder

WORKDIR /app
COPY package.json bun.lock ./
# Use the committed lockfile to guarantee reproducible dependency resolution.
RUN bun install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN bun run build

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM oven/bun:1-alpine AS runtime

WORKDIR /app

# Install json-server globally for the Sovereign Engine
RUN bun add -g json-server@1.0.0-beta.3

COPY --from=builder /app/dist ./dist
# Install only production dependencies to keep the image lean.
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile
COPY db.json ./

# Sovereign Engine port
EXPOSE 3000

# Start both json-server (port 3000) and the MCP server (stdio)
# In production, run MCP over stdio via the agent framework;
# json-server runs as a background service.
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]
