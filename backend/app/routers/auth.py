from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
import bcrypt
from pydantic import BaseModel, EmailStr

from app.config import settings
from app.database import get_db
from app.models import User, BuilderProfile

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# Schemas
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str
    role: str  # Must be 'customer' or 'builder'

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    phone: str
    created_at: datetime

    class Config:
        from_attributes = True

# Helper functions for password and JWT
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# Current user dependency
async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user

# Reusable role-check dependency builder
def require_role(allowed_roles: List[str]):
    async def dependency(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource"
            )
        return current_user
    return dependency

# Endpoints
@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(signup_data: SignupRequest, db: AsyncSession = Depends(get_db)):
    # 1. Validate role is only customer or builder (no admin)
    if signup_data.role not in ["customer", "builder"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be either 'customer' or 'builder'"
        )
    
    # 2. Check if user already exists
    result = await db.execute(select(User).where(User.email == signup_data.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )
    
    # 3. Create user
    new_user = User(
        email=signup_data.email,
        password_hash=hash_password(signup_data.password),
        name=signup_data.name,
        phone=signup_data.phone,
        role=signup_data.role,
        created_at=datetime.utcnow()
    )
    db.add(new_user)
    await db.flush() # flush to get user ID
    
    # 4. If builder, create a blank builder profile
    if signup_data.role == "builder":
        new_profile = BuilderProfile(
            user_id=new_user.id,
            business_name=f"{signup_data.name} Constructions",
            specialization="residential",
            years_experience=0,
            service_areas=["Hyderabad"],
            budget_min=100000,
            budget_max=1000000,
            bio="New builder profile. Please complete your profile details.",
            is_verified=False,
            verification_notes=None,
            avg_rating=0.0,
            created_at=datetime.utcnow()
        )
        db.add(new_profile)
        
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    # 1. Fetch user by email
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalars().first()
    
    # 2. Authenticate
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Create token
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
