import os
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, update, func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field

from app.database import get_db
from app.models import User, Project, Quote, BuilderProfile
from app.routers.auth import get_current_user, require_role
from app.utils.currency import format_inr

router = APIRouter(tags=["Projects"])

# Schemas
class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=3)
    description: str = Field(..., min_length=10)
    project_type: str  # residential, commercial, renovation
    location: str
    budget_min: int = Field(..., ge=0)
    budget_max: int = Field(..., ge=0)
    desired_timeline: str

class QuoteRequestPayload(BaseModel):
    builder_id: int

class QuoteSubmitPayload(BaseModel):
    project_id: int
    cost: int = Field(..., ge=0)
    timeline_estimate: str
    materials_details: str
    warranty_details: str

class BudgetCheckPayload(BaseModel):
    amount: Optional[int] = None

# POST /projects
@router.post("/projects", status_code=201)
async def create_project(
    data: ProjectCreate,
    current_user: User = Depends(require_role(["customer"])),
    db: AsyncSession = Depends(get_db)
):
    if data.budget_min > data.budget_max:
        raise HTTPException(status_code=400, detail="Minimum budget cannot exceed maximum budget")

    new_project = Project(
        customer_id=current_user.id,
        title=data.title,
        description=data.description,
        project_type=data.project_type,
        location=data.location,
        budget_min=data.budget_min,
        budget_max=data.budget_max,
        desired_timeline=data.desired_timeline,
        status="open"
    )
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)

    return new_project

# GET /projects (returns own projects for customer, or all for others)
@router.get("/projects")
async def get_projects(
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user and current_user.role == "customer":
        result = await db.execute(
            select(Project)
            .where(Project.customer_id == current_user.id)
            .order_by(Project.created_at.desc())
        )
    else:
        result = await db.execute(
            select(Project)
            .order_by(Project.created_at.desc())
        )
    return result.scalars().all()

# GET /projects/{id}
@router.get("/projects/{id}")
async def get_project_detail(
    id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Project).where(Project.id == id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

# GET /projects/builder/active (Builder's active hired projects)
@router.get("/projects/builder/active")
async def get_builder_active_projects(
    current_user: User = Depends(require_role(["builder"])),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Project)
        .join(Quote, Project.id == Quote.project_id)
        .where(Quote.builder_id == current_user.id, Quote.status == "accepted")
        .order_by(Project.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()

# POST /projects/{id}/request-quote (Customer invites a builder)
@router.post("/projects/{id}/request-quote")
async def request_quote(
    id: int,
    payload: QuoteRequestPayload,
    current_user: User = Depends(require_role(["customer"])),
    db: AsyncSession = Depends(get_db)
):
    # Verify project exists and belongs to customer
    proj_result = await db.execute(select(Project).where(Project.id == id))
    project = proj_result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to invite builders to this project")

    # Verify builder exists
    builder_result = await db.execute(select(User).where(User.id == payload.builder_id, User.role == "builder"))
    builder = builder_result.scalars().first()
    if not builder:
        raise HTTPException(status_code=404, detail="Builder not found")

    # Check if quote record already exists
    quote_result = await db.execute(
        select(Quote).where(Quote.project_id == id, Quote.builder_id == payload.builder_id)
    )
    existing_quote = quote_result.scalars().first()
    if existing_quote:
        raise HTTPException(status_code=400, detail="Builder has already been invited or bid on this project")

    # Create direct invitation quote shell (cost=0 initially)
    new_quote = Quote(
        project_id=id,
        builder_id=payload.builder_id,
        cost=0,
        timeline_estimate="Awaiting submission",
        materials_notes="Awaiting submission",
        warranty_period="Awaiting submission",
        source="invited",
        status="invited"
    )
    db.add(new_quote)
    await db.commit()
    await db.refresh(new_quote)

    return new_quote

# GET /projects/builder/leads (Builder leads panel: direct invites vs open marketplace)
@router.get("/projects/builder/leads")
async def get_builder_leads(
    current_user: User = Depends(require_role(["builder"])),
    db: AsyncSession = Depends(get_db)
):
    # Outer join to match projects with builder quotes (if they exist)
    stmt = (
        select(Project, Quote)
        .outerjoin(Quote, and_(Project.id == Quote.project_id, Quote.builder_id == current_user.id))
        .where(Project.status == "open")
        .order_by(Project.created_at.desc())
    )
    result = await db.execute(stmt)
    records = result.all()

    leads = []
    for project, quote in records:
        if quote is not None:
            # They have an invite or have already bid
            leads.append({
                "project_id": project.id,
                "title": project.title,
                "description": project.description,
                "project_type": project.project_type,
                "location": project.location,
                "budget_min": project.budget_min,
                "budget_max": project.budget_max,
                "desired_timeline": project.desired_timeline,
                "quote_id": quote.id,
                "quote_status": quote.status,
                "source": quote.source,  # will be 'invited' or 'marketplace'
                "cost": quote.cost,
                "timeline_estimate": quote.timeline_estimate
            })
        else:
            # No quote exists yet -> this is an open marketplace lead
            leads.append({
                "project_id": project.id,
                "title": project.title,
                "description": project.description,
                "project_type": project.project_type,
                "location": project.location,
                "budget_min": project.budget_min,
                "budget_max": project.budget_max,
                "desired_timeline": project.desired_timeline,
                "quote_id": None,
                "quote_status": None,
                "source": "marketplace",  # defaults to marketplace lead
                "cost": 0,
                "timeline_estimate": ""
            })

    return leads

# POST /quotes (Builder bids on a project or fills out an invite)
@router.post("/quotes")
async def submit_quote(
    payload: QuoteSubmitPayload,
    current_user: User = Depends(require_role(["builder"])),
    db: AsyncSession = Depends(get_db)
):
    # Check if quote record already exists
    quote_result = await db.execute(
        select(Quote).where(Quote.project_id == payload.project_id, Quote.builder_id == current_user.id)
    )
    existing_quote = quote_result.scalars().first()

    if existing_quote:
        # If they were invited, they submit detail and update status to 'quoted'
        existing_quote.cost = payload.cost
        existing_quote.timeline_estimate = payload.timeline_estimate
        existing_quote.materials_notes = payload.materials_details
        existing_quote.warranty_period = payload.warranty_details
        existing_quote.status = "quoted"
        
        await db.commit()
        await db.refresh(existing_quote)
        return existing_quote
    else:
        # Verify project is open
        proj_result = await db.execute(select(Project).where(Project.id == payload.project_id))
        project = proj_result.scalars().first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        if project.status != "open":
            raise HTTPException(status_code=400, detail="Cannot quote on a project that is not open")

        # Create new marketplace quote
        new_quote = Quote(
            project_id=payload.project_id,
            builder_id=current_user.id,
            cost=payload.cost,
            timeline_estimate=payload.timeline_estimate,
            materials_notes=payload.materials_details,
            warranty_period=payload.warranty_details,
            source="marketplace",
            status="quoted"
        )
        db.add(new_quote)
        await db.commit()
        await db.refresh(new_quote)
        return new_quote

# GET /projects/{id}/quotes (Customer fetches quotes for comparison)
@router.get("/projects/{id}/quotes")
async def get_project_quotes(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if project exists
    proj_result = await db.execute(select(Project).where(Project.id == id))
    project = proj_result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Fetch quotes and builder details
    stmt = (
        select(Quote)
        .where(Quote.project_id == id)
        .options(selectinload(Quote.builder))
    )
    result = await db.execute(stmt)
    quotes = result.scalars().all()

    data = []
    for q in quotes:
        # Load builder's business name
        profile_res = await db.execute(select(BuilderProfile).where(BuilderProfile.user_id == q.builder_id))
        profile = profile_res.scalars().first()
        biz_name = profile.business_name if profile else q.builder.name

        data.append({
            "id": q.id,
            "project_id": q.project_id,
            "builder_id": q.builder_id,
            "builder_name": biz_name,
            "cost": q.cost,
            "timeline_estimate": q.timeline_estimate,
            "materials_details": q.materials_notes,
            "warranty_details": q.warranty_period,
            "source": q.source,
            "status": q.status,
            "created_at": q.submitted_at
        })

    return data

# POST /quotes/{id}/accept (Customer accepts quote, reject others)
@router.post("/quotes/{id}/accept")
async def accept_quote(
    id: int,
    current_user: User = Depends(require_role(["customer"])),
    db: AsyncSession = Depends(get_db)
):
    # Fetch quote
    quote_res = await db.execute(select(Quote).where(Quote.id == id))
    quote = quote_res.scalars().first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    # Fetch project
    proj_res = await db.execute(select(Project).where(Project.id == quote.project_id))
    project = proj_res.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Verify authorization
    if project.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to accept quotes for this project")

    if project.status != "open":
        raise HTTPException(status_code=400, detail="Cannot accept quote for a project that is already hired or closed")

    # 1. Update accepted quote
    quote.status = "accepted"

    # 2. Update project status to hired
    project.status = "hired"

    # 3. Update all OTHER quotes for this project to rejected
    await db.execute(
        update(Quote)
        .where(Quote.project_id == project.id, Quote.id != id)
        .values(status="rejected")
    )

    await db.commit()
    await db.refresh(quote)
    await db.refresh(project)

    return {
        "message": "Quote accepted successfully",
        "quote_id": quote.id,
        "project_status": project.status,
        "quote_status": quote.status
      }

# POST /projects/{id}/complete (Customer completes project)
@router.post("/projects/{id}/complete")
async def complete_project(
    id: int,
    current_user: User = Depends(require_role(["customer"])),
    db: AsyncSession = Depends(get_db)
):
    proj_result = await db.execute(select(Project).where(Project.id == id))
    project = proj_result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to complete this project")
    if project.status != "hired" and project.status != "in_progress":
        raise HTTPException(status_code=400, detail="Only hired or active projects can be marked as completed")

    project.status = "completed"
    await db.commit()
    await db.refresh(project)
    
    return {
        "message": "Project marked as completed successfully",
        "id": project.id,
        "status": project.status
    }

# GET /projects/{id}/recommended-builders
@router.get("/projects/{id}/recommended-builders")
async def get_recommended_builders(
    id: int,
    db: AsyncSession = Depends(get_db)
):
    # Fetch project
    proj_res = await db.execute(select(Project).where(Project.id == id))
    project = proj_res.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Fetch all builder profiles
    builders_res = await db.execute(
        select(BuilderProfile)
        .options(selectinload(BuilderProfile.user))
    )
    builders = builders_res.scalars().all()

    recommendations = []
    p_min = project.budget_min
    p_max = project.budget_max
    p_width = p_max - p_min if p_max > p_min else 1.0

    for b in builders:
        # 1. Specialization Match (40%)
        spec_score = 0.40 if b.specialization.lower() == project.project_type.lower() else 0.0

        # 2. Location Match (30%)
        loc_score = 0.0
        if project.location and b.service_areas:
            # service_areas is a JSON array
            if project.location.strip().lower() in [area.strip().lower() for area in b.service_areas]:
                loc_score = 0.30

        # 3. Budget Overlap Match (20%)
        overlap_score = 0.0
        b_min = b.budget_min
        b_max = b.budget_max
        
        # Calculate intersection width
        overlap_min = max(p_min, b_min)
        overlap_max = min(p_max, b_max)
        
        if overlap_max > overlap_min:
            overlap_width = overlap_max - overlap_min
            overlap_ratio = overlap_width / p_width
            overlap_ratio = min(1.0, max(0.0, overlap_ratio))
            overlap_score = 0.20 * overlap_ratio

        # 4. Rating Match (10%)
        rating_val = b.avg_rating if b.avg_rating else 3.0
        rating_score = 0.10 * (rating_val / 5.0)

        total_score = round(spec_score + loc_score + overlap_score + rating_score, 3)

        recommendations.append({
            "builder": b,
            "score": total_score
        })

    # Sort descending by score
    recommendations.sort(key=lambda x: x["score"], reverse=True)
    top_5 = recommendations[:5]

    data = []
    for r in top_5:
        b = r["builder"]
        data.append({
            "user_id": b.user_id,
            "business_name": b.business_name,
            "specialization": b.specialization,
            "years_experience": b.years_experience,
            "service_areas": b.service_areas,
            "budget_min": b.budget_min,
            "budget_max": b.budget_max,
            "bio": b.bio,
            "is_verified": b.is_verified,
            "avg_rating": b.avg_rating,
            "name": b.user.name,
            "email": b.user.email,
            "phone": b.user.phone,
            "match_score": int(r["score"] * 100) # format as integer percentage (e.g. 85%)
        })

    return data

# POST /projects/{id}/budget-check
@router.post("/projects/{id}/budget-check")
async def check_project_budget(
    id: int,
    payload: BudgetCheckPayload,
    db: AsyncSession = Depends(get_db)
):
    # Fetch project
    proj_res = await db.execute(select(Project).where(Project.id == id))
    project = proj_res.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Fetch accepted quotes of the same project type
    stmt = (
        select(Quote.cost)
        .join(Project, Project.id == Quote.project_id)
        .where(
            Project.project_type == project.project_type,
            Quote.status == "accepted",
            Quote.cost > 0
        )
    )
    result = await db.execute(stmt)
    accepted_costs = result.scalars().all()
    
    count = len(accepted_costs)
    
    # If no quotes exist, return insufficient data
    if count < 1:
        return {
            "status": "insufficient_data",
            "message": "Insufficient historical accepted bids to run comparative analysis."
        }

    avg_accepted_cost = sum(accepted_costs) / count

    # Determine amount to check
    # If amount is passed (e.g. quote cost in the table), check that amount
    if payload.amount is not None:
        target_amount = payload.amount
        
        # within range: +/- 25% of average cost
        lower_bound = 0.75 * avg_accepted_cost
        upper_bound = 1.25 * avg_accepted_cost
        
        if target_amount < lower_bound:
            status_flag = "below_range"
        elif target_amount > upper_bound:
            status_flag = "above_range"
        else:
            status_flag = "within_range"
            
        return {
            "status": status_flag,
            "avg_accepted_cost": int(avg_accepted_cost),
            "checked_amount": target_amount
        }
    else:
        # Compare project's own budget range against average accepted cost
        # within range if avg_accepted_cost overlaps the project range
        if project.budget_min <= avg_accepted_cost <= project.budget_max:
            status_flag = "within_range"
        elif project.budget_max < avg_accepted_cost:
            status_flag = "below_range" # project budget is below average costs
        else:
            status_flag = "above_range" # project budget is above average costs
            
        return {
            "status": status_flag,
            "avg_accepted_cost": int(avg_accepted_cost),
            "project_budget_min": project.budget_min,
            "project_budget_max": project.budget_max
        }
