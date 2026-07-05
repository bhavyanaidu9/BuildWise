from datetime import datetime, date
from typing import List, Optional
from sqlalchemy import String, Integer, Float, Boolean, ForeignKey, JSON, Text, Date, DateTime, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)  # customer, builder, admin
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    builder_profile: Mapped[Optional["BuilderProfile"]] = relationship(
        "BuilderProfile", back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    customer_projects: Mapped[List["Project"]] = relationship(
        "Project", back_populates="customer", foreign_keys="[Project.customer_id]"
    )
    uploaded_documents: Mapped[List["ProjectDocument"]] = relationship(
        "ProjectDocument", back_populates="uploader"
    )
    sent_messages: Mapped[List["Message"]] = relationship(
        "Message", back_populates="sender"
    )
    customer_reviews: Mapped[List["Review"]] = relationship(
        "Review", back_populates="customer", foreign_keys="[Review.customer_id]"
    )


class BuilderProfile(Base):
    __tablename__ = "builder_profiles"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    specialization: Mapped[str] = mapped_column(String(100), nullable=False)  # residential, commercial, renovation
    years_experience: Mapped[int] = mapped_column(Integer, nullable=False)
    service_areas: Mapped[list] = mapped_column(JSON, nullable=False)  # JSON array of city strings
    budget_min: Mapped[int] = mapped_column(Integer, nullable=False)  # stored in whole rupees
    budget_max: Mapped[int] = mapped_column(Integer, nullable=False)  # stored in whole rupees
    bio: Mapped[str] = mapped_column(Text, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verification_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    avg_rating: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="builder_profile")
    portfolio_items: Mapped[List["PortfolioItem"]] = relationship(
        "PortfolioItem", back_populates="builder", cascade="all, delete-orphan"
    )
    quotes: Mapped[List["Quote"]] = relationship(
        "Quote", back_populates="builder"
    )
    reviews: Mapped[List["Review"]] = relationship(
        "Review", back_populates="builder", foreign_keys="[Review.builder_id]"
    )


class PortfolioItem(Base):
    __tablename__ = "portfolio_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    builder_id: Mapped[int] = mapped_column(ForeignKey("builder_profiles.user_id"), nullable=False)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    project_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Relationships
    builder: Mapped["BuilderProfile"] = relationship("BuilderProfile", back_populates="portfolio_items")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    project_type: Mapped[str] = mapped_column(String(100), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    budget_min: Mapped[int] = mapped_column(Integer, nullable=False)  # stored in whole rupees
    budget_max: Mapped[int] = mapped_column(Integer, nullable=False)  # stored in whole rupees
    desired_timeline: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="open", nullable=False)  # open, quoted, hired, in_progress, completed, cancelled
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    customer: Mapped["User"] = relationship("User", back_populates="customer_projects", foreign_keys=[customer_id])
    quotes: Mapped[List["Quote"]] = relationship(
        "Quote", back_populates="project", cascade="all, delete-orphan"
    )
    milestones: Mapped[List["ProjectMilestone"]] = relationship(
        "ProjectMilestone", back_populates="project", cascade="all, delete-orphan"
    )
    documents: Mapped[List["ProjectDocument"]] = relationship(
        "ProjectDocument", back_populates="project", cascade="all, delete-orphan"
    )
    messages: Mapped[List["Message"]] = relationship(
        "Message", back_populates="project", cascade="all, delete-orphan"
    )
    payments: Mapped[List["Payment"]] = relationship(
        "Payment", back_populates="project", cascade="all, delete-orphan"
    )
    review: Mapped[Optional["Review"]] = relationship(
        "Review", back_populates="project", uselist=False, cascade="all, delete-orphan"
    )


class Quote(Base):
    __tablename__ = "quotes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    builder_id: Mapped[int] = mapped_column(ForeignKey("builder_profiles.user_id"), nullable=False)
    cost: Mapped[int] = mapped_column(Integer, nullable=False)  # stored in whole rupees
    timeline_estimate: Mapped[str] = mapped_column(String(100), nullable=False)
    materials_notes: Mapped[str] = mapped_column(Text, nullable=False)
    warranty_period: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)  # pending, accepted, rejected
    source: Mapped[str] = mapped_column(String(50), nullable=False)  # invited, marketplace
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="quotes")
    builder: Mapped["BuilderProfile"] = relationship("BuilderProfile", back_populates="quotes")


class ProjectMilestone(Base):
    __tablename__ = "project_milestones"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)  # pending, in_progress, done
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="milestones")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="milestone")


class ProjectDocument(Base):
    __tablename__ = "project_documents"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    uploaded_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    doc_type: Mapped[str] = mapped_column(String(100), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="documents")
    uploader: Mapped["User"] = relationship("User", back_populates="uploaded_documents")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="messages")
    sender: Mapped["User"] = relationship("User", back_populates="sent_messages")


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    milestone_id: Mapped[Optional[int]] = mapped_column(ForeignKey("project_milestones.id"), nullable=True)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)  # stored in whole rupees
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)  # pending, paid
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="payments")
    milestone: Mapped[Optional["ProjectMilestone"]] = relationship("ProjectMilestone", back_populates="payments")


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), unique=True, nullable=False)
    builder_id: Mapped[int] = mapped_column(ForeignKey("builder_profiles.user_id"), nullable=False)
    customer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # CHECK constraint 1-5
    comment: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # CHECK constraint for rating in range [1, 5]
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="check_rating_range"),
    )

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="review")
    builder: Mapped["BuilderProfile"] = relationship("BuilderProfile", back_populates="reviews", foreign_keys=[builder_id])
    customer: Mapped["User"] = relationship("User", back_populates="customer_reviews", foreign_keys=[customer_id])
