# ── Stage 1: Build TypeScript ────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
# Install all deps (including devDeps) so tsc is available, then prune after build
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npx tsc && npm prune --omit=dev

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Install json-server globally for the Sovereign Engine
RUN npm install -g json-server@1.0.0-beta.3

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY db.json ./

# Sovereign Engine port
EXPOSE 3000

# Start both json-server (port 3000) and the MCP server (stdio)
# In production, run MCP over stdio via the agent framework;
# json-server runs as a background service.
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]
