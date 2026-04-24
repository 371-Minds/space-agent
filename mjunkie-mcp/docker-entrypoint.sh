#!/bin/sh
# Start the Sovereign Engine (json-server) in background, then start MCP server.
# Kills both child processes on SIGTERM/SIGINT and when either child exits first.
set -e

cleanup() {
  echo "[mjunkie-mcp] Shutting down..."
  if [ -n "$JSON_SERVER_PID" ]; then
    kill "$JSON_SERVER_PID" 2>/dev/null || true
    wait "$JSON_SERVER_PID" 2>/dev/null || true
  fi
  if [ -n "$MCP_PID" ]; then
    kill "$MCP_PID" 2>/dev/null || true
    wait "$MCP_PID" 2>/dev/null || true
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

# Poll until either child exits, then trigger cleanup of the other
while true; do
  if ! kill -0 "$JSON_SERVER_PID" 2>/dev/null; then
    echo "[mjunkie-mcp] Sovereign Engine exited unexpectedly."
    cleanup
  fi
  if ! kill -0 "$MCP_PID" 2>/dev/null; then
    echo "[mjunkie-mcp] MCP server exited."
    cleanup
  fi
  sleep 1
done
