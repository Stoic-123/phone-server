#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# PocketDev Server - Startup Daemon
# ==============================================================================

set -e

POCKETDEV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$POCKETDEV_DIR"

PID_FILE="$POCKETDEV_DIR/data/pocketdev.pid"
LOG_FILE="$POCKETDEV_DIR/logs/pocketdev_server.log"

# 1. Prevent CPU sleep
if command -v termux-wake-lock >/dev/null 2>&1; then
    termux-wake-lock
    echo "[*] Termux CPU wake-lock acquired."
fi

# 2. Check if OpenSSH daemon is running; start if needed
if ! pgrep -x "sshd" >/dev/null; then
    echo "[*] Starting OpenSSH daemon on port 8022..."
    sshd
else
    echo "[*] OpenSSH daemon is already running on port 8022."
fi

# 3. Check if PocketDev Server is already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "[!] PocketDev Server is already running with PID $OLD_PID"
        exit 0
    else
        rm -f "$PID_FILE"
    fi
fi

# 4. Resolve local IP address
LOCAL_IP="127.0.0.1"
if command -v ifconfig >/dev/null 2>&1; then
    LOCAL_IP=$(ifconfig 2>/dev/null | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -n1 || echo "127.0.0.1")
fi

echo "[*] Launching PocketDev Server on http://0.0.0.0:8000..."
export PYTHONPATH="$POCKETDEV_DIR:$PYTHONPATH"

# Run with python uvicorn
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 >> "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

sleep 2

if kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "=================================================================="
    echo " [OK] PocketDev Server is running!"
    echo " Dashboard URL  : http://${LOCAL_IP}:8000"
    echo " SSH Access     : ssh -p 8022 $(whoami)@${LOCAL_IP}"
    echo " Server PID     : ${SERVER_PID}"
    echo " Logs           : ${LOG_FILE}"
    echo "=================================================================="
else
    echo "[!] Server failed to start. Last log output:"
    tail -n 20 "$LOG_FILE"
    exit 1
fi
