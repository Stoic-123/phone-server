import sys
from pathlib import Path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

import unittest
from starlette.testclient import TestClient

from backend.app.core.config import settings
settings.DATABASE_PATH = settings.DATA_PATH / "test_pocketdev.db"
settings.ADMIN_CONFIG_PATH = settings.DATA_PATH / "test_admin_secret.json"

from backend.app.main import app
from backend.app.database.session import init_db
from backend.app.core.security import init_admin_credentials

class TestPocketDevBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        settings.ensure_directories()
        init_db()
        cls.creds = init_admin_credentials()
        cls.client = TestClient(app)
        res = cls.client.post("/api/auth/login", json={
            "username": cls.creds["username"],
            "password": cls.creds.get("initial_password", "admin")
        })
        assert res.status_code == 200, f"Login failed: {res.text}"
        token = res.json()["access_token"]
        cls.headers = {"Authorization": f"Bearer {token}"}

    @classmethod
    def tearDownClass(cls):
        if settings.DATABASE_PATH.exists():
            settings.DATABASE_PATH.unlink(missing_ok=True)
        if settings.ADMIN_CONFIG_PATH.exists():
            settings.ADMIN_CONFIG_PATH.unlink(missing_ok=True)

    def test_01_health_check(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")

    def test_02_unauthorized(self):
        res = self.client.get("/api/system")
        self.assertEqual(res.status_code, 401)

    def test_03_system_metrics(self):
        res = self.client.get("/api/system", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["online"])
        self.assertIn("cpu", data)
        self.assertIn("memory", data)
        self.assertIn("storage", data)

    def test_04_create_and_manage_project(self):
        create_payload = {
            "name": "Test Site",
            "description": "Test site for Reno2 F",
            "type": "static_html",
            "port": 8998,
            "entrypoint": "index.html",
            "auto_restart": False
        }
        res = self.client.post("/api/projects", json=create_payload, headers=self.headers)
        self.assertEqual(res.status_code, 201)
        proj = res.json()
        proj_id = proj["id"]
        self.assertEqual(proj["port"], 8998)

        # Duplicate port check
        res_dup = self.client.post("/api/projects", json=create_payload, headers=self.headers)
        self.assertEqual(res_dup.status_code, 400)

        # Start project
        res_start = self.client.post(f"/api/projects/{proj_id}/start", headers=self.headers)
        self.assertEqual(res_start.status_code, 200)

        # Logs
        res_logs = self.client.get(f"/api/projects/{proj_id}/logs", headers=self.headers)
        self.assertEqual(res_logs.status_code, 200)

        # Stop project
        res_stop = self.client.post(f"/api/projects/{proj_id}/stop", headers=self.headers)
        self.assertEqual(res_stop.status_code, 200)

        # Delete project
        res_del = self.client.delete(f"/api/projects/{proj_id}", headers=self.headers)
        self.assertEqual(res_del.status_code, 200)

    def test_05_ai_assistant_restricted_tools(self):
        res = self.client.get("/api/ai/tools", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        tools = res.json()
        self.assertTrue(len(tools) >= 5)

        res_chat = self.client.post("/api/ai/chat", json={"message": "status"}, headers=self.headers)
        self.assertEqual(res_chat.status_code, 200)
        self.assertIn("reply", res_chat.json())

if __name__ == "__main__":
    unittest.main()
