# Relay — Agent Harness Console (Next.js Client)

A web console to compose agent workflows from reusable skills and observe their execution on CLI harnesses (OpenCode, Codex, Antigravity, Claude Code).

## Architecture & Standards

- **Next.js App Router**: Discrete routing (`/workflows`, `/workflows/[id]`, `/runs`, `/skills`, `/settings`) with a persistent layout **Run Drawer** (ADR 0003).
- **Zustand State Stores**: Independent stores for workflows, skills, runs, and modal/drawer UI state.
- **Repository Adapter**: Clean abstraction layer decoupling in-browser simulated runs from future real CLI / SSE harness APIs (ADR 0004).
- **Domain Alignment**: Strictly adheres to [`GLOSSARY.md`](../GLOSSARY.md), [ADR 0001](../docs/adr/0001-workflows-reference-shared-skills.md), and [ADR 0002](../docs/adr/0002-harness-agnostic-workflows.md).
- **Design System**: shadcn/ui default **Zinc** theme with full dark/light mode support, Lucide icons, and Radix UI primitives.

## Getting Started

```bash
cd client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Commands

- `npm run dev`: Start local development server
- `npm run build`: Production Next.js build
- `npm run lint`: Run ESLint checks
