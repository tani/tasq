import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskCard } from "./TaskCard";
import type { Action, Task } from "../types";

let lastOnDragEnd:
  | ((event: unknown, info: { offset: { y: number } }) => void)
  | undefined;

vi.mock("framer-motion", () => ({
  motion: {
    // biome-ignore lint/suspicious/noExplicitAny: test double
    div: (props: any) => {
      if (props.onDragEnd) {
        lastOnDragEnd = props.onDragEnd;
      }
      return <div {...props} />;
    },
  },
  useMotionValue: () => 0,
  useTransform: () => 0,
}));

const makeTask = (text: string): Task => ({
  id: `id-${text.length}`,
  text,
  createdAt: 1,
});

describe("TaskCard", () => {
  it("renders content and short text sizing", () => {
    const dispatch = vi.fn<(action: Action) => void>();
    render(<TaskCard task={makeTask("Short task")} dispatch={dispatch} />);

    expect(screen.getByText("Current Focus")).toBeInTheDocument();
    const title = screen.getByText("Short task");
    expect(title).toBeInTheDocument();
    expect((title as HTMLElement).style.fontSize).toBe("2.5rem");
    expect(screen.getByText("Later")).toBeInTheDocument();
    expect(screen.getByText("Complete")).toBeInTheDocument();
  });

  it("uses medium text sizing", () => {
    const dispatch = vi.fn<(action: Action) => void>();
    const text = "This is a task with more length";
    render(<TaskCard task={makeTask(text)} dispatch={dispatch} />);

    expect((screen.getByText(text) as HTMLElement).style.fontSize).toBe("2rem");
  });

  it("uses small text sizing for long text", () => {
    const dispatch = vi.fn<(action: Action) => void>();
    const text = "This is a very long task that definitely exceeds fifty characters";
    render(<TaskCard task={makeTask(text)} dispatch={dispatch} />);

    expect((screen.getByText(text) as HTMLElement).style.fontSize).toBe("1.5rem");
  });

  it("dispatches later and undo on drag end thresholds", () => {
    const dispatch = vi.fn<(action: Action) => void>();
    render(<TaskCard task={makeTask("Swipe me")} dispatch={dispatch} />);

    lastOnDragEnd?.({}, { offset: { x: 0, y: -150 } });
    expect(dispatch).toHaveBeenCalledWith({ type: "LATER" });

    lastOnDragEnd?.({}, { offset: { x: 0, y: 150 } });
    expect(dispatch).toHaveBeenCalledWith({ type: "UNDO_LATER" });

    dispatch.mockClear();
    lastOnDragEnd?.({}, { offset: { x: 150, y: 0 } });
    expect(dispatch).toHaveBeenCalledWith({ type: "COMPLETE" });

    dispatch.mockClear();
    lastOnDragEnd?.({}, { offset: { x: -150, y: 0 } });
    expect(dispatch).toHaveBeenCalledWith({ type: "UNDO_COMPLETE" });

    dispatch.mockClear();
    lastOnDragEnd?.({}, { offset: { x: 0, y: 0 } });
    expect(dispatch).not.toHaveBeenCalled();
  });
});
