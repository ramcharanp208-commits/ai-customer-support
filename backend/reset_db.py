"""
Run this script ONCE to drop and recreate all tables with the correct schema.
Usage: python reset_db.py

WARNING: This deletes all existing data.
"""
import os
import sys

# Make sure we're in the backend directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from database import Base, engine
# Import all models so Base knows about them
from models import User, Ticket, TicketMessage   # noqa: F401

print("Dropping all existing tables...")
Base.metadata.drop_all(bind=engine)

print("Creating tables with correct schema...")
Base.metadata.create_all(bind=engine)

# Verify
from sqlalchemy import inspect
inspector = inspect(engine)
for table in inspector.get_table_names():
    cols = [c["name"] for c in inspector.get_columns(table)]
    print(f"  {table}: {cols}")

print("\nDone! Database reset successfully.")
print("You can now start the server: uvicorn main:app --reload")
