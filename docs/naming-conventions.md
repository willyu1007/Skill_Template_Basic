# Naming Conventions (directories / files / identifiers)

## 1. Purpose
The goals of these naming conventions are:
- **Scriptability**: scripts can locate files reliably with fewer branches.
- **Portability**: cross OS/IDE/provider moves should require zero or minimal renaming.
- **Readability**: humans and LLMs can infer purpose and scope from names.

## 2. Global rules (MUST)
- Use **kebab-case** (lowercase + hyphens) by default: `skill-name`, `switch-provider`.
- Avoid spaces and special characters (except `.`-prefixed directories). Recommended charset: `[a-z0-9-._]`.
- Directory names express "scope/role"; file names express "type/content". Avoid non-maintainable buckets like `misc/` or `temp/`.

## 3. Directory layout (MUST)
### 3.1 SSOT (not at repo root)
- SSOT root is fixed: `.ai/ssot/`
- SSOT subdirectories are fixed:
  - `.ai/ssot/skills/`
  - `.ai/ssot/workflows/` (or `.ai/ssot/agents/`, pick one; `workflows/` is recommended)
  - `.ai/ssot/commands/`

### 3.2 Provider artifacts (follow provider conventions)
- Provider artifact root is fixed: `.<provider>/skills/`
  - `codex` → `.codex/skills/`
  - `claude` → `.claude/skills/`
  - `cursor` → `.cursor/skills/`
  - `copilot` → `.copilot/skills/`
  - `gemini` → `.gemini/skills/`

Notes:
- For providers **without a documented skills directory standard**, this template still uses `.<provider>/skills/` as a **unified artifact entry point**. Adapters/scripts are responsible for mapping to the provider's actual consumable shape.

### 3.3 Adapters and templates (not at repo root)
- Adapter implementation / intermediate layer: `.ai/providers/<provider>/`
- Source templates: `.ai/templates/`

### 3.4 Other top-level directories (recommended)
- `docs/`: standards, design docs, ADRs, guides (use descriptive, readable titles; optional numeric prefixes)
- `scripts/`: script entrypoints (cross-platform can share the same base name with different suffixes, e.g. `switch-provider.ps1` / `switch-provider.sh`)
- `construction/` (or `init/`): bootstrap materials and `project-profile.yaml/json`

## 4. Skill / Workflow / Command naming
### 4.1 Skills
- Path: `.ai/ssot/skills/<skill-name>/SKILL.md`
- `<skill-name>`: kebab-case; encode capability/domain/tool; avoid ambiguous names. Examples: `skill-creator`, `repo-init`, `doc-style-guide`.
- Resources: `.ai/ssot/skills/<skill-name>/resources/<topic>.md` (topic is kebab-case)

### 4.2 Workflows (or agents)
- Name by intent/process: `refactor-planner`, `release-checklist`.
- Suggested path: `.ai/ssot/workflows/<workflow-name>.md`

### 4.3 Commands
- Name as "verb + target": `dev-docs`, `switch-provider`, `project-init`.
- Suggested path: `.ai/ssot/commands/<command-name>.md`

## 5. Provider identity strings (script interface)
Scripts MUST accept the following fixed provider identity strings:
- `codex`, `claude`, `cursor`, `copilot`, `gemini`

Do not use aliases like `openai`, `anthropic`, or `gh-copilot`. If aliases are necessary, map them internally in scripts, but keep artifact directory names compliant with this standard.

## 6. Versioning and changes (SHOULD)
- Prefer explicit version fields / change logs for SSOT content (exact fields are defined by the skill/workflow specs).
- If the directory structure changes, update all of:
  - `docs/naming-conventions.md`
  - `docs/documentation-guidelines.md`
  - path constants/mappings in `scripts/`
  - usage examples in `README.md`
