import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { Header } from "./components/Header";
import { TaskCard } from "./components/TaskCard";
import { VoiceInput } from "./components/VoiceInput";
import { getInitialState, STORAGE_KEY, taskReducer } from "./reducer";
import type { Action } from "./types";

const keyboardStore = {
  lastKey: "",
};

let appState = getInitialState();
const appListeners = new Set<() => void>();

const appStore = {
  hydrate: () => {
    appState = getInitialState();
  },
  getSnapshot: () => appState,
  getServerSnapshot: () => getInitialState(),
  subscribe: (listener: () => void) => {
    appListeners.add(listener);
    return () => {
      appListeners.delete(listener);
    };
  },
  dispatch: (action: Action) => {
    const nextState = taskReducer(appState, action);
    appState = nextState;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    }
    appListeners.forEach((listener) => {
      listener();
    });
  },
};

export function App() {
  appStore.hydrate();
  const state = useSyncExternalStore(
    appStore.subscribe,
    appStore.getSnapshot,
    appStore.getServerSnapshot,
  );
  const wrappedDispatch = appStore.dispatch;
  const [activeView, setActiveView] = useState<"tasks" | "history">("tasks");

  const currentTask = state.tasks[0];
  const stackedTasks = state.tasks.slice(0, 3);
  const pendingTasks = state.tasks;
  const completedTasks = [...state.completed].reverse();

  const keyboardStateRef = useRef({
    dispatch: wrappedDispatch,
    enabled: false,
  });

  const isDesktop =
    typeof window === "undefined" ||
    !window.matchMedia ||
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  keyboardStateRef.current = {
    dispatch: wrappedDispatch,
    enabled: Boolean(currentTask) && isDesktop && activeView === "tasks",
  };

  const subscribeToKeyboard = useCallback((onStoreChange: () => void) => {
    if (typeof window === "undefined") {
      return () => {};
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!keyboardStateRef.current.enabled) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable) {
        return;
      }
      const tagName = target?.tagName?.toLowerCase();
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select"
      ) {
        return;
      }

      if (event.key === "ArrowUp" || event.key === "k") {
        event.preventDefault();
        keyboardStateRef.current.dispatch({ type: "LATER" });
      } else if (event.key === "ArrowDown" || event.key === "j") {
        event.preventDefault();
        keyboardStateRef.current.dispatch({ type: "UNDO_LATER" });
      } else {
        return;
      }

      keyboardStore.lastKey = event.key;
      onStoreChange();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useSyncExternalStore(
    subscribeToKeyboard,
    () => keyboardStore.lastKey,
    () => "",
  );

  const appClass =
    "bg-dark text-white position-relative w-100 min-vh-100 d-flex flex-column align-items-center justify-content-between py-4 user-select-none overflow-hidden";
  const mainClass =
    "flex-grow-1 w-100 d-flex flex-column align-items-center justify-content-center gap-4 px-3 position-relative";

  return (
    <div className={appClass}>
      <Header
        state={state}
        activeView={activeView}
        onToggleView={() =>
          setActiveView(activeView === "tasks" ? "history" : "tasks")
        }
      />

      <main className={mainClass} style={{ perspective: "1200px" }}>
        {activeView === "tasks" ? (
          <AnimatePresence mode="wait">
            {currentTask ? (
              <div
                className="position-relative w-100 d-flex align-items-center justify-content-center"
                style={{ minHeight: "min(80vh, 820px)" }}
              >
                {[...stackedTasks].reverse().map((task, index) => {
                  const depth = stackedTasks.length - 1 - index;
                  const zIndex = 10 + index;
                  const scale = 1 - depth * 0.04;
                  const translateX = depth * 16;
                  const translateY = depth * 16;
                  const translateZ = depth * -40;
                  const isTop = depth === 0;

                  return (
                    <div
                      key={task.id}
                      className="position-absolute top-50 start-50 translate-middle"
                      style={{
                        zIndex,
                        transform: `translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) scale(${scale})`,
                        pointerEvents: isTop ? "auto" : "none",
                        opacity: isTop ? 1 : 0.6,
                        filter: isTop ? "none" : "saturate(0.6)",
                      }}
                    >
                      <div
                        className={
                          isTop
                            ? ""
                            : "border border-light border-opacity-25 rounded-5"
                        }
                      >
                        <TaskCard task={task} dispatch={wrappedDispatch} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : completedTasks.length > 0 ? (
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -120) {
                    wrappedDispatch({ type: "UNDO_COMPLETE" });
                  }
                }}
                whileTap={{ scale: 0.98, cursor: "grabbing" }}
                whileHover={{ scale: 1.01, cursor: "grab" }}
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.98, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="task-card-size card bg-transparent text-white d-flex flex-column align-items-center justify-content-center p-4"
                style={{ border: "2px dashed rgba(255, 255, 255, 0.4)" }}
              >
                <div className="text-uppercase small text-secondary fw-bold mb-3">
                  No pending tasks
                </div>
                <h2 className="fw-bold mb-2">Undo last completion</h2>
                <p className="text-secondary text-center mb-0">
                  Swipe left to restore your most recent completed task.
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="text-center p-5"
              >
                <div className="mb-4 d-inline-block position-relative">
                  <div
                    className="position-absolute top-50 start-50 translate-middle bg-success opacity-25 rounded-circle"
                    style={{
                      width: "120px",
                      height: "120px",
                      filter: "blur(20px)",
                    }}
                  ></div>
                  <i
                    className="bi bi-check-circle-fill text-success position-relative z-1"
                    style={{ fontSize: "5rem" }}
                  ></i>
                </div>

                <h2 className="fw-bold mb-3 text-white">All Caught Up!</h2>

                <p
                  className="text-secondary fs-5"
                  style={{ maxWidth: "300px", margin: "0 auto" }}
                >
                  Your mind is clear. Tap the mic below to capture a new
                  thought.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <section className="w-100" style={{ maxWidth: "860px" }}>
            <div className="card bg-dark bg-opacity-75 border-secondary text-white shadow-sm">
              <div className="card-body py-3 d-flex flex-column gap-3">
                <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2">
                  <h3 className="h6 mb-0 text-uppercase text-secondary fw-bold">
                    Task History
                  </h3>
                  <button
                    type="button"
                    className="btn btn-outline-light btn-sm"
                    onClick={() => wrappedDispatch({ type: "CLEAR_HISTORY" })}
                    disabled={
                      state.completed.length === 0 && state.later.length === 0
                    }
                  >
                    Clear history
                  </button>
                </div>
              </div>
              <div className="row g-0 border-top border-secondary">
                <div className="col-12 col-lg-6 border-bottom border-secondary border-lg-end">
                  <div className="p-3">
                    <div className="text-uppercase small text-secondary fw-bold mb-2">
                      Pending
                    </div>
                    <ul
                      className="list-group list-group-flush"
                      style={{ maxHeight: "280px", overflowY: "auto" }}
                    >
                      {pendingTasks.length > 0 ? (
                        pendingTasks.map((task) => (
                          <li
                            key={task.id}
                            className="list-group-item bg-transparent text-white border-secondary py-2"
                          >
                            {task.text}
                          </li>
                        ))
                      ) : (
                        <li className="list-group-item bg-transparent text-secondary border-secondary py-2">
                          No pending tasks
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
                <div className="col-12 col-lg-6">
                  <div className="p-3">
                    <div className="text-uppercase small text-secondary fw-bold mb-2">
                      Completed
                    </div>
                    <ul
                      className="list-group list-group-flush"
                      style={{ maxHeight: "280px", overflowY: "auto" }}
                    >
                      {completedTasks.length > 0 ? (
                        completedTasks.map((task) => (
                          <li
                            key={task.id}
                            className="list-group-item bg-transparent text-white-50 border-secondary py-2"
                          >
                            {task.text}
                          </li>
                        ))
                      ) : (
                        <li className="list-group-item bg-transparent text-secondary border-secondary py-2">
                          No completed tasks
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="w-100 d-flex justify-content-center pb-5 z-3">
        <VoiceInput dispatch={wrappedDispatch} />
      </footer>
    </div>
  );
}
