#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# PocketDev Server - Termux:Boot Autostart Setup
# ==============================================================================

set -e

BOOT_DIR="$HOME/.termux/boot"
mkdir -p "$BOOT_DIR"

POCKETDEV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BOOT_SCRIPT="$BOOT_DIR/pocketdev.sh"

cat << 'EOF' > "$BOOT_SCRIPT"
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock
sshd
sleep 5
EOF

echo "cd \"$POCKETDEV_DIR\" && ./scripts/start.sh" >> "$BOOT_SCRIPT"
chmod +x "$BOOT_SCRIPT"

echo "[OK] Termux:Boot autostart script created at $BOOT_SCRIPT"
echo "When the phone boots, PocketDev Server and OpenSSH will launch automatically."
