# SQLAlchemy models

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from .db import Base
from datetime import datetime
from sqlalchemy.orm import relationship
import time

class User(Base):
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    password = Column(String)   # plain-text for now (not safe, but should be fine for testing and dev)
    
    
class Ticket(Base):
    
    __tablename__ = "tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    fault_description = Column(String)
    location = Column(String)
    date_created = Column(DateTime, default=datetime.utcnow)
    date_updated = Column(DateTime)
    date_resolved = Column(DateTime)
    priority = Column(String)
    status = Column(String)
    type = Column(String)
    created_by = Column(String, ForeignKey("users.id"))
    assigned_by = Column(String, ForeignKey("users.id"))
    assigned_to = Column(String, ForeignKey("users.id"))
    due_date = Column(DateTime)
    notes = Column(String)
    
    creator = relationship("User", foreign_keys=[created_by])
    assignee = relationship("User", foreign_keys=[assigned_to])
    assigner = relationship("User", foreign_keys=[assigned_by])