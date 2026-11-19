import json
from fastapi import APIRouter, HTTPException, status, Depends
from backend.app.core.config import settings
from backend.app.core.security import (
    verify_password,
    hash_password,
    create_access_token,
    init_admin_credentials
)
from backend.app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    ChangePasswordRequest,
    AuthStatusResponse
)
from backend.app.api.deps import get_current_admin

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    admin_data = init_admin_credentials()
    if req.username != admin_data.get("username", "admin"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    if not verify_password(req.password, admin_data.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
        
    is_initial = "initial_password" in admin_data and req.password == admin_data.get("initial_password")
    token = create_access_token({"sub": req.username, "role": "admin"})
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.JWT_EXPIRE_MINUTES * 60,
        username=req.username,
        is_initial_password=is_initial
    )

@router.get("/status", response_model=AuthStatusResponse)
def get_status(username: str = Depends(get_current_admin)):
    admin_data = init_admin_credentials()
    return AuthStatusResponse(
        authenticated=True,
        username=username,
        is_initial_password="initial_password" in admin_data
    )

@router.post("/change-password")
def change_password(req: ChangePasswordRequest, username: str = Depends(get_current_admin)):
    admin_data = init_admin_credentials()
    if not verify_password(req.current_password, admin_data.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password verification failed"
        )
        
    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long"
        )
        
    new_hash = hash_password(req.new_password)
    admin_data["password_hash"] = new_hash
    if "initial_password" in admin_data:
        del admin_data["initial_password"]
        
    with open(settings.ADMIN_CONFIG_PATH, "w") as f:
        json.dump(admin_data, f, indent=2)
        
    return {"status": "success", "message": "Password changed successfully"}

@router.get("/initial-credentials")
def get_initial_credentials():
    """Returns initial generated setup credentials if still unconfigured for ease of first login."""
    admin_data = init_admin_credentials()
    if "initial_password" in admin_data:
        return {
            "initial_setup_required": True,
            "username": admin_data["username"],
            "initial_password": admin_data["initial_password"]
        }
    return {"initial_setup_required": False}
