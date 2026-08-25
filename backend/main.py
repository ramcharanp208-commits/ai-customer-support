from fastapi import FastAPI
from database import engine,Base
from models import User,Ticket,Message



Base.metadata.create_all(bind=engine)


app=FastAPI(title="AI Customer Support & Tickekting System",version="1.0.0")

@app.get("/")
def root():
    return {"message":"AI Customer Support API is running"}