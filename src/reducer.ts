import type { Action, State, Task } from "./types";

export const STORAGE_KEY = "tasq-data";

export const getInitialState = (): State => {
  // Safe check for SSR environments (though this is a SPA)
  if (typeof window === "undefined") return { tasks: [], completed: [], later: [] };

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Basic validation to ensure shape is correct
      if (parsed && Array.isArray(parsed.tasks)) {
        return {
          tasks: parsed.tasks,
          completed: Array.isArray(parsed.completed) ? parsed.completed : [],
          later: Array.isArray(parsed.later) ? parsed.later : [],
        };
      }
    } catch (e) {
      console.error("Failed to parse tasks from localStorage", e);
    }
  }
  return { tasks: [], completed: [], later: [] };
};

export const taskReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD": {
      const newTask: Task = {
        id: crypto.randomUUID(),
        text: action.payload,
        createdAt: Date.now(),
      };
      return {
        tasks: [...state.tasks, newTask],
        completed: state.completed,
        later: state.later,
      };
    }
    case "COMPLETE": {
      if (state.tasks.length === 0) return state;
      const [first, ...rest] = state.tasks;
      return {
        tasks: rest,
        completed: [...state.completed, first],
        later: state.later,
      };
    }
    case "LATER": {
      if (state.tasks.length === 0) return state;
      const [first, ...rest] = state.tasks;
      return {
        tasks: [...rest, first],
        completed: state.completed,
        later: [...state.later, first],
      };
    }
    case "UNDO_LATER": {
      if (state.later.length === 0) return state;
      const lastIndex = state.later.length - 1;
      const restored = state.later[lastIndex];
      return {
        tasks: [restored, ...state.tasks.filter((task) => task.id !== restored.id)],
        completed: state.completed,
        later: state.later.slice(0, lastIndex),
      };
    }
    case "UNDO_COMPLETE": {
      if (state.completed.length === 0) return state;
      const lastIndex = state.completed.length - 1;
      const restored = state.completed[lastIndex];
      return {
        tasks: [restored, ...state.tasks],
        completed: state.completed.slice(0, lastIndex),
        later: state.later,
      };
    }
    case "CLEAR_HISTORY": {
      return {
        tasks: state.tasks,
        completed: [],
        later: [],
      };
    }
    default:
      return state;
  }
};
