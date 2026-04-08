import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchLeaderboard, Vehicle } from "../api";

export default function Leaderboard() {
    const nav = useNavigate();
    const [type, setType] = useState<string>("");
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        setLoading(true);
        setErr("");
        fetchLeaderboard({ limit: 50, type: type || undefined })
            .then(setVehicles)
            .catch(() => setErr("Could not load leaderboard"))
            .finally(() => setLoading(false));
    }, [type]);

    const medalEmoji = (rank: number) => {
        if (rank === 0) return "🥇";
        if (rank === 1) return "🥈";
        if (rank === 2) return "🥉";
        return `#${rank + 1}`;
    };

    return (
        <div className="page">
            <div className="bg-blur bg-blur--1" />
            <div className="bg-blur bg-blur--2" />

            <header className="hero">
                <h1 className="logo">
                    🏁 Drag<span className="accent">Race</span>.io
                </h1>
                <p className="subtitle">🏆 Fastest Quarter-Mile Rankings</p>
            </header>

            <nav className="nav-bar glass" aria-label="Main navigation">
                <button className="btn btn--nav" onClick={() => nav("/")}>
                    🏠 Home
                </button>
                <button className="btn btn--nav btn--nav-active" disabled>
                    🏆 Leaderboard
                </button>
                <button className="btn btn--nav" onClick={() => nav("/history")}>
                    📜 History
                </button>
            </nav>

            {/* Filter */}
            <section className="filters" role="search">
                <select
                    className="input glass"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    aria-label="Filter leaderboard by vehicle type"
                >
                    <option value="">All types</option>
                    <option value="car">🚗 Cars Only</option>
                    <option value="motorcycle">🏍️ Motorcycles Only</option>
                </select>
            </section>

            {loading && <p className="status">Loading leaderboard…</p>}
            {err && (
                <div className="error-state" role="alert">
                    <p className="status status--err">⚠ {err}</p>
                </div>
            )}

            {!loading && !err && (
                <div className="leaderboard-table glass" role="table" aria-label="Leaderboard">
                    <div className="lb-header" role="row">
                        <span className="lb-cell lb-rank" role="columnheader">Rank</span>
                        <span className="lb-cell lb-vehicle" role="columnheader">Vehicle</span>
                        <span className="lb-cell lb-type" role="columnheader">Type</span>
                        <span className="lb-cell lb-time" role="columnheader">¼ Mile</span>
                    </div>
                    {vehicles.map((v, i) => (
                        <div
                            className={`lb-row ${i < 3 ? "lb-row--podium" : ""} ${i === 0 ? "lb-row--gold" : ""} ${i === 1 ? "lb-row--silver" : ""} ${i === 2 ? "lb-row--bronze" : ""}`}
                            key={v.id}
                            role="row"
                            onClick={() => nav(`/vehicles/${v.id}`)}
                            style={{ cursor: "pointer" }}
                            aria-label={`Rank ${i + 1}: ${v.make} ${v.model}`}
                        >
                            <span className="lb-cell lb-rank" role="cell">
                                {medalEmoji(i)}
                            </span>
                            <span className="lb-cell lb-vehicle" role="cell">
                                <span className="lb-vehicle-name">
                                    {v.year} {v.make} {v.model}
                                    {v.trim ? ` ${v.trim}` : ""}
                                </span>
                                <span className="lb-vehicle-source">{v.source}</span>
                            </span>
                            <span className="lb-cell lb-type" role="cell">
                                {v.type === "car" ? "🚗" : "🏍️"}
                            </span>
                            <span className="lb-cell lb-time" role="cell">
                                {v.quarter_mile_time_s.toFixed(2)}
                                <span className="card-time-unit">s</span>
                            </span>
                        </div>
                    ))}
                    {vehicles.length === 0 && (
                        <div className="status">No vehicles found.</div>
                    )}
                </div>
            )}
        </div>
    );
}
