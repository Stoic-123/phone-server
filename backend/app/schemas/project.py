from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    description: Optional[str] = ""
    type: str = Field(..., description="python_fastapi, python_flask, python_generic, nodejs_express, nodejs_generic, static_html")
    port: int = Field(..., ge=1024, le=65535)
    entrypoint: str = Field(default="main.py", description="Relative entrypoint file (e.g. main.py, server.js, index.html)")
    env_vars: Optional[Dict[str, str]] = Field(default_factory=dict)
    auto_restart: bool = False

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    port: Optional[int] = None
    entrypoint: Optional[str] = None
    env_vars: Optional[Dict[str, str]] = None
    auto_restart: Optional[bool] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    type: str
    port: int
    entrypoint: str
    env_vars: Dict[str, str]
    status: str # stopped, running, error
    auto_restart: bool
    pid: Optional[int] = None
    created_at: float
    updated_at: float

class ProjectLogResponse(BaseModel):
    id: str
    name: str
    lines: List[str]
    total_lines: int
