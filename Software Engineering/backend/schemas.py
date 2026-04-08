from pydantic import BaseModel, ConfigDict
from datetime import datetime


class VehicleOut(BaseModel):
    id: int
    type: str
    make: str
    model: str
    trim: str
    year: int
    quarter_mile_time_s: float
    source: str

    model_config = ConfigDict(from_attributes=True)


class RaceRequest(BaseModel):
    vehicle_a_id: int
    vehicle_b_id: int


class RaceResult(BaseModel):
    winner: str                 # "A" | "B" | "Tie"
    vehicle_a_time_s: float
    vehicle_b_time_s: float
    diff_s: float


class HistoryOut(BaseModel):
    id: int
    vehicle_a_id: int
    vehicle_b_id: int
    vehicle_a_label: str        # "2023 Tesla Model S Plaid"
    vehicle_b_label: str
    winner: str
    vehicle_a_time_s: float
    vehicle_b_time_s: float
    diff_s: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
