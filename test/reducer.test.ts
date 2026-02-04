import { beforeEach, describe, expect, it } from "bun:test";
import { getInitialState, STORAGE_KEY, taskReducer } from "../src/reducer";
import type { State } from "../src/types";

describe("getInitialState", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  it("returns empty state when window is undefined", () => {
    const originalWindow = globalThis.window;
    // biome-ignore lint/suspicious/noExplicitAny: controlled test override
    (globalThis as any).window = undefined;

    expect(getInitialState()).toEqual({ tasks: [], completed: [], later: [] });

    globalThis.window = originalWindow;
  });

  it("returns empty state on non-object JSON", () => {
    localStorage.setItem(STORAGE_KEY, "null");
    expect(getInitialState()).toEqual({ tasks: [], completed: [], later: [] });
  });

  it("returns tasks and empty completed when completed missing", () => {
    const state = { tasks: [{ id: "1", text: "Task", createdAt: 1 }] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    expect(getInitialState()).toEqual({
      tasks: state.tasks,
      completed: [],
      later: [],
    });
  });

  it("returns empty state when tasks is not an array", () => {
    const state = { tasks: "invalid" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    expect(getInitialState()).toEqual({ tasks: [], completed: [], later: [] });
  });

  it("returns tasks and completed when both provided", () => {
    const state: State = {
      tasks: [{ id: "1", text: "Task", createdAt: 1 }],
      completed: [{ id: "0", text: "Completed", createdAt: 0 }],
      later: [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    expect(getInitialState()).toEqual(state);
  });
});

describe("taskReducer edge cases", () => {
  it("returns state when completing with no tasks", () => {
    const state: State = { tasks: [], completed: [], later: [] };
    expect(taskReducer(state, { type: "COMPLETE" })).toEqual(state);
  });

  it("returns state when later with no tasks", () => {
    const state: State = { tasks: [], completed: [], later: [] };
    expect(taskReducer(state, { type: "LATER" })).toEqual(state);
  });

  it("returns state when undo later with no later tasks", () => {
    const state: State = {
      tasks: [{ id: "1", text: "Task", createdAt: 1 }],
      completed: [],
      later: [],
    };
    expect(taskReducer(state, { type: "UNDO_LATER" })).toEqual(state);
  });

  it("returns state when undoing completion with no completed tasks", () => {
    const state: State = {
      tasks: [{ id: "1", text: "Task", createdAt: 1 }],
      completed: [],
      later: [],
    };
    expect(taskReducer(state, { type: "UNDO_COMPLETE" })).toEqual(state);
  });

  it("returns state for unknown actions", () => {
    const state: State = { tasks: [], completed: [], later: [] };
    // biome-ignore lint/suspicious/noExplicitAny: test unknown action
    expect(taskReducer(state, { type: "UNKNOWN" } as any)).toEqual(state);
  });

  it("clears history while keeping tasks", () => {
    const state: State = {
      tasks: [{ id: "1", text: "Task", createdAt: 1 }],
      completed: [{ id: "2", text: "Done", createdAt: 2 }],
      later: [{ id: "3", text: "Later", createdAt: 3 }],
    };
    expect(taskReducer(state, { type: "CLEAR_HISTORY" })).toEqual({
      tasks: state.tasks,
      completed: [],
      later: [],
    });
  });
});
