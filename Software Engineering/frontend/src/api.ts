export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type Vehicle = {
    id: number;
    type: string;
    make: string;
    model: string;
    trim: string;
    year: number;
    quarter_mile_time_s: number;
    source: string;
};

export type HistoryEntry = {
    id: number;
    vehicle_a_id: number;
    vehicle_b_id: number;
    vehicle_a_label: string;
    vehicle_b_label: string;
    winner: string;
    vehicle_a_time_s: number;
    vehicle_b_time_s: number;
    diff_s: number;
    created_at: string;
};

export async function fetchVehicles(
    params: Record<string, string | number | undefined>
) {
    const url = new URL(`${API_URL}/vehicles`);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    });
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Failed to load vehicles");
    return (await res.json()) as Vehicle[];
}

export async function fetchVehicleById(id: number) {
    const res = await fetch(`${API_URL}/vehicles/${id}`);
    if (!res.ok) throw new Error("Vehicle not found");
    return (await res.json()) as Vehicle;
}

export async function fetchLeaderboard(params: {
    limit?: number;
    type?: string;
}) {
    const url = new URL(`${API_URL}/leaderboard`);
    if (params.limit) url.searchParams.set("limit", String(params.limit));
    if (params.type) url.searchParams.set("type", params.type);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Failed to load leaderboard");
    return (await res.json()) as Vehicle[];
}

export async function fetchHistory(params: {
    limit?: number;
    offset?: number;
}) {
    const url = new URL(`${API_URL}/history`);
    if (params.limit) url.searchParams.set("limit", String(params.limit));
    if (params.offset) url.searchParams.set("offset", String(params.offset));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Failed to load history");
    return (await res.json()) as HistoryEntry[];
}

export async function predictRace(
    vehicle_a_id: number,
    vehicle_b_id: number
) {
    const res = await fetch(`${API_URL}/race/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicle_a_id, vehicle_b_id }),
    });
    if (!res.ok) throw new Error("Race prediction failed");
    return (await res.json()) as {
        winner: "A" | "B" | "Tie";
        vehicle_a_time_s: number;
        vehicle_b_time_s: number;
        diff_s: number;
    };
}
