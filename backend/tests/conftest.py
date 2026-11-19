import os
import pytest
from pathlib import Path
from starlette.testclient import TestClient

# Point test db to temporary test path
from backend.app.core.config import settings
settings.DATABASE_PATH = settings.DATA_PATH / "test_pocketdev.db"
settings.ADMIN_CONFIG_PATH = settings.DATA_PATH / "test_admin_secret.json"

from backend.app.main import app
from backend.app.database.session import init_db
from backend.app.core.security import init_admin_credentials

@pytest.fixture(scope="session", autouse=True)
def setup_test_env():
    settings.ensure_directories()
    init_db()
    init_admin_credentials()
    yield
    # Cleanup test files if desired
    if settings.DATABASE_PATH.exists():
        settings.DATABASE_PATH.unlink(missing_ok=True)
    if settings.ADMIN_CONFIG_PATH.exists():
        settings.ADMIN_CONFIG_PATH.unlink(missing_ok=True)

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture
def auth_headers(client):
    admin_data = init_admin_credentials()
    res = client.post("/api/auth/login", json={
        "username": admin_data["username"],
        "password": admin_data.get("initial_password", "admin")
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
