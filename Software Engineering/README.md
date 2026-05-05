# DragRace.io

A web-based quarter-mile drag-race simulator for car and motorcycle enthusiasts.

**CP-317-D Software Engineering — Group 19 — Winter 2026**

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm 9+

### Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # macOS/Linux
# .venv\Scripts\activate     # Windows
pip install -r requirements.txt
python seed.py               # Populate 149 vehicles
uvicorn main:app --reload --port 8000
```

### Frontend Setup (new terminal)
```bash
cd frontend
npm install
npm run dev
```

### Open the App
Navigate to **http://localhost:5173** in your browser.  
No login required — the app works immediately.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Three.js |
| Backend | FastAPI, SQLAlchemy, SQLite |
| Testing | pytest (39 tests), Playwright (demo automation) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vehicles` | Paginated vehicle list with search & filters |
| GET | `/vehicles/{id}` | Single vehicle detail |
| GET | `/leaderboard` | Vehicles ranked by ¼-mile time |
| POST | `/race/predict` | Compare two vehicles, persist to history |
| GET | `/history` | Past race results |

API docs available at http://localhost:8000/docs (Swagger) or http://localhost:8000/redoc.

## Running Tests
```bash
cd backend
python -m pytest test_main.py tests/test_integration.py -v
```

## Team

| Name | Role |
|------|------|
| Nadeem Hassan | Product Owner |
| Nadeeem Hassan | Scrum Master |
| Omeed Attayi | Backend Developer |
| Elias Zubaidi | Backend Developer |
| Qasim Naeemuddin | Frontend Developer |
| Awale Hussein | Frontend Developer & QA Lead |
