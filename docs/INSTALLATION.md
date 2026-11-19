# PocketDev Server: OPPO Reno2 F Installation Guide

This guide details the complete, zero-root installation procedure for converting an OPPO Reno2 F into a dedicated home development server.

---

## 1. Prerequisites & Preparation

### Hardware
- **Device**: OPPO Reno2 F (MediaTek Helio P70, 8GB RAM, 128GB Storage).
- **Network**: Wi-Fi connection (same local subnet as your Windows development PC).
- **Power**: 5V/2A or VOOC Flash Charger.

### Software Required on Phone
> **CRITICAL**: Do **NOT** install Termux from Google Play Store! The Play Store build is obsolete and fails with repository errors.

1. Download **Termux** from [F-Droid](https://f-droid.org/packages/com.termux/) or GitHub Releases (`termux-app_v0.118.x+github-debug_arm64-v8a.apk`).
2. (Optional but recommended) Download **Termux:API** and **Termux:Boot** from F-Droid.

---

## 2. Transferring PocketDev to the Phone

### Option A: Via Git (Recommended)
Open Termux on the phone and run:
```bash
pkg update -y && pkg install -y git
git clone <your-pocketdev-repo-url> ~/pocketdev
cd ~/pocketdev
```

### Option B: Via Local Network / SCP from Windows
If you cloned or built PocketDev on your Windows PC:
```powershell
# From Windows PowerShell in phone-server directory
tar -czf pocketdev.tar.gz backend frontend/dist scripts docs
# Transfer via SCP once OpenSSH is started in Termux:
scp -P 8022 pocketdev.tar.gz u0_aXXX@<phone-ip>:~/
```

---

## 3. Running the Automated Setup Script

Inside Termux on your OPPO Reno2 F:
```bash
cd ~/pocketdev
chmod +x scripts/*.sh
./scripts/install.sh
```

The script will automatically:
1. Acquire a CPU wake-lock.
2. Upgrade Termux packages.
3. Install `python`, `nodejs-lts`, `openssh`, `git`, `tmux`, `termux-api`.
4. Prompt for Android storage permissions (tap **Allow** on screen).
5. Generate OpenSSH host keys and configure port `8022`.
6. Install Python backend requirements (`fastapi`, `uvicorn`, `pydantic`, etc.).
7. Setup directories and file permissions.

---

## 4. Starting the Server

Launch PocketDev:
```bash
./scripts/start.sh
```

You will see the banner:
```
==================================================================
 [OK] PocketDev Server is running!
 Dashboard URL  : http://192.168.1.50:8000
 SSH Access     : ssh -p 8022 u0_a200@192.168.1.50
 Server PID     : 14210
==================================================================
```

---

## 5. First Login & Dashboard Access

1. Open your browser on Windows (or any phone on the Wi-Fi network) and navigate to:
   ```
   http://<phone-ip>:8000
   ```
2. The initial administrator setup modal will display your auto-generated temporary password (also printed in server terminal output).
3. Log in, then visit **Settings** to set your permanent password.
