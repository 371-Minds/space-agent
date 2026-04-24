#!/bin/sh
# Start the Sovereign Engine (json-server) in background, then start MCP server
set -e

echo "[mjunkie-mcp] Starting Sovereign Engine on port 3000..."
json-server --watch db.json --port 3000 &

echo "[mjunkie-mcp] Starting MCP server..."
node dist/index.js
