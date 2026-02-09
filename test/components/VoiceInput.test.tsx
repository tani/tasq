import { describe, expect, it, jest, mock } from "bun:test";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VoiceInput } from "../../src/components/VoiceInput";
import type { Action } from "../../src/types";

const instances: MockSpeechRecognition[] = [];

class MockSpeechRecognition {
  start = mock(() => {});
  stop = mock(() => {});
  onresult:
    | ((event: { results: Array<Array<{ transcript: string }>> }) => void)
    | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  continuous = false;
  lang = "";
  interimResults = false;
  constructor() {
    instances.push(this);
  }
}

const setupSpeechRecognition = () => {
  instances.length = 0;
  Object.defineProperty(window, "SpeechRecognition", {
    value: MockSpeechRecognition,
    writable: true,
  });
  Object.defineProperty(window, "webkitSpeechRecognition", {
    value: MockSpeechRecognition,
    writable: true,
  });
};

describe("VoiceInput", () => {
  it("toggles keyboard input and submits text", async () => {
    setupSpeechRecognition();
    const dispatch = mock<(action: Action) => void>(() => {});
    const user = userEvent.setup();
    render(<VoiceInput dispatch={dispatch} />);

    await user.click(
      screen.getByRole("button", { name: /toggle keyboard input/i }),
    );
    const input = screen.getByRole("textbox", { name: /type a task/i });
    expect(input).toHaveFocus();

    await user.type(input, "  New Task  ");
    await user.click(screen.getByRole("button", { name: /add task/i }));
    expect(dispatch).toHaveBeenCalledWith({ type: "ADD", payload: "New Task" });
  });

  it("ignores empty submissions", async () => {
    setupSpeechRecognition();
    const dispatch = mock<(action: Action) => void>(() => {});
    const user = userEvent.setup();
    render(<VoiceInput dispatch={dispatch} />);

    await user.click(
      screen.getByRole("button", { name: /toggle keyboard input/i }),
    );
    const form = screen
      .getByRole("button", { name: /add task/i })
      .closest("form");
    expect(form).toBeTruthy();
    fireEvent.submit(form as HTMLFormElement);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("starts and stops speech recognition", async () => {
    setupSpeechRecognition();
    const dispatch = mock<(action: Action) => void>(() => {});
    const user = userEvent.setup();
    render(<VoiceInput dispatch={dispatch} />);

    const micButton = screen.getByRole("button", { name: /start recording/i });
    await user.click(micButton);
    expect(instances[0].start).toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /stop recording/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /stop recording/i }));
    expect(instances[0].stop).toHaveBeenCalled();

    act(() => {
      instances[0].onend?.();
    });
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /start recording/i }),
      ).toBeInTheDocument();
    });
  });

  it("dispatches transcript on speech result and handles error", () => {
    setupSpeechRecognition();
    const dispatch = mock<(action: Action) => void>(() => {});
    render(<VoiceInput dispatch={dispatch} />);

    instances[0].onresult?.({
      results: [[{ transcript: "Hello" }]],
    });
    expect(dispatch).toHaveBeenCalledWith({ type: "ADD", payload: "Hello" });

    instances[0].onresult?.({
      results: [[{ transcript: "" }]],
    });
    expect(dispatch).toHaveBeenCalledTimes(1);

    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    instances[0].onerror?.({ error: "network" });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("alerts when speech recognition is not supported", async () => {
    Object.defineProperty(window, "SpeechRecognition", {
      value: undefined,
      writable: true,
    });
    Object.defineProperty(window, "webkitSpeechRecognition", {
      value: undefined,
      writable: true,
    });
    const alertSpy = mock(() => {});
    Object.defineProperty(window, "alert", {
      value: alertSpy,
      writable: true,
    });
    const dispatch = mock<(action: Action) => void>(() => {});
    const user = userEvent.setup();
    render(<VoiceInput dispatch={dispatch} />);

    await user.click(screen.getByRole("button", { name: /start recording/i }));
    expect(alertSpy).toHaveBeenCalled();
  });
});
