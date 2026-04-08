from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from db import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(32), index=True)              # "car" | "motorcycle"
    make = Column(String(64), index=True)
    model = Column(String(64), index=True)
    trim = Column(String(128), default="")
    year = Column(Integer, index=True)
    quarter_mile_time_s = Column(Float, index=True)    # stored in seconds (indexed for leaderboard)
    source = Column(String(128), default="")           # data-source note


class RaceHistory(Base):
    __tablename__ = "race_history"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_a_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    vehicle_b_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    winner = Column(String(4), nullable=False)          # "A" | "B" | "Tie"
    vehicle_a_time_s = Column(Float, nullable=False)
    vehicle_b_time_s = Column(Float, nullable=False)
    diff_s = Column(Float, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
