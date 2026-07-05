import os
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field


from app.database import get_db
from app.models import User, BuilderProfile, PortfolioItem, Review
from app.routers.auth import get_current_user, require_role
from app.utils.currency import format_inr

router = APIRouter(prefix="/builders", tags=["Builders"])

# UPLOAD CONFIG
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

# Schemas
class PortfolioItemSchema(BaseModel):
    id: int
    image_url: str
    title: str
    description: str
    project_date: str

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    business_name: str = Field(..., min_length=2)
    specialization: str  # residential, commercial, renovation
    years_experience: int = Field(..., ge=0)
    service_areas: List[str]
    budget_min: int = Field(..., ge=0)
    budget_max: int = Field(..., ge=0)
    bio: str
    name: str = Field(..., min_length=2)
    phone: str = Field(..., min_length=10)

class BuilderDetailResponse(BaseModel):
    user_id: int
    business_name: str
    specialization: str
    years_experience: int
    service_areas: List[str]
    budget_min: int
    budget_max: int
    bio: str
    is_verified: bool
    verification_notes: Optional[str]
    avg_rating: float
    name: str
    email: str
    phone: str
    portfolio: List[PortfolioItemSchema]
    reviews: List[Dict[str, Any]]

    class Config:
        from_attributes = True

class PortfolioCreate(BaseModel):
    image_url: str
    title: str
    description: str
    project_date: str  # YYYY-MM-DD

# GET /builders/search
@router.get("/search")
async def search_builders(
    location: Optional[str] = None,
    specialization: Optional[str] = None,
    min_budget: Optional[int] = None,
    max_budget: Optional[int] = None,
    min_rating: Optional[float] = None,
    page: int = 1,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    query = select(BuilderProfile).join(User).options(selectinload(BuilderProfile.user))
    filters = []

    if location:
        # SQLite / Postgres compatible JSON array match using text LIKE
        filters.append(BuilderProfile.service_areas.like(f'%"{location}"%'))
    
    if specialization:
        filters.append(func.lower(BuilderProfile.specialization) == specialization.lower())
        
    if min_budget is not None:
        filters.append(BuilderProfile.budget_min >= min_budget)
        
    if max_budget is not None:
        filters.append(BuilderProfile.budget_max <= max_budget)
        
    if min_rating is not None:
        filters.append(BuilderProfile.avg_rating >= min_rating)

    if filters:
        query = query.where(and_(*filters))

    # Pagination offset
    offset_val = (page - 1) * limit
    
    # Execute query
    result = await db.execute(query.offset(offset_val).limit(limit))
    profiles = result.scalars().all()

    # Get total count for metadata
    count_query = select(func.count(BuilderProfile.user_id))
    if filters:
        count_query = count_query.where(and_(*filters))
    count_result = await db.execute(count_query)
    total_count = count_result.scalar() or 0

    data = []
    for p in profiles:
        data.append({
            "user_id": p.user_id,
            "business_name": p.business_name,
            "specialization": p.specialization,
            "years_experience": p.years_experience,
            "service_areas": p.service_areas,
            "budget_min": p.budget_min,
            "budget_max": p.budget_max,
            "budget_min_formatted": format_inr(p.budget_min),
            "budget_max_formatted": format_inr(p.budget_max),
            "bio": p.bio,
            "is_verified": p.is_verified,
            "avg_rating": p.avg_rating,
            "name": p.user.name,
            "email": p.user.email,
            "phone": p.user.phone
        })

    return {
        "builders": data,
        "page": page,
        "limit": limit,
        "total": total_count,
        "pages": (total_count + limit - 1) // limit
    }

# GET /builders/{id}
@router.get("/{id}", response_model=BuilderDetailResponse)
async def get_builder_detail(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BuilderProfile)
        .where(BuilderProfile.user_id == id)
        .options(
            selectinload(BuilderProfile.user),
            selectinload(BuilderProfile.portfolio_items)
        )
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Builder profile not found")

    # Fetch reviews
    reviews_result = await db.execute(
        select(Review)
        .where(Review.builder_id == id)
        .options(selectinload(Review.customer))
    )
    reviews = reviews_result.scalars().all()
    reviews_list = [
        {
            "id": r.id,
            "project_id": r.project_id,
            "customer_name": r.customer.name,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at
        } for r in reviews
    ]

    portfolio_list = [
        {
            "id": item.id,
            "image_url": item.image_url,
            "title": item.title,
            "description": item.description,
            "project_date": item.project_date.isoformat()
        } for item in profile.portfolio_items
    ]

    return {
        "user_id": profile.user_id,
        "business_name": profile.business_name,
        "specialization": profile.specialization,
        "years_experience": profile.years_experience,
        "service_areas": profile.service_areas,
        "budget_min": profile.budget_min,
        "budget_max": profile.budget_max,
        "bio": profile.bio,
        "is_verified": profile.is_verified,
        "verification_notes": profile.verification_notes,
        "avg_rating": profile.avg_rating,
        "name": profile.user.name,
        "email": profile.user.email,
        "phone": profile.user.phone,
        "portfolio": portfolio_list,
        "reviews": reviews_list
    }

# PUT /builders/me
@router.put("/me", response_model=BuilderDetailResponse)
async def update_my_profile(
    data: ProfileUpdate,
    current_user: User = Depends(require_role(["builder"])),
    db: AsyncSession = Depends(get_db)
):
    # Fetch builder profile
    result = await db.execute(
        select(BuilderProfile)
        .where(BuilderProfile.user_id == current_user.id)
        .options(
            selectinload(BuilderProfile.user),
            selectinload(BuilderProfile.portfolio_items)
        )
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Builder profile not initialized")

    # Update User fields (Name and Phone)
    current_user.name = data.name
    current_user.phone = data.phone

    # Update Profile fields
    profile.business_name = data.business_name
    profile.specialization = data.specialization
    profile.years_experience = data.years_experience
    profile.service_areas = data.service_areas
    profile.budget_min = data.budget_min
    profile.budget_max = data.budget_max
    profile.bio = data.bio

    await db.commit()
    await db.refresh(profile)

    # Mock empty arrays for response since we just updated
    return {
        "user_id": profile.user_id,
        "business_name": profile.business_name,
        "specialization": profile.specialization,
        "years_experience": profile.years_experience,
        "service_areas": profile.service_areas,
        "budget_min": profile.budget_min,
        "budget_max": profile.budget_max,
        "bio": profile.bio,
        "is_verified": profile.is_verified,
        "verification_notes": profile.verification_notes,
        "avg_rating": profile.avg_rating,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "portfolio": [
            {
                "id": item.id,
                "image_url": item.image_url,
                "title": item.title,
                "description": item.description,
                "project_date": item.project_date.isoformat()
            } for item in profile.portfolio_items
        ],
        "reviews": []  # we can fetch reviews if needed but empty for now
    }

# POST /builders/portfolio/upload
@router.post("/portfolio/upload")
async def upload_portfolio_image(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["builder"])),
    db: AsyncSession = Depends(get_db)
):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
        raise HTTPException(status_code=400, detail="Invalid image extension. Only jpg, jpeg, png, webp, and gif allowed.")

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    try:
        with open(filepath, "wb") as buffer:
            buffer.write(await file.read())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Return the relative URL path
    return {"url": f"/uploads/{filename}"}

# POST /builders/portfolio/item
@router.post("/portfolio/item", response_model=PortfolioItemSchema)
async def create_portfolio_item(
    item_data: PortfolioCreate,
    current_user: User = Depends(require_role(["builder"])),
    db: AsyncSession = Depends(get_db)
):
    from datetime import datetime
    try:
        proj_date = datetime.strptime(item_data.project_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD")

    new_item = PortfolioItem(
        builder_id=current_user.id,
        image_url=item_data.image_url,
        title=item_data.title,
        description=item_data.description,
        project_date=proj_date
    )
    db.add(new_item)
    await db.commit()
    await db.refresh(new_item)
    
    return {
        "id": new_item.id,
        "image_url": new_item.image_url,
        "title": new_item.title,
        "description": new_item.description,
        "project_date": new_item.project_date.isoformat()
    }

# POST /builders/{id}/verify — requires admin
@router.post("/{id}/verify")
async def toggle_verify(
    id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(BuilderProfile).where(BuilderProfile.user_id == id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Builder profile not found")

    profile.is_verified = not profile.is_verified
    profile.verification_notes = f"Verified by Admin ({current_user.email}) on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}" if profile.is_verified else None
    
    await db.commit()
    await db.refresh(profile)
    
    return {
        "user_id": profile.user_id,
        "is_verified": profile.is_verified,
        "verification_notes": profile.verification_notes
    }
