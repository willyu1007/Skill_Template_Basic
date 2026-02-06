---
name: plan-maker
description: Create a goal-aligned macro-level roadmap artifact (dev-docs/active/<task>/roadmap.md) by asking clarifying questions and recording assumptions; planning only (no code changes).
---

# Plan Maker

## Purpose
Produce a single, goal-aligned macro-level roadmap as a Markdown document that can guide execution without modifying the codebase.

## When to use
Use the plan-maker skill when:
- The user wants a saved roadmap/plan artifact under `dev-docs/active/` (not just an in-chat outline), unless the change is trivial (`< 30 min`)
- The user asks for a plan/phases/implementation plan before coding
- The user asks to "align thinking first" or "clarify direction" before planning
- The task is large/ambiguous and benefits from staged execution and verification
- You need a roadmap artifact saved under `dev-docs/active/` for collaboration and handoff

Avoid the skill when:
- The change is trivial (<30 min) and does not benefit from staged execution/verification
- A roadmap already exists and only minor edits are needed (update the existing roadmap instead)

## Inputs
- Task goal (required)
  - If the goal is ambiguous or missing critical constraints, you MUST ask clarifying questions before drafting the roadmap.
- Requirements source (optional):
  - **Existing document**: User provides a path to an existing requirements document; plan-maker reads and extracts key points
  - **Interactive collection**: Collect requirements through Q&A dialogue with the user
  - **Both**: Read existing document AND supplement with interactive Q&A
- Requirements alignment mode (optional):
  - If user requests "align thinking first" or "clarify direction", generate requirements document to `dev-docs/active/<task>/requirement.md` before creating roadmap
  - See `./templates/requirement.md` for the requirements document template

## Outputs
- `dev-docs/active/<task>/roadmap.md` (always)
  - `<task>` is a short filesystem-safe slug derived from the goal and confirmed with the user.
- `dev-docs/active/<task>/requirement.md` (optional, when requirements alignment mode is active)
  - Generated when user requests "align thinking first" or provides existing requirements document

## Steps

### Phase 0 — Requirements alignment (optional)

| Step | Condition | Action |
|------|-----------|--------|
| 0 | User asks "align thinking first" OR provides requirements doc | Proceed to 0a; else skip to Phase 1 |
| 0a | Existing doc provided | Read + extract (goal, use cases, boundaries, constraints) + confirm |
| 0a | Interactive collection | Ask: core goal, use cases (2-5), non-goals, constraints + confirm |
| 0b | Alignment mode active | Save to `dev-docs/active/<task>/requirement.md` + confirm before Phase 1 |

### Phase 1 — Roadmap creation (core)

| Step | Action | Notes |
|------|--------|-------|
| 1 | Restate goal + confirm direction | One sentence |
| 2 | Ask clarifying questions OR record assumptions | Scope, non-goals, success criteria, constraints |
| 3 | Propose + confirm `<task>` slug | kebab-case; skip if confirmed in Phase 0 |
| 4 | Draft roadmap using `./templates/roadmap.md` | Macro-level: phases, deliverables, verification, risks, rollback |
| 5 | Save to `dev-docs/active/<task>/roadmap.md` | Required |
| 6 | Return handoff message | Goal, save path, next 3 actions |

**Step 4 constraints**:
- Include "Project structure change preview" section (may be empty)
- Prefer directory-level paths; use `(none)` or `<TBD>` if unknown
- Do NOT guess project-specific paths without evidence

### Phase 2 — dev-docs linkage (conditional)

| Condition | Action |
|-----------|--------|
| Task meets Decision Gate (>2h OR multi-session OR high-risk OR cross-cutting) | Prompt user: "Create full dev-docs bundle?" |
| User confirms | Proceed with the dev-docs task bundle workflow using the roadmap as input |
| Criteria not met | Note in handoff: roadmap is sufficient |

## Verification
- [ ] Goal is restated and (where needed) confirmed with the user
- [ ] Ambiguities are resolved or recorded as explicit open questions/assumptions
- [ ] (If alignment mode) Requirements document saved to `dev-docs/active/<task>/requirement.md`
- [ ] (If alignment mode) User confirmed requirements understanding before roadmap creation
- [ ] Roadmap includes phases and per-step deliverables
- [ ] Roadmap includes "Project structure change preview" section (may be empty)
- [ ] Roadmap defines verification/acceptance criteria and a rollback strategy
- [ ] Roadmap is saved to `dev-docs/active/<task>/roadmap.md`
- [ ] dev-docs Decision Gate evaluated; user prompted for full bundle if criteria met
- [ ] No application/source/config files were modified

## Boundaries
- MUST NOT modify application/source code, project configuration, or database state
- MUST ask clarifying questions when the goal or constraints are ambiguous
- MUST NOT invent project-specific facts (APIs, file paths, schemas) without evidence
- When the user requests a persistent plan artifact, write the roadmap to `dev-docs/active/<task>/roadmap.md` instead of keeping it only in chat, unless the change is trivial (`< 30 min`)
- If the user asks to implement immediately but the task is non-trivial, produce the roadmap first, then ask for confirmation to proceed with execution in a follow-up turn.
- If the task meets the dev-docs Decision Gate, prompt the user whether to create a full dev-docs task bundle.
- If the user confirms bundle creation, proceed with the dev-docs task bundle workflow in a follow-up turn.
- SHOULD keep the roadmap macro-level; deep design details belong in separate documentation artifacts
- SHOULD NOT include secrets (credentials, tokens, private keys) in the roadmap
- PRODUCES macro-level roadmaps: phases, scope, impact, risks, rollback strategy
- PRODUCES requirements documents (when alignment mode is active)
- DOES NOT produce implementation-level documentation (architecture diagrams, step-by-step code guides, pitfalls logs)
- The roadmap is a planning artifact; detailed implementation docs belong to a separate documentation bundle

## Included assets
- Templates:
  - `./templates/roadmap.md` (roadmap document)
  - `./templates/requirement.md` (requirements alignment document)
- Reference: `./reference/detailed-docs-convention.md` (optional file layout convention)
- Example: `./examples/sample-roadmap.md`
