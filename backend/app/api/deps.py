from typing import Optional
from fastapi import Header, HTTPException, status, Depends
from backend.app.core.config import settings
from backend.app.core.security import decode_access_token, init_admin_credentials

def get_current_admin(
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None)
) -> str:
    """Authenticates request via Bearer JWT token or X-API-Key header."""
    admin_data = init_admin_credentials()
    
    # Check API Key
    if x_api_key and x_api_key == admin_data.get("api_key"):
        return admin_data.get("username", "admin")
        
    # Check Bearer JWT token
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        payload = decode_access_token(token)
        if payload and payload.get("sub"):
            return payload["sub"]
            
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unauthorized access. Provide a valid Bearer token or X-API-Key.",
        headers={"WWW-Authenticate": "Bearer"}
    )
