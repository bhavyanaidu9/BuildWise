from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field

from app.database import get_db
from app.models import User, Project, Quote, Review, BuilderProfile
from app.routers.auth import get_current_user, require_role

router = APIRouter(prefix="/reviews", tags=["Reviews"])

class ReviewCreate(BaseModel):
    project_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=5)

@router.post("", status_code=201)
async def create_review(
    data: ReviewCreate,
    current_user: User = Depends(require_role(["customer"])),
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch project and verify ownership
    proj_res = await db.execute(select(Project).where(Project.id == data.project_id))
    project = proj_res.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to review this project")

    # 2. Verify project status is 'completed'
    if project.status != "completed":
        raise HTTPException(
            status_code=400, 
            detail=f"Reviews can only be submitted for completed projects. Current status: {project.status}"
        )

    # 3. Verify no existing review
    existing_res = await db.execute(
        select(Review).where(Review.project_id == data.project_id)
    )
    existing_review = existing_res.scalars().first()
    if existing_review:
        raise HTTPException(status_code=400, detail="A review has already been submitted for this project")

    # 4. Find hired builder for this project
    quote_res = await db.execute(
        select(Quote).where(Quote.project_id == data.project_id, Quote.status == "accepted")
    )
    quote = quote_res.scalars().first()
    if not quote:
        raise HTTPException(
            status_code=400, 
            detail="Could not resolve the hired builder for this project"
        )

    builder_id = quote.builder_id

    # 5. Create Review
    new_review = Review(
        project_id=data.project_id,
        customer_id=current_user.id,
        builder_id=builder_id,
        rating=data.rating,
        comment=data.comment
    )
    db.add(new_review)
    await db.flush() # get review ID

    # 6. Recalculate builder's profile average rating
    all_reviews_res = await db.execute(
        select(Review).where(Review.builder_id == builder_id)
    )
    all_reviews = all_reviews_res.scalars().all()
    
    total_rating = sum(r.rating for r in all_reviews)
    count = len(all_reviews)
    new_avg = round(total_rating / count, 1) if count > 0 else 0.0

    profile_res = await db.execute(
        select(BuilderProfile).where(BuilderProfile.user_id == builder_id)
    )
    profile = profile_res.scalars().first()
    if profile:
        profile.avg_rating = new_avg
        # If schema doesn't have num_reviews, check models.py
        # BuilderProfile model attributes in models.py:
        # avg_rating: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
        # (It doesn't have num_reviews in models.py, let's verify by checking models.py if needed, or we just update avg_rating).
        # Let's keep it safe and just update avg_rating.

    await db.commit()
    await db.refresh(new_review)

    return {
        "id": new_review.id,
        "project_id": new_review.project_id,
        "customer_id": new_review.customer_id,
        "builder_id": new_review.builder_id,
        "rating": new_review.rating,
        "comment": new_review.comment,
        "created_at": new_review.created_at.isoformat()
    }
