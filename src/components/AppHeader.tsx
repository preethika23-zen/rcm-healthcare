import { Moon, Shield, Sun } from "lucide-react";

type Props = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

export default function AppHeader({ theme, onToggleTheme }: Props) {
  return (
    <header className="app-header-block">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center floating theme-toggle-btn">
            <Shield size={24} />
          </div>

          <div className="flex flex-col gap-2">
            <div>
              <h1
                className="text-2xl md:text-3xl font-bold leading-tight"
                style={{ color: "var(--text-main)" }}
              >
                RCM Denial Prediction Engine
              </h1>
              <p className="mt-1" style={{ color: "var(--text-soft)" }}>
                Predictive Claim Intelligence for Revenue Cycle Teams
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="header-badge">RCM Intelligence Suite</span>

              <span className="header-status">
                <span className="header-status-dot"></span>
                Explainable AI Enabled
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </header>
  );
}