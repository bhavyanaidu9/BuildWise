# BuildConnect

BuildConnect is a premium construction marketplace connecting customers with verified builders in Hyderabad, India. The application consists of a FastAPI backend and a React + Vite frontend styled with custom CSS variables matching the core design tokens system.

---

## Repository Structure

```text
build/
├── backend/
│   ├── app/
│   │   ├── app/main.py         # FastAPI Entry Point
│   │   ├── app/models.py       # SQLAlchemy 2.0 Models
│   │   ├── app/database.py     # Async Database Session
│   │   ├── app/config.py       # Configuration loader
│   │   └── app/utils/currency.py # INR Currency formatting
│   ├── migrations/             # Alembic database migrations
│   ├── scripts/
│   │   └── seed.py             # Seed script for initial setup
│   ├── requirements.txt        # Backend dependencies
│   └── .env                    # Local environment config
├── frontend/
│   ├── src/
│   │   ├── context/AuthContext.jsx # React Context for authentication
│   │   ├── App.jsx             # Main interactive dashboard
│   │   ├── main.jsx            # Entry mount point
│   │   └── index.css           # Global resets and CSS design system
│   ├── package.json            # Node dependencies
│   └── vite.config.js          # Vite configurations
└── README.md                   # This instruction file
```

---

## Backend Local Setup (SQLite Dev Setup)

The backend uses **FastAPI**, **SQLAlchemy (async)**, and **aiosqlite** for local development. Models are written using generic types so that they can be deployed to PostgreSQL without changing any codebase logic.

### 1. Prerequisite
Ensure Python 3.10+ is installed on your local machine.

### 2. Environment Configuration
Create a `.env` file in the `/backend` directory (automatically created during scaffolding):
```env
DATABASE_URL=sqlite+aiosqlite:///./buildconnect.db
SECRET_KEY=supersecretkey123forlocaldevonlychangeinproduction
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
FRONTEND_URL=http://localhost:5173
```

### 3. Install Dependencies
Run the following in the `/backend` folder:
```bash
pip install -r requirements.txt
```

### 4. Database Setup & Seeding
Generate tables and seed mock data:
```bash
# Run database seeding script (which builds tables dynamically)
python scripts/seed.py
```
This seeds:
- `1 admin` (`admin@buildconnect.com` / `password123`)
- `2 customers` (Sneha Reddy, Arjun Rao)
- `5 builders` (Rajesh Kumar, Priyesh Patel, Vikram Naidu, Sai Teja, Ananya Rao) with budget ranges, service areas, and ratings.
- `3 projects` (Completed, In Progress, Open) with related quotes, milestones, payments, review, and message threads.

### 5. Run the Server
Run the FastAPI development server:
```bash
uvicorn app.main:app --reload
```
The server will boot at `http://localhost:8000`. You can visit `http://localhost:8000/docs` to view the interactive OpenAPI/Swagger documentation.

---

## Frontend Local Setup

The frontend is built with **React**, **Vite**, and **Lucide Icons** styled via a strict custom CSS design system using native variables.

### 1. Install Dependencies
From the `/frontend` directory:
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
The application will boot at `http://localhost:5173`. Open it in your browser. It automatically fetches backend connectivity status from `/api/health` and lists the seeded database contents.

### 3. Build for Production
To verify compilation and create production bundles:
```bash
npm run build
```
