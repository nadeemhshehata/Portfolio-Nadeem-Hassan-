import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchHistory, HistoryEntry } from "../api";

export default function History() {
    const nav = useNavigate();
    const [entries, setEntries] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        setLoading(true);
        setErr("");
        fetchHistory({ limit: 25 })
            .then(setEntries)
            .catch(() => setErr("Could not load race history"))
            .finally(() => setLoading(false));
    }, []);

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="page">
            <div className="bg-blur bg-blur--1" />
            <div className="bg-blur bg-blur--2" />

            <header className="hero">
                <h1 className="logo">
                    🏁 Drag<span className="accent">Race</span>.io
                </h1>
                <p className="subtitle">📜 Race History</p>
            </header>

            <nav className="nav-bar glass" aria-label="Main navigation">
                <button className="btn btn--nav" onClick={() => nav("/")}>
                    🏠 Home
                </button>
                <button className="btn btn--nav" onClick={() => nav("/leaderboard")}>
                    🏆 Leaderboard
                </button>
                <button className="btn btn--nav btn--nav-active" disabled>
                    📜 History
                </button>
            </nav>

            {loading && <p className="status">Loading race history…</p>}
            {err && (
                <div className="error-state" role="alert">
                    <p className="status status--err">⚠ {err}</p>
                </div>
            )}

            {!loading && !err && entries.length === 0 && (
                <div className="empty-state" role="status">
                    <p className="status">No race history yet. Go race some vehicles!</p>
                    <button className="btn btn--race" onClick={() => nav("/")}>
                        🏁 Start a Race
                    </button>
                </div>
            )}

            {!loading && !err && entries.length > 0 && (
                <div className="history-list" role="list" aria-label="Race history">
                    {entries.map((e) => {
                        const winnerLabel =
                            e.winner === "A"
                                ? e.vehicle_a_label
                                : e.winner === "B"
                                    ? e.vehicle_b_label
                                    : "Tie";
                        return (
                            <div className="history-card glass" key={e.id} role="listitem">
                                <div className="history-matchup">
                                    <div
                                        className={`history-side ${e.winner === "A" ? "history-side--winner" : ""}`}
                                    >
                                        <span className="history-badge">A</span>
                                        <span className="history-name">{e.vehicle_a_label}</span>
                                        <span className="history-time">
                                            {e.vehicle_a_time_s.toFixed(2)}s
                                        </span>
                                    </div>
                                    <div className="history-vs">VS</div>
                                    <div
                                        className={`history-side ${e.winner === "B" ? "history-side--winner" : ""}`}
                                    >
                                        <span className="history-badge">B</span>
                                        <span className="history-name">{e.vehicle_b_label}</span>
                                        <span className="history-time">
                                            {e.vehicle_b_time_s.toFixed(2)}s
                                        </span>
                                    </div>
                                </div>
                                <div className="history-result">
                                    <span className="history-winner">
                                        🏆 {winnerLabel}
                                        {e.winner !== "Tie" && (
                                            <span className="history-diff">
                                                {" "}
                                                by {e.diff_s.toFixed(2)}s
                                            </span>
                                        )}
                                    </span>
                                    <span className="history-date">
                                        {formatDate(e.created_at)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
