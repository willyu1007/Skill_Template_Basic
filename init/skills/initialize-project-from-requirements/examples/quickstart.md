# Example - Quick start (AI-assisted)

1. Ask your LLM to follow `init/AGENTS.md`.
2. Review Stage A docs under `init/stage-a-docs/`.
3. Validate Stage A docs:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs check-docs --docs-root init/stage-a-docs
```

4. Review Stage B blueprint at `init/project-blueprint.json` and validate:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs validate   --blueprint init/project-blueprint.json
```

5. Dry-run scaffold:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs scaffold   --blueprint init/project-blueprint.json   --repo-root .
```

6. Apply Stage C (scaffold + manifest + wrapper sync):

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs apply   --blueprint init/project-blueprint.json   --repo-root .   --providers codex,claude   --require-stage-a
```

7. Optional cleanup (remove init kit):

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs cleanup-init   --repo-root .   --apply   --i-understand --archive
```
