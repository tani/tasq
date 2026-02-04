import type { State } from "../types";

interface HeaderProps {
  state: State;
  activeView: "tasks" | "history";
  onToggleView: () => void;
}

export function Header({ state, activeView, onToggleView }: HeaderProps) {
  const badgeClass =
    activeView === "tasks" ? "text-bg-primary" : "text-bg-secondary";

  return (
    <header className="w-100 d-flex justify-content-between align-items-center px-4 py-3 fixed-top z-3">
      <div className="d-flex align-items-center gap-2">
        <div
          className="bg-primary rounded-circle d-flex align-items-center justify-content-center shadow-lg"
          style={{ width: "32px", height: "32px" }}
        >
          <i className="bi bi-layers-fill text-white small"></i>
        </div>

        <h1 className="h5 fw-bold mb-0 text-white-50">Tasq</h1>
      </div>

      <button
        type="button"
        onClick={onToggleView}
        className={`btn btn-lg rounded-pill d-flex align-items-center gap-2 px-4 py-2 border-0 shadow-sm ${badgeClass}`}
        aria-label={activeView === "tasks" ? "Show task history" : "Show tasks"}
      >
        <span className="fw-bold">•</span> {state.tasks.length}
      </button>
    </header>
  );
}
