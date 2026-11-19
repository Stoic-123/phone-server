import os
import re
import time
import shutil
import signal
import threading
import subprocess
from pathlib import Path
from typing import Dict, Optional, Tuple, Any

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

        # Launch cloudflared ephemeral quick tunnel
        cmd = ["cloudflared", "tunnel", "--url", f"http://127.0.0.1:{port}"]
        try:
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1
            )
        except Exception as e:
            return False, f"Failed to spawn cloudflared: {str(e)}", None

        url_captured = [None]
        url_event = threading.Event()

        def stream_reader(pipe):
            url_pattern = re.compile(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com")
            try:
                for line in iter(pipe.readline, ''):
                    if not line:
                        break
                    match = url_pattern.search(line)
                    if match and not url_captured[0]:
                        url_captured[0] = match.group(0)
                        url_event.set()
            except Exception:
                pass
            finally:
                try:
                    pipe.close()
                except Exception:
                    pass

        t_out = threading.Thread(target=stream_reader, args=(proc.stdout,), daemon=True)
        t_err = threading.Thread(target=stream_reader, args=(proc.stderr,), daemon=True)
        t_out.start()
        t_err.start()

        # Wait up to 10 seconds for Cloudflare to assign the random URL
        matched = url_event.wait(timeout=10.0)

        if matched and url_captured[0]:
            found_url = url_captured[0]
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
            # Failed to capture in time
            try:
                proc.terminate()
            except Exception:
                pass
            return False, "Failed to capture public URL from Cloudflare within 10 seconds. Check network connectivity.", None

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
