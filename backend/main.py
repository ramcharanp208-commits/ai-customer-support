import os
import json
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from openai import OpenAI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv


load_dotenv()

from database import engine, Base, get_db
from models import User, Ticket, Message
from schemas import (
    UserRegister, UserLogin, UserOut,
    TicketCreate, TicketOut, TicketDetailOut, TicketAssign, TicketStatusUpdate,
    MessageCreate, MessageOut,
    AIAnalyzeRequest
)
from auth import (
    hash_password, verify_password, create_token,
    get_current_user, require_customer, require_agent, require_admin
)

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Customer Support System", version="1.0.0")

# Allow frontend to talk to backend
# Reads allowed origins from .env — covers Live Server (5500) and Vite (5173)
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5500,http://127.0.0.1:5500").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI client — reads key from .env
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))

# Base Directories setup
BASE_DIR=os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR=os.path.join(BASE_DIR,"..", "frontend")
# Link css and Js file
app.mount("/css",StaticFiles(directory=os.path.join(FRONTEND_DIR,"css")),name="css")
app.mount("/js",StaticFiles(directory=os.path.join(FRONTEND_DIR,"js")),name="js")

@app.get("/")
def serve_root():
    return FileResponse(os.path.join(FRONTEND_DIR,"index.html"))

@app.get("/login")
def serve_login():
    return FileResponse(os.path.join(FRONTEND_DIR,"login.html"))

@app.get("/register")
def serve_register():
    return FileResponse(os.path.join(FRONTEND_DIR,"register.html"))

@app.get("/dashboard")
def serve_dashboard():
    return FileResponse(os.path.join(FRONTEND_DIR,"dashboard.html"))

@app.get("/admin")
def serve_admin():
    return FileResponse(os.path.join(FRONTEND_DIR,"admin.html"))

@app.get("/admin-tickets")
def serve_admin_tickets():
    return FileResponse(os.path.join(FRONTEND_DIR,"admin-tickets.html"))

@app.get("/agent")
def serve_agent():
    return FileResponse(os.path.join(FRONTEND_DIR,"agent.html"))


@app.get("/ticket")
def serve_ticket():
    return FileResponse(os.path.join(FRONTEND_DIR,"ticket.html"))

@app.get("/new-ticket")
def serve_new_ticket():
    return FileResponse(os.path.join(FRONTEND_DIR,"new-ticket.html"))



# ─────────────────────────────────────────────
# AI HELPER FUNCTIONS
# ─────────────────────────────────────────────

def analyze_with_ai(title, description):
    """Send ticket to OpenAI and get category, priority, sentiment, summary, reply."""
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key or api_key == "your-openai-api-key-here":
        return rule_based_analysis(description)

    system_msg = (
        "You are a customer support triage assistant. "
        "Analyze the ticket and reply ONLY with a valid JSON object with these keys: "
        "category (payment/billing/technical/account/general), "
        "priority (low/medium/high/urgent), "
        "sentiment (positive/neutral/negative), "
        "summary (one sentence, max 120 chars), "
        "suggested_reply (professional 2-3 sentence reply to customer). "
        "Return ONLY the JSON, no extra text."
    )
    user_msg = f"Title: {title}\nDescription: {description}"

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user",   "content": user_msg}
            ],
            temperature=0.2,
            max_tokens=300
        )
        data = json.loads(response.choices[0].message.content.strip())
        return {
            "category"        : data.get("category",         "general"),
            "priority"        : data.get("priority",         "medium"),
            "sentiment"       : data.get("sentiment",        "neutral"),
            "summary"         : data.get("summary",          "")[:300],
            "suggested_reply" : data.get("suggested_reply",  "")
        }
    except Exception:
        return rule_based_analysis(description)


def rule_based_analysis(description):
    """Fallback when OpenAI is not available."""
    text = description.lower()

    if any(w in text for w in ["payment", "pay", "charged", "refund", "invoice"]):
        category = "payment"
        reply    = "Thank you for contacting us about your payment. We will review your account and respond shortly."
    elif any(w in text for w in ["billing", "subscription", "plan", "receipt"]):
        category = "billing"
        reply    = "We received your billing query and our team will investigate right away."
    elif any(w in text for w in ["bug", "error", "crash", "not working", "broken"]):
        category = "technical"
        reply    = "Sorry for the trouble! Our technical team has been notified and will assist you soon."
    elif any(w in text for w in ["account", "login", "password", "locked", "access"]):
        category = "account"
        reply    = "We understand you are having account issues. We will look into this for you immediately."
    else:
        category = "general"
        reply    = "Thank you for reaching out. A support agent will review your request and respond shortly."

    if any(w in text for w in ["urgent", "asap", "immediately", "critical"]):
        priority = "urgent"
    elif any(w in text for w in ["important", "soon", "quickly", "high"]):
        priority = "high"
    elif any(w in text for w in ["low", "minor", "whenever", "no rush"]):
        priority = "low"
    else:
        priority = "medium"

    if any(w in text for w in ["angry", "frustrated", "terrible", "hate", "awful"]):
        sentiment = "negative"
    elif any(w in text for w in ["thank", "great", "happy", "appreciate"]):
        sentiment = "positive"
    else:
        sentiment = "neutral"

    return {
        "category"        : category,
        "priority"        : priority,
        "sentiment"       : sentiment,
        "summary"         : description[:120],
        "suggested_reply" : reply
    }


def ai_suggest_reply(ticket_title, ticket_description, messages):
    """Generate a reply suggestion for an agent."""
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key or api_key == "your-openai-api-key-here":
        return "Thank you for your patience. We are actively working on your issue and will update you shortly."

    history = "\n".join([f"- {m}" for m in messages[-5:]])
    system_msg = (
        "You are a helpful customer support agent. "
        "Based on the ticket and message history, write a short professional reply (2-3 sentences). "
        "Return only the reply text."
    )
    user_msg = f"Ticket: {ticket_title}\nIssue: {ticket_description}\nHistory:\n{history or 'No messages yet.'}"

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user",   "content": user_msg}
            ],
            temperature=0.4,
            max_tokens=150
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return "Thank you for your patience. We are actively working on your issue."


# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────

@app.get("/api")
def root():
    return {"message": "AI Customer Support API is running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}


# ── Auth routes ───────────────────────────────

@app.post("/auth/register", response_model=UserOut, status_code=201)
def register(data: UserRegister, db: Session = Depends(get_db)):
    # Check email not already used
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Validate role
    if data.role not in ["customer", "agent", "admin"]:
        raise HTTPException(status_code=400, detail="Role must be customer, agent, or admin")

    user = User(
        name     = data.name,
        email    = data.email,
        password = hash_password(data.password),
        role     = data.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/login")
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token({"sub": str(user.id), "role": user.role})
    return {
        "access_token": token,
        "token_type"  : "bearer",
        "user"        : {
            "id"        : user.id,
            "name"      : user.name,
            "email"     : user.email,
            "role"      : user.role,
            "created_at": user.created_at
        }
    }


@app.get("/auth/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# ── AI routes ─────────────────────────────────

@app.post("/ai/analyze")
def ai_analyze(data: AIAnalyzeRequest, current_user: User = Depends(get_current_user)):
    result = analyze_with_ai("Support Request", data.description)
    return result


@app.get("/ai/suggest-reply/{ticket_id}")
def suggest_reply(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_agent)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    messages = db.query(Message).filter(Message.ticket_id == ticket_id).all()
    history  = [m.message for m in messages]
    reply    = ai_suggest_reply(ticket.title, ticket.description, history)
    return {"ticket_id": ticket_id, "suggested_reply": reply}


# ── Ticket routes (Customer) ──────────────────

@app.post("/tickets/", response_model=TicketDetailOut, status_code=201)
def create_ticket(data: TicketCreate, db: Session = Depends(get_db), current_user: User = Depends(require_customer)):
    # AI analysis happens automatically on ticket creation
    analysis = analyze_with_ai(data.title, data.description)

    ticket = Ticket(
        title             = data.title,
        description       = data.description,
        priority          = analysis["priority"],
        category          = analysis["category"],
        ai_summary        = analysis["summary"],
        ai_suggested_reply= analysis["suggested_reply"],
        user_id           = current_user.id
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    # Save AI reply as first message in thread
    ai_msg = Message(
        message     = analysis["suggested_reply"],
        sender_type = "ai",
        sender_name = "AI Assistant",
        ticket_id   = ticket.id
    )
    db.add(ai_msg)
    db.commit()

    # Build response manually (since no ORM relationships)
    messages = db.query(Message).filter(Message.ticket_id == ticket.id).all()
    result   = TicketDetailOut.model_validate(ticket)
    result.messages   = messages
    result.owner_name = current_user.name
    return result


@app.get("/tickets/my")
def my_tickets(db: Session = Depends(get_db), current_user: User = Depends(require_customer)):
    tickets = db.query(Ticket).filter(Ticket.user_id == current_user.id).order_by(Ticket.created_at.desc()).all()
    return tickets


@app.get("/tickets/{ticket_id}", response_model=TicketDetailOut)
def get_ticket(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Customers can only see their own tickets
    if current_user.role == "customer" and ticket.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    messages = db.query(Message).filter(Message.ticket_id == ticket_id).order_by(Message.created_at).all()
    owner    = db.query(User).filter(User.id == ticket.user_id).first()
    assignee = db.query(User).filter(User.id == ticket.assigned_to).first() if ticket.assigned_to else None

    result              = TicketDetailOut.model_validate(ticket)
    result.messages     = messages
    result.owner_name   = owner.name    if owner    else None
    result.assignee_name= assignee.name if assignee else None
    return result


# ── Message routes (Agent) ────────────────────

@app.post("/tickets/{ticket_id}/messages", response_model=MessageOut)
def post_message(ticket_id: int, data: MessageCreate, db: Session = Depends(get_db), current_user: User = Depends(require_agent)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    msg = Message(
        message     = data.message,
        sender_type = "agent",
        sender_name = current_user.name,
        ticket_id   = ticket_id
    )
    db.add(msg)

    # Optionally change ticket status in the same request
    if data.status_change:
        ticket.status = data.status_change

    db.commit()
    db.refresh(msg)
    return msg


@app.get("/agent/tickets")
def agent_tickets(db: Session = Depends(get_db), current_user: User = Depends(require_agent)):
    """Tickets assigned to this agent."""
    tickets = db.query(Ticket).filter(Ticket.assigned_to == current_user.id).order_by(Ticket.created_at.desc()).all()
    return tickets


@app.get("/agent/all-tickets")
def agent_all_tickets(db: Session = Depends(get_db), current_user: User = Depends(require_agent)):
    """All open and pending tickets visible to agents."""
    tickets = db.query(Ticket).filter(Ticket.status.in_(["open", "pending"])).order_by(Ticket.created_at.desc()).all()
    return tickets


# ── Admin routes ──────────────────────────────

@app.get("/admin/dashboard")
def admin_dashboard(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return {
        "total_tickets"     : db.query(Ticket).count(),
        "open_tickets"      : db.query(Ticket).filter(Ticket.status == "open").count(),
        "pending_tickets"   : db.query(Ticket).filter(Ticket.status == "pending").count(),
        "resolved_tickets"  : db.query(Ticket).filter(Ticket.status == "resolved").count(),
        "closed_tickets"    : db.query(Ticket).filter(Ticket.status == "closed").count(),
        "high_priority"     : db.query(Ticket).filter(Ticket.priority == "high").count(),
        "urgent_tickets"    : db.query(Ticket).filter(Ticket.priority == "urgent").count(),
        "unassigned_tickets": db.query(Ticket).filter(Ticket.assigned_to == None).count()
    }


@app.get("/admin/tickets")
def admin_list_tickets(
    page      : int = 1,
    page_size : int = 20,
    status    : str = None,
    priority  : str = None,
    category  : str = None,
    db        : Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    query = db.query(Ticket)
    if status:
        query = query.filter(Ticket.status == status)
    if priority:
        query = query.filter(Ticket.priority == priority)
    if category:
        query = query.filter(Ticket.category == category)

    total   = query.count()
    tickets = query.order_by(Ticket.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "page": page, "page_size": page_size, "tickets": tickets}


@app.get("/admin/agents")
def list_agents(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    agents = db.query(User).filter(User.role.in_(["agent", "admin"])).all()
    return agents


@app.patch("/tickets/{ticket_id}/assign")
def assign_ticket(ticket_id: int, data: TicketAssign, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    agent = db.query(User).filter(User.id == data.agent_id, User.role.in_(["agent", "admin"])).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    ticket.assigned_to = data.agent_id
    if ticket.status == "open":
        ticket.status = "pending"   # auto move to pending on assign
    db.commit()
    db.refresh(ticket)
    return ticket


@app.patch("/tickets/{ticket_id}/status")
def update_status(ticket_id: int, data: TicketStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.status = data.status
    db.commit()
    db.refresh(ticket)
    return ticket


@app.delete("/admin/tickets/{ticket_id}", status_code=204)
def delete_ticket(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    # Delete messages first
    db.query(Message).filter(Message.ticket_id == ticket_id).delete()
    db.delete(ticket)
    db.commit()
