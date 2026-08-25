from sqlalchemy import Column,String,Integer
from database import Base



class User(Base):
    __tablename__="users"

    id=Column(Integer,primary_key=True,index=True)
    name=Column(String,nullable=False)
    email=Column(String,unique=True,nullable=False,index=True)
    password=Column(String,nullable=False)


class Ticket(Base):
    __tablename__="tickets"
    id=Column(Integer,primary_key=True,index=True)
    title=Column(String,nullable=False)
    description=Column(String,nullable=False)
    status=Column(String,default="open")
    priority=Column(String,default="medium")
    user_id=Column(Integer,nullable=False)


class Message(Base):
    __tablename__="messages"
    id=Column(Integer,primary_key=True,index=True)
    message=Column(String,nullable=False)
    sender_type=Column(Integer,nullable=False)
    ticket_id=Column(Integer,nullable=False)
