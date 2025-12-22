# Provider Adapter

A unified adapter that transforms SSOT content into provider-specific artifacts.

## Supported Providers
| Provider | Target Directory | Notes |
|----------|-----------------|-------|
| `claude` | `.claude/` | Claude Code official format |
| `codex` | `.codex/` | OpenAI Codex format |
| `cursor` | `.cursor/` | Cursor IDE format |
| `copilot` | `.copilot/` | GitHub Copilot format |
| `gemini` | `.gemini/` | Google Gemini format |

## Usage
```powershell
# Windows
./.ai/scripts/adapt.ps1 -Provider claude

# Linux/macOS
bash ./.ai/scripts/adapt.sh claude
```

## Adaptation Logic
The adapter performs:
1. **Directory Mapping**: Copies SSOT to `.[provider]/` directory.
2. **Structure Adaptation**: Adjusts subdirectory names based on provider conventions.
3. **Format Validation**: Ensures output matches provider expectations.

## Provider-Specific Adaptations

### Claude Code
- Skills: `.[provider]/skills/[name]/SKILL.md`
- Workflows: `.[provider]/agents/*.md`
- Commands: `.[provider]/commands/*.md`

### Cursor / Copilot / Others
- Skills: `.[provider]/skills/[name]/SKILL.md`
- Workflows: `.[provider]/workflows/*.md`
- Commands: `.[provider]/commands/*.md`

## SSOT Authority
Always edit in `.ai/ssot/`. The adapter generates read-only provider artifacts.


