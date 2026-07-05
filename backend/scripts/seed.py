import os
import sys
import asyncio
from datetime import datetime, date, timedelta
import bcrypt

# Add backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, async_session_maker, Base
from app.models import User, BuilderProfile, PortfolioItem, Project, Quote, ProjectMilestone, ProjectDocument, Message, Payment, Review

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


async def seed_data():
    print("Connecting to the database to seed data...")
    
    # Drop and recreate tables to ensure a clean state
    async with engine.begin() as conn:
        print("Dropping all existing tables...")
        await conn.run_sync(Base.metadata.drop_all)
        print("Creating all tables from metadata...")
        await conn.run_sync(Base.metadata.create_all)
        
    async with async_session_maker() as session:
        print("Inserting records...")
        
        # 1. Admin User
        admin = User(
            email="admin@buildconnect.com",
            password_hash=hash_password("password123"),
            role="admin",
            name="Admin User",
            phone="9999999999",
            created_at=datetime.utcnow() - timedelta(days=30)
        )
        session.add(admin)
        
        # 2. Customers
        customer_1 = User(
            email="sneha@example.com",
            password_hash=hash_password("password123"),
            role="customer",
            name="Sneha Reddy",
            phone="9876543210",
            created_at=datetime.utcnow() - timedelta(days=25)
        )
        customer_2 = User(
            email="arjun@example.com",
            password_hash=hash_password("password123"),
            role="customer",
            name="Arjun Rao",
            phone="9876543211",
            created_at=datetime.utcnow() - timedelta(days=20)
        )
        session.add_all([customer_1, customer_2])
        
        # Flush to get user IDs
        await session.flush()
        
        # 3. Builders
        # Builder 1: Rajesh Kumar
        user_b1 = User(
            email="rajesh@rajeshconstructions.com",
            password_hash=hash_password("password123"),
            role="builder",
            name="Rajesh Kumar",
            phone="9000000001",
            created_at=datetime.utcnow() - timedelta(days=20)
        )
        # Builder 2: Priyesh Patel
        user_b2 = User(
            email="priyesh@patelbuilders.com",
            password_hash=hash_password("password123"),
            role="builder",
            name="Priyesh Patel",
            phone="9000000002",
            created_at=datetime.utcnow() - timedelta(days=18)
        )
        # Builder 3: Vikram Naidu
        user_b3 = User(
            email="vikram@naidurenovations.com",
            password_hash=hash_password("password123"),
            role="builder",
            name="Vikram Naidu",
            phone="9000000003",
            created_at=datetime.utcnow() - timedelta(days=15)
        )
        # Builder 4: Sai Teja
        user_b4 = User(
            email="teja@tejainfra.com",
            password_hash=hash_password("password123"),
            role="builder",
            name="Sai Teja",
            phone="9000000004",
            created_at=datetime.utcnow() - timedelta(days=12)
        )
        # Builder 5: Ananya Rao
        user_b5 = User(
            email="ananya@ananyadesigns.com",
            password_hash=hash_password("password123"),
            role="builder",
            name="Ananya Rao",
            phone="9000000005",
            created_at=datetime.utcnow() - timedelta(days=10)
        )
        
        session.add_all([user_b1, user_b2, user_b3, user_b4, user_b5])
        await session.flush()
        
        profile_b1 = BuilderProfile(
            user_id=user_b1.id,
            business_name="Rajesh Constructions",
            specialization="residential",
            years_experience=10,
            service_areas=["Hyderabad", "Kukatpally", "Gachibowli"],
            budget_min=400000,
            budget_max=5000000,
            bio="Award-winning residential builder specializing in high-quality independent houses and villas.",
            is_verified=True,
            verification_notes="Verified via business license and local office visit.",
            avg_rating=4.8,
            created_at=datetime.utcnow() - timedelta(days=20)
        )
        
        profile_b2 = BuilderProfile(
            user_id=user_b2.id,
            business_name="Patel & Sons Commercial",
            specialization="commercial",
            years_experience=15,
            service_areas=["Hyderabad", "Madhapur", "Kondapur", "Gachibowli"],
            budget_min=1500000,
            budget_max=9500000,
            bio="Leading builder for corporate offices, retail spaces, and commercial showrooms.",
            is_verified=True,
            verification_notes="Verified via corporate registration documents.",
            avg_rating=4.7,
            created_at=datetime.utcnow() - timedelta(days=18)
        )
        
        profile_b3 = BuilderProfile(
            user_id=user_b3.id,
            business_name="Naidu Renovations",
            specialization="renovation",
            years_experience=8,
            service_areas=["Secunderabad", "Miyapur", "Kukatpally"],
            budget_min=100000,
            budget_max=2500000,
            bio="Specialists in home extension, bathroom, and kitchen renovations.",
            is_verified=True,
            verification_notes="ID and contractor license verified.",
            avg_rating=4.5,
            created_at=datetime.utcnow() - timedelta(days=15)
        )
        
        profile_b4 = BuilderProfile(
            user_id=user_b4.id,
            business_name="Teja Infra Projects",
            specialization="residential",
            years_experience=5,
            service_areas=["Hyderabad", "Miyapur", "Secunderabad"],
            budget_min=500000,
            budget_max=3000000,
            bio="Affordable and reliable structural and brickwork builders.",
            is_verified=False,
            verification_notes=None,
            avg_rating=0.0,
            created_at=datetime.utcnow() - timedelta(days=12)
        )
        
        profile_b5 = BuilderProfile(
            user_id=user_b5.id,
            business_name="Ananya Designs & Build",
            specialization="renovation",
            years_experience=12,
            service_areas=["Hyderabad", "Kondapur", "Madhapur", "Vijayawada", "Bengaluru"],
            budget_min=300000,
            budget_max=4000000,
            bio="Architect-led renovation agency with a focus on modern interior redesigns.",
            is_verified=True,
            verification_notes="Architect registration and GST verified.",
            avg_rating=4.9,
            created_at=datetime.utcnow() - timedelta(days=10)
        )
        
        session.add_all([profile_b1, profile_b2, profile_b3, profile_b4, profile_b5])
        await session.flush()
        
        # Portfolio Items
        portfolio_item_1 = PortfolioItem(
            builder_id=profile_b1.user_id,
            image_url="https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
            title="Luxury Villa in Gachibowli",
            description="Completed structure and finishing of a 4500 sq ft luxury villa.",
            project_date=date(2025, 6, 15)
        )
        portfolio_item_2 = PortfolioItem(
            builder_id=profile_b2.user_id,
            image_url="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab",
            title="Tech Office Showroom",
            description="Modern commercial retail showroom building in HITEC City.",
            project_date=date(2025, 10, 20)
        )
        session.add_all([portfolio_item_1, portfolio_item_2])
        
        # 4. Sample Projects
        # Project 1: Completed. Customer: Sneha Reddy. Builder: Rajesh Kumar.
        project_1 = Project(
            customer_id=customer_1.id,
            title="Luxury 3BHK Villa Construction",
            description="Complete construction of an independent 3BHK villa from foundation to keys handover.",
            project_type="residential",
            location="Gachibowli",
            budget_min=4500000,
            budget_max=5500000,
            desired_timeline="12 months",
            status="completed",
            created_at=datetime.utcnow() - timedelta(days=200)
        )
        
        # Project 2: In Progress. Customer: Arjun Rao. Builder: Priyesh Patel.
        project_2 = Project(
            customer_id=customer_2.id,
            title="Office Showroom Interior Renovation",
            description="Complete layout restructuring, electrical overhaul, and design finishing for commercial retail space.",
            project_type="commercial",
            location="Madhapur",
            budget_min=2000000,
            budget_max=3000000,
            desired_timeline="3 months",
            status="in_progress",
            created_at=datetime.utcnow() - timedelta(days=60)
        )
        
        # Project 3: Open. Customer: Sneha Reddy. No builder hired yet.
        project_3 = Project(
            customer_id=customer_1.id,
            title="Modern Kitchen Renovation",
            description="Upgrading kitchen to a modern modular kitchen layout with a quartz countertop, premium fittings, and storage cabinetry.",
            project_type="renovation",
            location="Kukatpally",
            budget_min=300000,
            budget_max=500000,
            desired_timeline="1 month",
            status="open",
            created_at=datetime.utcnow() - timedelta(days=5)
        )
        
        session.add_all([project_1, project_2, project_3])
        await session.flush()
        
        # 5. Quotes
        # Quote for Project 1 (Accepted)
        quote_p1 = Quote(
            project_id=project_1.id,
            builder_id=profile_b1.user_id,
            cost=4800000,
            timeline_estimate="11 months",
            materials_notes="Grade A bricks, premium teak wood, top-tier sanitary fittings, and standard modular electrical systems.",
            warranty_period="5 years structural warranty",
            status="accepted",
            source="marketplace",
            submitted_at=datetime.utcnow() - timedelta(days=195)
        )
        
        # Quote for Project 2 (Accepted)
        quote_p2 = Quote(
            project_id=project_2.id,
            builder_id=profile_b2.user_id,
            cost=2200000,
            timeline_estimate="3 months",
            materials_notes="Acoustic partitioning, tempered glass doors, automated LED lighting, and commercial-grade vinyl flooring.",
            warranty_period="2 years workmanship warranty",
            status="accepted",
            source="invited",
            submitted_at=datetime.utcnow() - timedelta(days=55)
        )
        
        # Quotes for Project 3 (Pending quotes)
        quote_p3_b3 = Quote(
            project_id=project_3.id,
            builder_id=profile_b3.user_id,
            cost=380000,
            timeline_estimate="25 days",
            materials_notes="High-quality MDF wood cabinetry, local black granite countertop, Hettich hinges.",
            warranty_period="3 years cabinet warranty",
            status="pending",
            source="marketplace",
            submitted_at=datetime.utcnow() - timedelta(days=4)
        )
        
        quote_p3_b5 = Quote(
            project_id=project_3.id,
            builder_id=profile_b5.user_id,
            cost=420000,
            timeline_estimate="20 days",
            materials_notes="Premium Marine plywood cabinetry, white quartz countertop, Hafele soft-close sliders.",
            warranty_period="5 years warranty",
            status="pending",
            source="invited",
            submitted_at=datetime.utcnow() - timedelta(days=3)
        )
        
        session.add_all([quote_p1, quote_p2, quote_p3_b3, quote_p3_b5])
        await session.flush()
        
        # 6. Project Milestones
        # Project 1 Milestones (All completed)
        m1_p1 = ProjectMilestone(
            project_id=project_1.id,
            title="Foundation & Structure",
            description="Excavation, foundation laying, and building concrete pillars/roof structure.",
            status="done",
            due_date=date.today() - timedelta(days=60),
            completed_at=datetime.utcnow() - timedelta(days=62)
        )
        m2_p1 = ProjectMilestone(
            project_id=project_1.id,
            title="Finishing & Interior",
            description="Plastering, electrical wiring, tile installation, painting, and fitting fixtures.",
            status="done",
            due_date=date.today() - timedelta(days=15),
            completed_at=datetime.utcnow() - timedelta(days=15)
        )
        
        # Project 2 Milestones (In progress)
        m1_p2 = ProjectMilestone(
            project_id=project_2.id,
            title="Demolition & Wiring",
            description="Clearing old shop fittings and laying down new conduits for electrical lines.",
            status="done",
            due_date=date.today() - timedelta(days=30),
            completed_at=datetime.utcnow() - timedelta(days=28)
        )
        m2_p2 = ProjectMilestone(
            project_id=project_2.id,
            title="Woodwork & Glass Installation",
            description="Erecting structural partition panels and fitting commercial showroom glass panes.",
            status="in_progress",
            due_date=date.today() + timedelta(days=30),
            completed_at=None
        )
        
        session.add_all([m1_p1, m2_p1, m1_p2, m2_p2])
        await session.flush()
        
        # 7. Payments
        # Payments for Project 1 (Fully Paid)
        pay_p1_1 = Payment(
            project_id=project_1.id,
            milestone_id=m1_p1.id,
            amount=2400000,
            status="paid",
            paid_at=datetime.utcnow() - timedelta(days=62)
        )
        pay_p1_2 = Payment(
            project_id=project_1.id,
            milestone_id=m2_p1.id,
            amount=2400000,
            status="paid",
            paid_at=datetime.utcnow() - timedelta(days=15)
        )
        
        # Payments for Project 2 (Partial)
        pay_p2_1 = Payment(
            project_id=project_2.id,
            milestone_id=m1_p2.id,
            amount=1000000,
            status="paid",
            paid_at=datetime.utcnow() - timedelta(days=28)
        )
        pay_p2_2 = Payment(
            project_id=project_2.id,
            milestone_id=m2_p2.id,
            amount=1200000,
            status="pending",
            paid_at=None
        )
        
        session.add_all([pay_p1_1, pay_p1_2, pay_p2_1, pay_p2_2])
        
        # 8. Message Thread
        msg_1 = Message(
            project_id=project_2.id,
            sender_id=customer_2.id,
            content="Hi Priyesh, how is the woodwork milestone progressing?",
            sent_at=datetime.utcnow() - timedelta(days=2)
        )
        msg_2 = Message(
            project_id=project_2.id,
            sender_id=user_b2.id,
            content="Hi Arjun, the materials have arrived. We are on track to complete by next week.",
            sent_at=datetime.utcnow() - timedelta(days=2) + timedelta(hours=3)
        )
        session.add_all([msg_1, msg_2])
        
        # 9. Review
        review_p1 = Review(
            project_id=project_1.id,
            builder_id=profile_b1.user_id,
            customer_id=customer_1.id,
            rating=5,
            comment="Rajesh Constructions did an excellent job. High quality materials used and completed on time.",
            created_at=datetime.utcnow() - timedelta(days=14)
        )
        session.add(review_p1)
        
        # 10. Documents
        doc_1 = ProjectDocument(
            project_id=project_2.id,
            uploaded_by=customer_2.id,
            file_url="https://storage.googleapis.com/buildconnect-docs/showroom_blueprint.pdf",
            file_name="showroom_blueprint.pdf",
            doc_type="Blueprint",
            uploaded_at=datetime.utcnow() - timedelta(days=59)
        )
        session.add(doc_1)
        
        await session.commit()
        print("Database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
