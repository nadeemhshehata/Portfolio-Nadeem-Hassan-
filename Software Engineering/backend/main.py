from fastapi import FastAPI, Depends, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_
from cachetools import TTLCache
import threading

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from db import Base, engine, get_db
from models import Vehicle, RaceHistory
from schemas import VehicleOut, RaceRequest, RaceResult, HistoryOut

# ── Rate limiter ──
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="DragRace.io API", version="3.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- CORS (restricted to frontend origins – SEC-01) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:4173",   # Vite preview
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

Base.metadata.create_all(bind=engine)

# Global TTL Cache for vehicles endpoint
vehicles_cache = TTLCache(maxsize=128, ttl=60)
vehicles_cache_lock = threading.Lock()

# ──────────────────────────────────────
# API-01  GET /vehicles  (list + paging)
# ──────────────────────────────────────
@app.get("/vehicles", response_model=list[VehicleOut])
@limiter.limit("60/minute")
def list_vehicles(
    request: Request,
    response: Response,
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    q: str | None = None,
    type: str | None = None,
    make: str | None = None,
    model: str | None = None,
    year_min: int | None = Query(None, ge=1900, le=2030),
    year_max: int | None = Query(None, ge=1900, le=2030),
    db: Session = Depends(get_db),
):
    """Return vehicles with optional search, filter, and paging."""
    if q and len(q) > 100:
        q = q[:100]

    cache_key = f"vehicles:{limit}:{offset}:{q}:{type}:{make}:{model}:{year_min}:{year_max}"
    
    with vehicles_cache_lock:
        if cache_key in vehicles_cache:
            response.headers["X-Cache"] = "HIT"
            return vehicles_cache[cache_key]

    response.headers["X-Cache"] = "MISS"

    query = db.query(Vehicle)

    if q:
        like = f"%{q.lower()}%"
        query = query.filter(
            or_(
                Vehicle.make.ilike(like),
                Vehicle.model.ilike(like),
                Vehicle.trim.ilike(like),
            )
        )
    if type:
        query = query.filter(Vehicle.type == type)
    if make:
        query = query.filter(Vehicle.make == make)
    if model:
        query = query.filter(Vehicle.model == model)
    if year_min is not None:
        query = query.filter(Vehicle.year >= year_min)
    if year_max is not None:
        query = query.filter(Vehicle.year <= year_max)

    items = (
        query.order_by(Vehicle.make.asc(), Vehicle.model.asc(), Vehicle.year.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    # Serialize to Pydantic before caching to avoid DetachedInstanceError
    result = [VehicleOut.model_validate(item) if hasattr(VehicleOut, "model_validate") else VehicleOut.from_orm(item) for item in items]
    
    with vehicles_cache_lock:
        vehicles_cache[cache_key] = result
    
    return result


@app.get("/vehicles/{vehicle_id}", response_model=VehicleOut)
@limiter.limit("60/minute")
def get_vehicle(request: Request, vehicle_id: int, db: Session = Depends(get_db)):
    """Return a single vehicle by ID."""
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return v


# ──────────────────────────────────────
# LB-01  GET /leaderboard
# ──────────────────────────────────────
@app.get("/leaderboard", response_model=list[VehicleOut])
@limiter.limit("60/minute")
def get_leaderboard(
    request: Request,
    limit: int = Query(25, ge=1, le=100),
    type: str | None = None,
    db: Session = Depends(get_db),
):
    """Return vehicles ranked by quarter-mile time (fastest first)."""
    query = db.query(Vehicle)
    if type:
        query = query.filter(Vehicle.type == type)
    return query.order_by(Vehicle.quarter_mile_time_s.asc()).limit(limit).all()


# ──────────────────────────────────────
# RACE-01  POST /race/predict
# ──────────────────────────────────────
@app.post("/race/predict", response_model=RaceResult)
@limiter.limit("60/minute")
def predict_race(request: Request, req: RaceRequest, db: Session = Depends(get_db)):
    """Compare two vehicles by quarter-mile time. Returns winner + delta.
    Also saves the result to race history (HIST-01)."""
    a = db.query(Vehicle).filter(Vehicle.id == req.vehicle_a_id).first()
    b = db.query(Vehicle).filter(Vehicle.id == req.vehicle_b_id).first()
    if not a or not b:
        raise HTTPException(status_code=404, detail="Invalid vehicle id(s)")

    a_t = float(a.quarter_mile_time_s)
    b_t = float(b.quarter_mile_time_s)
    diff = round(abs(a_t - b_t), 3)

    if a_t < b_t:
        winner = "A"
    elif b_t < a_t:
        winner = "B"
    else:
        winner = "Tie"

    # HIST-01: persist race result to history table
    history = RaceHistory(
        vehicle_a_id=req.vehicle_a_id,
        vehicle_b_id=req.vehicle_b_id,
        winner=winner,
        vehicle_a_time_s=a_t,
        vehicle_b_time_s=b_t,
        diff_s=diff,
    )
    db.add(history)
    db.commit()

    return RaceResult(
        winner=winner,
        vehicle_a_time_s=a_t,
        vehicle_b_time_s=b_t,
        diff_s=diff,
    )


def _vehicle_label(v: Vehicle) -> str:
    """Build a human-readable label like '2023 Tesla Model S Plaid'."""
    label = f"{v.year} {v.make} {v.model}"
    if v.trim:
        label += f" {v.trim}"
    return label


# ──────────────────────────────────────
# HIST-01  GET /history
# ──────────────────────────────────────
@app.get("/history", response_model=list[HistoryOut])
@limiter.limit("60/minute")
def get_history(
    request: Request,
    limit: int = Query(25, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Return past race results, newest first, with human-readable vehicle labels."""
    rows = (
        db.query(RaceHistory)
        .order_by(RaceHistory.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    results = []
    for h in rows:
        va = db.query(Vehicle).filter(Vehicle.id == h.vehicle_a_id).first()
        vb = db.query(Vehicle).filter(Vehicle.id == h.vehicle_b_id).first()
        results.append(
            HistoryOut(
                id=h.id,
                vehicle_a_id=h.vehicle_a_id,
                vehicle_b_id=h.vehicle_b_id,
                vehicle_a_label=_vehicle_label(va) if va else f"Vehicle #{h.vehicle_a_id}",
                vehicle_b_label=_vehicle_label(vb) if vb else f"Vehicle #{h.vehicle_b_id}",
                winner=h.winner,
                vehicle_a_time_s=h.vehicle_a_time_s,
                vehicle_b_time_s=h.vehicle_b_time_s,
                diff_s=h.diff_s,
                created_at=h.created_at,
            )
        )
    return results
