> 目标：在 Claude Code 中正确放置、编写、触发 Skills，并解释本仓库的 `.ai/ssot` ↔ `.claude` 生成关系。

## 1. Claude Code 的 Skills 是什么
- **一个 skill = 一个目录**，目录内必须有 `SKILL.md`。
- `SKILL.md` 需要 **YAML frontmatter**（至少 `name`、`description`），正文用 Markdown 写操作规范/知识库/流程。
- 可选的同目录文件：`resources/`、示例、脚本等；在 `SKILL.md` 里用相对路径引用即可。

## 2. Claude Code 识别 skills 的路径
- **个人 skills**：`~/.claude/skills/<skill-name>/SKILL.md`
- **项目 skills**：`<repo>/.claude/skills/<skill-name>/SKILL.md`

> 结论：如果你在用 Claude Code，项目用 `.claude/` 承接 skills 是符合官方约定的。

## 3. Claude Code 如何触发/使用 skills
- Claude 会根据你的请求与 `description` 的关键词/意图，**自动决定是否使用**某个 skill。
- 你也可以在对话里 **显式点名**（例如写出 skill 名称），以提高命中率。
- 这与 **slash commands**（你手动输入 `/xxx`）不同：skills 是“自动选择”，commands 是“用户显式调用”。

## 4. 本仓库的规范（SSOT）与 `.claude/` 的关系
本仓库采用 **SSOT（Single Source of Truth）**：
- 只维护 `.ai/ssot/` 为唯一事实源：
  - `.ai/ssot/skills/`：技能
  - `.ai/ssot/workflows/`：工作流（在 Claude 侧会生成到 `.claude/agents/`）
  - `.ai/ssot/commands/`：可复用命令（在 Claude 侧会生成到 `.claude/commands/`）
- `.claude/` 是 **生成产物**（可删可重建），不要手改。

生成/同步命令：
- `node .ai/scripts/adapt.js claude`

## 5. 常见坑：你在用的不是 Claude Code
如果你运行的是 **OpenAI Codex CLI**，它不会读取 `.claude/skills`；你需要生成/放置到 `.codex/skills`（见 `construction/OpenAI_Codex_Skills.md`）。
