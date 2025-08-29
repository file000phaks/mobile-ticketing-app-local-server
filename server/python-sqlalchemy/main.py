# Entry point

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from .db import Base, engine, SessionLocal
from . import crud, schemas
from .models import Ticket
from typing import Optional, List
import os

Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def serve_index():
    filepath = os.path.join(os.path.dirname(__file__), "static", "index.html")
    return FileResponse(filepath)

origins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

def get_db():
    
    db = SessionLocal()
    
    try:
        yield db
    finally:
        db.close()
        

@app.post("/users", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    
    return crud.create_user(db, user)


@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    
    return crud.get_users(db)


@app.get("/users/id/{user_id}")
def get_user_by_id(user_id: str, db: Session = Depends(get_db)):
    
    user = crud.get_user_by_id(db, user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

# get user by email
@app.get("/users/email/{user_email}")
def get_user_by_email(user_email: str, db: Session = Depends(get_db)):
    
    user = crud.get_user_by_email(db, user_email)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

#delete user by id
@app.delete("/users/id/{user_id}")
def delete_user_by_id(user_id: str, db: Session = Depends(get_db)):
    
    deleted_user = crud.delete_user_by_id(db, user_id)
    
    if not deleted_user: 
        raise HTTPException(status_code=404, detail="User not found")
    
    return { "detail": "User deleted" }

# delete user by email
@app.delete("/users/email/{user_email}")
def delete_user_by_email(user_email: str, db: Session = Depends(get_db)):
    
    deleted_user = crud.delete_user_by_email(db, user_email)
    
    if not deleted_user: 
        raise HTTPException(status_code=404, detail="User not found")
    
    return { "detail": "User deleted" }

# login
@app.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    
    auth_user = crud.authenticate_user(db, user.email, user.password)
    
    if not auth_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {"message" : "Login successful", "user_id": auth_user.id}


# create ticket
@app.post("/tickets", response_model=schemas.TicketOut)
def create_ticket(ticket: schemas.TicketCreate, db: Session = Depends(get_db)):
    
    return crud.create_ticket(db, ticket)


# get ticket by id
@app.get("/tickets/{ticket_id}", response_model=schemas.TicketOut)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    
    ticket = crud.get_ticket_by_id(db, ticket_id)
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return ticket


# Filter and paginate tickets
@app.get("/tickets", response_model=List[schemas.TicketOut])
def get_tickets(
    status: Optional[str] = None,
    created_by: Optional[int] = None,
    assigned_to: Optional[int] = None,
    assigned_by: Optional[int] = None,
    limit: int = 10,    # Max number of results to return
    offset: int = 0,    # How many to skip (for pagination)
    db: Session = Depends(get_db)
):
    
    query = db.query(Ticket)    # Start with all tickets
    
    # Apply filters if provided
    if status:
        query = query.filter(Ticket.status == status)
    if created_by:
        query = query.filter(Ticket.created_by == created_by)
    if assigned_to:
        query = query.filter(Ticket.assigned_to == assigned_to)
    if assigned_by:
        query = query.filter(Ticket.assigned_by == assigned_by)
        
    # Apply pagination and return result
    return query.offset(offset).limit(limit).all()

        
@app.get("/tickets/user/{field}/{user_id}")
def get_tickets_by_user(field: str, user_id: int, db: Session = Depends(get_db)):
    
    if field not in { "created_by", "assigned_to", "assigned_by"}:
        raise HTTPException(status_code=400, detail="Invalid field")
    
    return crud.get_tickets_by_user_field(db, field, user_id)


@app.put("/tickets/{ticket_id}", response_model=schemas.TicketOut)
def update_ticket(ticket_id: int, updates: schemas.TicketUpdate, db: Session = Depends(get_db)):
    
    ticket = crud.update_ticket(db, ticket_id, updates)
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return ticket