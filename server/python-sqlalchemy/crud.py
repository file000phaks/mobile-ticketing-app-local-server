from sqlalchemy.orm import Session
from .models import User, Ticket
from .schemas import UserCreate
from fastapi import HTTPException
from . import schemas
from datetime import datetime, timezone

def create_user(db: Session, user: UserCreate):
    
    existing = db.query(User).filter(User.email == user.email).first()
    
    if existing: 
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = User(email=user.email, full_name=user.full_name, password=user.password)
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
     
    return db_user


def get_users(db: Session):
    
    return db.query(User).all()


def get_user_by_id(db: Session, user_id: int):
    
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, user_email: str):
    
    return db.query(User).filter(User.email == user_email).first()


def delete_user_by_id(db: Session, user_id: int):
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        return None
     
    db.delete(user)
    db.commit()
    
    return user

def delete_user_by_email(db: Session, user_email: str):
    
    user = db.query(User).filter(User.email == user_email).first()
    
    if not user:
        return None
     
    db.delete(user)
    db.commit()
    
    return user

def authenticate_user(db: Session, email: str, password: str):
    
    user = db.query(User).filter(User.email == email).first()
    
    if not user or user.password != password:
        return None
    
    return user


def create_ticket(db: Session, ticket: schemas.TicketCreate):
    
    new_ticket = Ticket(**ticket.dict(), date_created=datetime.now(timezone.utc))
    
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    
    return new_ticket

def get_ticket_by_id(db: Session, ticket_id: int):
     
    return db.query(Ticket).filter(Ticket.id == ticket_id).first()

def get_tickets_by_user_field(db: Session, field: str, user_id: int):
    
    return db.query(Ticket).filter(getattr(Ticket, field) == user_id).all()

def update_ticket(db: Session, ticket_id: int, updates: schemas.TicketUpdate):
    
    # find ticket by id
    ticket = db.query(Ticket).filter(Ticket.id == ticket.id).first()
    
    if not ticket:
        return None
    
    # Loop through update fields, skip unset ones
    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(ticket, key, value)
        
    ticket.date_updated = datetime.now(timezone.utc)
    db.commit() # save changes
    db.refresh(ticket)  # reload from db
    
    return ticket