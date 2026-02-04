import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { Window as HappyWindow } from "happy-dom";
import { afterEach } from "vitest";

const globalTarget = globalThis as typeof globalThis & {
  window?: Window;
  document?: Document;
  navigator?: Navigator;
  localStorage?: Storage;
  crypto?: Crypto;
};

if (!globalTarget.window) {
  const dom = new HappyWindow();
  globalTarget.window = dom as unknown as Window;
  globalTarget.document = dom.document;
  globalTarget.navigator = dom.navigator;
}

if (!globalTarget.localStorage) {
  const store = new Map<string, string>();
  const localStorageMock = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value.toString());
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
  Object.defineProperty(window, "localStorage", { value: localStorageMock });
}

if (!globalTarget.crypto) {
  Object.defineProperty(globalTarget, "crypto", {
    value: {
      randomUUID: () => Math.random().toString(36).substring(7),
    },
  });
}

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
