from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from backend.app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectLogResponse
)
from backend.app.services.project_service import project_service
from backend.app.services.process_manager import process_manager
from backend.app.api.deps import get_current_admin

router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("", response_model=List[ProjectResponse])
def list_projects(username: str = Depends(get_current_admin)):
    return project_service.list_projects()

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(data: ProjectCreate, username: str = Depends(get_current_admin)):
    try:
        return project_service.create_project(data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/{id}", response_model=ProjectResponse)
def get_project(id: str, username: str = Depends(get_current_admin)):
    proj = project_service.get_project(id)
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {id} not found")
    return proj

@router.put("/{id}", response_model=ProjectResponse)
def update_project(id: str, data: ProjectUpdate, username: str = Depends(get_current_admin)):
    try:
        proj = project_service.update_project(id, data)
        if not proj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {id} not found")
        return proj
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{id}")
def delete_project(id: str, username: str = Depends(get_current_admin)):
    ok = project_service.delete_project(id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {id} not found")
    return {"status": "success", "message": f"Project {id} deleted"}

@router.post("/{id}/start")
def start_project(id: str, username: str = Depends(get_current_admin)):
    proj = project_service.get_project(id)
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {id} not found")
    
    ok, msg = process_manager.start_project(id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    return {"status": "success", "message": msg}

@router.post("/{id}/stop")
def stop_project(id: str, username: str = Depends(get_current_admin)):
    proj = project_service.get_project(id)
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {id} not found")
    
    ok, msg = process_manager.stop_project(id)
    return {"status": "success", "message": msg}

@router.post("/{id}/restart")
def restart_project(id: str, username: str = Depends(get_current_admin)):
    proj = project_service.get_project(id)
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {id} not found")
    
    ok, msg = process_manager.restart_project(id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    return {"status": "success", "message": msg}

@router.get("/{id}/logs", response_model=ProjectLogResponse)
def get_project_logs(id: str, limit: int = 150, username: str = Depends(get_current_admin)):
    proj = project_service.get_project(id)
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {id} not found")
    
    lines = process_manager.get_logs(id, limit=limit)
    return ProjectLogResponse(
        id=id,
        name=proj.name,
        lines=lines,
        total_lines=len(lines)
    )
