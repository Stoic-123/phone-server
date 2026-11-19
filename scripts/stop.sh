#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# PocketDev Server - Graceful Shutdown Script
# ==============================================================================

POCKETDEV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="$POCKETDEV_DIR/data/pocketdev.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "[!] No PID file found at $PID_FILE. Server may not be running."
    exit 0
fi

SERVER_PID=$(cat "$PID_FILE")

if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "[!] Process $SERVER_PID is not active. Removing stale PID file."
    rm -f "$PID_FILE"
    exit 0
fi

echo "[*] Stopping PocketDev Server (PID: $SERVER_PID)..."
kill "$SERVER_PID"

# Wait up to 5 seconds for clean exit
for i in {1..5}; do
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
        echo "[OK] PocketDev Server stopped gracefully."
        rm -f "$PID_FILE"
        exit 0
    fi
    sleep 1
done

# Force kill if still hanging
echo "[!] Process still active, sending SIGKILL..."
kill -9 "$SERVER_PID" 2>/dev/null || true
rm -f "$PID_FILE"
echo "[OK] Stopped."
