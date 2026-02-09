import { type FormEvent, useEffect, useRef, useState } from "react";
import type { Action } from "../types";

interface VoiceInputProps {
  dispatch: (action: Action) => void;
}

export function VoiceInput({ dispatch }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [showKeyboard, setShowKeyboard] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Initialize SpeechRecognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = "ja-JP"; // Default to Japanese as per context
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          dispatch({ type: "ADD", payload: transcript });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [dispatch]);

  useEffect(() => {
    if (showKeyboard) {
      inputRef.current?.focus();
    }
  }, [showKeyboard]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = typedText.trim();
    if (!trimmed) {
      return;
    }
    dispatch({ type: "ADD", payload: trimmed });
    setTypedText("");
  };

  return (
    <form className="d-flex align-items-center gap-3" onSubmit={handleSubmit}>
      <div className="position-relative">
        <button
          type="button"
          onClick={toggleListening}
          className={`btn position-relative d-flex align-items-center justify-content-center rounded-circle border-0 z-2 text-white ${isListening ? "btn-danger recording-pulse" : "btn-primary shadow-lg"}`}
          style={{
            width: "72px",
            height: "72px",
            transform: isListening ? "scale(1.1)" : "scale(1)",
            transition:
              "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
          aria-label={isListening ? "Stop Recording" : "Start Recording"}
        >
          {isListening ? (
            <i className="bi bi-stop-fill fs-2" />
          ) : (
            <i className="bi bi-mic-fill fs-3" />
          )}
        </button>

        {/* Ambient glow behind button when idle */}
        {!isListening && (
          <div
            className="position-absolute top-50 start-50 translate-middle bg-primary rounded-circle z-1 opacity-50"
            style={{
              width: "60px",
              height: "60px",
              filter: "blur(20px)",
            }}
          ></div>
        )}
      </div>

      <button
        type="button"
        className="btn btn-outline-light rounded-circle d-flex align-items-center justify-content-center"
        style={{ width: "56px", height: "56px" }}
        onClick={() => setShowKeyboard((prev) => !prev)}
        aria-label="Toggle keyboard input"
        aria-expanded={showKeyboard}
      >
        <i className="bi bi-keyboard fs-4" aria-hidden="true" />
      </button>

      <div
        className={`input-group input-group-lg ${showKeyboard ? "" : "d-none"}`}
      >
        <input
          ref={inputRef}
          type="text"
          className="form-control bg-dark text-white border-secondary"
          placeholder="Type a task"
          value={typedText}
          onChange={(event) => setTypedText(event.target.value)}
          aria-label="Type a task"
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!typedText.trim()}
          aria-label="Add task"
        >
          Add
        </button>
      </div>
    </form>
  );
}

// Type definition for Web Speech API
declare global {
  interface Window {
    // biome-ignore lint/suspicious/noExplicitAny: Web Speech API types not available
    SpeechRecognition: any;
    // biome-ignore lint/suspicious/noExplicitAny: Web Speech API types not available
    webkitSpeechRecognition: any;
  }
}
