import { afterEach, expect } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";

expect.extend(matchers);

const globalTarget = globalThis as typeof globalThis & {
  localStorage?: Storage;
  crypto?: Crypto;
};

if (!globalTarget.localStorage) {
  const store = new Map<string, string>();
  const localStorageMock = {
    getItem: (key: string) =>
      store.has(key) ? (store.get(key) ?? null) : null,
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
  Object.defineProperty(globalTarget, "localStorage", {
    value: localStorageMock,
  });
}

if (!globalTarget.crypto) {
  Object.defineProperty(globalTarget, "crypto", {
    value: {
      randomUUID: () => Math.random().toString(36).slice(2),
    },
  });
}

afterEach(() => {
  cleanup();
});
