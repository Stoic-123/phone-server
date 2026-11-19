def test_get_system_metrics(client, auth_headers):
    res = client.get("/api/system", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["online"] is True
    assert "cpu" in data
    assert "memory" in data
    assert "storage" in data
    assert "network" in data
    assert data["memory"]["total_mb"] > 0
    assert data["storage"]["total_gb"] > 0

def test_system_services(client, auth_headers):
    res = client.get("/api/system/services", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)
