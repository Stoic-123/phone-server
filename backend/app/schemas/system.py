from typing import Optional, List, Dict
from pydantic import BaseModel

class CpuInfo(BaseModel):
    usage_percent: Optional[float] = None
    cores: int = 8
    model: str = "MediaTek Helio P70 (4x Cortex-A73 + 4x Cortex-A53)"
    frequency_mhz: Optional[float] = None

class MemoryInfo(BaseModel):
    total_mb: float
    used_mb: float
    free_mb: float
    available_mb: float
    usage_percent: float

class StorageInfo(BaseModel):
    total_gb: float
    used_gb: float
    free_gb: float
    usage_percent: float
    path: str

class BatteryInfo(BaseModel):
    present: bool = False
    percentage: Optional[int] = None
    temperature_c: Optional[float] = None
    status: Optional[str] = None # Charging, Discharging, Full
    health: Optional[str] = None

class NetworkInfo(BaseModel):
    local_ip: str
    hostname: str
    interfaces: List[Dict[str, str]] = []
    bytes_sent: Optional[int] = None
    bytes_recv: Optional[int] = None

class ServiceStatus(BaseModel):
    name: str
    port: Optional[int] = None
    status: str # running, stopped, degraded
    pid: Optional[int] = None

class SystemMetricsResponse(BaseModel):
    online: bool = True
    device_model: str
    android_version: Optional[str] = None
    kernel_version: str
    uptime_seconds: float
    uptime_human: str
    cpu: CpuInfo
    memory: MemoryInfo
    storage: StorageInfo
    battery: BatteryInfo
    network: NetworkInfo
    services: List[ServiceStatus] = []
    is_termux: bool = False
    timestamp: float
