from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from backend.app.schemas.system import SystemMetricsResponse, ServiceStatus
from backend.app.services.system_monitor import system_monitor
from backend.app.services.process_manager import process_manager
from backend.app.database.session import get_db
from backend.app.api.deps import get_current_admin

router = APIRouter(tags=["system"])

@router.get("/health")
def health():
    return {
        "status": "healthy",
        "server": "PocketDev Server",
        "device": system_monitor.get_android_version() or "Android",
        "mode": "standalone"
    }

@router.get("/system", response_model=SystemMetricsResponse)
def get_system_metrics(username: str = Depends(get_current_admin)):
    active_services = process_manager.get_active_services_status()
    service_objs = [
        ServiceStatus(name=s["name"], port=s["port"], status=s["status"], pid=s["pid"])
        for s in active_services
    ]
    return system_monitor.get_full_metrics(services=service_objs)

@router.get("/system/services", response_model=List[ServiceStatus])
def get_services(username: str = Depends(get_current_admin)):
    active_services = process_manager.get_active_services_status()
    return [
        ServiceStatus(name=s["name"], port=s["port"], status=s["status"], pid=s["pid"])
        for s in active_services
    ]

@router.get("/system/logs")
def get_system_logs(limit: int = 50, username: str = Depends(get_current_admin)):
    with get_db() as db:
        cur = db.cursor()
        cur.execute("SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = cur.fetchall()
        return [
            {
                "id": r["id"],
                "level": r["level"],
                "source": r["source"],
                "message": r["message"],
                "project_id": r["project_id"],
                "timestamp": r["timestamp"]
            }
            for r in rows
        ]
