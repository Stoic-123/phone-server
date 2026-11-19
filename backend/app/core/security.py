import os
import json
import time
import hmac
import hashlib
import secrets
import base64
from pathlib import Path
from typing import Optional, Dict, Any
from backend.app.core.config import settings

def hash_password(password: str, salt: Optional[str] = None) -> str:
    """Hashes password with PBKDF2-HMAC-SHA256 (compatible across all Python versions and platforms without binary wheels)."""
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations=100000
    )
    return f"{salt}${hashed.hex()}"

def verify_password(plain_password: str, stored_hash: str) -> bool:
    try:
        salt, expected_hex = stored_hash.split("$", 1)
        actual_hash = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            iterations=100000
        )
        return hmac.compare_digest(actual_hash.hex(), expected_hex)
    except Exception:
        return False

# Base64url encoding/decoding for RFC 7519 JWT
def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")

def _b64url_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data.encode("ascii"))

def create_access_token(data: Dict[str, Any], expires_delta_seconds: Optional[int] = None) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    now = int(time.time())
    if expires_delta_seconds is None:
        expires_delta_seconds = settings.JWT_EXPIRE_MINUTES * 60
    payload["iat"] = now
    payload["exp"] = now + expires_delta_seconds
    
    header_json = json.dumps(header, separators=(",", ":")).encode("utf-8")
    payload_json = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    
    header_b64 = _b64url_encode(header_json)
    payload_b64 = _b64url_encode(payload_json)
    
    message = f"{header_b64}.{payload_b64}".encode("ascii")
    signature = hmac.new(settings.JWT_SECRET.encode("utf-8"), message, hashlib.sha256).digest()
    sig_b64 = _b64url_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{sig_b64}"

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        message = f"{header_b64}.{payload_b64}".encode("ascii")
        expected_sig = hmac.new(settings.JWT_SECRET.encode("utf-8"), message, hashlib.sha256).digest()
        actual_sig = _b64url_decode(sig_b64)
        
        if not hmac.compare_digest(actual_sig, expected_sig):
            return None
        
        payload = json.loads(_b64url_decode(payload_b64).decode("utf-8"))
        if "exp" in payload and payload["exp"] < time.time():
            return None # Expired
        return payload
    except Exception:
        return None

def init_admin_credentials() -> Dict[str, str]:
    """Generates initial secure admin password if not already present."""
    config_file = settings.ADMIN_CONFIG_PATH
    if config_file.exists():
        try:
            with open(config_file, "r") as f:
                data = json.load(f)
                if "username" in data and "password_hash" in data:
                    return data
        except Exception:
            pass

    # Generate a new random 12-char secure password for initial installation
    generated_password = secrets.token_urlsafe(9)
    pwd_hash = hash_password(generated_password)
    api_key = f"pk_{secrets.token_hex(20)}"
    data = {
        "username": "admin",
        "password_hash": pwd_hash,
        "initial_password": generated_password,
        "api_key": api_key,
        "created_at": time.time()
    }
    with open(config_file, "w") as f:
        json.dump(data, f, indent=2)
    return data

def sanitize_safe_path(base_dir: Path, requested_path: str) -> Path:
    """Strictly ensures requested_path is within base_dir to block path traversal."""
    resolved_base = base_dir.resolve()
    target = (resolved_base / requested_path).resolve()
    if not str(target).startswith(str(resolved_base)):
        raise ValueError(f"Path traversal detected: {requested_path}")
    return target
