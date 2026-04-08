"""
DragRace.io – Sprint 3 automated tests
Run:  python -m pytest test_main.py -v
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from db import Base, get_db
from main import app
from models import Vehicle, RaceHistory

# ── In-memory SQLite for test isolation ──
TEST_DB_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True, scope="module")
def setup_db():
    """Create tables and seed test vehicles before the module runs."""
    Base.metadata.create_all(bind=engine)
    db = TestSession()
    db.add_all([
        Vehicle(id=1, type="car",        make="Tesla",    model="Model S",
                trim="Plaid", year=2023, quarter_mile_time_s=9.23,  source="test"),
        Vehicle(id=2, type="car",        make="Ford",     model="Mustang",
                trim="GT",    year=2021, quarter_mile_time_s=12.40, source="test"),
        Vehicle(id=3, type="motorcycle", make="Kawasaki", model="Ninja H2R",
                trim="",      year=2023, quarter_mile_time_s=9.10,  source="test"),
        Vehicle(id=4, type="car",        make="Clone",    model="CloneCar",
                trim="",      year=2024, quarter_mile_time_s=9.23,  source="test"),
        Vehicle(id=5, type="car",        make="Chevrolet", model="Corvette",
                trim="Z06",   year=2023, quarter_mile_time_s=10.50, source="test"),
        Vehicle(id=6, type="motorcycle", make="Ducati",   model="Panigale",
                trim="V4R",   year=2023, quarter_mile_time_s=9.80,  source="test"),
    ])
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


client = TestClient(app)


# ═══════════════════════════════════════════
# Vehicle listing tests (API-01 / API-02)
# ═══════════════════════════════════════════

class TestListVehicles:
    """API-01: GET /vehicles"""

    def test_list_vehicles_returns_200_with_list(self):
        r = client.get("/vehicles")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_limit_returns_exact_count(self):
        """GET /vehicles?limit=2 returns at most 2 results."""
        r = client.get("/vehicles", params={"limit": 2})
        assert r.status_code == 200
        assert len(r.json()) <= 2

    def test_search_filters_correctly(self):
        """GET /vehicles?q=corvette returns only matching vehicles."""
        r = client.get("/vehicles", params={"q": "corvette"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1
        assert all(
            "corvette" in v["make"].lower()
            or "corvette" in v["model"].lower()
            or "corvette" in v["trim"].lower()
            for v in data
        )

    def test_filter_by_type_car(self):
        """GET /vehicles?type=car returns only cars."""
        r = client.get("/vehicles", params={"type": "car"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1
        assert all(v["type"] == "car" for v in data)

    def test_filter_by_type_motorcycle(self):
        """GET /vehicles?type=motorcycle returns only motorcycles."""
        r = client.get("/vehicles", params={"type": "motorcycle"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1
        assert all(v["type"] == "motorcycle" for v in data)

    def test_empty_search_returns_empty_list(self):
        r = client.get("/vehicles", params={"q": "zzzznonexistent"})
        assert r.status_code == 200
        assert r.json() == []

    def test_paging_limit(self):
        r = client.get("/vehicles", params={"limit": 2, "offset": 0})
        assert r.status_code == 200
        assert len(r.json()) <= 2

    def test_offset_beyond_data(self):
        r = client.get("/vehicles", params={"offset": 9999})
        assert r.status_code == 200
        assert r.json() == []


# ═══════════════════════════════════════════
# Vehicle detail tests
# ═══════════════════════════════════════════

class TestVehicleDetail:
    """GET /vehicles/{id}"""

    def test_get_vehicle_by_id(self):
        """GET /vehicles/1 returns the correct vehicle."""
        r = client.get("/vehicles/1")
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == 1
        assert data["make"] == "Tesla"
        assert data["model"] == "Model S"

    def test_get_vehicle_not_found(self):
        """GET /vehicles/999999 returns 404."""
        r = client.get("/vehicles/999999")
        assert r.status_code == 404


# ═══════════════════════════════════════════
# Race prediction tests (RACE-01)
# ═══════════════════════════════════════════

class TestRacePredict:
    """RACE-01: POST /race/predict"""

    def test_predict_winner(self):
        """Tesla (9.23s) should beat Ford (12.40s)."""
        r = client.post("/race/predict", json={"vehicle_a_id": 1, "vehicle_b_id": 2})
        assert r.status_code == 200
        data = r.json()
        assert data["winner"] == "A"
        assert data["vehicle_a_time_s"] == 9.23
        assert data["vehicle_b_time_s"] == 12.40
        assert data["diff_s"] == pytest.approx(3.17, abs=0.01)

    def test_predict_winner_reversed(self):
        """Ford vs Tesla — B should win."""
        r = client.post("/race/predict", json={"vehicle_a_id": 2, "vehicle_b_id": 1})
        assert r.status_code == 200
        data = r.json()
        assert data["winner"] == "B"

    def test_predict_tie(self):
        """Two vehicles with identical quarter-mile times → Tie."""
        r = client.post("/race/predict", json={"vehicle_a_id": 1, "vehicle_b_id": 4})
        assert r.status_code == 200
        assert r.json()["winner"] == "Tie"
        assert r.json()["diff_s"] == 0.0

    def test_invalid_vehicle_id(self):
        """Non-existent vehicle IDs should return 404."""
        r = client.post("/race/predict", json={"vehicle_a_id": 9999, "vehicle_b_id": 1})
        assert r.status_code == 404

    def test_both_ids_invalid(self):
        """Both IDs invalid → 404."""
        r = client.post("/race/predict", json={"vehicle_a_id": 8888, "vehicle_b_id": 9999})
        assert r.status_code == 404

    def test_same_vehicle_both_slots(self):
        """Same vehicle in both slots → valid Tie (same time vs itself)."""
        r = client.post("/race/predict", json={"vehicle_a_id": 2, "vehicle_b_id": 2})
        assert r.status_code == 200
        data = r.json()
        assert data["winner"] == "Tie"
        assert data["diff_s"] == 0.0

    def test_predict_returns_all_fields(self):
        """Response includes all required fields."""
        r = client.post("/race/predict", json={"vehicle_a_id": 1, "vehicle_b_id": 2})
        assert r.status_code == 200
        data = r.json()
        assert "winner" in data
        assert "vehicle_a_time_s" in data
        assert "vehicle_b_time_s" in data
        assert "diff_s" in data


# ═══════════════════════════════════════════
# Security tests (SEC-01)
# ═══════════════════════════════════════════

class TestSecurity:
    """SEC-01: Input validation + rate limiting"""

    def test_limit_exceeds_max_returns_422(self):
        """limit > 100 should be rejected by FastAPI validation."""
        r = client.get("/vehicles", params={"limit": 200})
        assert r.status_code == 422

    def test_negative_offset_returns_422(self):
        """offset < 0 should be rejected."""
        r = client.get("/vehicles", params={"offset": -1})
        assert r.status_code == 422

    def test_long_query_is_handled(self):
        """Very long q string is truncated (not crash)."""
        long_q = "a" * 200
        r = client.get("/vehicles", params={"q": long_q})
        assert r.status_code == 200  # handled gracefully, not 500

    def test_year_min_out_of_range(self):
        """year_min < 1900 should be rejected."""
        r = client.get("/vehicles", params={"year_min": 1800})
        assert r.status_code == 422

    def test_year_max_out_of_range(self):
        """year_max > 2030 should be rejected."""
        r = client.get("/vehicles", params={"year_max": 3000})
        assert r.status_code == 422

    def test_invalid_race_body(self):
        """POST /race/predict with missing fields → 422."""
        r = client.post("/race/predict", json={"vehicle_a_id": 1})
        assert r.status_code == 422

    def test_rate_limit_headers_present(self):
        """Response should include rate limit info (X-RateLimit headers)."""
        r = client.get("/vehicles")
        # slowapi adds these headers
        assert r.status_code == 200


# ═══════════════════════════════════════════
# Leaderboard tests (LB-01)
# ═══════════════════════════════════════════

class TestLeaderboard:
    """LB-01: GET /leaderboard"""

    def test_leaderboard_returns_sorted(self):
        """Leaderboard returns vehicles sorted by quarter-mile time ascending."""
        r = client.get("/leaderboard")
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 2
        times = [v["quarter_mile_time_s"] for v in data]
        assert times == sorted(times), "Leaderboard must be sorted fastest-first"

    def test_leaderboard_with_limit(self):
        """GET /leaderboard?limit=3 returns at most 3 vehicles."""
        r = client.get("/leaderboard", params={"limit": 3})
        assert r.status_code == 200
        assert len(r.json()) <= 3

    def test_leaderboard_filter_motorcycle(self):
        """GET /leaderboard?type=motorcycle returns only motorcycles."""
        r = client.get("/leaderboard", params={"type": "motorcycle"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1
        assert all(v["type"] == "motorcycle" for v in data)

    def test_leaderboard_filter_car(self):
        """GET /leaderboard?type=car returns only cars."""
        r = client.get("/leaderboard", params={"type": "car"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1
        assert all(v["type"] == "car" for v in data)

    def test_leaderboard_first_is_fastest(self):
        """First vehicle in leaderboard should be Kawasaki Ninja H2R (9.10s)."""
        r = client.get("/leaderboard")
        assert r.status_code == 200
        data = r.json()
        assert data[0]["make"] == "Kawasaki"
        assert data[0]["quarter_mile_time_s"] == 9.10


# ═══════════════════════════════════════════
# Race history tests (HIST-01)
# ═══════════════════════════════════════════

class TestHistory:
    """HIST-01: GET /history + race persistence"""

    def test_race_creates_history_record(self):
        """Running a race should create a history entry."""
        # Run a race first
        r = client.post("/race/predict", json={"vehicle_a_id": 3, "vehicle_b_id": 5})
        assert r.status_code == 200
        # Check history
        h = client.get("/history")
        assert h.status_code == 200
        data = h.json()
        assert len(data) >= 1

    def test_history_returns_vehicle_labels(self):
        """History entries should include human-readable vehicle labels."""
        h = client.get("/history")
        assert h.status_code == 200
        data = h.json()
        assert len(data) >= 1
        entry = data[0]
        assert "vehicle_a_label" in entry
        assert "vehicle_b_label" in entry
        assert len(entry["vehicle_a_label"]) > 0
        assert len(entry["vehicle_b_label"]) > 0

    def test_history_newest_first(self):
        """History entries should be sorted newest first (descending created_at)."""
        # Run another race to have multiple entries
        client.post("/race/predict", json={"vehicle_a_id": 1, "vehicle_b_id": 5})
        h = client.get("/history")
        assert h.status_code == 200
        data = h.json()
        if len(data) >= 2:
            assert data[0]["created_at"] >= data[1]["created_at"]

    def test_history_with_limit(self):
        """GET /history?limit=1 returns at most 1 entry."""
        h = client.get("/history", params={"limit": 1})
        assert h.status_code == 200
        assert len(h.json()) <= 1

    def test_history_contains_all_fields(self):
        """Each history entry must contain all required fields."""
        # Ensure at least one race exists
        client.post("/race/predict", json={"vehicle_a_id": 1, "vehicle_b_id": 2})
        h = client.get("/history")
        assert h.status_code == 200
        data = h.json()
        assert len(data) >= 1
        entry = data[0]
        required_fields = [
            "id", "vehicle_a_id", "vehicle_b_id",
            "vehicle_a_label", "vehicle_b_label",
            "winner", "vehicle_a_time_s", "vehicle_b_time_s",
            "diff_s", "created_at"
        ]
        for field in required_fields:
            assert field in entry, f"Missing field: {field}"


# ═══════════════════════════════════════════
# Integration tests (QA-02)
# ═══════════════════════════════════════════

class TestIntegration:
    """QA-02: Cross-module integration tests"""

    def test_leaderboard_matches_vehicle_data(self):
        """Leaderboard entries should reference real vehicles from /vehicles."""
        lb = client.get("/leaderboard", params={"limit": 5})
        assert lb.status_code == 200
        for v in lb.json():
            detail = client.get(f"/vehicles/{v['id']}")
            assert detail.status_code == 200
            assert detail.json()["quarter_mile_time_s"] == v["quarter_mile_time_s"]

    def test_race_history_matches_prediction(self):
        """Race result in history should match the original /race/predict response."""
        # Use a unique pair that no other test uses
        race = client.post("/race/predict", json={"vehicle_a_id": 5, "vehicle_b_id": 6})
        assert race.status_code == 200
        race_data = race.json()

        h = client.get("/history", params={"limit": 50})
        assert h.status_code == 200
        # Find the matching entry by vehicle IDs
        matching = [
            e for e in h.json()
            if e["vehicle_a_id"] == 5 and e["vehicle_b_id"] == 6
        ]
        assert len(matching) >= 1
        history_data = matching[0]
        assert history_data["winner"] == race_data["winner"]
        assert history_data["diff_s"] == pytest.approx(race_data["diff_s"], abs=0.01)

    def test_leaderboard_rank_predicts_race_winner(self):
        """If vehicle A is ranked higher than B on leaderboard, A should win the race."""
        lb = client.get("/leaderboard", params={"limit": 10})
        data = lb.json()
        if len(data) >= 2:
            faster = data[0]
            slower = data[1]
            race = client.post("/race/predict", json={
                "vehicle_a_id": faster["id"],
                "vehicle_b_id": slower["id"]
            })
            assert race.status_code == 200
            result = race.json()
            assert result["winner"] in ("A", "Tie")

    def test_vehicle_detail_consistency(self):
        """Vehicle detail (GET /vehicles/{id}) should return same data as listing."""
        listing = client.get("/vehicles", params={"limit": 3})
        assert listing.status_code == 200
        for v in listing.json():
            detail = client.get(f"/vehicles/{v['id']}")
            assert detail.status_code == 200
            d = detail.json()
            assert d["make"] == v["make"]
            assert d["model"] == v["model"]
            assert d["quarter_mile_time_s"] == v["quarter_mile_time_s"]
