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
- Host plan-mode artifact(s) (optional, read-only input)
  - May exist in the host runtime (Cursor/Codex/other planning surfaces); treat as seed input only and do not overwrite from this skill.

## Plan-mode interoperability
- Runtime signal contract:
  - Planning mode is active only when a reliable runtime signal exists (for example, `collaboration_mode=Plan`) or the user explicitly confirms it.
  - If the signal is missing, ask the user once.
  - If the signal remains unavailable and user confirmation is unavailable, continue as non-Plan mode and record that assumption.
- Seed artifact discovery order:
  1. User-provided artifact paths
  2. Runtime-provided host plan artifact paths
  3. `dev-docs/active/<task>/requirement.md` (when present or generated in Phase 0)
  4. Existing `dev-docs/active/<task>/roadmap.md` (update flow only)
- Merge and conflict policy (required):
  - Build the roadmap draft using set-union over available seed artifacts.
  - Resolve conflicts using this strict precedence:
    1. Latest user-confirmed instruction
    2. `requirement.md`
    3. Host plan-mode artifact
    4. Model inference
  - If conflicts remain unresolved, record them under roadmap open questions/assumptions and do not silently drop them.
- Consistency baseline for dual artifacts:
  - If both host plan artifact and roadmap exist, keep semantic consistency for goal, boundaries, constraints, milestone/phase ordering, and acceptance criteria.
  - `dev-docs/active/<task>/roadmap.md` remains repository SSOT.

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
| 1 | Detect planning-mode context | Use runtime signal when available; otherwise ask user once |
| 2 | Discover seed artifacts | Follow the required discovery order |
| 3 | Restate goal + confirm direction | One sentence |
| 4 | Ask clarifying questions OR record assumptions | Scope, non-goals, success criteria, constraints |
| 5 | Propose + confirm `<task>` slug | kebab-case; skip if confirmed in Phase 0 |
| 6 | Draft roadmap using `./templates/roadmap.md` | Macro-level: phases, deliverables, verification, risks, rollback |
| 7 | Save to `dev-docs/active/<task>/roadmap.md` | Required |
| 8 | Return handoff message | Goal, save path, next 3 actions |

**Step 6 constraints**:
- Include "Project structure change preview" section (may be empty)
- Prefer directory-level paths; use `(none)` or `<TBD>` if unknown
- Do NOT guess project-specific paths without evidence
- Include input trace and merge/conflict decisions in the roadmap draft
- If plan-mode artifacts are available, use them as first-pass inputs and merge by union
- Apply the strict precedence order for conflicts (user-confirmed > requirement.md > host artifact > inference)
- If planning-mode signal is unavailable and user confirmation is unavailable, proceed as non-Plan mode and record the assumption

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
- [ ] Planning-mode signal was checked; if missing, user was explicitly asked once before assuming non-Plan mode
- [ ] Seed artifact discovery order was applied and recorded
- [ ] Merge/conflict resolution applied strict precedence (user-confirmed > requirement.md > host artifact > inference)
- [ ] Unresolved conflicts are preserved as open questions/assumptions
- [ ] (If dual artifacts) Goal, boundaries, constraints, phases, and acceptance criteria are semantically consistent
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
- MUST NOT assume planning mode unless a runtime signal exists or the user explicitly confirms it
- MUST default to non-Plan mode when no reliable signal or user confirmation is available, and record this assumption
- MUST treat `dev-docs/active/<task>/roadmap.md` as repository SSOT
- MUST apply conflict precedence: user-confirmed > requirement.md > host plan artifact > inference
- When the user requests a persistent plan artifact, write the roadmap to `dev-docs/active/<task>/roadmap.md` instead of keeping it only in chat, unless the change is trivial (`< 30 min`)
- If the user asks to implement immediately but the task is non-trivial, produce the roadmap first, then ask for confirmation to proceed with execution in a follow-up turn.
- If the task meets the dev-docs Decision Gate, prompt the user whether to create a full dev-docs task bundle.
- If the user confirms bundle creation, proceed with the dev-docs task bundle workflow in a follow-up turn.
- SHOULD keep the roadmap macro-level; deep design details belong in separate documentation artifacts
- SHOULD NOT include secrets (credentials, tokens, private keys) in the roadmap
- SHOULD preserve semantic consistency across dual artifacts while documenting intentional divergences
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
