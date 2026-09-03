# AI Customer Support System

A full-stack customer support ticketing system powered by **OpenAI GPT-4o-mini**.  
Customers submit tickets, AI instantly classifies them, and agents reply with AI-generated suggestions.

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | Python, FastAPI, SQLAlchemy, SQLite |
| Auth      | JWT (python-jose) + bcrypt          |
| AI        | OpenAI GPT-4o-mini                  |
| Frontend  | HTML, CSS, JavaScript (no framework)|

---

## Features

- **JWT Authentication** — Register and login as customer, agent, or admin
- **Role-Based Access** — Each role sees a different dashboard
- **AI Ticket Triage** — Every ticket is auto-classified by OpenAI (category, priority, sentiment, summary)
- **AI Reply Suggestion** — Agents get one-click AI-generated replies
- **Live AI Preview** — See AI analysis while typing a new ticket
- **Admin Panel** — Filter, paginate, assign, change status, delete tickets
- **Chat-style thread** — Color-coded messages for customer / agent / AI

---

## Project Structure

```
ai-customer-support/
│
├── backend/
│   ├── main.py          ← All API routes
│   ├── models.py        ← Database tables (SQLAlchemy)
│   ├── schemas.py       ← Request/response validation (Pydantic)
│   ├── auth.py          ← JWT helpers + role guards
│   ├── database.py      ← DB engine + session
│   ├── reset_db.py      ← Script to reset database
│   ├── requirements.txt ← Python packages
│   └── .env             ← Secret keys (never commit)
│
└── frontend/
    ├── index.html        ← Redirects to login
    ├── login.html        ← Login page
    ├── register.html     ← Register page
    ├── dashboard.html    ← Customer: my tickets
    ├── new-ticket.html   ← Customer: submit ticket
    ├── ticket.html       ← Ticket detail + chat thread
    ├── agent.html        ← Agent: queue dashboard
    ├── admin.html        ← Admin: stats dashboard
    ├── admin-tickets.html← Admin: manage all tickets
    ├── css/
    │   └── style.css     ← All styles (one file)
    └── js/
        └── script.js     ← All logic + API calls (one file)
```

---

## How to Run

### Step 1 — Backend

```bash
# Go to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate

# Install packages
pip install -r requirements.txt

# Create .env file and add your keys (see below)

# Reset database (first time only)
python reset_db.py

# Start the server
uvicorn main:app --reload
```

Backend runs at: `http://localhost:8000`  
API docs at: `http://localhost:8000/docs`

### Step 2 — Frontend

No build step needed. Just open the files:

```
Open frontend/login.html in your browser
     OR
Use VS Code Live Server → right-click login.html → Open with Live Server
```

> **Note:** The frontend talks to the backend at `http://127.0.0.1:8000`.  
> Make sure uvicorn is running before you open the frontend.

---

## Environment Variables

Create a file `backend/.env` with these values:

```
SECRET_KEY=your-random-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
OPENAI_API_KEY=your-openai-api-key-here
DATABASE_URL=sqlite:///./support.db
```

> If `OPENAI_API_KEY` is missing or invalid, the app still works using  
> keyword-based rule fallback — no crashes.

---

## API Routes

| Method | Route | Who can use | What it does |
|--------|-------|-------------|--------------|
| POST | `/auth/register` | Anyone | Create account |
| POST | `/auth/login` | Anyone | Login, get JWT token |
| GET | `/auth/me` | Logged in | Get my profile |
| POST | `/ai/analyze` | Logged in | Analyse text with AI |
| GET | `/ai/suggest-reply/{id}` | Agent, Admin | AI reply suggestion |
| POST | `/tickets/` | Customer+ | Create ticket (AI auto-classifies) |
| GET | `/tickets/my` | Customer+ | My tickets |
| GET | `/tickets/{id}` | Any role | Ticket + messages |
| POST | `/tickets/{id}/messages` | Agent, Admin | Post a reply |
| GET | `/agent/tickets` | Agent, Admin | My assigned tickets |
| GET | `/agent/all-tickets` | Agent, Admin | All open tickets |
| GET | `/admin/dashboard` | Admin | Stats overview |
| GET | `/admin/tickets` | Admin | All tickets (paginated + filtered) |
| GET | `/admin/agents` | Admin | List agents |
| PATCH | `/tickets/{id}/assign` | Admin | Assign to agent |
| PATCH | `/tickets/{id}/status` | Admin | Change status |
| DELETE | `/admin/tickets/{id}` | Admin | Delete ticket |

---

## Roles

| Role | Can do |
|------|--------|
| **customer** | Submit tickets, view own tickets and messages |
| **agent** | View assigned + all open tickets, post replies, use AI suggest |
| **admin** | Everything — full dashboard, assign, delete, change status |

---

## Security Notes

- Passwords are hashed with **bcrypt** — never stored as plain text
- JWTs expire after 60 minutes
- `SECRET_KEY` must be changed before going to production
- `.env` is in `.gitignore` — never committed to GitHub
- Role checks happen on the **backend** — frontend checks are UI only
