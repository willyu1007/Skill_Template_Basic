# Stage C - Scaffold + Skills

## Goal

Create a minimal scaffold and enable the right skill packs, then sync provider wrappers.

## Outputs

| Output | Location |
|--------|----------|
| Scaffold directories | `src/` or `apps/` + `packages/` |
| Manifest | `.ai/skills/_meta/sync-manifest.json` |
| Provider wrappers | `.codex/skills/`, `.claude/skills/` |
| Root docs | `README.md`, `AGENTS.md` |

## Definition of Done

- [ ] Scaffold directories created (no overwrites)
- [ ] Manifest updated with selected packs
- [ ] Provider wrappers regenerated
- [ ] Root `README.md` and `AGENTS.md` updated from blueprint
- [ ] Skill retention reviewed (`review-skill-retention` completed)
- [ ] (Optional) Agent builder pruned if not needed

## Commands

```bash
# Dry-run scaffold
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs scaffold

# Apply scaffold + manifest + wrappers
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs apply --providers both

# Apply without agent-builder
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs apply --providers both --skip-agent-builder --i-understand

# (Required) Mark skill retention reviewed (blocks Stage C approval until done)
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs review-skill-retention

# Approve and complete initialization
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs approve --stage C

# (Optional) Re-generate root docs (README.md + AGENTS.md)
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs update-root-docs --apply
```

## Post-init options

```bash
# Prune agent-builder after init (if decided later)
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs prune-agent-builder --apply --i-understand

# Cleanup init kit (optionally archive first)
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs cleanup-init --apply --i-understand --archive
```

`--archive` copies Stage A docs + blueprint into `docs/project/overview/` by default (override with `--archive-dir`).

## See also

- Config templates: `init/skills/initialize-project-from-requirements/templates/scaffold-configs/`
- Full reference: `init/reference.md`
