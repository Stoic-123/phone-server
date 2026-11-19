def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "server" in data

def test_unauthorized_access(client):
    res = client.get("/api/system")
    assert res.status_code == 401

def test_login_success(client):
    from backend.app.core.security import init_admin_credentials
    creds = init_admin_credentials()
    res = client.post("/api/auth/login", json={
        "username": creds["username"],
        "password": creds["initial_password"]
    })
    assert res.status_code == 200
    token_data = res.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

def test_login_failure(client):
    res = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "wrong_password_123"
    })
    assert res.status_code == 401
