from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, nullable=False)
    email      = Column(String, unique=True, nullable=False, index=True)
    password   = Column(String, nullable=False)   # stores bcrypt hash
    role       = Column(String, default="customer")  # customer | agent | admin
    created_at = Column(DateTime, default=datetime.utcnow)


class Ticket(Base):
    __tablename__ = "tickets"

    id                = Column(Integer, primary_key=True, index=True)
    title             = Column(String, nullable=False)
    description       = Column(String, nullable=False)
    status            = Column(String, default="open")    # open | pending | resolved | closed
    priority          = Column(String, default="medium")  # low | medium | high | urgent
    category          = Column(String, default="general") # payment | billing | technical | account | general
    ai_summary        = Column(String, nullable=True)
    ai_suggested_reply= Column(String, nullable=True)
    user_id           = Column(Integer, nullable=False)
    assigned_to       = Column(Integer, nullable=True)
    created_at        = Column(DateTime, default=datetime.utcnow)
    updated_at        = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Message(Base):
    __tablename__ = "messages"

    id          = Column(Integer, primary_key=True, index=True)
    message     = Column(String, nullable=False)
    sender_type = Column(String, nullable=False)  # customer | agent | ai
    sender_name = Column(String, nullable=True)
    ticket_id   = Column(Integer, nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow)
