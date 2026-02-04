import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()], // Use react plugin (since we have it via bun or installed? Wait, I didn't install @vitejs/plugin-react explicitly, but usually it's there in Vite projects. I should check if I need it. Actually I can probably skip it if I just want to run unit tests, but for JSX transformation it is needed. Wait, Bun runs tsx natively. Vitest might need it for React.)
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    css: true, // Process CSS
  },
});
