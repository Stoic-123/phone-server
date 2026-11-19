# PocketDev Server 🚀
### Transforming OPPO Reno2 F into a Self-Hosted Micro-Development Server

**PocketDev Server** turns an unrooted OPPO Reno2 F Android smartphone (MediaTek Helio P70, 8GB RAM, 128GB UFS flash) into a reliable, lightweight home development server.

It provides a modern dark web dashboard, process runtime supervisor for Python and Node.js microservices, OpenSSH remote shell access, automated Git & ZIP deployments, and a sandboxed AI assistant.

---

## 🌟 Key Features

- **Zero Root Required**: Operates entirely within the Termux userland environment on standard Android/ColorOS.
- **Multi-Runtime Process Supervisor**:
  - Run **Python** (FastAPI, Flask, custom microservices).
  - Run **Node.js** (Express, microservices, REST APIs).
  - Serve **React** production builds and static web applications.
- **Real-Time Hardware Telemetry**: Live CPU utilization, 8GB RAM monitoring, 128GB flash storage usage, battery percentage, thermals, and uptime with zero simulated data.
- **Developer Web Dashboard**: Dark-themed responsive SPA built with React 18, Vite, TypeScript, Tailwind CSS, and Lucide icons.
- **Automated Deployments**: Deploy directly from Windows PC via Git clone/pull or drag-and-drop ZIP archives with Zip-Slip path traversal protection.
- **Secure OpenSSH Access**: High-port (8022) SSH daemon with Ed25519 key authentication and VS Code Remote - SSH support.
- **Sandboxed AI Server Assistant**: Diagnoses application stack traces, provides Helio P70 optimization advice, and requires explicit user confirmation for destructive actions.
- **Process Watchdog**: Automatically detects crashed services and restarts them with backoff logic.

---

## 🏗️ Architecture

```
                      +------------------------------------------+
                      |               Windows PC                 |
                      |   - Browser (Web Dashboard @ :8000)      |
                      |   - PowerShell SSH Client (@ :8022)      |
                      |   - Git / ZIP Deployment CLI / Web UI    |
                      +--------------------+---------------------+
                                           | Wi-Fi (LAN)
                                           v
+---------------------------------------------------------------------------------------+
|  OPPO Reno2 F (MediaTek Helio P70 - 8GB RAM - 128GB Storage - Android / ColorOS)       |
|                                                                                       |
|  +---------------------------------------------------------------------------------+  |
|  |  Termux Userland Environment (Linux Kernel 4.14+ Namespace)                     |  |
|  |                                                                                 |  |
|  |  +---------------------------+  +--------------------------------------------+  |  |
|  |  | OpenSSH Server (Port 8022)|  | PocketDev Core Daemon (FastAPI / Port 8000)|  |  |
|  |  | - Public Key / Password   |  | - System Monitor (/proc, Termux API)       |  |  |
|  |  +---------------------------+  | - Process & Runtime Manager                |  |  |
|  |                                 | - Deployment Engine (Git, ZIP extraction)  |  |  |
|  |  +---------------------------+  | - AI Assistant Service (Restricted Tools)  |  |  |
|  |  | Static Web UI Asset Host  |  | - SQLite Database (State, Auth, Projects)  |  |  |
|  |  | (Served from /static)     |  +---------------------+----------------------+  |  |
|  |  +---------------------------+                        |                            |
|  |                                                       v                            |
|  |  +---------------------------------------------------------------------------+  |  |
|  |  | Managed Child Project Runtimes                                            |  |  |
|  |  |  - Python App 1 (e.g. FastAPI on :8081)                                   |  |  |
|  |  |  - Node.js App 1 (e.g. Express on :8082)                                  |  |  |
|  |  |  - Static Web App (e.g. on :8083)                                         |  |  |
|  |  +---------------------------------------------------------------------------+  |  |
|  +---------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------+
```

---

## ⚡ Quick Start on OPPO Reno2 F

### 1. Install Termux
Install the latest release of Termux from [F-Droid](https://f-droid.org/packages/com.termux/) (do not use Google Play).

### 2. Run Automated Setup
In Termux on the phone:
```bash
git clone <pocketdev-repo-url> ~/pocketdev
cd ~/pocketdev
chmod +x scripts/*.sh
./scripts/install.sh
```

### 3. Start the Server
```bash
./scripts/start.sh
```

### 4. Access the Dashboard
Open your browser on your Windows PC or phone:
```
http://<phone-ip>:8000
```
Log in using the auto-generated initial credentials displayed on the terminal or first-time setup prompt.

---

## 📚 Documentation Directory

- **[Installation Guide](docs/INSTALLATION.md)**: Full walkthrough of Termux installation and first boot.
- **[OPPO Reno2 F & ColorOS Optimizations](docs/OPPO_RENO2F_OPTIMIZATION.md)**: How to prevent ColorOS background task killing and configure battery wake locks.
- **[SSH & Remote Access Guide](docs/SSH_SETUP.md)**: Windows PowerShell SSH setup and VS Code Remote - SSH configuration.
- **[REST API Specification](docs/API_SPEC.md)**: Full API endpoint reference and authentication documentation.
- **[Progress Tracker](docs/PROGRESS.md)**: Phase-by-phase implementation record.

---

## 🧪 Testing

Run the test suite on host or phone:
```bash
python backend/tests/run_tests.py
```
All backend unit tests verify authentication, system metric collection, process lifecycle, project creation/deletion, and AI sandboxing.

---

## 🔒 Security Model

- **Protected Ports**: Only explicitly configured user projects and high-ports (8000, 8022, 8080+) are opened.
- **Path Traversal Protection**: Directory traversal (`../`) and Zip-Slip vulnerabilities are strictly rejected.
- **Authentication**: JWT Bearer tokens with PBKDF2 password hashing and secure token generation.
- **Restricted AI Tools**: Destructive operations (project deletion, service restart, dependency install) require manual user approval before execution.
