# Stage B - Blueprint (machine-readable)

## Goal

Convert Stage A documents into a JSON blueprint that can drive scaffolding and skill selection.

## Output (file)

- `docs/project/project-blueprint.json`

Start from:
- `init/skills/initialize-project-from-requirements/templates/project-blueprint.example.json`

Schema reference:
- `init/skills/initialize-project-from-requirements/templates/project-blueprint.schema.json`

## Steps

1. Encode only the decisions needed for scaffolding and skill selection.
2. Keep implementation detail in Stage A docs (not in the blueprint).
3. Populate tech stack fields:
   - `repo.language`: primary programming language (typescript, javascript, python, go, java, dotnet, other)
   - `repo.packageManager`: package manager (npm, pnpm, yarn, pip, poetry, go, maven, gradle, dotnet, other)
   - `capabilities.frontend.framework`: frontend framework (if frontend is enabled)
   - `capabilities.backend.framework`: backend framework (if backend is enabled)
4. Select `skills.packs` (at minimum include `workflows`).

## Verification

Blueprint validation:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.js validate   --blueprint docs/project/project-blueprint.json
```

Pack reconciliation (recommended):

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.js suggest-packs   --blueprint docs/project/project-blueprint.json   --repo-root .
```

