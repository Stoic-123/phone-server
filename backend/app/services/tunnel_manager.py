import os
import re
import time
import shutil
import signal
import threading
import subprocess
from pathlib import Path
from typing import Dict, Optional, Tuple, Any

from backend.app.core.config import settings
from backend.app.database.session import get_db

class TunnelManager:
    def __init__(self):
        self._processes: Dict[str, subprocess.Popen] = {}
        self._urls: Dict[str, str] = {}
        self._lock = threading.Lock()

    def is_cloudflared_installed(self) -> bool:
        return shutil.which("cloudflared") is not None

    def get_public_url(self, project_id: str) -> Optional[str]:
        with self._lock:
            if project_id in self._urls:
                return self._urls[project_id]
        
        with get_db() as db:
            cur = db.cursor()
            cur.execute("SELECT public_url FROM projects WHERE id = ?", (project_id,))
            row = cur.fetchone()
            if row and row["public_url"]:
                return row["public_url"]
        return None

    def start_quick_tunnel(self, project_id: str, port: int) -> Tuple[bool, str, Optional[str]]:
        if not self.is_cloudflared_installed():
            return False, "cloudflared is not installed on the system. Run 'pkg install cloudflared' in Termux.", None

        with self._lock:
            # Check if tunnel already running
            if project_id in self._processes:
                proc = self._processes[project_id]
                if proc.poll() is None and project_id in self._urls:
                    return True, "Tunnel already active", self._urls[project_id]
                else:
                    try:
                        proc.terminate()
                    except Exception:
                        pass
                    del self._processes[project_id]
                    if project_id in self._urls:
                        del self._urls[project_id]

        log_dir = settings.LOGS_PATH / "tunnels"
        log_dir.mkdir(parents=True, exist_ok=True)
        log_file = log_dir / f"quick_{project_id}.log"
        if log_file.exists():
            try:
                log_file.unlink()
            except Exception:
                pass

        # Launch cloudflared ephemeral quick tunnel with logfile and http2 for fast fallback
        cmd = [
            "cloudflared", "tunnel",
            "--protocol", "http2",
            "--url", f"http://127.0.0.1:{port}",
            "--logfile", str(log_file)
        ]
        try:
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        except Exception as e:
            return False, f"Failed to spawn cloudflared: {str(e)}", None

        # Poll the logfile directly to bypass pipe block buffering
        found_url = None
        url_pattern = re.compile(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com")
        start_time = time.time()

        while time.time() - start_time < 20.0:
            time.sleep(0.4)
            if proc.poll() is not None:
                # Process exited prematurely
                err_content = ""
                if log_file.exists():
                    try:
                        err_content = log_file.read_text(encoding="utf-8", errors="replace")[-300:]
                    except Exception:
                        pass
                return False, f"Tunnel process exited with code {proc.returncode}. {err_content}", None

            if log_file.exists():
                try:
                    content = log_file.read_text(encoding="utf-8", errors="replace")
                    match = url_pattern.search(content)
                    if match:
                        found_url = match.group(0)
                        break
                except Exception:
                    pass

        if found_url:
            with self._lock:
                self._processes[project_id] = proc
                self._urls[project_id] = found_url

            # Save in database
            with get_db() as db:
                cur = db.cursor()
                cur.execute(
                    "UPDATE projects SET public_url = ?, tunnel_pid = ?, updated_at = ? WHERE id = ?",
                    (found_url, proc.pid, time.time(), project_id)
                )
                cur.execute(
                    "INSERT INTO system_logs (level, source, message, project_id, timestamp) VALUES (?, ?, ?, ?, ?)",
                    ("INFO", "tunnel_manager", f"Generated public URL for project '{project_id}': {found_url}", project_id, time.time())
                )

            return True, f"Public URL generated: {found_url}", found_url
        else:
            try:
                proc.terminate()
            except Exception:
                pass
            return False, "Failed to capture public URL from Cloudflare within 20 seconds. Check network connectivity.", None

    def stop_tunnel(self, project_id: str) -> Tuple[bool, str]:
        with self._lock:
            proc = self._processes.pop(project_id, None)
            self._urls.pop(project_id, None)

        if proc:
            try:
                proc.terminate()
                proc.wait(timeout=2.0)
            except Exception:
                try:
                    proc.kill()
                except Exception:
                    pass

        with get_db() as db:
            cur = db.cursor()
            cur.execute("SELECT tunnel_pid FROM projects WHERE id = ?", (project_id,))
            row = cur.fetchone()
            if row and row["tunnel_pid"]:
                try:
                    os.kill(row["tunnel_pid"], signal.SIGTERM)
                except Exception:
                    pass

            cur.execute("UPDATE projects SET public_url = NULL, tunnel_pid = NULL, updated_at = ? WHERE id = ?", (time.time(), project_id))
            cur.execute(
                "INSERT INTO system_logs (level, source, message, project_id, timestamp) VALUES (?, ?, ?, ?, ?)",
                ("INFO", "tunnel_manager", f"Disabled public URL for project '{project_id}'", project_id, time.time())
            )

        return True, "Public URL disabled"

tunnel_manager = TunnelManager()
