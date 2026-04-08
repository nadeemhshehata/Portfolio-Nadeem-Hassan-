import csv
from sqlalchemy.orm import Session
from db import SessionLocal, Base, engine
from models import Vehicle

SEED_CSV = "./data/vehicles_seed.csv"


def main():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # Simple "upsert-ish" by (make, model, trim, year)
    existing = {(v.make, v.model, v.trim, v.year) for v in db.query(Vehicle).all()}

    added = 0
    with open(SEED_CSV, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            key = (row["make"], row["model"], row.get("trim", ""), int(row["year"]))
            if key in existing:
                continue
            v = Vehicle(
                type=row["type"],
                make=row["make"],
                model=row["model"],
                trim=row.get("trim", ""),
                year=int(row["year"]),
                quarter_mile_time_s=float(row["quarter_mile_time_s"]),
                source=row.get("source", ""),
            )
            db.add(v)
            added += 1

    db.commit()
    db.close()
    print(f"Seed complete. Added {added} vehicles.")


if __name__ == "__main__":
    main()
