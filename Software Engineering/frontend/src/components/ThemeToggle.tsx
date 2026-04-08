import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    return (
        <button
            className="btn btn--sm glass"
            style={{ position: "absolute", top: "16px", right: "16px", zIndex: 100 }}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>
    );
}
