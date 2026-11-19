import os
import sys
import json
import time
from pathlib import Path
from typing import Optional, Dict, Any, List

from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, FileResponse, Response
from starlette.routing import Route, Mount
from starlette.staticfiles import StaticFiles

from backend.app.core.config import settings
from backend.app.core.security import (
    verify_password,
    hash_password,
    create_access_token,
    decode_access_token,
    init_admin_credentials
)
from backend.app.database.session import init_db, get_db
from backend.app.services.system_monitor import system_monitor
from backend.app.services.process_manager import process_manager
from backend.app.services.project_service import project_service
from backend.app.services.deployer import deployer
from backend.app.services.ai_assistant import ai_assistant

# --- Authentication Helpers ---
def check_auth(request: Request) -> Optional[str]:
    admin_data = init_admin_credentials()
    api_key = request.headers.get("x-api-key")
    if api_key and api_key == admin_data.get("api_key"):
        return admin_data.get("username", "admin")

    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
        payload = decode_access_token(token)
        if payload and payload.get("sub"):
            return payload["sub"]
    return None

def require_auth(request: Request):
    user = check_auth(request)
    if not user:
        return JSONResponse(status_code=401, content={"detail": "Unauthorized access"})
    return user

# --- Auth Endpoints ---
async def api_login(request: Request):
    try:
        data = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"detail": "Invalid JSON body"})
    
    username = data.get("username", "")
    password = data.get("password", "")
    admin_data = init_admin_credentials()

    if username != admin_data.get("username", "admin") or not verify_password(password, admin_data.get("password_hash", "")):
        return JSONResponse(status_code=401, content={"detail": "Invalid username or password"})

    is_initial = "initial_password" in admin_data and password == admin_data.get("initial_password")
    token = create_access_token({"sub": username, "role": "admin"})
    
    return JSONResponse({
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.JWT_EXPIRE_MINUTES * 60,
        "username": username,
        "is_initial_password": is_initial
    })

async def api_auth_status(request: Request):
    user = check_auth(request)
    if not user:
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    admin_data = init_admin_credentials()
    return JSONResponse({
        "authenticated": True,
        "username": user,
        "is_initial_password": "initial_password" in admin_data
    })

async def api_change_password(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    try:
        data = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"detail": "Invalid JSON"})

    current_pwd = data.get("current_password", "")
    new_pwd = data.get("new_password", "")
    admin_data = init_admin_credentials()

    if not verify_password(current_pwd, admin_data.get("password_hash", "")):
        return JSONResponse(status_code=400, content={"detail": "Current password verification failed"})
    if len(new_pwd) < 6:
        return JSONResponse(status_code=400, content={"detail": "New password must be at least 6 characters long"})

    admin_data["password_hash"] = hash_password(new_pwd)
    if "initial_password" in admin_data:
        del admin_data["initial_password"]

    with open(settings.ADMIN_CONFIG_PATH, "w") as f:
        json.dump(admin_data, f, indent=2)

    return JSONResponse({"status": "success", "message": "Password changed successfully"})

async def api_initial_credentials(request: Request):
    admin_data = init_admin_credentials()
    if "initial_password" in admin_data:
        return JSONResponse({
            "initial_setup_required": True,
            "username": admin_data["username"],
            "initial_password": admin_data["initial_password"]
        })
    return JSONResponse({"initial_setup_required": False})

from backend.app.schemas.base import to_dict

# --- System Endpoints ---
async def api_health(request: Request):
    return JSONResponse({
        "status": "healthy",
        "server": settings.PROJECT_NAME,
        "device": system_monitor.get_android_version() or settings.DEVICE_MODEL,
        "mode": "standalone"
    })

async def api_system(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    active_services = process_manager.get_active_services_status()
    metrics = system_monitor.get_full_metrics(services=active_services)
    return JSONResponse(to_dict(metrics))

async def api_system_services(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    return JSONResponse(process_manager.get_active_services_status())

async def api_system_logs(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    limit = int(request.query_params.get("limit", 50))
    with get_db() as db:
        cur = db.cursor()
        cur.execute("SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = cur.fetchall()
        return JSONResponse([
            {
                "id": r["id"],
                "level": r["level"],
                "source": r["source"],
                "message": r["message"],
                "project_id": r["project_id"],
                "timestamp": r["timestamp"]
            }
            for r in rows
        ])

# --- Projects Endpoints ---
async def api_projects_list(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    projs = project_service.list_projects()
    return JSONResponse([to_dict(p) for p in projs])

async def api_projects_create(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"detail": "Invalid JSON"})

    from backend.app.schemas.project import ProjectCreate
    try:
        create_obj = ProjectCreate(**body)
        res = project_service.create_project(create_obj)
        return JSONResponse(to_dict(res), status_code=201)
    except ValueError as e:
        return JSONResponse(status_code=400, content={"detail": str(e)})

async def api_project_detail(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    pid = request.path_params["id"]
    proj = project_service.get_project(pid)
    if not proj:
        return JSONResponse(status_code=404, content={"detail": "Project not found"})
    return JSONResponse(to_dict(proj))

async def api_project_update(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    pid = request.path_params["id"]
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"detail": "Invalid JSON"})
    from backend.app.schemas.project import ProjectUpdate
    try:
        proj = project_service.update_project(pid, ProjectUpdate(**body))
        if not proj:
            return JSONResponse(status_code=404, content={"detail": "Project not found"})
        return JSONResponse(to_dict(proj))
    except ValueError as e:
        return JSONResponse(status_code=400, content={"detail": str(e)})

async def api_project_delete(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    pid = request.path_params["id"]
    ok = project_service.delete_project(pid)
    if not ok:
        return JSONResponse(status_code=404, content={"detail": "Project not found"})
    return JSONResponse({"status": "success", "message": f"Project {pid} deleted"})

async def api_project_start(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    pid = request.path_params["id"]
    ok, msg = process_manager.start_project(pid)
    if not ok:
        return JSONResponse(status_code=400, content={"detail": msg})
    return JSONResponse({"status": "success", "message": msg})

async def api_project_stop(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    pid = request.path_params["id"]
    ok, msg = process_manager.stop_project(pid)
    return JSONResponse({"status": "success", "message": msg})

async def api_project_restart(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    pid = request.path_params["id"]
    ok, msg = process_manager.restart_project(pid)
    if not ok:
        return JSONResponse(status_code=400, content={"detail": msg})
    return JSONResponse({"status": "success", "message": msg})

async def api_project_tunnel_start(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    pid = request.path_params["id"]
    proj = project_service.get_project(pid)
    if not proj:
        return JSONResponse(status_code=404, content={"detail": "Project not found"})
    if proj.status != "running":
        return JSONResponse(status_code=400, content={"detail": f"Project must be running to generate a public URL. Current status is {proj.status}."})
    from backend.app.services.tunnel_manager import tunnel_manager
    ok, msg, url = tunnel_manager.start_quick_tunnel(pid, proj.port)
    if not ok:
        return JSONResponse(status_code=400, content={"detail": msg})
    return JSONResponse({"status": "success", "message": msg, "public_url": url})

async def api_project_tunnel_stop(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    pid = request.path_params["id"]
    from backend.app.services.tunnel_manager import tunnel_manager
    ok, msg = tunnel_manager.stop_tunnel(pid)
    return JSONResponse({"status": "success", "message": msg})

async def api_project_logs(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    pid = request.path_params["id"]
    proj = project_service.get_project(pid)
    if not proj:
        return JSONResponse(status_code=404, content={"detail": "Project not found"})
    lines = process_manager.get_logs(pid, limit=int(request.query_params.get("limit", 150)))
    return JSONResponse({
        "id": pid,
        "name": proj.name,
        "lines": lines,
        "total_lines": len(lines)
    })

# --- Deployment Endpoints ---
async def api_deploy_git(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"detail": "Invalid JSON"})

    pid = body.get("project_id")
    repo_url = body.get("repo_url")
    branch = body.get("branch", "main")
    if not pid or not repo_url:
        return JSONResponse(status_code=400, content={"detail": "Missing project_id or repo_url"})

    success, log, dep_id = deployer.deploy_git(
        project_id=pid,
        repo_url=repo_url,
        branch=branch,
        install_dependencies=body.get("install_dependencies", True),
        restart_after_deploy=body.get("restart_after_deploy", True)
    )
    return JSONResponse({
        "id": dep_id,
        "project_id": pid,
        "source_type": "git",
        "source_ref": repo_url,
        "status": "success" if success else "failed",
        "log": log,
        "created_at": time.time()
    })

async def api_deploy_zip(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    form = await request.form()
    project_id = form.get("project_id")
    file = form.get("file")
    if not project_id or not file:
        return JSONResponse(status_code=400, content={"detail": "Missing project_id or file"})

    filename = getattr(file, "filename", "upload.zip")
    if not filename.endswith(".zip"):
        return JSONResponse(status_code=400, content={"detail": "Only .zip files are supported"})

    zip_dest = settings.DEPLOYMENTS_PATH / f"upload_{project_id}_{filename}"
    try:
        content = await file.read()
        with open(zip_dest, "wb") as f:
            f.write(content)

        success, log, dep_id = deployer.deploy_zip(
            project_id=str(project_id),
            zip_file_path=zip_dest,
            install_dependencies=True,
            restart_after_deploy=True
        )
    finally:
        if zip_dest.exists():
            zip_dest.unlink(missing_ok=True)

    return JSONResponse({
        "id": dep_id,
        "project_id": project_id,
        "source_type": "zip",
        "source_ref": filename,
        "status": "success" if success else "failed",
        "log": log,
        "created_at": time.time()
    })

async def api_deployments_list(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    pid = request.path_params["project_id"]
    with get_db() as db:
        cur = db.cursor()
        cur.execute("SELECT * FROM deployments WHERE project_id = ? ORDER BY created_at DESC", (pid,))
        rows = cur.fetchall()
        return JSONResponse([
            {
                "id": r["id"],
                "project_id": r["project_id"],
                "source_type": r["source_type"],
                "source_ref": r["source_ref"],
                "status": r["status"],
                "log": r["log"],
                "created_at": r["created_at"]
            }
            for r in rows
        ])

# --- AI Endpoints ---
async def api_ai_tools(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    return JSONResponse(ai_assistant.get_available_tools())

async def api_ai_chat(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"detail": "Invalid JSON"})
    from backend.app.schemas.ai import AiChatRequest
    res = await ai_assistant.chat(AiChatRequest(**body))
    return JSONResponse(res.model_dump() if hasattr(res, "model_dump") else res.dict())

async def api_ai_execute(request: Request):
    if not check_auth(request):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"detail": "Invalid JSON"})
    from backend.app.schemas.ai import AiToolExecutionRequest
    success, msg = ai_assistant.execute_confirmed_action(AiToolExecutionRequest(**body))
    if not success and not body.get("confirmed", False):
        return JSONResponse({"status": "cancelled", "message": msg})
    if not success:
        return JSONResponse(status_code=400, content={"detail": msg})
    return JSONResponse({"status": "success", "message": msg})

# --- Static Frontend SPA ---
frontend_dist = settings.BASE_PATH / "frontend" / "dist"

async def spa_index(request: Request):
    full_path = request.path_params.get("full_path", "")
    if full_path.startswith("api/") or request.url.path.startswith("/api/"):
        return JSONResponse(status_code=404, content={"detail": f"API endpoint not found: {request.url.path}"})
    index_file = frontend_dist / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return JSONResponse({
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "device": settings.DEVICE_MODEL,
        "status": "online"
    })

routes = [
    # Auth
    Route("/api/auth/login", api_login, methods=["POST"]),
    Route("/api/auth/status", api_auth_status, methods=["GET"]),
    Route("/api/auth/change-password", api_change_password, methods=["POST"]),
    Route("/api/auth/initial-credentials", api_initial_credentials, methods=["GET"]),
    # System
    Route("/api/health", api_health, methods=["GET"]),
    Route("/api/system", api_system, methods=["GET"]),
    Route("/api/system/services", api_system_services, methods=["GET"]),
    Route("/api/system/logs", api_system_logs, methods=["GET"]),
    # Projects sub-routes (MUST BE BEFORE /{id})
    Route("/api/projects", api_projects_list, methods=["GET"]),
    Route("/api/projects", api_projects_create, methods=["POST"]),
    Route("/api/projects/{id}/start", api_project_start, methods=["POST"]),
    Route("/api/projects/{id}/stop", api_project_stop, methods=["POST"]),
    Route("/api/projects/{id}/restart", api_project_restart, methods=["POST"]),
    Route("/api/projects/{id}/tunnel/start", api_project_tunnel_start, methods=["POST"]),
    Route("/api/projects/{id}/tunnel/stop", api_project_tunnel_stop, methods=["POST"]),
    Route("/api/projects/{id}/logs", api_project_logs, methods=["GET"]),
    Route("/api/projects/{id}", api_project_detail, methods=["GET"]),
    Route("/api/projects/{id}", api_project_update, methods=["PUT"]),
    Route("/api/projects/{id}", api_project_delete, methods=["DELETE"]),
    # Deployments
    Route("/api/deployments/git", api_deploy_git, methods=["POST"]),
    Route("/api/deployments/upload-zip", api_deploy_zip, methods=["POST"]),
    Route("/api/deployments/{project_id}", api_deployments_list, methods=["GET"]),
    # AI
    Route("/api/ai/tools", api_ai_tools, methods=["GET"]),
    Route("/api/ai/chat", api_ai_chat, methods=["POST"]),
    Route("/api/ai/execute", api_ai_execute, methods=["POST"]),
]

if (frontend_dist / "assets").exists():
    routes.append(Mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets"))

routes.append(Route("/{full_path:path}", spa_index, methods=["GET"]))

middleware = [
    Middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
        allow_credentials=True
    )
]

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: Starlette):
    settings.ensure_directories()
    init_db()
    admin_info = init_admin_credentials()
    print("\n" + "=" * 60)
    print("   POCKETDEV SERVER - OPPO RENO2 F ANDROID HOST")
    print("=" * 60)
    print(f" Environment : {'Android / Termux' if settings.IS_ANDROID else 'Standard Linux / PC'}")
    print(f" Web & API   : http://{settings.HOST}:{settings.PORT}")
    print(f" OpenSSH Port: {settings.SSH_PORT}")
    print(f" Admin User  : {admin_info['username']}")
    if "initial_password" in admin_info:
        print(f" Setup Pass  : {admin_info['initial_password']}")
    print(f" API Key     : {admin_info['api_key']}")
    print("=" * 60 + "\n")
    yield
    process_manager._running = False

app = Starlette(
    routes=routes,
    middleware=middleware,
    lifespan=lifespan
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=False)
