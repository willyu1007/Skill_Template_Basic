---
name: project-orchestrator
description: Front-door project work orchestrator for this repo. Use when starting or continuing any development request that needs triage, deduplication, mapping to the project mainline (Milestone/Feature/Requirement/Task), or deciding whether to reuse an existing task or register a new one. Maintains project-level continuity via the project hub under .ai/project/<project>/ (registry + changelog + derived views coordination). Keywords: triage, dedupe, mapping, milestone, feature, requirement, task, registry, dashboard.
---

# Project Orchestrator

## Purpose
Provide a **single front door** for project-level governance:
- Prevent duplicate work
- Keep semantic mapping clean (Feature/Requirement <-> Task)
- Advance the project mainline (milestones, priorities)
- Keep the project hub consistent with ongoing work

This skill is **project-management oriented**. It should not implement product code changes.

## When to use
Use this skill when the request involves any of the following:
- Starting a new development request (feature, bug fix, refactor, integration)
- Continuing work but needing to locate the right task or decide whether to create a new task
- Mapping work to Milestones/Features/Requirements
- Updating project status, milestones, priorities, scope, or archival decisions
- Writing project-level updates (`registry.yaml`, `changelog.md`) to maintain long-term continuity

## When to avoid
Avoid using this skill for purely local implementation within an already-scoped task when no scope/status/mapping changes are needed. In those cases, use task-level execution skills and rely on `project-sync-lint` for eventual consistency.

## Inputs
- Natural-language request (new work or continuation)
- Optional: constraints (scope, deadlines, dependencies)
- Optional: pointers to existing task docs (`dev-docs/**/active/<task>/...`)

## Process (high-level)
1. Ensure the project hub exists.
   - If missing, instruct to run:
     - `node .ai/scripts/projectctl.mjs init --project main`
2. Load the current project state:
   - Prefer reading `.ai/project/main/registry.yaml`
   - Run lint for sanity if needed:
     - `node .ai/scripts/projectctl.mjs lint --check --project main`
3. Search for related work:
   - Look for matching Features/Requirements/Tasks in `registry.yaml`
   - Cross-check existing task bundles under `dev-docs/**` when needed
4. Decide: reuse an existing Task vs propose a new Task.
5. If a new Task is needed:
   - Propose a stable task slug (kebab-case)
   - Do **not** create the task bundle in this skill
   - Instruct to create a task bundle (via task-level workflow), then register it:
     - Create the task bundle at: `dev-docs/active/<slug>/`
     - Run: `node .ai/scripts/projectctl.mjs sync --apply --project main`
6. Update project hub semantics (when needed):
   - Update `registry.yaml` to map Milestone/Feature/Requirement <-> Task
   - Append a human-readable event to `changelog.md`
7. Regenerate derived views (optional, but recommended after mapping changes):
   - `node .ai/scripts/projectctl.mjs sync --apply --project main`

## Outputs
- An explicit triage decision:
  - Matched Task(s) with rationale and next action, OR
  - New Task proposal (slug + mapping intent) and next steps
- Project hub updates under `.ai/project/main/` when applicable

## Verification
- If you updated project hub files:
  - `node .ai/scripts/projectctl.mjs lint --check --project main`
- If you changed SSOT skills:
  - `node .ai/scripts/lint-skills.mjs --strict`
  - `node .ai/scripts/sync-skills.mjs --scope current --providers both --mode reset --yes`

## Boundaries
- Do not implement product code changes in this workflow.
- Do not create task bundles under `dev-docs/**` (delegate to task-level workflows).
- Do not edit generated stubs under `.codex/` or `.claude/` directly.

## Contract
All behavior MUST follow `.ai/project/CONTRACT.md`.
- Do not introduce new files or rename contract files without explicit approval.
- Do not duplicate task execution details into the project hub; keep references and summaries only.
