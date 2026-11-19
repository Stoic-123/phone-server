from typing import Optional, List
from pydantic import BaseModel, Field

class GitDeploymentRequest(BaseModel):
    project_id: str
    repo_url: str = Field(..., description="Git repository URL (https://...)")
    branch: Optional[str] = "main"
    install_dependencies: bool = True
    restart_after_deploy: bool = True

class DeploymentResponse(BaseModel):
    id: str
    project_id: str
    source_type: str # git, zip
    source_ref: str
    status: str # pending, in_progress, success, failed
    log: str
    created_at: float
