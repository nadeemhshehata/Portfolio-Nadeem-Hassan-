import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchVehicleById, Vehicle } from "../api";

export default function VehicleDetail() {
    const { id } = useParams<{ id: string }>();
    const nav = useNavigate();
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setErr("");
        fetchVehicleById(Number(id))
            .then(setVehicle)
            .catch(() => setErr("Vehicle not found"))
            .finally(() => setLoading(false));
    }, [id]);

    return (
        <div className="page">
            <div className="bg-blur bg-blur--1" />
            <div className="bg-blur bg-blur--2" />

            <header className="hero">
                <h1 className="logo">
                    🏁 Drag<span className="accent">Race</span>.io
                </h1>
                <p className="subtitle">Vehicle Details</p>
            </header>

            <nav className="nav-bar glass" aria-label="Main navigation">
                <button className="btn btn--nav" onClick={() => nav("/")}>
                    🏠 Home
                </button>
                <button className="btn btn--nav" onClick={() => nav("/leaderboard")}>
                    🏆 Leaderboard
                </button>
                <button className="btn btn--nav" onClick={() => nav("/history")}>
                    📜 History
                </button>
            </nav>

            {loading && <p className="status">Loading vehicle…</p>}

            {err && (
                <div className="error-state" role="alert">
                    <p className="status status--err">⚠ {err}</p>
                    <button className="btn btn--retry" onClick={() => nav("/")} aria-label="Go back to home">
                        ↩ Back to Home
                    </button>
                </div>
            )}

            {vehicle && !loading && (
                <section className="detail-card glass" aria-label="Vehicle details">
                    <div className="detail-header">
                        <div>
                            <h2 className="detail-title">
                                {vehicle.make} {vehicle.model}
                                {vehicle.trim ? ` ${vehicle.trim}` : ""}
                            </h2>
                            <div className="detail-meta">
                                {vehicle.year} • {vehicle.type === "car" ? "🚗" : "🏍️"}{" "}
                                {vehicle.type}
                            </div>
                        </div>
                        <div className="detail-time">
                            {vehicle.quarter_mile_time_s.toFixed(2)}
                            <span className="card-time-unit">s</span>
                        </div>
                    </div>

                    <div className="detail-specs">
                        <div className="spec-row">
                            <span className="spec-label">Make</span>
                            <span className="spec-value">{vehicle.make}</span>
                        </div>
                        <div className="spec-row">
                            <span className="spec-label">Model</span>
                            <span className="spec-value">{vehicle.model}</span>
                        </div>
                        {vehicle.trim && (
                            <div className="spec-row">
                                <span className="spec-label">Trim</span>
                                <span className="spec-value">{vehicle.trim}</span>
                            </div>
                        )}
                        <div className="spec-row">
                            <span className="spec-label">Year</span>
                            <span className="spec-value">{vehicle.year}</span>
                        </div>
                        <div className="spec-row">
                            <span className="spec-label">Type</span>
                            <span className="spec-value">{vehicle.type}</span>
                        </div>
                        <div className="spec-row">
                            <span className="spec-label">¼-Mile Time</span>
                            <span className="spec-value spec-value--highlight">
                                {vehicle.quarter_mile_time_s.toFixed(2)}s
                            </span>
                        </div>
                        {vehicle.source && (
                            <div className="spec-row">
                                <span className="spec-label">Data Source</span>
                                <span className="spec-value">{vehicle.source}</span>
                            </div>
                        )}
                    </div>

                    <div className="detail-actions">
                        <button
                            className="btn btn--race"
                            onClick={() => nav("/", { state: { preselect: vehicle } })}
                            aria-label={`Select ${vehicle.make} ${vehicle.model} for race`}
                        >
                            🏁 Race This Vehicle
                        </button>
                        <button
                            className="btn btn--retry"
                            onClick={() => nav(-1 as any)}
                            aria-label="Go back"
                        >
                            ↩ Back
                        </button>
                    </div>
                </section>
            )}
        </div>
    );
}
