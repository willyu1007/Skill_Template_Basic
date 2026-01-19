# Example - Blueprint review checklist

Before applying Stage C, review `init/project-blueprint.json`:

## Checklist

- `project.name` is stable and does not depend on an implementation detail.
- `repo.layout` matches intended structure (`single` vs `monorepo`).
- `capabilities.*` reflect **decisions**, not aspirations (avoid setting `enabled=true` for “maybe later”).
- `skills.packs` includes only what you want enabled now.
- No secrets are present (no tokens, passwords, connection strings).

## Validate

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs validate   --blueprint init/project-blueprint.json
```

## Reconcile packs (recommended)

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs suggest-packs   --blueprint init/project-blueprint.json   --repo-root .
```

