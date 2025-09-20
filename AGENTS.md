# Repository Guidelines

## Project Structure & Module Organization
The repository hosts two deliverables: `congressional-insight-explorer/`, a Vite + React + TypeScript front-end, and `data_analysis/`, a static prototype that renders raw JSON-LD. Within the explorer, source lives in `src/`, with `components/` for UI (Graph, DetailPane, MultiModal), `lib/` for parsing and state, `data/` for JSON-LD assets, and `styles/` for Tailwind utilities; production output lands in `dist/` and static assets stay in `public/`. The prototype relies on `app.js`, `styles.css`, and supporting JSON-LD under `data/`, `raw_data/`, and `schemas/`. Continuous deployment publishes the Vite build through `.github/workflows/deploy.yml`.

## Build, Test, and Development Commands
Inside `congressional-insight-explorer/`, install dependencies once with `npm install`. Use `npm run dev` to launch Vite at `http://localhost:5173`, `npm run build` for a typed production bundle (`tsc -b` + `vite build`), `npm run preview` (or `npm run serve`) to verify the built output, and `npm run lint` for the ESLint suite. For the static prototype, serve locally with any static server, e.g. `npx http-server data_analysis` and open `index.html` in a browser.

## Coding Style & Naming Conventions
Write new features in TypeScript and prefer functional React components. Keep logic colocated with features, rely on types from `src/lib/types`, and respect the ESLint configuration (TypeScript + React Hooks + React Refresh). Follow the existing 2-space indentation, single quotes, and PascalCase component names; choose descriptive camelCase for hooks, stores, and helpers. Tailwind utility strings should progress layout → spacing → color while reusing tokens such as `bg-primary-blue` defined in `tailwind.config.js`. The vanilla prototype should continue the modular helper pattern established in `app.js`.

## Testing Guidelines
Automated tests are not yet present; when adding them, prefer Vitest with Testing Library and place specs alongside the code (`ComponentName.test.tsx`). Cover both data transformations (e.g., `lib/data-processor`) and interactive flows. Until then, perform manual QA of the graph, search modal, transcript timelines, and dataset fetches before submitting changes.

## Commit & Pull Request Guidelines
Git history follows conventional commits (`feat:`, `fix:`, `chore:`). Keep subjects imperative and under 72 characters, with focused changes per commit. Pull requests should summarize scope, link issues, note affected data files, and attach screenshots or GIFs for UI updates. Run `npm run lint` and the relevant build command before requesting review, and document any data migrations or schema shifts in the PR description.
