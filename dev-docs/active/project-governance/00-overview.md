# 00 Overview

## Status
- State: in-progress
- Next step: Implement repo-level Project Governance SSOT + scripts (projectctl) and add the two new skills.

## Goal
Add project-level progress aggregation and governance for this template repo, without changing the existing task-level `dev-docs/**` execution workflow.

## Non-goals
- Do not initialize `.ai/project/main/` in this template repo by default (init remains a script action).
- Do not change existing product code (this repo is a template).
- Do not require Python; use dependency-free Node ESM (`.mjs`) scripts.

## Context
The repo already supports task-level execution context via `dev-docs/active/<task>/...`, but lacks a project-level hub for milestones/features/requirements/tasks mapping, deduplication, and progress aggregation across tasks.

## Acceptance criteria (high level)
- [ ] Repo contains `.ai/project/CONTRACT.md` and `.ai/project/AGENTS.md` (English).
- [ ] Repo contains two new skills under `.ai/skills/workflows/planning/`: `project-orchestrator` and `project-sync-lint`.
- [ ] Repo contains `node .ai/scripts/projectctl.mjs` with `init`, `lint`, and `sync` commands.
- [ ] Lint policy matches agreed rules (dev-bundle is progress SoT; `.ai-task.yaml` is identity SoT; warnings for drift).
- [ ] CI templates used by `cictl.mjs` include a project governance lint step (non-blocking on warnings).
