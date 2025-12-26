# Stage Checkpoints (Mandatory User Approval)

## Conclusions (read first)

- **EVERY stage transition requires explicit user approval.**
- AI MUST NOT proceed to the next stage without user saying "approved" / "continue" / "yes" or equivalent.
- This prevents runaway automation and ensures user stays in control.

---

## Checkpoint A → B: Requirements Complete

### When to Trigger

After ALL of these conditions are met:
1. All 4 Stage A docs exist under `docs/project/`
2. `check-docs` passes (or `--strict` if required)
3. AI has completed the quality checklist self-review

### Prompt to User

```
## Stage A 完成检查点

我已完成需求文档的撰写：
- ✅ requirements.md
- ✅ non-functional-requirements.md  
- ✅ domain-glossary.md
- ✅ risk-open-questions.md

验证结果：
- `check-docs`: [PASS/FAIL]
- 质量自检: [已完成]

### 请您审查

1. 请查看 `docs/project/` 下的 4 个文档
2. 确认内容符合您的预期
3. 如有修改意见，请告诉我

### 确认进入下一阶段

如果您对 Stage A 满意，请回复 **"继续"** 或 **"approved"**，我将开始生成项目蓝图 (Stage B)。

如果需要修改，请告诉我具体的修改点。
```

### AI MUST

- Wait for explicit user approval
- If user requests changes, iterate until approved
- Record approval in `init/.init-state.json` (`stageA.userApproved: true`)

---

## Checkpoint B → C: Blueprint Complete

### When to Trigger

After ALL of these conditions are met:
1. `docs/project/project-blueprint.json` exists
2. `validate` command passes
3. `suggest-packs` has been reviewed (user aware of recommended packs)
4. AI has completed the quality checklist self-review

### Prompt to User

```
## Stage B 完成检查点

我已生成项目蓝图：
- 📄 docs/project/project-blueprint.json

验证结果：
- `validate`: [PASS/FAIL]
- 推荐技能包: [workflows, backend, frontend, ...]
- 当前技能包: [workflows, backend, frontend, ...]

### 蓝图摘要

| 字段 | 值 |
|------|-----|
| 项目名称 | {{project.name}} |
| 仓库布局 | {{repo.layout}} |
| 语言 | {{repo.language}} |
| 前端 | {{capabilities.frontend.enabled}} |
| 后端 | {{capabilities.backend.enabled}} |
| 数据库 | {{capabilities.database.enabled}} |

### 请您审查

1. 请查看 `docs/project/project-blueprint.json`
2. 确认技能包选择符合项目需求
3. 如有修改意见，请告诉我

### 确认进入下一阶段

如果您对 Stage B 满意，请回复 **"继续"** 或 **"approved"**，我将开始创建项目脚手架 (Stage C)。

如果需要修改，请告诉我具体的修改点。
```

### AI MUST

- Wait for explicit user approval
- Show pack suggestions and let user decide
- Record approval in `init/.init-state.json` (`stageB.userApproved: true`)

---

## Checkpoint C: Scaffold Complete

### When to Trigger

After ALL of these conditions are met:
1. `scaffold --apply` has completed
2. Manifest updated
3. Wrappers synced
4. AI has completed the quality checklist self-review

### Prompt to User

```
## Stage C 完成检查点

项目初始化已完成：

### 创建的目录结构

{{scaffold_summary}}

### 启用的技能包

{{enabled_packs}}

### 验证

- `sync-manifest.json`: 已更新
- Provider wrappers: 已生成
  - `.codex/skills/`: {{codex_skill_count}} 个技能
  - `.claude/skills/`: {{claude_skill_count}} 个技能

### 下一步

1. **保留文档**: `docs/project/` 下的文档是项目的需求基线，请保留
2. **清理 init 目录** (可选): 如果您确定不再需要初始化工具，可以运行:
   ```bash
   node init/skills/initialize-project-from-requirements/scripts/init-pipeline.js cleanup-init --repo-root . --apply --i-understand
   ```
3. **开始开发**: 您现在可以使用已启用的技能开始开发了

### 确认初始化完成

如果您确认初始化已完成，请回复 **"完成"** 或 **"done"**。

如果您想清理 init 目录，请回复 **"清理 init"** 或 **"cleanup init"**。
```

### AI MUST

- Wait for explicit user confirmation
- Only run cleanup-init if user explicitly requests it
- Record completion in `init/.init-state.json` (`stage: "complete"`)

---

## Emergency Stop

At any point, if user says:
- "停止" / "stop" / "cancel" / "abort"

AI MUST:
1. Immediately stop the current operation
2. Summarize what has been done
3. Explain what has NOT been done
4. Save current state to `init/.init-state.json`
5. Wait for user instructions

---

## State Recovery

If a session is interrupted, AI should:

1. Check for existing `init/.init-state.json`
2. If found, resume from the recorded state
3. Prompt user: "检测到未完成的初始化状态，是否从 Stage [X] 继续？"

**Note**: The state file is stored in `init/` and will be deleted when `cleanup-init` is run. This is intentional - the state is temporary working data, not a permanent record.

