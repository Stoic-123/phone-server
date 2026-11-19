from fastapi import APIRouter, Depends, HTTPException, status
from backend.app.schemas.ai import (
    AiChatRequest,
    AiChatResponse,
    AiToolExecutionRequest
)
from backend.app.services.ai_assistant import ai_assistant
from backend.app.api.deps import get_current_admin

router = APIRouter(prefix="/ai", tags=["ai"])

@router.get("/tools")
def get_tools(username: str = Depends(get_current_admin)):
    return ai_assistant.get_available_tools()

@router.post("/chat", response_model=AiChatResponse)
async def chat(req: AiChatRequest, username: str = Depends(get_current_admin)):
    return await ai_assistant.chat(req)

@router.post("/execute")
def execute_action(req: AiToolExecutionRequest, username: str = Depends(get_current_admin)):
    success, msg = ai_assistant.execute_confirmed_action(req)
    if not success and not req.confirmed:
        return {"status": "cancelled", "message": msg}
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    return {"status": "success", "message": msg}
