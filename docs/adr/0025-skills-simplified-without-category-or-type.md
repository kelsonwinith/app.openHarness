# 25. Skills Simplified: Pure Skills Without Category or Type

Date: 2026-10-22

## Status

Accepted

## Context

Previously, skills were classified using a rigid `SkillCategory` taxonomy (`discovery`, `planning`, `build`, `quality`, `docs`). In practice, skills are reusable, composable instruction blocks that can be utilized in any phase or sequence. Forcing skills into arbitrary categories added unnecessary complexity to the UI (filter tabs, select menus, badge tags) and domain model without providing real execution value.

## Decision

1. **Pure Skill Domain Model**:
   - Removed `SkillCategory` and `category` from `Skill` in [`client/lib/domain/types.ts`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/lib/domain/types.ts).
   - A Skill is now defined purely by its identity, name, icon, description, and instructions.
2. **Simplified Skill Library Interface**:
   - In [`client/app/skills/page.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/skills/page.tsx), removed category filter pills and category badges. Replaced with a single clean search bar.
3. **Streamlined Skill Form & Add Dialogs**:
   - In [`client/components/dialogs/skill-form-dialog.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/skill-form-dialog.tsx), removed category selection so creating a skill only asks for name, description, and instructions.
   - In [`client/components/dialogs/add-skill-dialog.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/add-skill-dialog.tsx), removed category filter tabs and category badges.
4. **Cleaned Up Step Cards**:
   - Removed category badges from workflow step items in [`client/app/workflows/[id]/page.tsx`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/workflows/[id]/page.tsx).
5. **Glossary Alignment**:
   - Updated [`GLOSSARY.md`](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/GLOSSARY.md) defining a Skill as a pure, atomic unit of work without category, group, or type.

## Consequences

- The skill catalog is unencumbered by artificial groupings or types.
- Skill authoring and discovery are faster, cleaner, and strictly focused on instruction content.
