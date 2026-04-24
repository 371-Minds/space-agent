# ── Stage 1: Build TypeScript ────────────────────────────────────────────────
FROM oven/bun:1-alpine AS builder

WORKDIR /app
COPY package.json bun.lockb* ./
# bun.lockb* is optional: the wildcard allows the first Docker build to run
# without a committed lockfile. After `bun install` runs locally and bun.lockb
# is committed, subsequent builds will use --frozen-lockfile semantics via Bun's
# default behavior when the lockfile is present.
RUN bun install

COPY tsconfig.json ./
COPY src ./src
RUN bun run build

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM oven/bun:1-alpine AS runtime

WORKDIR /app

# Install json-server globally for the Sovereign Engine
RUN bun add -g json-server@1.0.0-beta.3

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json db.json ./

# Sovereign Engine port
EXPOSE 3000

# Start both json-server (port 3000) and the MCP server (stdio)
# In production, run MCP over stdio via the agent framework;
# json-server runs as a background service.
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]
