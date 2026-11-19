# PocketDev Server Architecture & Specification

## 1. System Overview

PocketDev Server provides a robust, self-hosted, lightweight software engineering environment on an unrooted Android smartphone (specifically optimized for OPPO Reno2 F).

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
|  |  Termux Userland Environment (Linux 4.14+ Android Kernel Namespace)             |  |
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
|  |  |  - Python App 1 (e.g. FastAPI / Flask on :8081)                           |  |  |
|  |  |  - Node.js App 1 (e.g. Express / Next build on :8082)                     |  |  |
|  |  |  - Static Web App (e.g. Python http.server on :8083)                      |  |  |
|  |  +---------------------------------------------------------------------------+  |  |
|  +---------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------+
```

## 2. Port Allocation Model

To prevent collisions with standard Android system services and allow multiple concurrent servers:

- **8000**: PocketDev Main API and Web Dashboard
- **8022**: Termux OpenSSH daemon
- **8080 - 8100**: Dynamically allocated or user-configured ports for managed projects

## 3. Storage Hierarchy in Termux

Under Termux non-root environment:
- `$PREFIX`: `/data/data/com.termux/files/usr` (Binaries, Python, Node, OpenSSH)
- `$HOME`: `/data/data/com.termux/files/home`
- `$POCKETDEV_HOME`: `$HOME/pocketdev`
  - `backend/`: Application code
  - `frontend/dist/`: Production SPA bundle
  - `data/`: SQLite `pocketdev.db` and runtime state
  - `logs/`: Application, server, and deployment logs
  - `projects/`: Root directory for all managed child projects
    - `projects/{project_id}/`: Project working directory
    - `projects/{project_id}/venv/`: Isolated Python virtual environment (if Python)
    - `projects/{project_id}/node_modules/`: Local packages (if Node.js)
  - `deployments/`: Temporary upload and extraction staging

## 4. Hardware Access Model (Non-Root Android)

1. **CPU Usage**: Extracted from `/proc/stat` and `/proc/cpuinfo` (accessible in Termux).
2. **Memory / RAM**: Extracted from `/proc/meminfo` (`MemTotal`, `MemAvailable`, `MemFree`, `Buffers`, `Cached`).
3. **Storage**: Standard POSIX `statvfs` on `$HOME` (reflects internal 128GB flash partition).
4. **Battery & Thermals**:
   - `termux-battery-status` (via Termux:API) if installed.
   - Sysfs thermal zones (`/sys/class/thermal/thermal_zone*/temp` where world-readable).
   - Graceful fallback with zero fake data when sensors are restricted by Android SELinux.
5. **Network Interfaces**: `/proc/net/dev` and standard socket interface queries to resolve local LAN IP (e.g. `192.168.x.x`).
