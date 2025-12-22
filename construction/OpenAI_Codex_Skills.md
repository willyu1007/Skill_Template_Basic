> 目标：在 OpenAI Codex CLI 中正确放置、编写、触发 Skills，并解释为什么仅有 `.claude/` 会“不生效”。

## 1. Codex 的 Skills 是什么
- **一个 skill = 一个目录**，目录内必须有 `SKILL.md`。
- `SKILL.md` 用 Markdown 写指令，且需要 **YAML frontmatter**（至少 `name`、`description`）。
- 可选：`resources/`、`scripts/`、`assets/` 等，按需由 `SKILL.md` 引用。

## 2. Codex 会从哪些位置加载 skills
Codex 支持两类位置：
- **Repo skills（推荐团队共享）**：`<repo>/.codex/skills/<skill-name>/SKILL.md`
- **User skills（个人全局）**：`$CODEX_HOME/skills/<skill-name>/SKILL.md`（例如 `~/.codex/skills/...`）

> 结论：Codex **不会读取** `.claude/skills`。如果你的项目只放了 `.claude/`，那么在 Codex 里看起来就是“并不符合使用规范/不会触发”。

## 3. Codex 如何触发/使用 skills
- Codex 会基于你的请求与 `description` 的内容，**自动选择**合适的 skills。
- 你也可以在提示词中 **显式点名** skill（例如直接写出 skill 名称，或使用类似 `$skill-name` 的形式），以提高命中率。

## 4. 本仓库如何生成 `.codex/skills`
本仓库采用 **SSOT（Single Source of Truth）**：
- 只维护 `.ai/ssot/skills/` 为技能源；然后用适配脚本生成 provider 目录。

生成 Codex 产物：
- `node .ai/scripts/adapt.js codex`

生成后你会得到：
- `.codex/skills/<skill-name>/SKILL.md`

## 5. “当前项目承接skills目录为 `.claude/`”的修正建议
- 如果你主要用 **Codex**：把 repo 级 skills 放在 `.codex/skills/`（用上面的脚本生成），不要指望 `.claude/` 生效。
- 如果你同时支持 **Claude + Codex**：保留 `.claude/` 给 Claude Code，用脚本同时生成 `.codex/` 给 Codex；唯一维护点始终是 `.ai/ssot/`。
