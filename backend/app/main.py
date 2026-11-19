import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from backend.app.core.config import settings
from backend.app.core.security import init_admin_credentials
from backend.app.database.session import init_db
from backend.app.api import auth, system, projects, deployments, ai

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database & admin password
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
        print(" (Save this temporary password or change it in Settings!)")
    print(f" API Key     : {admin_info['api_key']}")
    print("=" * 60 + "\n")
    
    yield
    
    # Graceful shutdown: cleanup processes if any
    from backend.app.services.process_manager import process_manager
    process_manager._running = False

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Self-hosted development server for OPPO Reno2 F Android phone",
    lifespan=lifespan
)

# Enable CORS for local network administration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(system.router, prefix=settings.API_V1_PREFIX)
app.include_router(projects.router, prefix=settings.API_V1_PREFIX)
app.include_router(deployments.router, prefix=settings.API_V1_PREFIX)
app.include_router(ai.router, prefix=settings.API_V1_PREFIX)

# Static files / Frontend mounting
frontend_dist = settings.BASE_PATH / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        # Don't intercept API routes
        if full_path.startswith("api/"):
            return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
        
        file_path = frontend_dist / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/")
    def index():
        return {
            "name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "device": settings.DEVICE_MODEL,
            "status": "online",
            "api_docs": "/docs",
            "dashboard_note": "Frontend SPA bundle will be available at root once built (cd frontend && npm run build)."
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=False)
