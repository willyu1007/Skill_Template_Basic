# Project Initialization

> Human-facing documentation. If you are an LLM/AI assistant, skip this file to save tokens and follow `init/AGENTS.md` instead.

A **3-stage, verifiable** pipeline for initializing projects from requirements.

| Stage | Output | Verification |
|-------|--------|--------------|
| **A** | Requirement docs in `init/stage-a-docs/` | `check-docs` |
| **B** | Blueprint at `init/project-blueprint.json` | `validate` |
| **C** | Scaffold + skill wrappers | `apply` |

## Quick Start

### AI-assisted (recommended)

Ask your LLM to follow `init/AGENTS.md`.

### Manual

```bash
# 1. Initialize templates and state
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs start

# 2. Edit Stage A docs, then validate
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs check-docs

# 3. Approve Stage A
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs approve --stage A

# 4. Edit blueprint, then validate
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs validate

# 5. Approve Stage B
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs approve --stage B

# 6. Apply scaffold and wrappers
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs apply --providers both

# 7. Complete initialization
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs approve --stage C
```

## Documentation

| File | Purpose |
|------|---------|
| `AGENTS.md` | LLM instructions (main entry point) |
| `reference.md` | Redirect to the “Reference” section in this README |
| `stages/` | Stage-specific checklists |
| `skills/.../SKILL.md` | Full skill documentation |

## Post-init Cleanup

```bash
# Optional: remove agent-builder if not needed
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs prune-agent-builder --apply --i-understand

# Optional: archive and remove init kit
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs cleanup-init --apply --i-understand --archive
```

## Reference

### Conclusions (read first)

- Stage A produces **human-readable SSOT** for intent under `init/stage-a-docs/` (archive to `docs/project/` after init if needed).
- Stage B produces **machine-readable SSOT** for automation: `init/project-blueprint.json`.
- Stage C is deterministic:
  - scaffold directories based on `repo.layout` and enabled capabilities
  - update `.ai/skills/_meta/sync-manifest.json` (based on `skills.packs`)
  - regenerate provider wrappers by running `node .ai/scripts/sync-skills.mjs --scope current --providers both --mode reset --yes`
- The init kit is bootstrap-only. You may remove `init/` after success (guarded by `init/.init-kit`).

### 1. Definitions

- **Stage A (Requirements)**: docs defining scope, users, acceptance criteria, constraints, and non-goals.
- **Stage B (Blueprint)**: JSON decisions that drive scaffolding and skill selection deterministically.
- **Stage C (Scaffold + Skills)**: creates minimal directories, selects packs, and syncs wrappers.

### 2. Command Reference

#### 2.1 `start`

Initialize state file and create template files.

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs start --repo-root .
```

Creates:
- `init/.init-state.json` - state tracking file
- `init/stage-a-docs/*.md` - Stage A document templates
- `init/project-blueprint.json` - Stage B blueprint template

#### 2.2 `status`

Show current initialization progress.

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs status --repo-root .
```

#### 2.3 `check-docs`

Validate Stage A documents.

```bash
# Normal mode
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs check-docs

# Strict mode (treats warnings as errors)
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs check-docs --strict
```

#### 2.4 `validate`

Validate Stage B blueprint.

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs validate
```

#### 2.5 `suggest-packs`

Recommend skill packs based on blueprint capabilities.

```bash
# Warn-only (default)
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs suggest-packs

# Auto-add missing recommended packs
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs suggest-packs --write
```

#### 2.6 `approve`

Approve current stage and advance to next stage.

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs approve --stage A
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs approve --stage B
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs approve --stage C
```

#### 2.7 `scaffold`

Dry-run scaffold plan.

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs scaffold
```

#### 2.8 `apply`

Apply scaffold + manifest update + wrapper sync.

```bash
# Standard apply
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs apply --providers both

# With agent-builder removal
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs apply --providers both --skip-agent-builder --i-understand
```

#### 2.9 `prune-agent-builder`

Remove `.ai/skills/workflows/agent` after initialization.

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs prune-agent-builder --apply --i-understand
```

#### 2.10 `cleanup-init`

Remove the init kit (optionally archive to `docs/project/` first).

```bash
# Dry-run
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs cleanup-init --i-understand

# Apply with archive
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs cleanup-init --apply --i-understand --archive
```

### 3. Stage A validation details

#### 3.1 What `check-docs` validates (MUST)

Given `--docs-root <path>` (default: `init/stage-a-docs`), it checks:

- All required files exist:
  - `requirements.md`
  - `non-functional-requirements.md`
  - `domain-glossary.md`
  - `risk-open-questions.md`
- Each file contains minimum required headings.
- No template placeholders remain (e.g., `<name>`, `- ...`, `: ...`).

#### 3.2 What `check-docs` does NOT validate

- Whether requirements are "correct" or "complete" for the business.
- Whether acceptance criteria cover all edge cases.
- Whether NFR targets are realistic.

#### 3.3 Strict mode

- `--strict` treats **warnings** (TBD/TODO markers) as failures.

### 4. Requirements → Blueprint mapping

#### 4.1 Mapping principles (MUST)

- Blueprint encodes **decisions needed for scaffolding and pack selection only**.
- Do not encode implementation details unless they are hard constraints.
- If undecided, record as TBD in `init/stage-a-docs/risk-open-questions.md`.

#### 4.2 Blueprint fields that MUST be explicit

- `repo.layout`: `single` or `monorepo`
- `repo.language`: primary language
- `capabilities.frontend.enabled` and/or `capabilities.backend.enabled`
- `skills.packs`: include at least `workflows`

### 5. Capabilities → Packs mapping

| Capability / intent | Suggested pack |
|---|---|
| always | `workflows` |
| backend enabled | `backend` |
| frontend enabled | `frontend` |
| database enabled | `data` |
| BPMN enabled | `diagrams` |
| CI / containerize | `ops` |

### 6. Cleanup safety rules

- `cleanup-init` refuses to run unless `init/.init-kit` exists.
- Use `--archive` to copy init inputs into `docs/project/` before cleanup.
- On some platforms, the script renames `init/` to `.init-trash-<timestamp>` before deletion.
