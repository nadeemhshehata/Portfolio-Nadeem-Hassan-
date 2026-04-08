import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchVehicles, Vehicle } from "../api";

/* ── Debounce hook (300ms default) ── */
function useDebounce<T>(value: T, delay = 300): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
}

export default function Home() {
    const nav = useNavigate();
    const [q, setQ] = useState("");
    const [type, setType] = useState<string>("");
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string>("");

    const [a, setA] = useState<Vehicle | null>(null);
    const [b, setB] = useState<Vehicle | null>(null);

    const canRace = useMemo(() => !!a && !!b && a.id !== b.id, [a, b]);

    // Debounce the search query so we don't fire on every keystroke
    const debouncedQ = useDebounce(q, 300);

    const loadVehicles = useCallback(() => {
        setLoading(true);
        setErr("");
        fetchVehicles({
            limit: 50,
            offset: 0,
            q: debouncedQ || undefined,
            type: type || undefined,
        })
            .then((data) => setVehicles(data))
            .catch(() => setErr("Could not load vehicles. Check your connection and try again."))
            .finally(() => setLoading(false));
    }, [debouncedQ, type]);

    useEffect(() => {
        loadVehicles();
    }, [loadVehicles]);

    return (
        <div className="page">
            {/* Decorative blurs */}
            <div className="bg-blur bg-blur--1" />
            <div className="bg-blur bg-blur--2" />

            <header className="hero">
                <h1 className="logo">
                    🏁 Drag<span className="accent">Race</span>.io
                </h1>
                <p className="subtitle">
                    Browse → pick <strong>A</strong> &amp; <strong>B</strong> → race →
                    results
                </p>
            </header>

            <nav className="nav-bar glass" aria-label="Main navigation">
                <button className="btn btn--nav btn--nav-active" disabled>
                    🏠 Home
                </button>
                <button className="btn btn--nav" onClick={() => nav("/leaderboard")}>
                    🏆 Leaderboard
                </button>
                <button className="btn btn--nav" onClick={() => nav("/history")}>
                    📜 History
                </button>
            </nav>

            {/* ── Matchup bar ── */}
            <section className="matchup-bar glass" aria-label="Vehicle matchup selection">
                <div className="matchup-slots">
                    <div className={`slot ${a ? "slot--filled" : ""}`}>
                        <span className="slot-label">A</span>
                        <span className="slot-value">
                            {a
                                ? `${a.year} ${a.make} ${a.model}${a.trim ? ` ${a.trim}` : ""}`
                                : "Select a vehicle"}
                        </span>
                        {a && (
                            <span className="slot-time">{a.quarter_mile_time_s.toFixed(2)}s</span>
                        )}
                    </div>

                    <div className="vs-badge" aria-hidden="true">VS</div>

                    <div className={`slot ${b ? "slot--filled" : ""}`}>
                        <span className="slot-label">B</span>
                        <span className="slot-value">
                            {b
                                ? `${b.year} ${b.make} ${b.model}${b.trim ? ` ${b.trim}` : ""}`
                                : "Select a vehicle"}
                        </span>
                        {b && (
                            <span className="slot-time">{b.quarter_mile_time_s.toFixed(2)}s</span>
                        )}
                    </div>
                </div>

                {a && b && a.id === b.id && (
                    <p className="warn" role="alert">⚠ Pick two different vehicles.</p>
                )}

                <button
                    className="btn btn--race"
                    disabled={!canRace}
                    onClick={() => nav("/results", { state: { a, b } })}
                    aria-label={
                        canRace
                            ? "Start race between Vehicle A and Vehicle B"
                            : "Select two different vehicles to start a race"
                    }
                >
                    🚀 Race!
                </button>
            </section>

            {/* ── Filters ── */}
            <section className="filters" role="search">
                <input
                    id="search-input"
                    className="input glass"
                    placeholder="🔍  Search make / model / trim…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    aria-label="Search vehicles by make, model, or trim"
                />
                <select
                    id="type-filter"
                    className="input glass"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    aria-label="Filter by vehicle type"
                >
                    <option value="">All types</option>
                    <option value="car">🚗 Car</option>
                    <option value="motorcycle">🏍️ Motorcycle</option>
                </select>
            </section>

            {/* ── Status / Error / Empty States ── */}
            {loading && (
                <div className="status" role="status" aria-live="polite">
                    <p>Loading vehicles…</p>
                </div>
            )}

            {err && (
                <div className="error-state" role="alert">
                    <p className="status status--err">⚠ {err}</p>
                    <button
                        className="btn btn--retry"
                        onClick={loadVehicles}
                        aria-label="Retry loading vehicles"
                    >
                        🔄 Retry
                    </button>
                </div>
            )}

            {!loading && !err && vehicles.length === 0 && (
                <div className="empty-state" role="status">
                    <p className="status">No vehicles matched your search.</p>
                    {(q || type) && (
                        <button
                            className="btn btn--retry"
                            onClick={() => { setQ(""); setType(""); }}
                            aria-label="Clear search filters"
                        >
                            ✕ Clear Filters
                        </button>
                    )}
                </div>
            )}

            {/* ── Vehicle grid ── */}
            <div className="grid" role="list" aria-label="Vehicle list">
                {vehicles.map((v) => {
                    const isA = a?.id === v.id;
                    const isB = b?.id === v.id;
                    const title = `${v.make} ${v.model}${v.trim ? ` (${v.trim})` : ""}`;
                    return (
                        <div
                            className={`card glass ${isA ? "card--a" : ""} ${isB ? "card--b" : ""}`}
                            key={v.id}
                            role="listitem"
                        >
                            <div
                                className="card-top"
                                onClick={() => nav(`/vehicles/${v.id}`)}
                                style={{ cursor: "pointer" }}
                            >
                                <div>
                                    <div className="card-title">{title}</div>
                                    <div className="card-meta">
                                        {v.year} •{" "}
                                        {v.type === "car" ? "🚗" : "🏍️"} {v.type}
                                    </div>
                                </div>
                                <div className="card-time">
                                    {v.quarter_mile_time_s.toFixed(2)}
                                    <span className="card-time-unit">s</span>
                                </div>
                            </div>
                            <div className="card-actions">
                                <button
                                    className={`btn btn--sm ${isA ? "btn--active" : ""}`}
                                    onClick={() => setA(v)}
                                    aria-label={`Set ${v.make} ${v.model} as Vehicle A`}
                                >
                                    {isA ? "✓ Vehicle A" : "Set as A"}
                                </button>
                                <button
                                    className={`btn btn--sm ${isB ? "btn--active" : ""}`}
                                    onClick={() => setB(v)}
                                    aria-label={`Set ${v.make} ${v.model} as Vehicle B`}
                                >
                                    {isB ? "✓ Vehicle B" : "Set as B"}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
