# Stage C - Scaffold + Skills (deterministic)

## Goal

Create a minimal scaffold and enable the right skill packs, then sync provider-native wrappers.

## Inputs

- Blueprint: `docs/project/project-blueprint.json`
- Repo skill SSOT: `.ai/skills/`
- Sync script: `.ai/scripts/sync-skills.js`

## Outputs

- Minimal scaffold directories (framework-agnostic, no overwrites)
- `.ai/skills/_meta/sync-manifest.json` updated (collection: `current`)
- `.codex/skills/` and/or `.claude/skills/` regenerated (wrappers)

## Steps

1. Dry-run scaffold (required): Review what will be created.
2. Check config template coverage:
   - The `apply` command will auto-generate config files if a template exists for the selected `repo.language` + `repo.packageManager` combination.
   - Available templates: `typescript-pnpm`, `go`, `cpp-xmake`, `react-native-typescript`.
   - If no template exists, provide guidance on essential config files needed and suggest using framework-specific CLI tools.
3. Apply scaffold + manifest update + wrapper sync.
4. Optionally remove the `init/` kit after success.

## Verification

Dry-run scaffold:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.js scaffold   --blueprint docs/project/project-blueprint.json   --repo-root .
```

Apply (writes changes):

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.js apply   --blueprint docs/project/project-blueprint.json   --repo-root .   --providers both
```

Optional cleanup:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.js cleanup-init   --repo-root .   --apply   --i-understand
```

