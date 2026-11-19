# PocketDev Server REST API Specification

Base URL: `http://<phone-ip>:8000/api`

All endpoints (except `/health` and `/auth/login`) require Bearer token authentication via:
`Authorization: Bearer <jwt_token>`
or
`X-API-Key: <admin_api_key>`

---

## 1. Authentication

### `POST /auth/login`
Authenticates user and returns JWT bearer token.
- **Request Body**:
  ```json
  {
    "username": "admin",
    "password": "<admin_password>"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "expires_in": 604800,
    "username": "admin",
    "is_initial_password": false
  }
  ```

### `GET /auth/status`
Checks if authentication session is valid.

### `POST /auth/change-password`
Updates the administrator password.
- **Request Body**:
  ```json
  {
    "current_password": "old_pass",
    "new_password": "new_secure_pass"
  }
  ```

---

## 2. System Monitoring

### `GET /health`
Public lightweight health probe for reverse proxies and uptime monitors.
- **Response (200 OK)**:
  ```json
  {
    "status": "healthy",
    "server": "PocketDev Server",
    "device": "OPPO Reno2 F (MediaTek Helio P70)"
  }
  ```

### `GET /system`
Full hardware telemetry, metrics, and running child services.
- **Response (200 OK)**:
  ```json
  {
    "online": true,
    "device_model": "OPPO Reno2 F (MediaTek Helio P70)",
    "android_version": "Android 10 (API 29) / ColorOS 7",
    "kernel_version": "4.14.186",
    "uptime_seconds": 154320.0,
    "uptime_human": "1d 18h 52m",
    "cpu": {
      "usage_percent": 14.5,
      "cores": 8,
      "model": "MediaTek Helio P70",
      "frequency_mhz": 1989.0
    },
    "memory": {
      "total_mb": 7820.0,
      "used_mb": 2150.0,
      "free_mb": 5670.0,
      "available_mb": 5670.0,
      "usage_percent": 27.5
    },
    "storage": {
      "total_gb": 108.4,
      "used_gb": 18.2,
      "free_gb": 90.2,
      "usage_percent": 16.8,
      "path": "/data/data/com.termux/files/home/pocketdev"
    },
    "battery": {
      "present": true,
      "percentage": 88,
      "temperature_c": 33.2,
      "status": "Charging",
      "health": "GOOD"
    },
    "network": {
      "local_ip": "192.168.1.50",
      "hostname": "localhost"
    },
    "services": []
  }
  ```

---

## 3. Project Management

### `GET /projects`
Returns array of all created projects and runtime statuses.

### `POST /projects`
Creates a new project.
- **Request Body**:
  ```json
  {
    "name": "My API",
    "description": "FastAPI service",
    "type": "python_fastapi",
    "port": 8081,
    "entrypoint": "main.py",
    "auto_restart": true
  }
  ```

### `GET /projects/{id}`
Returns details for a specific project.

### `PUT /projects/{id}`
Updates project configuration or auto-restart preference.

### `DELETE /projects/{id}`
Stops the process, deletes project files and removes record from database.

### `POST /projects/{id}/start`
Launches the project runtime.

### `POST /projects/{id}/stop`
Stops the project runtime safely.

### `POST /projects/{id}/restart`
Stops and relaunches the project runtime.

### `GET /projects/{id}/logs?limit=150`
Returns recent stdout/stderr lines from the project log file.

---

## 4. Deployments

### `POST /deployments/git`
Deploys code from a remote Git repository into the project directory.
- **Request Body**:
  ```json
  {
    "project_id": "my-api-123",
    "repo_url": "https://github.com/user/repo.git",
    "branch": "main",
    "install_dependencies": true,
    "restart_after_deploy": true
  }
  ```

### `POST /deployments/upload-zip`
Multipart form upload of a `.zip` archive containing application code.
- **Form Fields**: `project_id`, `file` (binary .zip), `install_dependencies`, `restart_after_deploy`.

### `GET /deployments/{project_id}`
Returns history of deployments and build outputs.

---

## 5. AI Assistant & Restricted Tools

### `GET /ai/tools`
Returns list of available sandboxed tools and whether they require user confirmation.

### `POST /ai/chat`
Interacts with the AI assistant.
- **Request Body**:
  ```json
  {
    "message": "Check server health and explain recent project errors",
    "conversation_history": []
  }
  ```

### `POST /ai/execute`
Executes an approved tool action after user confirmation.
- **Request Body**:
  ```json
  {
    "action_id": "act-3f41a8",
    "confirmed": true
  }
  ```
