# Stage B - Blueprint

## Goal

Convert Stage A documents into a JSON blueprint that drives scaffolding and skill selection.

## Output

- `init/project-blueprint.json`

## Required Fields

| Field | Description |
|-------|-------------|
| `repo.layout` | `single` or `monorepo` |
| `repo.language` | Primary programming language |
| `capabilities.*` | Enabled features (frontend, backend, database) |
| `skills.packs` | At minimum include `workflows` |

## Definition of Done

- [ ] Blueprint passes validation
- [ ] All required fields are populated
- [ ] Tech stack fields match Stage A constraints
- [ ] `skills.packs` includes recommended packs for enabled capabilities

## Commands

```bash
# Validate blueprint
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs validate

# Check pack recommendations
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs suggest-packs

# Approve and advance to Stage C
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs approve --stage B
```

## See also

- Example: `init/skills/initialize-project-from-requirements/templates/project-blueprint.example.json`
- Schema: `init/skills/initialize-project-from-requirements/templates/project-blueprint.schema.json`
- Full reference: `init/reference.md`
