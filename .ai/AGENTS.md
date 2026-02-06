# `.ai/` (LLM-facing)

## Purpose

`.ai/` stores **LLM-facing** assets for repo governance:
- Skills (SSOT)
- Maintenance scripts (lint/sync/checks)
- LLM engineering governance entry points

## Non-negotiables

- **SSOT**: edit skills only under `.ai/skills/`.
- **Generated stubs**: do not edit `.codex/skills/` or `.claude/skills/` directly. Regenerate via sync.
- **Progressive disclosure**: do not recursively enumerate `.ai/` to "discover" content.

## Skill selection (description-only)

Select skills by semantic match to each skill’s frontmatter `description`.
Do not maintain routing tables in this file. When selection drifts, update the relevant skill description instead.

## Context loading rules (token-efficient)

AI/LLM MUST:
- Read only the **single** file it is routed to.
- Open additional files only when an already-opened doc provides an explicit path.

AI/LLM MUST NOT:
- Run recursive listing/grep over `.ai/` (e.g., `tree .ai`, `rg --files .ai`).

## Verification (repo maintenance)

- Lint skills: `node .ai/scripts/lint-skills.mjs --strict`
- Sync stubs: `node .ai/scripts/sync-skills.mjs --scope current --providers both --mode reset --yes`
- Delete skills: `node .ai/scripts/sync-skills.mjs --delete-skills <name|path> --delete-scope all --clean-empty --yes` (preview with `--dry-run`)
- LLM config key gate: `node .ai/skills/workflows/llm/llm-engineering/scripts/check-llm-config-keys.mjs`
- LLM registry sanity: `node .ai/skills/workflows/llm/llm-engineering/scripts/validate-llm-registry.mjs`
