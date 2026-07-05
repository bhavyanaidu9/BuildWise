from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

def get_database_url() -> str:
    url = settings.DATABASE_URL
    # Supabase / Render / Railway supply postgres:// or postgresql://
    # Convert to asyncpg driver format
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url

DATABASE_URL = get_database_url()

IS_SQLITE = DATABASE_URL.startswith("sqlite")
IS_REMOTE_PG = not IS_SQLITE and "localhost" not in DATABASE_URL

# Build connect_args and engine kwargs based on DB type
connect_args = {}
engine_kwargs = {"echo": False}

if IS_SQLITE:
    # SQLite: disable thread check, no pool config
    connect_args["check_same_thread"] = False

else:
    # PostgreSQL (Supabase, Render, Railway): enable SSL + connection pooling
    if IS_REMOTE_PG:
        connect_args["ssl"] = "require"
    engine_kwargs["pool_pre_ping"] = True   # auto-reconnect on dropped connections
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10

engine = create_async_engine(
    DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs
)

async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
