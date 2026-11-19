#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# PocketDev Server - Local Health & Hardware Monitor
# ==============================================================================

echo "=== PocketDev Local Health Inspection ==="

# 1. Check ports
echo -n "[*] Port 8000 (PocketDev Web/API) : "
if curl -s http://127.0.0.1:8000/api/health >/dev/null 2>&1; then
    echo "ONLINE (Healthy)"
else
    echo "OFFLINE"
fi

echo -n "[*] Port 8022 (OpenSSH Server)    : "
if pgrep -x "sshd" >/dev/null 2>&1; then
    echo "ONLINE"
else
    echo "OFFLINE"
fi

# 2. Memory stats
if [ -f "/proc/meminfo" ]; then
    TOTAL_MEM=$(grep MemTotal /proc/meminfo | awk '{print int($2/1024)}')
    AVAIL_MEM=$(grep MemAvailable /proc/meminfo | awk '{print int($2/1024)}')
    echo "[*] RAM Status                    : ${AVAIL_MEM} MB available of ${TOTAL_MEM} MB"
fi

# 3. Battery stats
if command -v termux-battery-status >/dev/null 2>&1; then
    BATT_JSON=$(termux-battery-status 2>/dev/null || echo "{}")
    echo "[*] Battery / Thermals            : $(echo "$BATT_JSON" | grep -o '"percentage":[0-9]*' | cut -d: -f2)% (Temp: $(echo "$BATT_JSON" | grep -o '"temperature":[0-9.]*' | cut -d: -f2)°C)"
fi

# 4. Storage stats
DISK_USAGE=$(df -h "$HOME" | tail -n1 | awk '{print $3 " used / " $2 " total (" $5 ")"}')
echo "[*] Storage (Internal Flash)      : $DISK_USAGE"

echo "========================================="
