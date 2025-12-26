---
name: initialize-project-from-requirements
description: Use this only in repos that still include the init/ bootstrap kit to produce Stage A/B/C artifacts, update skill pack selection, and sync provider skill wrappers.
---

# Initialize a Project From Requirements

## Purpose

Turn an early project idea into **verifiable, file-based** outputs:

- **Stage A (Requirements)**: four requirement documents under `docs/project/`
- **Stage B (Blueprint)**: a machine-readable `docs/project/project-blueprint.json`
- **Stage C (Scaffold + Skills)**: a minimal scaffold + skill pack manifest update + wrapper sync via `node .ai/scripts/sync-skills.js`

This skill is designed to be **bootstrap-only**. After initialization, you may remove the `init/` kit.

## When to use

Use this when:

- The repo still contains an `init/` directory (bootstrap kit present).
- The user needs a clear, reviewable project description before implementation starts.
- You want deterministic initialization outputs (docs + blueprint + minimal scaffold + skills enabled).

Do NOT use this when:

- The repo has already been initialized and `docs/project/project-blueprint.json` is stable.
- The user is asking for implementation work unrelated to initialization.
- You do not have permission to generate or modify repo files.

## Inputs

- Repo root path (or run from repo root).
- Stage A docs root: `docs/project/` (created from templates in `templates/`)
- Stage B blueprint: `docs/project/project-blueprint.json`

Optional inputs:

- Provider set for wrapper sync: `both` (default), or `codex`, `claude`, `codex,claude`.

## Outputs

- Stage A docs (created/updated by the authoring process):
  - `docs/project/requirements.md`
  - `docs/project/non-functional-requirements.md`
  - `docs/project/domain-glossary.md`
  - `docs/project/risk-open-questions.md`
- Stage B blueprint:
  - `docs/project/project-blueprint.json`
- Stage C scaffold (directories only; no framework code):
  - `src/` or (`apps/`, `packages/`) depending on `repo.layout`
- Skills enabled (SSOT):
  - `.ai/skills/_meta/sync-manifest.json` updated (collection: `current`)
- Provider wrappers regenerated:
  - via `node .ai/scripts/sync-skills.js`

## Critical Process Rules (MUST follow)

### Rule 1: State Tracking

- Before starting, check for existing `init/.init-state.json`
- If found, resume from recorded state (ask user to confirm)
- If not found, run `node init-pipeline.js start` to create initial state
- State is automatically updated by pipeline commands
- State file will be deleted when `cleanup-init` is run

### Rule 2: Mandatory Checkpoints

- **EVERY stage transition requires explicit user approval**
- Use prompts from `templates/stage-checkpoints.md`
- Do NOT proceed without user saying "继续" / "approved" / "yes"

### Rule 3: Quality Self-Review

- Before requesting user approval, complete the relevant checklist in `templates/quality-checklist.md`
- If any checklist item is "No", iterate before proceeding

---

## Steps

### Stage A: interview → requirement docs (verifiable)

1. **Initialize state**: Run `node init-pipeline.js start` to create `init/.init-state.json`.
2. Use `templates/conversation-prompts.md` to run a structured requirements interview.
3. Update state as each question is answered (`stageA.mustAsk.*`).
4. Draft the four Stage A documents using templates under `templates/`.
5. **Self-review**: Complete Stage A checklist in `templates/quality-checklist.md`.
6. Validate Stage A docs:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.js check-docs --docs-root docs/project
```

Use strict mode when you need a hard gate (CI / regulated workflows):

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.js check-docs --docs-root docs/project --strict
```

7. **CHECKPOINT A→B**: Use prompt from `templates/stage-checkpoints.md` to request user approval.
8. Wait for explicit user approval before proceeding.

### Stage B: requirements → blueprint (machine-readable)

1. Create `docs/project/project-blueprint.json` based on the Stage A docs.
2. Validate the blueprint:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.js validate   --blueprint docs/project/project-blueprint.json
```

3. Reconcile packs with capabilities (warn-only by default):

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.js suggest-packs   --blueprint docs/project/project-blueprint.json   --repo-root .
```

If you want to **add missing recommended packs** into the blueprint (safe-add only):

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.js suggest-packs   --blueprint docs/project/project-blueprint.json   --repo-root .   --write
```

4. **Self-review**: Complete Stage B checklist in `templates/quality-checklist.md`.
5. **CHECKPOINT B→C**: Use prompt from `templates/stage-checkpoints.md` to request user approval.
6. Wait for explicit user approval before proceeding.

### Stage C: scaffold + enable packs + sync wrappers

1. Dry-run the scaffold plan:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.js scaffold   --blueprint docs/project/project-blueprint.json   --repo-root .
```

2. Apply scaffold + manifest update + wrapper sync:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.js apply   --blueprint docs/project/project-blueprint.json   --repo-root .   --providers codex,claude   --require-stage-a
```

3. (Optional) Generate base config files:

```bash
node init/skills/initialize-project-from-requirements/scripts/scaffold-configs.js   --blueprint docs/project/project-blueprint.json   --repo-root .   --apply
```

4. **Self-review**: Complete Stage C checklist in `templates/quality-checklist.md`.
5. **CHECKPOINT C Complete**: Use prompt from `templates/stage-checkpoints.md` to confirm completion.
6. (Optional) Remove the bootstrap kit after user explicitly requests:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.js cleanup-init   --repo-root .   --apply   --i-understand
```

## Boundaries

- Do not invent requirements. Resolve ambiguity with the user, or record it as TBD in `docs/project/risk-open-questions.md`.
- Do not add provider-specific assumptions into Stage A docs or the blueprint.
- Do not edit `.codex/skills/` or `.claude/skills/` directly. Only update SSOT in `.ai/skills/` and run `node .ai/scripts/sync-skills.js`. (This repo’s SSOT rule applies.) 
- Scaffolding MUST NOT overwrite existing files; it should only create missing directories and small placeholder `README.md` files.

## Included assets

### Templates

- `templates/conversation-prompts.md` - Question bank for Stage A interview
- `templates/requirements.template.md` - Stage A requirements doc template
- `templates/non-functional-requirements.template.md` - Stage A NFR doc template
- `templates/domain-glossary.template.md` - Stage A glossary template
- `templates/risk-open-questions.template.md` - Stage A risks template
- `templates/project-blueprint.example.json` - Stage B blueprint example
- `templates/project-blueprint.schema.json` - Stage B blueprint JSON schema
- `templates/init-state.schema.json` - State tracking schema (NEW)
- `templates/init-state.example.json` - Initial state template (NEW)
- `templates/quality-checklist.md` - Semantic quality self-review (NEW)
- `templates/stage-checkpoints.md` - User approval prompts (NEW)
- `templates/scaffold-configs/` - Base config file templates (NEW)

### Scripts

- `scripts/init-pipeline.js` - Main pipeline script (validate, check-docs, scaffold, apply, cleanup)
- `scripts/scaffold-configs.js` - Config file generator (NEW)

### Examples

- `examples/quickstart.md` - Quick start guide
- `examples/blueprint-review.md` - Blueprint review walkthrough

