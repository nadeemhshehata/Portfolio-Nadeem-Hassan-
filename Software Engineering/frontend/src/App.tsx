import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Results from "./pages/Results";
import VehicleDetail from "./pages/VehicleDetail";
import Leaderboard from "./pages/Leaderboard";
import History from "./pages/History";
import ThemeToggle from "./components/ThemeToggle";
import "./index.css";

export default function App() {
    return (
        <BrowserRouter>
            <ThemeToggle />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/vehicles/:id" element={<VehicleDetail />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/history" element={<History />} />
                <Route path="/results" element={<Results />} />
            </Routes>
        </BrowserRouter>
    );
}
