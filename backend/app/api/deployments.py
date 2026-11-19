import shutil
from typing import List
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from backend.app.schemas.deployment import GitDeploymentRequest, DeploymentResponse
from backend.app.services.deployer import deployer
from backend.app.services.project_service import project_service
from backend.app.core.config import settings
from backend.app.database.session import get_db
from backend.app.api.deps import get_current_admin

router = APIRouter(prefix="/deployments", tags=["deployments"])

@router.post("/git", response_model=DeploymentResponse)
def deploy_git(req: GitDeploymentRequest, username: str = Depends(get_current_admin)):
    proj = project_service.get_project(req.project_id)
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {req.project_id} not found")

    success, log, dep_id = deployer.deploy_git(
        project_id=req.project_id,
        repo_url=req.repo_url,
        branch=req.branch or "main",
        install_dependencies=req.install_dependencies,
        restart_after_deploy=req.restart_after_deploy
    )

    return DeploymentResponse(
        id=dep_id,
        project_id=req.project_id,
        source_type="git",
        source_ref=req.repo_url,
        status="success" if success else "failed",
        log=log,
        created_at=float(dep_id.split("-")[-1]) if False else 0.0 # Will fetch from DB if needed
    )

@router.post("/upload-zip", response_model=DeploymentResponse)
async def deploy_zip(
    project_id: str = Form(...),
    file: UploadFile = File(...),
    install_dependencies: bool = Form(True),
    restart_after_deploy: bool = Form(True),
    username: str = Depends(get_current_admin)
):
    proj = project_service.get_project(project_id)
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")

    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only .zip archive packages are allowed")

    # Save uploaded file safely into deployments/
    zip_dest = settings.DEPLOYMENTS_PATH / f"upload_{project_id}_{file.filename}"
    try:
        with open(zip_dest, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        success, log, dep_id = deployer.deploy_zip(
            project_id=project_id,
            zip_file_path=zip_dest,
            install_dependencies=install_dependencies,
            restart_after_deploy=restart_after_deploy
        )
    finally:
        # Clean up temporary uploaded zip file
        if zip_dest.exists():
            zip_dest.unlink(missing_ok=True)

    return DeploymentResponse(
        id=dep_id,
        project_id=project_id,
        source_type="zip",
        source_ref=file.filename,
        status="success" if success else "failed",
        log=log,
        created_at=0.0
    )

@router.get("/{project_id}", response_model=List[DeploymentResponse])
def get_project_deployments(project_id: str, username: str = Depends(get_current_admin)):
    with get_db() as db:
        cur = db.cursor()
        cur.execute("SELECT * FROM deployments WHERE project_id = ? ORDER BY created_at DESC", (project_id,))
        rows = cur.fetchall()
        return [
            DeploymentResponse(
                id=r["id"],
                project_id=r["project_id"],
                source_type=r["source_type"],
                source_ref=r["source_ref"],
                status=r["status"],
                log=r["log"],
                created_at=r["created_at"]
            )
            for r in rows
        ]
