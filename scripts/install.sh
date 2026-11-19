#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# PocketDev Server - Automated Termux Installer for OPPO Reno2 F
# Lightweight Non-Root Server Runtime (Zero-Rust Compilation)
# ==============================================================================

set -e

echo "=================================================================="
echo "    PocketDev Server - OPPO Reno2 F Installer (Non-Root)          "
echo "=================================================================="

# 1. Verify Termux environment
if [ ! -d "/data/data/com.termux" ]; then
    echo "[!] Error: This script must be executed inside Termux on an Android device."
    exit 1
fi

# 2. Acquire wake lock immediately to prevent CPU sleep during installation
echo "[*] Requesting Termux wake-lock..."
termux-wake-lock || true

# 3. Update Termux repositories and packages
echo "[*] Updating package repositories..."
pkg update -y && pkg upgrade -y

# 4. Install essential packages: Python, Node.js LTS, OpenSSH, Git, tmux, curl
echo "[*] Installing native toolchain: Python, Node.js, OpenSSH, Git, tmux..."
pkg install -y \
    python \
    python-pip \
    nodejs-lts \
    openssh \
    git \
    tmux \
    curl \
    termux-api \
    termux-tools

# 5. Setup Termux Storage access (prompts Android permission dialog)
echo "[*] Configuring Termux storage permissions..."
termux-setup-storage || true

# 6. Setup OpenSSH host keys and configure port 8022
echo "[*] Setting up OpenSSH on port 8022..."
if [ ! -f "$PREFIX/etc/ssh/ssh_host_rsa_key" ]; then
    ssh-keygen -A
fi

# Ensure sshd config has port 8022
SSHD_CONFIG="$PREFIX/etc/ssh/sshd_config"
if ! grep -q "^Port 8022" "$SSHD_CONFIG" 2>/dev/null; then
    echo "Port 8022" >> "$SSHD_CONFIG"
fi

# 7. Setup Python packages
POCKETDEV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$POCKETDEV_DIR"

echo "[*] Setting up lightweight Python runtime in $POCKETDEV_DIR..."
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt

# 8. Ensure project directory hierarchy exists
mkdir -p "$POCKETDEV_DIR/data"
mkdir -p "$POCKETDEV_DIR/logs/projects"
mkdir -p "$POCKETDEV_DIR/projects"
mkdir -p "$POCKETDEV_DIR/deployments"

# 9. Make scripts executable
chmod +x "$POCKETDEV_DIR/scripts/"*.sh

echo ""
echo "=================================================================="
echo " [OK] PocketDev Server installed successfully on OPPO Reno2 F!   "
echo "=================================================================="
echo " Next steps:"
echo " 1. Start the server: ./scripts/start.sh"
echo " 2. Check health:     ./scripts/health-check.sh"
echo " 3. Termux username:  $(whoami)"
echo " 4. Set password:     passwd"
echo "=================================================================="
