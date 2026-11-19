import os
import sys
import time
import socket
import signal
import asyncio
import threading
import subprocess
from pathlib import Path
from typing import Dict, Optional, List, Tuple

from backend.app.core.config import settings
from backend.app.database.session import get_db

class ProcessManager:
    def __init__(self):
        self._processes: Dict[str, subprocess.Popen] = {}
        self._log_files: Dict[str, Any] = {}
        self._lock = threading.Lock()
        self._watchdog_thread: Optional[threading.Thread] = None
        self._running = True
        self._start_watchdog()

    def _start_watchdog(self):
        self._watchdog_thread = threading.Thread(target=self._watchdog_loop, daemon=True)
        self._watchdog_thread.start()

    def _watchdog_loop(self):
        while self._running:
            time.sleep(5)
            self._check_and_recover_processes()

    def _check_and_recover_processes(self):
        with self._lock:
            # Check dead processes
            dead_projects = []
            for project_id, proc in list(self._processes.items()):
                poll_res = proc.poll()
                if poll_res is not None:
                    # Process died
                    dead_projects.append((project_id, poll_res))
            
            for project_id, return_code in dead_projects:
                del self._processes[project_id]
                if project_id in self._log_files:
                    try:
                        self._log_files[project_id].close()
                    except Exception:
                        pass
                    del self._log_files[project_id]
                self._handle_process_exit(project_id, return_code)

    def _handle_process_exit(self, project_id: str, return_code: int):
        with get_db() as db:
            cur = db.cursor()
            cur.execute("SELECT auto_restart, name FROM projects WHERE id = ?", (project_id,))
            row = cur.fetchone()
            if not row:
                return
            auto_restart = bool(row["auto_restart"])
            name = row["name"]
            
            status = "stopped" if return_code == 0 else "error"
            cur.execute("UPDATE projects SET status = ?, pid = NULL WHERE id = ?", (status, project_id))
            cur.execute(
                "INSERT INTO system_logs (level, source, message, project_id, timestamp) VALUES (?, ?, ?, ?, ?)",
                ("WARNING" if return_code != 0 else "INFO", "process_manager", f"Project '{name}' exited with code {return_code}", project_id, time.time())
            )
            
        if auto_restart and return_code != 0:
            # Auto-restart crashed service after short delay
            time.sleep(2)
            try:
                self.start_project(project_id)
            except Exception as e:
                with get_db() as db:
                    db.cursor().execute(
                        "INSERT INTO system_logs (level, source, message, project_id, timestamp) VALUES (?, ?, ?, ?, ?)",
                        ("ERROR", "process_manager", f"Failed auto-restart for '{project_id}': {str(e)}", project_id, time.time())
                    )

    def is_port_in_use(self, port: int) -> bool:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            return s.connect_ex(("127.0.0.1", port)) == 0

    def get_project_log_path(self, project_id: str) -> Path:
        proj_log_dir = settings.LOGS_PATH / "projects"
        proj_log_dir.mkdir(parents=True, exist_ok=True)
        return proj_log_dir / f"{project_id}.log"

    def start_project(self, project_id: str) -> Tuple[bool, str]:
        with self._lock:
            if project_id in self._processes:
                proc = self._processes[project_id]
                if proc.poll() is None:
                    return False, f"Project {project_id} is already running with PID {proc.pid}"
                else:
                    del self._processes[project_id]

            with get_db() as db:
                cur = db.cursor()
                cur.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
                proj = cur.fetchone()
                if not proj:
                    return False, f"Project {project_id} not found"

            port = proj["port"]
            ptype = proj["type"]
            entrypoint = proj["entrypoint"]
            proj_dir = settings.PROJECTS_PATH / project_id

            if not proj_dir.exists():
                proj_dir.mkdir(parents=True, exist_ok=True)

            if self.is_port_in_use(port):
                return False, f"Port {port} is already in use by another service on the device"

            # Parse environment variables safely
            import json
            try:
                custom_env = json.loads(proj["env_vars"]) if proj["env_vars"] else {}
            except Exception:
                custom_env = {}

            # Construct safe execution command based on project type
            cmd: List[str] = []
            exec_env = os.environ.copy()
            exec_env.update({k: str(v) for k, v in custom_env.items()})
            exec_env["PORT"] = str(port)

            if ptype == "python_fastapi":
                module_name = entrypoint.replace(".py", "").replace("/", ".").replace("\\", ".")
                cmd = [sys.executable, "-m", "uvicorn", f"{module_name}:app", "--host", "0.0.0.0", "--port", str(port)]
            elif ptype == "python_flask":
                exec_env["FLASK_APP"] = entrypoint
                cmd = [sys.executable, "-m", "flask", "run", "--host", "0.0.0.0", "--port", str(port)]
            elif ptype == "python_generic":
                cmd = [sys.executable, entrypoint]
            elif ptype == "nodejs_express" or ptype == "nodejs_generic":
                node_bin = "node"
                cmd = [node_bin, entrypoint]
            elif ptype == "static_html":
                # Built-in lightweight python static web server
                cmd = [sys.executable, "-m", "http.server", str(port), "--bind", "0.0.0.0", "--directory", str(proj_dir)]
            else:
                return False, f"Unsupported project type: {ptype}"

            # Prepare logging file
            log_file_path = self.get_project_log_path(project_id)
            log_file = open(log_file_path, "a", buffering=1, encoding="utf-8")
            timestamp_str = time.strftime("%Y-%m-%d %H:%M:%S")
            log_file.write(f"\n--- [PocketDev] Starting service on port {port} at {timestamp_str} ---\n")
            log_file.write(f"--- Command: {' '.join(cmd)} ---\n")
            log_file.flush()

            try:
                proc = subprocess.Popen(
                    cmd,
                    cwd=str(proj_dir),
                    env=exec_env,
                    stdout=log_file,
                    stderr=subprocess.STDOUT,
                    shell=False
                )
                self._processes[project_id] = proc
                self._log_files[project_id] = log_file
                pid = proc.pid
            except Exception as e:
                log_file.write(f"\n[PocketDev Error] Failed to launch: {str(e)}\n")
                log_file.close()
                return False, f"Process launch failed: {str(e)}"

            # Update DB state
            with get_db() as db:
                db.cursor().execute(
                    "UPDATE projects SET status = 'running', pid = ?, updated_at = ? WHERE id = ?",
                    (pid, time.time(), project_id)
                )
                db.cursor().execute(
                    "INSERT INTO system_logs (level, source, message, project_id, timestamp) VALUES (?, ?, ?, ?, ?)",
                    ("INFO", "process_manager", f"Started project '{proj['name']}' (PID: {pid}, Port: {port})", project_id, time.time())
                )

            return True, f"Project {project_id} started successfully with PID {pid} on port {port}"

    def stop_project(self, project_id: str) -> Tuple[bool, str]:
        with self._lock:
            proc = self._processes.get(project_id)

            if proc:
                try:
                    proc.terminate()
                except Exception:
                    pass
                del self._processes[project_id]

            if project_id in self._log_files:
                try:
                    self._log_files[project_id].close()
                except Exception:
                    pass
                del self._log_files[project_id]

            # In case PID was recorded in DB but not in memory
            with get_db() as db:
                cur = db.cursor()
                cur.execute("SELECT pid, name FROM projects WHERE id = ?", (project_id,))
                row = cur.fetchone()
                if row and row["pid"] and row["pid"] != os.getpid():
                    orphan_pid = row["pid"]
                    try:
                        os.kill(orphan_pid, signal.SIGTERM)
                    except Exception:
                        pass
                
                cur.execute("UPDATE projects SET status = 'stopped', pid = NULL, updated_at = ? WHERE id = ?", (time.time(), project_id))
                if row:
                    cur.execute(
                        "INSERT INTO system_logs (level, source, message, project_id, timestamp) VALUES (?, ?, ?, ?, ?)",
                        ("INFO", "process_manager", f"Stopped project '{row['name']}'", project_id, time.time())
                    )

            # Append to log
            log_file_path = self.get_project_log_path(project_id)
            if log_file_path.exists():
                try:
                    with open(log_file_path, "a", encoding="utf-8") as f:
                        f.write(f"\n--- [PocketDev] Service stopped at {time.strftime('%Y-%m-%d %H:%M:%S')} ---\n")
                except Exception:
                    pass

            return True, f"Project {project_id} stopped"

    def restart_project(self, project_id: str) -> Tuple[bool, str]:
        self.stop_project(project_id)
        return self.start_project(project_id)

    def get_logs(self, project_id: str, limit: int = 150) -> List[str]:
        log_file = self.get_project_log_path(project_id)
        if not log_file.exists():
            return ["No logs available yet for this project."]
        try:
            with open(log_file, "r", encoding="utf-8", errors="replace") as f:
                lines = f.readlines()
                return [line.rstrip() for line in lines[-limit:]]
        except Exception as e:
            return [f"Error reading logs: {str(e)}"]

    def get_active_services_status(self) -> List[Dict[str, Any]]:
        with get_db() as db:
            cur = db.cursor()
            cur.execute("SELECT id, name, port, status, pid FROM projects")
            rows = cur.fetchall()
            
            services = []
            for r in rows:
                services.append({
                    "name": r["name"],
                    "port": r["port"],
                    "status": r["status"],
                    "pid": r["pid"]
                })
            return services

process_manager = ProcessManager()
