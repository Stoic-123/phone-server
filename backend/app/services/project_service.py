import os
import re
import json
import time
import uuid
import shutil
from pathlib import Path
from typing import Optional, List, Dict, Any

from backend.app.core.config import settings
from backend.app.database.session import get_db
from backend.app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from backend.app.services.process_manager import process_manager

class ProjectService:
    @staticmethod
    def _slugify(name: str) -> str:
        s = re.sub(r"[^\w\s-]", "", name).strip().lower()
        return re.sub(r"[-\s]+", "-", s)

    def list_projects(self) -> List[ProjectResponse]:
        with get_db() as db:
            cur = db.cursor()
            cur.execute("SELECT * FROM projects ORDER BY created_at DESC")
            rows = cur.fetchall()
            
            projects = []
            for r in rows:
                try:
                    env_dict = json.loads(r["env_vars"]) if r["env_vars"] else {}
                except Exception:
                    env_dict = {}
                projects.append(ProjectResponse(
                    id=r["id"],
                    name=r["name"],
                    description=r["description"] or "",
                    type=r["type"],
                    port=r["port"],
                    entrypoint=r["entrypoint"],
                    env_vars=env_dict,
                    status=r["status"],
                    auto_restart=bool(r["auto_restart"]),
                    pid=r["pid"],
                    public_url=r["public_url"] if "public_url" in r.keys() else None,
                    created_at=r["created_at"],
                    updated_at=r["updated_at"]
                ))
            return projects

    def get_project(self, project_id: str) -> Optional[ProjectResponse]:
        with get_db() as db:
            cur = db.cursor()
            cur.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
            r = cur.fetchone()
            if not r:
                return None
            try:
                env_dict = json.loads(r["env_vars"]) if r["env_vars"] else {}
            except Exception:
                env_dict = {}
            return ProjectResponse(
                id=r["id"],
                name=r["name"],
                description=r["description"] or "",
                type=r["type"],
                port=r["port"],
                entrypoint=r["entrypoint"],
                env_vars=env_dict,
                status=r["status"],
                auto_restart=bool(r["auto_restart"]),
                pid=r["pid"],
                public_url=r["public_url"] if "public_url" in r.keys() else None,
                created_at=r["created_at"],
                updated_at=r["updated_at"]
            )

    def create_project(self, data: ProjectCreate) -> ProjectResponse:
        project_id = f"{self._slugify(data.name)}-{uuid.uuid4().hex[:6]}"
        now = time.time()
        
        # Check port uniqueness in database
        with get_db() as db:
            cur = db.cursor()
            cur.execute("SELECT id FROM projects WHERE port = ?", (data.port,))
            if cur.fetchone():
                raise ValueError(f"Port {data.port} is already assigned to another project")

            env_json = json.dumps(data.env_vars or {})
            cur.execute("""
            INSERT INTO projects (id, name, description, type, port, entrypoint, env_vars, status, auto_restart, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'stopped', ?, ?, ?)
            """, (
                project_id,
                data.name,
                data.description or "",
                data.type,
                data.port,
                data.entrypoint,
                env_json,
                1 if data.auto_restart else 0,
                now,
                now
            ))

        # Create project directory and bootstrap starter template files if folder is empty
        proj_dir = settings.PROJECTS_PATH / project_id
        proj_dir.mkdir(parents=True, exist_ok=True)
        self._bootstrap_template(proj_dir, data.type, data.port, data.name)

        return self.get_project(project_id)

    def _bootstrap_template(self, proj_dir: Path, ptype: str, port: int, name: str):
        if ptype == "python_fastapi":
            main_py = proj_dir / "main.py"
            if not main_py.exists():
                main_py.write_text(f'''try:
    from fastapi import FastAPI
    app = FastAPI(title="{name}", description="PocketDev hosted API on OPPO Reno2 F")
    @app.get("/")
    def read_root():
        return {{"status": "online", "project": "{name}", "device": "OPPO Reno2 F"}}
    @app.get("/health")
    def health():
        return {{"status": "healthy"}}
except ImportError:
    from starlette.applications import Starlette
    from starlette.responses import JSONResponse
    from starlette.routing import Route
    async def root(req):
        return JSONResponse({{"status": "online", "project": "{name}", "device": "OPPO Reno2 F"}})
    async def health(req):
        return JSONResponse({{"status": "healthy"}})
    app = Starlette(routes=[Route("/", root), Route("/health", health)])
''', encoding="utf-8")
        elif ptype == "python_flask":
            app_py = proj_dir / "app.py"
            if not app_py.exists():
                app_py.write_text(f"""from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/")
def index():
    return jsonify(project="{name}", status="running", host="PocketDev Server")
""", encoding="utf-8")
        elif ptype == "nodejs_express":
            pkg_json = proj_dir / "package.json"
            if not pkg_json.exists():
                pkg_json.write_text(f"""{{
  "name": "{self._slugify(name)}",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {{
    "express": "^4.19.2"
  }}
}}
""", encoding="utf-8")
            server_js = proj_dir / "server.js"
            if not server_js.exists():
                server_js.write_text(f"""const http = require('http');
const port = process.env.PORT || {port};

const server = http.createServer((req, res) => {{
  res.writeHead(200, {{ 'Content-Type': 'application/json' }});
  res.end(JSON.stringify({{
    project: '{name}',
    message: 'Hello from Node.js on PocketDev Android Server',
    uptime: process.uptime()
  }}));
}});

server.listen(port, () => {{
  console.log(`Server running at port ${{port}}`);
}});
""", encoding="utf-8")
        elif ptype == "static_html":
            index_html = proj_dir / "index.html"
            if not index_html.exists():
                index_html.write_text(f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{name} - PocketDev</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }}
        .card {{ background: #1e293b; padding: 2rem; border-radius: 12px; border: 1px solid #334155; max-width: 480px; text-align: center; }}
        h1 {{ color: #38bdf8; margin-top: 0; }}
        .badge {{ background: #0369a1; padding: 4px 12px; border-radius: 999px; font-size: 0.85rem; }}
    </style>
</head>
<body>
    <div class="card">
        <h1>{name}</h1>
        <p>Static Website deployed on PocketDev Server (OPPO Reno2 F)</p>
        <span class="badge">Port {port}</span>
    </div>
</body>
</html>
""", encoding="utf-8")

    def update_project(self, project_id: str, data: ProjectUpdate) -> Optional[ProjectResponse]:
        proj = self.get_project(project_id)
        if not proj:
            return None

        fields = []
        params = []
        if data.name is not None:
            fields.append("name = ?")
            params.append(data.name)
        if data.description is not None:
            fields.append("description = ?")
            params.append(data.description)
        if data.port is not None and data.port != proj.port:
            with get_db() as db:
                if db.cursor().execute("SELECT id FROM projects WHERE port = ? AND id != ?", (data.port, project_id)).fetchone():
                    raise ValueError(f"Port {data.port} is already used by another project")
            fields.append("port = ?")
            params.append(data.port)
        if data.entrypoint is not None:
            fields.append("entrypoint = ?")
            params.append(data.entrypoint)
        if data.env_vars is not None:
            fields.append("env_vars = ?")
            params.append(json.dumps(data.env_vars))
        if data.auto_restart is not None:
            fields.append("auto_restart = ?")
            params.append(1 if data.auto_restart else 0)

        if fields:
            fields.append("updated_at = ?")
            params.append(time.time())
            params.append(project_id)
            query = f"UPDATE projects SET {', '.join(fields)} WHERE id = ?"
            with get_db() as db:
                db.cursor().execute(query, tuple(params))

        return self.get_project(project_id)

    def delete_project(self, project_id: str) -> bool:
        proj = self.get_project(project_id)
        if not proj:
            return False

        # Stop if running
        process_manager.stop_project(project_id)

        # Remove from database
        with get_db() as db:
            cur = db.cursor()
            cur.execute("DELETE FROM deployments WHERE project_id = ?", (project_id,))
            cur.execute("DELETE FROM system_logs WHERE project_id = ?", (project_id,))
            cur.execute("DELETE FROM projects WHERE id = ?", (project_id,))

        # Remove directory safely
        proj_dir = settings.PROJECTS_PATH / project_id
        if proj_dir.exists():
            shutil.rmtree(proj_dir, ignore_errors=True)

        # Remove log file
        log_file = process_manager.get_project_log_path(project_id)
        if log_file.exists():
            try:
                log_file.unlink()
            except Exception:
                pass

        return True

project_service = ProjectService()
