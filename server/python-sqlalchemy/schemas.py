from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str
    
class UserOut(UserCreate):
    email: str
    
class UserLogin(BaseModel):
    email: str
    password: str
    
class TicketCreate(BaseModel):
    title: str
    fault_description: str
    location: str
    priority: str
    status: str
    type: str
    created_by: int
    assigned_to: int
    assigned_by: int
    due_date: datetime
    notes: Optional[str] = None
    
class TicketOut(TicketCreate):
    id: int
    date_created: datetime
    class Config:
        orm_mode = True
        
class TicketUpdate(BaseModel):
    # All fields are optional so user can update only what they want
    title: Optional[str]
    fault_description: Optional[str]
    location: Optional[str]
    priority: Optional[str]
    status: Optional[str]
    type: Optional[str]
    created_by: Optional[int]
    assigned_to: Optional[int]
    assigned_by: Optional[int]
    due_date: Optional[datetime]
    date_resolved: Optional[datetime]
    notes: Optional[str] = None