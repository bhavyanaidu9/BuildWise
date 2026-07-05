from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Dict, Any
import os

from app.config import settings
from app.database import get_db, engine
from app.models import User, BuilderProfile, Project, Quote
from app.utils.currency import format_inr
from app.routers.auth import router as auth_router
from app.routers.builders import router as builders_router
from app.routers.projects import router as projects_router
from app.routers.tracking import router as tracking_router
from app.routers.reviews import router as reviews_router

# Import Base so all models are registered before create_all
from app.database import Base
import app.models  # noqa — ensures all model classes are registered

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create all tables on startup (safe: won't drop existing data)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title="BuildConnect API",
    description="Construction marketplace connecting customers with verified builders in Hyderabad, India",
    version="1.0.0",
    lifespan=lifespan
)


# Ensure uploads directory exists and mount it as StaticFiles
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Register routers
app.include_router(auth_router, prefix="/api")
app.include_router(builders_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(tracking_router, prefix="/api")
app.include_router(reviews_router, prefix="/api")






# CORS setup — FRONTEND_URL may be comma-separated list of allowed origins
# e.g. "https://buildconnect.vercel.app,http://localhost:5173"
_raw_origins = settings.FRONTEND_URL.split(",")
origins = list({o.strip() for o in _raw_origins if o.strip()})
# Always allow local dev
origins += ["http://localhost:5173", "http://127.0.0.1:5173"]
origins = list(set(origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root_index():
    return {
        "app": "BuildConnect Construction Marketplace API",
        "health": "/api/health",
        "documentation": "/docs",
        "status": "online"
    }

@app.get("/api/health")
async def health_check(db: AsyncSession = Depends(get_db)):

    db_status = "healthy"
    try:
        # Perform a simple query to verify database connection
        await db.execute(select(1))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    return {
        "status": "online",
        "database": db_status,
        "message": "BuildConnect API is running smoothly."
    }

@app.get("/api/users", response_model=List[Dict[str, Any]])
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "role": u.role,
            "phone": u.phone,
            "created_at": u.created_at
        } for u in users
    ]

@app.get("/api/builders", response_model=List[Dict[str, Any]])
async def list_builders(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BuilderProfile).options(selectinload(BuilderProfile.user)))
    profiles = result.scalars().all()

    
    data = []
    for p in profiles:
        data.append({
            "user_id": p.user_id,
            "business_name": p.business_name,
            "specialization": p.specialization,
            "years_experience": p.years_experience,
            "service_areas": p.service_areas,
            "budget_min": p.budget_min,  # raw int rupee amount
            "budget_max": p.budget_max,  # raw int rupee amount
            # Add formatted string in response for verification, keeping the raw values as numbers
            "budget_min_formatted": format_inr(p.budget_min),
            "budget_max_formatted": format_inr(p.budget_max),
            "bio": p.bio,
            "is_verified": p.is_verified,
            "avg_rating": p.avg_rating,
            "name": p.user.name,
            "email": p.user.email,
            "phone": p.user.phone
        })
    return data

@app.get("/api/projects", response_model=List[Dict[str, Any]])
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project))
    projects = result.scalars().all()
    return [
        {
            "id": p.id,
            "customer_id": p.customer_id,
            "title": p.title,
            "description": p.description,
            "project_type": p.project_type,
            "location": p.location,
            "budget_min": p.budget_min,
            "budget_max": p.budget_max,
            "budget_min_formatted": format_inr(p.budget_min),
            "budget_max_formatted": format_inr(p.budget_max),
            "desired_timeline": p.desired_timeline,
            "status": p.status,
            "created_at": p.created_at
        } for p in projects
    ]
