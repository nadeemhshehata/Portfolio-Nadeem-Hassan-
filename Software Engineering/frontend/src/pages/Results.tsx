import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { predictRace, Vehicle } from "../api";
import RaceAnimation from "../components/RaceAnimation";

export default function Results() {
    const nav = useNavigate();
    const loc = useLocation() as { state?: { a?: Vehicle; b?: Vehicle } };
    const a = loc.state?.a;
    const b = loc.state?.b;

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [result, setResult] = useState<null | {
        winner: "A" | "B" | "Tie";
        vehicle_a_time_s: number;
        vehicle_b_time_s: number;
        diff_s: number;
    }>(null);
    const [showAnimation, setShowAnimation] = useState(true);

    useEffect(() => {
        if (!a || !b) {
            nav("/");
            return;
        }
        setLoading(true);
        setErr("");
        predictRace(a.id, b.id)
            .then(setResult)
            .catch(() => setErr("Could not compute race result"))
            .finally(() => setLoading(false));
    }, [a, b, nav]);

    const handleAnimationComplete = useCallback(() => {
        setShowAnimation(false);
    }, []);

    if (!a || !b) return null;

    const winnerVehicle =
        result?.winner === "A" ? a : result?.winner === "B" ? b : null;
    const winnerLabel = winnerVehicle
        ? `${winnerVehicle.year} ${winnerVehicle.make} ${winnerVehicle.model}`
        : "It's a Tie!";

    const vehicleALabel = `${a.year} ${a.make} ${a.model}${a.trim ? ` ${a.trim}` : ""}`;
    const vehicleBLabel = `${b.year} ${b.make} ${b.model}${b.trim ? ` ${b.trim}` : ""}`;

    return (
        <div className="page">
            <div className="bg-blur bg-blur--1" />
            <div className="bg-blur bg-blur--2" />

            <header className="hero">
                <h1 className="logo">
                    🏁 Drag<span className="accent">Race</span>.io
                </h1>
                <p className="subtitle">Quarter-mile showdown — who's faster?</p>
            </header>

            {loading && <p className="status">Computing race…</p>}

            {err && (
                <div className="error-state" role="alert">
                    <p className="status status--err">⚠ {err}</p>
                    <button
                        className="btn btn--retry"
                        onClick={() => nav("/")}
                        aria-label="Go back to home page"
                    >
                        ↩ Back to Home
                    </button>
                </div>
            )}

            {/* RACE-02: Three.js animation phase */}
            {result && showAnimation && (
                <RaceAnimation
                    vehicleATime={result.vehicle_a_time_s}
                    vehicleBTime={result.vehicle_b_time_s}
                    winner={result.winner}
                    vehicleALabel={vehicleALabel}
                    vehicleBLabel={vehicleBLabel}
                    vehicleAType={a.type}
                    vehicleBType={b.type}
                    onComplete={handleAnimationComplete}
                />
            )}

            {/* Results panel — shown after animation completes or is skipped */}
            {result && !showAnimation && (
                <section
                    className="results-card glass"
                    aria-live="polite"
                    role="region"
                    aria-label="Race results"
                >
                    {/* Winner banner */}
                    <div className="winner-banner">
                        <span className="trophy" role="img" aria-label="Trophy">🏆</span>
                        <h2 className="winner-label">{winnerLabel}</h2>
                        {result.winner !== "Tie" && (
                            <p className="winner-diff">
                                by {result.diff_s.toFixed(2)}s
                            </p>
                        )}
                    </div>

                    {/* Side-by-side comparison */}
                    <div className="compare">
                        <div
                            className={`compare-side ${result.winner === "A" ? "compare-side--winner" : ""
                                }`}
                        >
                            <div className="compare-badge">A</div>
                            <div className="compare-name">
                                {a.year} {a.make} {a.model}
                                {a.trim ? ` (${a.trim})` : ""}
                            </div>
                            <div className="compare-time">
                                {result.vehicle_a_time_s.toFixed(2)}
                                <span className="card-time-unit">s</span>
                            </div>
                        </div>

                        <div className="compare-vs">VS</div>

                        <div
                            className={`compare-side ${result.winner === "B" ? "compare-side--winner" : ""
                                }`}
                        >
                            <div className="compare-badge">B</div>
                            <div className="compare-name">
                                {b.year} {b.make} {b.model}
                                {b.trim ? ` (${b.trim})` : ""}
                            </div>
                            <div className="compare-time">
                                {result.vehicle_b_time_s.toFixed(2)}
                                <span className="card-time-unit">s</span>
                            </div>
                        </div>
                    </div>

                    <button
                        className="btn btn--race"
                        onClick={() => nav("/")}
                        aria-label="Start a new matchup"
                    >
                        ↩ New Matchup
                    </button>
                    
                    <div style={{ marginTop: "32px", fontSize: "0.8rem", color: "var(--text-dim)", padding: "16px", background: "var(--surface)", borderRadius: "var(--radius-sm)" }}>
                        <p><strong>Disclaimer:</strong> DragRace.io is a simulation tool for educational purposes only. Vehicle performance data is estimated and does not reflect real-world conditions. Do not use this data for real driving decisions.</p>
                    </div>
                </section>
            )}
        </div>
    );
}
