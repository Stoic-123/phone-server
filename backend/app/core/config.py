import os
import sys
from pathlib import Path
from typing import Optional
from backend.app.schemas.base import BaseModel

# Determine base directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

# Detect Termux / Android environment
IS_ANDROID = "ANDROID_ROOT" in os.environ or Path("/data/data/com.termux").exists()
IS_TERMUX = "TERMUX_VERSION" in os.environ or Path("/data/data/com.termux/files/usr").exists()


class Settings(BaseModel):
    PROJECT_NAME: str = "PocketDev Server"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Server network bindings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    SSH_PORT: int = 8022
    
    # Filesystem paths
    BASE_PATH: Path = BASE_DIR
    DATA_PATH: Path = BASE_DIR / "data"
    LOGS_PATH: Path = BASE_DIR / "logs"
    PROJECTS_PATH: Path = BASE_DIR / "projects"
    DEPLOYMENTS_PATH: Path = BASE_DIR / "deployments"
    DATABASE_PATH: Path = BASE_DIR / "data" / "pocketdev.db"
    ADMIN_CONFIG_PATH: Path = BASE_DIR / "data" / "admin_secret.json"
    
    # Security
    JWT_SECRET: str = os.getenv("POCKETDEV_JWT_SECRET", "pocketdev-secure-default-key-change-me")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Hardware & Environment flags
    IS_ANDROID: bool = IS_ANDROID
    IS_TERMUX: bool = IS_TERMUX
    DEVICE_MODEL: str = "OPPO Reno2 F (MediaTek Helio P70)"
    
    # AI Assistant configuration
    AI_ENABLED: bool = True
    AI_PROVIDER: str = os.getenv("POCKETDEV_AI_PROVIDER", "gemini") # gemini | openai | anthropic | custom
    AI_API_KEY: str = os.getenv("POCKETDEV_AI_API_KEY", "")
    AI_MODEL: str = os.getenv("POCKETDEV_AI_MODEL", "gemini-1.5-flash")
    
    def ensure_directories(self) -> None:
        self.DATA_PATH.mkdir(parents=True, exist_ok=True)
        self.LOGS_PATH.mkdir(parents=True, exist_ok=True)
        self.PROJECTS_PATH.mkdir(parents=True, exist_ok=True)
        self.DEPLOYMENTS_PATH.mkdir(parents=True, exist_ok=True)


settings = Settings()
settings.ensure_directories()
