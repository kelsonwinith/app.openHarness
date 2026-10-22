# 27. Simplified Settings View

Date: 2026-10-22

## Status

Accepted

## Context

Following the complete removal of standalone runs and the focus on project-native session execution, the Settings page (`/settings`) still displayed simulation speed controls and legacy mock sample data loaders meant for run simulations.

## Decision

1. **Removed Simulation Speed**:
   - Removed `simSpeed` tick rate buttons (1x, 2x, 4x) from [`client/app/settings/page.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/settings/page.tsx).
2. **Focused Settings Sections**:
   - Organized settings into three essential core panels:
     1. **Appearance & Theme**: Light, Dark, System.
     2. **Default CLI Agent Harness**: OpenCode, Codex, Antigravity, Claude Code.
     3. **Data Storage & Persistence**: Configuration export (`.json`) and reset console state.
     4. **Architectural References**: GLOSSARY and ADR links.

## Consequences

- Clean, uncluttered settings page matching the modern minimalist console aesthetic.
- Eliminates vestigial run simulation controls.
