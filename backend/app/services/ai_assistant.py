import os
import json
import time
import uuid
import httpx
from typing import Optional, Dict, Any, List

from backend.app.core.config import settings
from backend.app.database.session import get_db
from backend.app.services.system_monitor import system_monitor
from backend.app.services.process_manager import process_manager
from backend.app.services.project_service import project_service
from backend.app.schemas.ai import (
    AiChatRequest,
    AiChatResponse,
    AiToolCall,
    AiToolExecutionRequest
)

RESTRICTED_TOOLS = [
    {
        "name": "get_system_health",
        "description": "Read-only inspection of CPU, RAM, storage, battery, thermals, and running services.",
        "requires_confirmation": False
    },
    {
        "name": "read_project_logs",
        "description": "Read recent output and error logs from a managed project.",
        "requires_confirmation": False
    },
    {
        "name": "explain_error",
        "description": "Analyze stack traces, dependency errors, and port collision issues.",
        "requires_confirmation": False
    },
    {
        "name": "suggest_optimizations",
        "description": "Provide MediaTek Helio P70 and ColorOS battery/wake-lock optimization advice.",
        "requires_confirmation": False
    },
    {
        "name": "generate_config",
        "description": "Generate configuration templates for FastAPI, Express, or static projects.",
        "requires_confirmation": False
    },
    {
        "name": "restart_service",
        "description": "Restart a specific managed project service.",
        "requires_confirmation": True
    },
    {
        "name": "install_dependencies",
        "description": "Install Python requirements.txt or Node.js package.json in a project.",
        "requires_confirmation": True
    },
    {
        "name": "delete_project",
        "description": "Permanently delete a managed project and its files.",
        "requires_confirmation": True
    }
]

class AiAssistantService:
    def __init__(self):
        self._pending_actions: Dict[str, Dict[str, Any]] = {}

    def get_available_tools(self) -> List[Dict[str, Any]]:
        return RESTRICTED_TOOLS

    async def chat(self, req: AiChatRequest) -> AiChatResponse:
        user_msg = req.message.lower().strip()
        
        # 1. Check for specific tool intent matching
        if "health" in user_msg or "status" in user_msg or "how is the server" in user_msg or "cpu" in user_msg or "ram" in user_msg:
            metrics = system_monitor.get_full_metrics(
                [{"name": s["name"], "status": s["status"], "port": s["port"], "pid": s["pid"]} for s in process_manager.get_active_services_status()]
            )
            reply = (
                f"**PocketDev Server Status ({metrics.device_model})**\n\n"
                f"- **Uptime**: {metrics.uptime_human}\n"
                f"- **RAM**: {metrics.memory.used_mb} MB / {metrics.memory.total_mb} MB ({metrics.memory.usage_percent}%)\n"
                f"- **Storage**: {metrics.storage.used_gb} GB / {metrics.storage.total_gb} GB ({metrics.storage.usage_percent}%)\n"
                f"- **Local IP**: `{metrics.network.local_ip}`\n"
                f"- **Active Services**: {len([s for s in metrics.services if s.status == 'running'])} running\n"
            )
            if metrics.battery.present:
                reply += f"- **Battery**: {metrics.battery.percentage}% ({metrics.battery.status}, {metrics.battery.temperature_c}°C)\n"
            return AiChatResponse(
                reply=reply,
                suggested_actions=["Suggest Helio P70 optimizations", "View running services", "Check project logs"]
            )

        if "optimize" in user_msg or "battery" in user_msg or "helio" in user_msg or "thermal" in user_msg:
            reply = (
                "**Optimization Advice for OPPO Reno2 F (Helio P70 & ColorOS):**\n\n"
                "1. **Acquire Termux Wake Lock**: Run `termux-wake-lock` in Termux to prevent CPU sleep when screen is off.\n"
                "2. **ColorOS App Freeze Whitelist**: In ColorOS Settings > Battery > App Battery Management > Termux:\n"
                "   - Enable *Allow Background Activity*\n"
                "   - Enable *Allow Auto-startup*\n"
                "3. **Thermal Throttling**: The MediaTek Helio P70 (4x A73 + 4x A53) generates heat under heavy sustained load. Keep the phone on a ventilated surface or unplug the charger once full to avoid thermal throttling."
            )
            return AiChatResponse(
                reply=reply,
                suggested_actions=["Check CPU temperature", "Setup wake lock script", "Inspect RAM usage"]
            )

        # Destructive action: restart project
        if "restart" in user_msg:
            # Check if project mentioned
            projects = project_service.list_projects()
            matched_proj = None
            if req.project_id:
                matched_proj = project_service.get_project(req.project_id)
            else:
                for p in projects:
                    if p.name.lower() in user_msg or p.id in user_msg:
                        matched_proj = p
                        break
            
            if matched_proj:
                action_id = f"act-{uuid.uuid4().hex[:8]}"
                self._pending_actions[action_id] = {
                    "tool": "restart_service",
                    "project_id": matched_proj.id,
                    "created_at": time.time()
                }
                tool_call = AiToolCall(
                    tool_name="restart_service",
                    arguments={"project_id": matched_proj.id, "project_name": matched_proj.name},
                    requires_confirmation=True,
                    action_id=action_id,
                    description=f"Restart service '{matched_proj.name}' on port {matched_proj.port}"
                )
                return AiChatResponse(
                    reply=f"I prepared a request to restart project **{matched_proj.name}**. Since restarting disrupts active connections, please confirm below to proceed.",
                    tool_call=tool_call,
                    suggested_actions=["Confirm restart", "Cancel"]
                )

        # Log inspection or error diagnosis
        if "log" in user_msg or "error" in user_msg or "crashed" in user_msg:
            target_proj_id = req.project_id
            if not target_proj_id:
                projects = project_service.list_projects()
                if projects:
                    target_proj_id = projects[0].id
            
            if target_proj_id:
                logs = process_manager.get_logs(target_proj_id, limit=30)
                log_text = "\n".join(logs)
                diagnosis = self._diagnose_logs(log_text)
                return AiChatResponse(
                    reply=f"**Log Diagnosis for Project `{target_proj_id}`:**\n\n{diagnosis}\n\n```\n{log_text[-600:]}\n```",
                    suggested_actions=["Restart service", "Inspect system health"]
                )

        # External AI API forwarding if API key is configured
        if settings.AI_API_KEY:
            try:
                external_reply = await self._call_external_ai(req.message, req.conversation_history)
                if external_reply:
                    return AiChatResponse(reply=external_reply)
            except Exception as e:
                pass

        # Fallback helpful assistant response
        return AiChatResponse(
            reply=(
                "I am **PocketDev AI Assistant**, running natively on your OPPO Reno2 F.\n\n"
                "I can assist you with:\n"
                "- Checking server hardware & health (`status`, `cpu`, `ram`)\n"
                "- Diagnosing application errors and logs (`show logs`)\n"
                "- Helio P70 / ColorOS battery optimization (`optimize`)\n"
                "- Managing process restarts with confirmation (`restart <project>`)\n\n"
                "How would you like to proceed?"
            ),
            suggested_actions=["Check system status", "Helio P70 optimization tips", "Diagnose project logs"]
        )

    def _diagnose_logs(self, log_text: str) -> str:
        if "Address already in use" in log_text or "EADDRINUSE" in log_text:
            return "**Port Conflict Detected**: The target port is already bound by another process. Try reconfiguring the project port or stopping the conflicting process."
        if "ModuleNotFoundError" in log_text or "Cannot find module" in log_text:
            return "**Missing Dependencies**: The project requires packages that are not installed. Run dependency installation (pip/npm)."
        if "SyntaxError" in log_text:
            return "**Syntax Error**: The entrypoint script contains invalid syntax. Check the file for unmatched brackets or unsupported language features."
        return "**Status Normal**: No critical runtime fatal errors detected in recent lines."

    def execute_confirmed_action(self, req: AiToolExecutionRequest) -> Tuple[bool, str]:
        action = self._pending_actions.get(req.action_id)
        if not action:
            return False, "Action ID not found or already executed"

        del self._pending_actions[req.action_id]

        if not req.confirmed:
            return False, "Action was rejected by user."

        tool = action.get("tool")
        if tool == "restart_service":
            pid = action.get("project_id")
            ok, msg = process_manager.restart_project(pid)
            return ok, msg
        elif tool == "delete_project":
            pid = action.get("project_id")
            ok = project_service.delete_project(pid)
            return ok, f"Project {pid} deleted" if ok else "Delete failed"
        elif tool == "install_dependencies":
            pid = action.get("project_id")
            proj = project_service.get_project(pid)
            if not proj:
                return False, "Project not found"
            proj_dir = settings.PROJECTS_PATH / pid
            from backend.app.services.deployer import deployer
            ok, log = deployer._install_dependencies(proj_dir, proj.type)
            return ok, log

        return False, f"Unknown action tool: {tool}"

    async def _call_external_ai(self, prompt: str, history: Optional[List[Any]]) -> Optional[str]:
        if settings.AI_PROVIDER == "gemini":
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.AI_MODEL}:generateContent?key={settings.AI_API_KEY}"
            payload = {
                "contents": [{"parts": [{"text": f"You are PocketDev Server AI on an OPPO Reno2 F Android phone.\n\nUser: {prompt}"}]}]
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        return candidates[0]["content"]["parts"][0]["text"]
        return None

ai_assistant = AiAssistantService()
