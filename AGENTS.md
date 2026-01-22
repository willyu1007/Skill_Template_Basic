# AI Assistant Instructions

**AI-Friendly Repository Template** - a starter kit for creating LLM-optimized codebases.

## Project Type

Template repository. Users clone the repo to start new AI-friendly projects.

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `init/` | **Start here** - Initialization instructions |
| `.ai/` | Skills, scripts, LLM governance (see `.ai/AGENTS.md`) |
| `dev-docs/` | Working documentation for complex tasks |

## Routing

| Task Type | Entry Point |
|-----------|-------------|
| **First time / Project setup** | `init/AGENTS.md` |
| **Skill authoring / maintenance** | `.ai/AGENTS.md` |
| **LLM engineering** | `.ai/llm-config/AGENTS.md` |
| **Complex task documentation** | `dev-docs/AGENTS.md` |

## Global Rules

- For complex tasks (multi-module, multi-session, >2 hours), create task docs under `dev-docs/active/`
- Always edit `.ai/skills/` (SSOT), never edit `.codex/` or `.claude/` directly
- Follow progressive disclosure: read only the file you are routed to
- On context reset for ongoing work, read `dev-docs/active/<task-slug>/00-overview.md` first

## Coding Standards (RECOMMEND)

- **ESM (.mjs)**: All scripts in the repo use ES Modules with `.mjs` extension. Use `import`/`export` syntax, not `require()`.

## Coding Workflow (MUST)

- Before modifying code/config for a task that meets the Decision Gate in `dev-docs/AGENTS.md`, create/update the dev-docs task bundle as required.
- If the user asks for planning artifacts (plan/roadmap/milestones/implementation plan) before coding:
  - If the task meets the Decision Gate, use `plan-maker` first, then ask for confirmation to proceed with implementation.
  - If the task is trivial (<30 min), provide an in-chat plan (do NOT write under `dev-docs/`).
  - If the task needs context preservation (multi-session, handoff) or qualifies as complex, follow `dev-docs/AGENTS.md` and use dev-docs workflows.

## Workspace Safety (MUST)

- NEVER create/copy/clone this repository into any subdirectory of itself (no nested repo copies).
- Create throwaway test repos **outside** the repo root (OS temp or a sibling directory) and delete them after verification.
- Keep temporary workspaces shallow: if a path is getting deeply nested or has exceeded **12 path segments** total;, stop and clean up instead of continuing.

