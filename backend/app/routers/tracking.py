import os
import uuid
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field

from app.database import get_db
from app.models import User, Project, ProjectMilestone, ProjectDocument, Message, Payment
from app.routers.auth import get_current_user, require_role

router = APIRouter(prefix="/projects", tags=["Project Tracking"])

# Schemas
class MilestoneCreate(BaseModel):
    title: str = Field(..., min_length=2)
    description: str
    due_date: str # YYYY-MM-DD

class MilestoneStatusUpdate(BaseModel):
    status: str # pending, in_progress, done

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1)

class PaymentCreate(BaseModel):
    milestone_id: Optional[int] = None
    amount: int = Field(..., ge=0)

# UPLOAD CONFIG
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

# Helper to verify project access (must be owner customer OR hired builder)
async def verify_project_access(project_id: int, user: User, db: AsyncSession) -> Project:
    stmt = (
        select(Project)
        .where(Project.id == project_id)
        .options(selectinload(Project.quotes))
    )
    result = await db.execute(stmt)
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Access is permitted if customer is the owner
    if project.customer_id == user.id:
        return project

    # Access is permitted if builder has an accepted quote for this project
    accepted_builders = [q.builder_id for q in project.quotes if q.status == "accepted"]
    if user.id in accepted_builders:
        return project

    # Admin gets override access
    if user.role == "admin":
        return project

    raise HTTPException(status_code=403, detail="Not authorized to track this project")


# === 1. MILESTONES ENDPOINTS ===

@router.get("/{id}/milestones")
async def get_project_milestones(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_project_access(id, current_user, db)
    result = await db.execute(
        select(ProjectMilestone)
        .where(ProjectMilestone.project_id == id)
        .order_by(ProjectMilestone.due_date.asc())
    )
    milestones = result.scalars().all()
    
    # Return serializable data
    return [
        {
            "id": m.id,
            "project_id": m.project_id,
            "title": m.title,
            "description": m.description,
            "status": m.status,
            "due_date": m.due_date.isoformat(),
            "completed_at": m.completed_at.isoformat() if m.completed_at else None
        } for m in milestones
    ]

@router.post("/{id}/milestones", status_code=201)
async def create_project_milestone(
    id: int,
    data: MilestoneCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify access and check that user is not a customer/builder outside this project
    await verify_project_access(id, current_user, db)

    try:
        due = datetime.strptime(data.due_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD")

    new_milestone = ProjectMilestone(
        project_id=id,
        title=data.title,
        description=data.description,
        status="pending",
        due_date=due
    )
    db.add(new_milestone)
    await db.commit()
    await db.refresh(new_milestone)

    return {
        "id": new_milestone.id,
        "project_id": new_milestone.project_id,
        "title": new_milestone.title,
        "description": new_milestone.description,
        "status": new_milestone.status,
        "due_date": new_milestone.due_date.isoformat()
    }

@router.put("/{id}/milestones/{mid}")
async def update_milestone_status(
    id: int,
    mid: int,
    data: MilestoneStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_project_access(id, current_user, db)
    
    result = await db.execute(
        select(ProjectMilestone)
        .where(ProjectMilestone.id == mid, ProjectMilestone.project_id == id)
    )
    milestone = result.scalars().first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    milestone.status = data.status
    if data.status == "done":
        milestone.completed_at = datetime.utcnow()
    else:
        milestone.completed_at = None

    await db.commit()
    await db.refresh(milestone)

    return {
        "id": milestone.id,
        "status": milestone.status,
        "completed_at": milestone.completed_at.isoformat() if milestone.completed_at else None
    }


# === 2. DOCUMENTS ENDPOINTS ===

@router.get("/{id}/documents")
async def get_project_documents(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_project_access(id, current_user, db)
    result = await db.execute(
        select(ProjectDocument)
        .where(ProjectDocument.project_id == id)
        .options(selectinload(ProjectDocument.uploader))
        .order_by(ProjectDocument.uploaded_at.desc())
    )
    docs = result.scalars().all()
    return [
        {
            "id": d.id,
            "project_id": d.project_id,
            "file_url": d.file_url,
            "file_name": d.file_name,
            "doc_type": d.doc_type,
            "uploaded_by_name": d.uploader.name,
            "uploaded_at": d.uploaded_at.isoformat()
        } for d in docs
    ]

@router.post("/{id}/documents", status_code=201)
async def upload_project_document(
    id: int,
    file: UploadFile = File(...),
    doc_type: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_project_access(id, current_user, db)
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    ext = os.path.splitext(file.filename)[1].lower()
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    try:
        with open(filepath, "wb") as buffer:
            buffer.write(await file.read())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write file: {str(e)}")

    new_doc = ProjectDocument(
        project_id=id,
        uploaded_by=current_user.id,
        file_url=f"/uploads/{filename}",
        file_name=file.filename,
        doc_type=doc_type
    )
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)

    return {
        "id": new_doc.id,
        "file_url": new_doc.file_url,
        "file_name": new_doc.file_name,
        "doc_type": new_doc.doc_type,
        "uploaded_at": new_doc.uploaded_at.isoformat()
    }


# === 3. MESSAGES ENDPOINTS ===

@router.get("/{id}/messages")
async def get_project_messages(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_project_access(id, current_user, db)
    result = await db.execute(
        select(Message)
        .where(Message.project_id == id)
        .options(selectinload(Message.sender))
        .order_by(Message.sent_at.asc())
    )
    messages = result.scalars().all()
    return [
        {
            "id": m.id,
            "project_id": m.project_id,
            "sender_id": m.sender_id,
            "sender_name": m.sender.name,
            "sender_role": m.sender.role,
            "content": m.content,
            "sent_at": m.sent_at.isoformat()
        } for m in messages
    ]

@router.post("/{id}/messages", status_code=201)
async def send_project_message(
    id: int,
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_project_access(id, current_user, db)
    new_msg = Message(
        project_id=id,
        sender_id=current_user.id,
        content=data.content
    )
    db.add(new_msg)
    await db.commit()
    await db.refresh(new_msg)

    return {
        "id": new_msg.id,
        "content": new_msg.content,
        "sent_at": new_msg.sent_at.isoformat()
    }


# === 4. PAYMENTS ENDPOINTS ===

@router.get("/{id}/payments")
async def get_project_payments(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_project_access(id, current_user, db)
    result = await db.execute(
        select(Payment)
        .where(Payment.project_id == id)
        .options(selectinload(Payment.milestone))
        .order_by(Payment.paid_at.desc().nulls_last())
    )
    payments = result.scalars().all()
    return [
        {
            "id": p.id,
            "project_id": p.project_id,
            "milestone_id": p.milestone_id,
            "milestone_title": p.milestone.title if p.milestone else "General Project Cost",
            "amount": p.amount,
            "status": p.status,
            "paid_at": p.paid_at.isoformat() if p.paid_at else None
        } for p in payments
    ]

@router.post("/{id}/payments", status_code=201)
async def log_project_payment(
    id: int,
    data: PaymentCreate,
    current_user: User = Depends(require_role(["customer"])), # Only customer pays!
    db: AsyncSession = Depends(get_db)
):
    await verify_project_access(id, current_user, db)

    # If milestone_id is passed, check if a pending payment is already logged for it
    if data.milestone_id:
        pending_res = await db.execute(
            select(Payment)
            .where(
                Payment.project_id == id,
                Payment.milestone_id == data.milestone_id,
                Payment.status == "pending"
            )
        )
        existing_payment = pending_res.scalars().first()
        if existing_payment:
            existing_payment.status = "paid"
            existing_payment.paid_at = datetime.utcnow()
            existing_payment.amount = data.amount # update to actual paid amount
            await db.commit()
            await db.refresh(existing_payment)
            return existing_payment

    # Create new payment record
    new_payment = Payment(
        project_id=id,
        milestone_id=data.milestone_id,
        amount=data.amount,
        status="paid",
        paid_at=datetime.utcnow()
    )
    db.add(new_payment)
    await db.commit()
    await db.refresh(new_payment)
    return new_payment
