from typing import Optional
from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    username: str
    is_initial_password: bool = False

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class AuthStatusResponse(BaseModel):
    authenticated: bool
    username: Optional[str] = None
    is_initial_password: bool = False
