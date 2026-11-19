from typing import Optional, List, Dict, Any
from backend.app.schemas.base import BaseModel, Field

class AiChatMessage(BaseModel):
    role: str # user, assistant, system, tool
    content: str

class AiChatRequest(BaseModel):
    message: str
    project_id: Optional[str] = None
    conversation_history: Optional[List[AiChatMessage]] = Field(default_factory=list)

class AiToolExecutionRequest(BaseModel):
    action_id: str
    confirmed: bool

class AiToolCall(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]
    requires_confirmation: bool = False
    action_id: Optional[str] = None
    description: str

class AiChatResponse(BaseModel):
    reply: str
    tool_call: Optional[AiToolCall] = None
    suggested_actions: List[str] = []
