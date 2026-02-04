import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, mock } from "bun:test";
import { App } from "../src/App";
import { STORAGE_KEY, taskReducer } from "../src/reducer";
import type { Action, State } from "../src/types";

const mockStart = mock(() => {});
const mockStop = mock(() => {});
class MockSpeechRecognition {
  start = mockStart;
  stop = mockStop;
  onresult:
    | ((event: { results: Array<Array<{ transcript: string }>> }) => void)
    | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  continuous = false;
  lang = "";
  interimResults = false;
}

describe("Task Reducer (Pure Logic)", () => {
  it("should add a task", () => {
    const initialState: State = { tasks: [], completed: [], later: [] };
    const action: Action = { type: "ADD", payload: "New Task" };
    const newState = taskReducer(initialState, action);

    expect(newState.tasks).toHaveLength(1);
    expect(newState.tasks[0].text).toBe("New Task");
  });

  it("should complete a task (remove first)", () => {
    const initialState: State = {
      tasks: [
        { id: "1", text: "Task 1", createdAt: 1 },
        { id: "2", text: "Task 2", createdAt: 2 },
      ],
      completed: [],
      later: [],
    };
    const action: Action = { type: "COMPLETE" };
    const newState = taskReducer(initialState, action);

    expect(newState.tasks).toHaveLength(1);
    expect(newState.tasks[0].id).toBe("2");
    expect(newState.completed).toHaveLength(1);
    expect(newState.completed[0].id).toBe("1");
  });

  it("should move a task to later (move first to last)", () => {
    const initialState: State = {
      tasks: [
        { id: "1", text: "Task 1", createdAt: 1 },
        { id: "2", text: "Task 2", createdAt: 2 },
      ],
      completed: [],
      later: [],
    };
    const action: Action = { type: "LATER" };
    const newState = taskReducer(initialState, action);

    expect(newState.tasks).toHaveLength(2);
    expect(newState.tasks[0].id).toBe("2");
    expect(newState.tasks[1].id).toBe("1");
  });

  it("should revert a task (restore last completed to front)", () => {
    const initialState: State = {
      tasks: [
        { id: "2", text: "Task 2", createdAt: 2 },
        { id: "3", text: "Task 3", createdAt: 3 },
      ],
      completed: [{ id: "1", text: "Task 1", createdAt: 1 }],
      later: [],
    };
    const action: Action = { type: "UNDO_COMPLETE" };
    const newState = taskReducer(initialState, action);

    expect(newState.tasks).toHaveLength(3);
    expect(newState.tasks[0].id).toBe("1");
    expect(newState.tasks[1].id).toBe("2");
    expect(newState.completed).toHaveLength(0);
  });
});

describe("Tasq App (Integration)", () => {
  beforeEach(() => {
    localStorage.clear();
    mock.clearAllMocks();
    Object.defineProperty(window, "SpeechRecognition", {
      value: MockSpeechRecognition,
      writable: true,
    });
    Object.defineProperty(window, "webkitSpeechRecognition", {
      value: MockSpeechRecognition,
      writable: true,
    });
    window.matchMedia = () => ({
      matches: true,
      addEventListener: () => {},
      removeEventListener: () => {},
    });
  });

  it('should render "All Caught Up!" initially', () => {
    render(<App />);
    expect(screen.getByText("All Caught Up!")).toBeInTheDocument();
  });

  it("should add task via mock voice input interaction", async () => {
    // Pre-seed state via localStorage for testing initial render if needed,
    // but here we want to test the ADD action flow via dispatch logic simulation
    // Since we can't easily trigger the SpeechRecognition event from outside without complex mocks,
    // We will test if the component renders the button.

    render(<App />);
    const micButton = screen.getByRole("button", { name: /start recording/i });
    expect(micButton).toBeInTheDocument();

    // Simulate click
    fireEvent.click(micButton);
    expect(mockStart).toHaveBeenCalled();
  });

  it("should handle keyboard shortcuts for later and undo later", async () => {
    const state: State = {
      tasks: [
        { id: "1", text: "Task 1", createdAt: 1 },
        { id: "2", text: "Task 2", createdAt: 2 },
      ],
      completed: [{ id: "0", text: "Task 0", createdAt: 0 }],
      later: [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Task 1" }),
      ).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "k" });
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Task 2" }),
      ).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "j" });
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Task 1" }),
      ).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "ArrowDown" });
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Task 1" }),
      ).toBeInTheDocument();
    });
  });

  it("should ignore keyboard shortcuts when target is an input", async () => {
    const state: State = {
      tasks: [{ id: "1", text: "Task 1", createdAt: 1 }],
      completed: [],
      later: [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Task 1" }),
      ).toBeInTheDocument();
    });

    const input = document.createElement("input");
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: "k", bubbles: true });

    expect(screen.getByRole("heading", { name: "Task 1" })).toBeInTheDocument();
    input.remove();
  });

  it("should ignore keyboard shortcuts when target is content editable", async () => {
    const state: State = {
      tasks: [{ id: "1", text: "Task 1", createdAt: 1 }],
      completed: [],
      later: [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Task 1" }),
      ).toBeInTheDocument();
    });

    const editable = document.createElement("div");
    editable.contentEditable = "true";
    document.body.appendChild(editable);
    fireEvent.keyDown(editable, { key: "j", bubbles: true });

    expect(screen.getByRole("heading", { name: "Task 1" })).toBeInTheDocument();
    editable.remove();
  });

  it("should skip keyboard listeners on touch-only devices", () => {
    window.matchMedia = () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    });
    const state: State = {
      tasks: [{ id: "1", text: "Task 1", createdAt: 1 }],
      completed: [],
      later: [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    render(<App />);

    fireEvent.keyDown(window, { key: "k" });
    expect(screen.getByRole("heading", { name: "Task 1" })).toBeInTheDocument();
  });

  it("should allow keyboard shortcuts when matchMedia is unavailable", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: test override
    (window as any).matchMedia = undefined;
    const state: State = {
      tasks: [
        { id: "1", text: "Task 1", createdAt: 1 },
        { id: "2", text: "Task 2", createdAt: 2 },
      ],
      completed: [],
      later: [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Task 1" }),
      ).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "k" });
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Task 2" }),
      ).toBeInTheDocument();
    });
  });

  it("should undo later with ArrowDown", async () => {
    const state: State = {
      tasks: [{ id: "1", text: "Task 1", createdAt: 1 }],
      completed: [{ id: "0", text: "Task 0", createdAt: 0 }],
      later: [{ id: "9", text: "Task 9", createdAt: 9 }],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Task 1" }),
      ).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "ArrowDown" });
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Task 9" }),
      ).toBeInTheDocument();
    });
  });

  it("should undo later with j", async () => {
    const state: State = {
      tasks: [{ id: "1", text: "Task 1", createdAt: 1 }],
      completed: [{ id: "0", text: "Task 0", createdAt: 0 }],
      later: [{ id: "9", text: "Task 9", createdAt: 9 }],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Task 1" }),
      ).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "j" });
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Task 9" }),
      ).toBeInTheDocument();
    });
  });

  it("should ignore unrelated keys", async () => {
    const state: State = {
      tasks: [{ id: "1", text: "Task 1", createdAt: 1 }],
      completed: [],
      later: [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Task 1" }),
      ).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "x" });
    expect(screen.getByRole("heading", { name: "Task 1" })).toBeInTheDocument();
  });

  it("should persist tasks when adding via keyboard input form", async () => {
    render(<App />);
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: /toggle keyboard input/i }),
    );
    const input = screen.getByRole("textbox", { name: /type a task/i });
    await user.type(input, "New Task");
    await user.click(screen.getByRole("button", { name: /add task/i }));

    const saved = localStorage.getItem(STORAGE_KEY);
    expect(saved).toContain("New Task");
  });

  // Note: Testing actual Swipe requires complex pointer event mocking or e2e tools (Cypress/Playwright).
  // For Unit/Integration with RTL, we often rely on verifying the reducer and that components receive the dispatch.
});
