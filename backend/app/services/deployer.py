import os
import sys
import time
import uuid
import shutil
import zipfile
import subprocess
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

from backend.app.core.config import settings
from backend.app.database.session import get_db
from backend.app.services.process_manager import process_manager
from backend.app.services.project_service import project_service

class DeploymentService:
    def deploy_git(
        self,
        project_id: str,
        repo_url: str,
        branch: str = "main",
        install_dependencies: bool = True,
        restart_after_deploy: bool = True
    ) -> Tuple[bool, str, str]:
        """Clones or pulls a Git repository into the project directory safely."""
        proj = project_service.get_project(project_id)
        if not proj:
            return False, "Project not found", ""

        deployment_id = f"dep-{uuid.uuid4().hex[:8]}"
        now = time.time()
        proj_dir = settings.PROJECTS_PATH / project_id
        proj_dir.mkdir(parents=True, exist_ok=True)
        
        logs = [f"Starting Git deployment for {proj.name} ({project_id}) at {time.strftime('%Y-%m-%d %H:%M:%S')}"]
        logs.append(f"Repository: {repo_url} (Branch: {branch})")

        with get_db() as db:
            db.cursor().execute(
                "INSERT INTO deployments (id, project_id, source_type, source_ref, status, log, created_at) VALUES (?, ?, 'git', ?, 'in_progress', '', ?)",
                (deployment_id, project_id, repo_url, now)
            )

        git_bin = shutil.which("git") or "git"
        success = True

        try:
            # Check if existing repo (.git exists)
            dot_git = proj_dir / ".git"
            if dot_git.exists():
                logs.append("Existing git repository detected. Executing git pull...")
                pull_res = subprocess.run(
                    [git_bin, "pull", "origin", branch],
                    cwd=str(proj_dir),
                    capture_output=True,
                    text=True,
                    timeout=120
                )
                logs.append(pull_res.stdout)
                if pull_res.returncode != 0:
                    logs.append(f"Git pull failed: {pull_res.stderr}")
                    success = False
            else:
                logs.append("Cloning repository into project directory...")
                # Clone into a temp folder then move items into proj_dir
                temp_clone_dir = settings.DEPLOYMENTS_PATH / f"git_{deployment_id}"
                clone_res = subprocess.run(
                    [git_bin, "clone", "--depth", "1", "--branch", branch, repo_url, str(temp_clone_dir)],
                    capture_output=True,
                    text=True,
                    timeout=180
                )
                logs.append(clone_res.stdout)
                if clone_res.returncode != 0:
                    logs.append(f"Git clone failed: {clone_res.stderr}")
                    success = False
                else:
                    # Copy contents into proj_dir
                    for item in temp_clone_dir.iterdir():
                        dest = proj_dir / item.name
                        if dest.exists():
                            if dest.is_dir():
                                shutil.rmtree(dest, ignore_errors=True)
                            else:
                                dest.unlink(missing_ok=True)
                        shutil.move(str(item), str(proj_dir))
                    shutil.rmtree(temp_clone_dir, ignore_errors=True)
                    logs.append("Repository files moved into project root.")

                # Auto-detect common static web directories (public/, dist/, build/, out/)
                if proj.type == "static_html":
                    for web_dir_name in ["public", "dist", "build", "out"]:
                        web_dir = proj_dir / web_dir_name
                        if web_dir.is_dir() and (web_dir / "index.html").exists():
                            logs.append(f"Auto-detected static web root in '{web_dir_name}/'. Promoting files to root...")
                            for item in list(web_dir.iterdir()):
                                target = proj_dir / item.name
                                if target.exists():
                                    if target.is_dir():
                                        shutil.rmtree(target)
                                    else:
                                        target.unlink()
                                shutil.move(str(item), str(target))
                            try:
                                shutil.rmtree(web_dir)
                            except Exception:
                                pass
                            break

            # Dependency installation
            if success and install_dependencies:
                dep_ok, dep_log = self._install_dependencies(proj_dir, proj.type)
                logs.append(dep_log)
                if not dep_ok:
                    success = False

            # Restart if requested
            if success and restart_after_deploy:
                logs.append("Restarting service with new deployment...")
                r_ok, r_msg = process_manager.restart_project(project_id)
                logs.append(r_msg)

        except Exception as e:
            logs.append(f"Deployment exception: {str(e)}")
            success = False

        status_str = "success" if success else "failed"
        full_log = "\n".join(logs)
        with get_db() as db:
            db.cursor().execute(
                "UPDATE deployments SET status = ?, log = ? WHERE id = ?",
                (status_str, full_log, deployment_id)
            )

        return success, full_log, deployment_id

    def deploy_zip(
        self,
        project_id: str,
        zip_file_path: Path,
        install_dependencies: bool = True,
        restart_after_deploy: bool = True
    ) -> Tuple[bool, str, str]:
        """Extracts a ZIP archive into the project directory with ZIP Slip security checks."""
        proj = project_service.get_project(project_id)
        if not proj:
            return False, "Project not found", ""

        deployment_id = f"dep-{uuid.uuid4().hex[:8]}"
        now = time.time()
        proj_dir = (settings.PROJECTS_PATH / project_id).resolve()
        proj_dir.mkdir(parents=True, exist_ok=True)
        
        logs = [f"Starting ZIP deployment for {proj.name} ({project_id}) at {time.strftime('%Y-%m-%d %H:%M:%S')}"]
        logs.append(f"Source file: {zip_file_path.name} ({round(zip_file_path.stat().st_size / 1024, 1)} KB)")

        with get_db() as db:
            db.cursor().execute(
                "INSERT INTO deployments (id, project_id, source_type, source_ref, status, log, created_at) VALUES (?, ?, 'zip', ?, 'in_progress', '', ?)",
                (deployment_id, project_id, zip_file_path.name, now)
            )

        success = True
        try:
            with zipfile.ZipFile(zip_file_path, "r") as zf:
                # Security: Check for Zip Slip path traversal
                for member in zf.namelist():
                    resolved_dest = (proj_dir / member).resolve()
                    if not str(resolved_dest).startswith(str(proj_dir)):
                        raise ValueError(f"Zip Slip attack detected in member: {member}")
                
                # Safe to extract
                zf.extractall(proj_dir)
                logs.append(f"Successfully unpacked {len(zf.namelist())} files.")

                # Auto-flatten GitHub/GitLab ZIP archives wrapped in a root folder (e.g. repo-main/)
                zip_top_dirs = {Path(m).parts[0] for m in zf.namelist() if len(Path(m).parts) > 1}
                if len(zip_top_dirs) == 1:
                    nested_dir_name = list(zip_top_dirs)[0]
                    nested_dir = proj_dir / nested_dir_name
                    if nested_dir.is_dir():
                        logs.append(f"Auto-flattening GitHub repository folder: {nested_dir_name}")
                        for item in nested_dir.iterdir():
                            target = proj_dir / item.name
                            if target.exists():
                                if target.is_dir():
                                    shutil.rmtree(target)
                                else:
                                    target.unlink()
                            shutil.move(str(item), str(target))
                        try:
                            shutil.rmtree(nested_dir)
                        except Exception:
                            pass

                # Auto-detect common static web directories (public/, dist/, build/, out/)
                if proj.type == "static_html":
                    for web_dir_name in ["public", "dist", "build", "out"]:
                        web_dir = proj_dir / web_dir_name
                        if web_dir.is_dir() and (web_dir / "index.html").exists():
                            logs.append(f"Auto-detected static web root in '{web_dir_name}/'. Promoting files to root...")
                            for item in list(web_dir.iterdir()):
                                target = proj_dir / item.name
                                if target.exists():
                                    if target.is_dir():
                                        shutil.rmtree(target)
                                    else:
                                        target.unlink()
                                shutil.move(str(item), str(target))
                            try:
                                shutil.rmtree(web_dir)
                            except Exception:
                                pass
                            break

            if install_dependencies:
                dep_ok, dep_log = self._install_dependencies(proj_dir, proj.type)
                logs.append(dep_log)
                if not dep_ok:
                    success = False

            if success and restart_after_deploy:
                logs.append("Restarting service with new deployment...")
                r_ok, r_msg = process_manager.restart_project(project_id)
                logs.append(r_msg)

        except Exception as e:
            logs.append(f"Deployment exception: {str(e)}")
            success = False

        status_str = "success" if success else "failed"
        full_log = "\n".join(logs)
        with get_db() as db:
            db.cursor().execute(
                "UPDATE deployments SET status = ?, log = ? WHERE id = ?",
                (status_str, full_log, deployment_id)
            )

        return success, full_log, deployment_id

    def _install_dependencies(self, proj_dir: Path, ptype: str) -> Tuple[bool, str]:
        logs = []
        if ptype.startswith("python_"):
            req_file = proj_dir / "requirements.txt"
            if req_file.exists():
                logs.append("Detected requirements.txt. Running pip install...")
                res = subprocess.run(
                    [sys.executable, "-m", "pip", "install", "--no-cache-dir", "-r", "requirements.txt"],
                    cwd=str(proj_dir),
                    capture_output=True,
                    text=True,
                    timeout=300
                )
                logs.append(res.stdout)
                if res.returncode != 0:
                    logs.append(f"Pip error: {res.stderr}")
                    return False, "\n".join(logs)
                logs.append("Python dependencies installed successfully.")
        elif ptype.startswith("nodejs_"):
            pkg_file = proj_dir / "package.json"
            if pkg_file.exists():
                npm_bin = shutil.which("npm") or "npm"
                logs.append("Detected package.json. Running npm install --production...")
                res = subprocess.run(
                    [npm_bin, "install", "--production", "--no-audit", "--no-fund"],
                    cwd=str(proj_dir),
                    capture_output=True,
                    text=True,
                    timeout=300
                )
                logs.append(res.stdout)
                if res.returncode != 0:
                    logs.append(f"npm error: {res.stderr}")
                    return False, "\n".join(logs)
                logs.append("Node.js dependencies installed successfully.")

        return True, "\n".join(logs)

deployer = DeploymentService()
