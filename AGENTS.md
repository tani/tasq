# Repository Guidelines

## Project Structure & Module Organization
Core application code lives in `src/`. The Bun server entry is `src/index.ts`, React UI code is in `src/frontend.tsx` and `src/App.tsx`, and reusable UI units are in `src/components/`. State logic is centralized in `src/reducer.ts` with shared types in `src/types.ts`. Stack card layout rules and constants live in `src/stackStyles.ts`.

Tests mirror source areas under `test/` (for example, `test/components/TaskCard.test.tsx`). Test setup and DOM shims are in `test/happydom.ts` and `test/testing-library.ts`. Static assets and PWA icons are stored in `assets/`. Production output is generated into `dist/` by `scripts/build.ts`.

## Build, Test, and Development Commands
- `bun dev`: Run the app in hot-reload development mode from `src/index.ts`.
- `bun start`: Run the production server locally (`NODE_ENV=production`).
- `bun run build`: Build browser assets into `dist/` and copy static assets.
- `bun test`: Run all tests with Bun’s test runner.
- `bun run lint`: Run Biome lint checks.
- `bun run format`: Apply Biome formatting.
- `bun run check`: Run Biome check with safe auto-fixes.
- `bun run quality`: Run `bun run check` and `bun test` together.

Dev helpers:
- `http://localhost:3000/?demo=stack`: In non-production mode, preload a 3-card sample stack for quick visual QA.

## Coding Style & Naming Conventions
Use TypeScript + React with Biome as the source of truth. Formatting is 2-space indentation and double quotes (`biome.json`). Keep component filenames in `PascalCase` (for example, `VoiceInput.tsx`) and utility/state files in `camelCase` or descriptive lowercase (for example, `reducer.ts`).

Prefer small, focused modules and colocated tests. Let Biome organize imports and normalize formatting before opening a PR.

## Testing Guidelines
Testing uses `bun test` with Testing Library and Happy DOM preloaded via `bunfig.toml`. Name tests as `*.test.ts` or `*.test.tsx`, matching the feature or component under test. Add regression tests for reducer changes and interaction tests for UI behavior.

Run `bun run quality` before pushing. If behavior affects rendering or interactions, include at least one test update.

## Commit & Pull Request Guidelines
Recent history uses short, imperative commit subjects (for example, `Reorganize project layout and fix lint`). Follow that style:
- Start with a verb (`Add`, `Fix`, `Refine`, `Migrate`).
- Keep subject concise and specific.

For pull requests, include:
- Clear summary of user-visible and technical changes.
- Linked issue/task ID when available.
- Test evidence (`bun run quality`).
- Screenshots or short recordings for UI changes.
