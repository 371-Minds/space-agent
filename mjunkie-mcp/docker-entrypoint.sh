#!/bin/sh
# Start the Sovereign Engine (json-server) in background, then start MCP server.
# Propagates SIGTERM/SIGINT to both child processes on exit.
set -e

cleanup() {
  echo "[mjunkie-mcp] Shutting down..."
  if [ -n "$JSON_SERVER_PID" ]; then
    kill "$JSON_SERVER_PID" 2>/dev/null || true
  fi
  exit 0
}
trap cleanup TERM INT

echo "[mjunkie-mcp] Starting Sovereign Engine on port 3000..."
json-server --watch db.json --port 3000 &
JSON_SERVER_PID=$!

echo "[mjunkie-mcp] Starting MCP server..."
node dist/index.js &
MCP_PID=$!

# Wait for either process to exit; clean up the other
wait "$MCP_PID" "$JSON_SERVER_PID"
cleanup
