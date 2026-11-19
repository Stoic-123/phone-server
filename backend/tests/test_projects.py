def test_create_and_manage_project(client, auth_headers):
    # 1. Create project
    create_payload = {
        "name": "Test Static Site",
        "description": "Test site for Reno2 F",
        "type": "static_html",
        "port": 8999,
        "entrypoint": "index.html",
        "auto_restart": False
    }
    res = client.post("/api/projects", json=create_payload, headers=auth_headers)
    assert res.status_code == 201
    proj = res.json()
    proj_id = proj["id"]
    assert proj["name"] == "Test Static Site"
    assert proj["port"] == 8999
    assert proj["status"] == "stopped"

    # 2. Get project by ID
    res = client.get(f"/api/projects/{proj_id}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["id"] == proj_id

    # 3. Duplicate port rejection
    res = client.post("/api/projects", json=create_payload, headers=auth_headers)
    assert res.status_code == 400

    # 4. Start project
    res = client.post(f"/api/projects/{proj_id}/start", headers=auth_headers)
    assert res.status_code == 200

    # 5. Check logs
    res = client.get(f"/api/projects/{proj_id}/logs", headers=auth_headers)
    assert res.status_code == 200
    assert "lines" in res.json()

    # 6. Stop project
    res = client.post(f"/api/projects/{proj_id}/stop", headers=auth_headers)
    assert res.status_code == 200

    # 7. Delete project
    res = client.delete(f"/api/projects/{proj_id}", headers=auth_headers)
    assert res.status_code == 200
