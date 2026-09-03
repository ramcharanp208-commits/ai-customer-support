"""
Pydantic schemas for request validation and response serialization.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from models import SenderType, TicketCategory, TicketPriority, TicketStatus, UserRole


# ---------------------------------------------------------------------------
# Auth / User schemas
# ---------------------------------------------------------------------------

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    role: UserRole = UserRole.customer


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------------------------------------------------------------------------
# Ticket schemas
# ---------------------------------------------------------------------------

class TicketCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=255)
    description: str = Field(..., min_length=10)


class TicketOut(BaseModel):
    id: int
    title: str
    description: str
    status: TicketStatus
    priority: TicketPriority
    category: TicketCategory
    ai_summary: Optional[str] = None
    ai_suggested_reply: Optional[str] = None
    user_id: int
    assigned_to: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TicketDetailOut(TicketOut):
    messages: List["MessageOut"] = []
    owner_name: Optional[str] = None
    assignee_name: Optional[str] = None

    model_config = {"from_attributes": True}


class TicketAssign(BaseModel):
    agent_id: int


class TicketStatusUpdate(BaseModel):
    status: TicketStatus


# ---------------------------------------------------------------------------
# Message schemas
# ---------------------------------------------------------------------------

class MessageCreate(BaseModel):
    message: str = Field(..., min_length=1)
    status_change: Optional[TicketStatus] = None  # optionally change ticket status


class MessageOut(BaseModel):
    id: int
    message: str
    sender_type: SenderType
    sender_name: Optional[str] = None
    ticket_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# AI schemas
# ---------------------------------------------------------------------------

class AIAnalyzeRequest(BaseModel):
    description: str = Field(..., min_length=5)


class AIAnalysisResult(BaseModel):
    category: TicketCategory
    priority: TicketPriority
    sentiment: str          # "positive" | "neutral" | "negative"
    summary: str
    suggested_reply: str
    confidence: float = Field(..., ge=0.0, le=1.0)


# ---------------------------------------------------------------------------
# Pagination / generic wrappers
# ---------------------------------------------------------------------------

class PaginatedTickets(BaseModel):
    total: int
    page: int
    page_size: int
    tickets: List[TicketOut]


class DashboardStats(BaseModel):
    total_tickets: int
    open_tickets: int
    pending_tickets: int
    resolved_tickets: int
    closed_tickets: int
    high_priority: int
    urgent_tickets: int
    unassigned_tickets: int


# Update forward refs
TicketDetailOut.model_rebuild()
