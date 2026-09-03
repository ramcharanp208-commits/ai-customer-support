from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    name    : str
    email   : EmailStr
    password: str
    role    : str = "customer"   # customer | agent | admin

class UserLogin(BaseModel):
    email   : EmailStr
    password: str

class UserOut(BaseModel):
    id        : int
    name      : str
    email     : str
    role      : str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Tickets ───────────────────────────────────────────────────────────────────

class TicketCreate(BaseModel):
    title      : str
    description: str

class TicketOut(BaseModel):
    id                : int
    title             : str
    description       : str
    status            : str
    priority          : str
    category          : str
    ai_summary        : Optional[str] = None
    ai_suggested_reply: Optional[str] = None
    user_id           : int
    assigned_to       : Optional[int] = None
    created_at        : datetime
    updated_at        : datetime

    class Config:
        from_attributes = True

class TicketAssign(BaseModel):
    agent_id: int

class TicketStatusUpdate(BaseModel):
    status: str


# ── Messages ──────────────────────────────────────────────────────────────────

class MessageCreate(BaseModel):
    message      : str
    status_change: Optional[str] = None  # optionally change ticket status

class MessageOut(BaseModel):
    id          : int
    message     : str
    sender_type : str
    sender_name : Optional[str] = None
    ticket_id   : int
    created_at  : datetime

    class Config:
        from_attributes = True


# ── Ticket with messages (detail view) ───────────────────────────────────────

class TicketDetailOut(TicketOut):
    messages     : List[MessageOut] = []
    owner_name   : Optional[str]    = None
    assignee_name: Optional[str]    = None


# ── AI ────────────────────────────────────────────────────────────────────────

class AIAnalyzeRequest(BaseModel):
    description: str
