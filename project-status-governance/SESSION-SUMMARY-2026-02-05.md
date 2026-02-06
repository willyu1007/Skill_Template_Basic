# Session Summary: 项目进度管理系统优化

**日期**: 2026-02-05  
**范围**: `.ai/` 项目治理系统、skills、projectctl 工具、可选 Git hooks

---

## 1. 目标

优化项目进度管理系统，使其：
1. 满足项目进度管理与 dev-docs 机制联动需求
2. 层级划分明确，所有 skills 遵循统一标准
3. 具备良好的 LLM 鲁棒性、可执行性、自动化能力

> 审计与对照记录（可回溯）：`dev-docs/active/project-progress-monitoring-audit/00-overview.md`

---

## 2. 发现的问题

### 2.1 术语不一致

| 问题 | 位置 | 影响 |
|------|------|------|
| 任务级使用 "milestones"，与项目级 Milestone (M-xxx) 混淆 | 7 个文件 | LLM 语义歧义 |

### 2.2 LLM 不友好的表述

| 问题 | 位置 | 影响 |
|------|------|------|
| ASCII 流程图占用大量 token，依赖空间解析 | `task-starter`, `CONTRACT.md` | Token 效率低，解析脆弱 |
| 散文式步骤描述 | `plan-maker`, `create-dev-docs-plan` | 语义密度低 |
| 冗余的 Routes A/B/C/D 部分与规则表重复 | `task-starter` | 语义重复 |
| Output 示例过长 | `project-orchestrator` | Token 浪费 |
| 引用不一致 ("Routes A/B/C" vs "R1/R2/R3") | `task-starter` Verification | LLM 混淆 |

### 2.3 功能缺失

| 问题 | 影响 |
|------|------|
| 缺少统一入口 skill | LLM 不确定从哪个 skill 开始 |
| `projectctl` 缺少 `map` 命令 | 无法直接映射 Task → Feature/Requirement |
| CONTRACT.md 缺少 LLM 导航章节 | LLM 缺乏工作流指导 |

### 2.4 审计补充：稳定性与自动化边角

| 问题 | 位置 | 影响 |
|------|------|------|
| `task_id` 分配策略潜在“复用历史 ID”风险（与契约“ID 不复用”精神冲突） | `.ai/scripts/projectctl.mjs` | task_id 可能失去长期稳定性 |
| CLI 提示文案使用 `projectctl init ...`（缺少可执行体） | `.ai/scripts/projectctl.mjs` | 操作指引歧义、降低可执行性 |
| pre-commit 仅识别根 `dev-docs/`，对多 root `dev-docs` 不友好 | `.githooks/pre-commit` | 自动同步覆盖不全 |

---

## 3. 解决方案

### 3.1 统一术语

将任务级 "milestones" 统一改为 "phases"，保留项目级 "Milestone" (M-xxx)。

### 3.2 结构化表述

| 原格式 | 新格式 | 效果 |
|--------|--------|------|
| ASCII 流程图 | 规则表 (first match wins) | Token -60% |
| 散文式步骤 | 表格 | Token -40~55% |
| 冗余 Routes 部分 | 删除，仅保留规则表 | 消除重复 |
| 长示例 | 字段表 + 决策类型表 | Token -50% |

### 3.3 新增功能

| 功能 | 实现 |
|------|------|
| 统一入口 | 新建 `task-starter` skill |
| 任务映射 | `projectctl map --task T-xxx --feature F-xxx` |
| LLM 导航 | CONTRACT.md 第 9 节 Workflow Decision Flow |

---

## 4. 实施细节

### 4.1 术语统一 (7 个文件)

```
.ai/skills/workflows/dev-docs/create-dev-docs-plan/SKILL.md
.ai/skills/workflows/dev-docs/create-dev-docs-plan/templates/01-plan.md
.ai/skills/workflows/dev-docs/create-dev-docs-plan/examples/sample-task-bundle.md
.ai/skills/workflows/planning/plan-maker/SKILL.md
.ai/skills/workflows/planning/plan-maker/templates/roadmap.md
.ai/skills/workflows/planning/plan-maker/reference/detailed-docs-convention.md
.ai/skills/workflows/dev-docs/update-dev-docs-for-handoff/SKILL.md
```

**变更**: `milestones` → `phases` (在任务级上下文中)

### 4.2 CONTRACT.md 新增章节

```markdown
## 9. Workflow Decision Flow (LLM Navigation)

### 9.1 Entry Routing Rules
| Rule | Condition | Action | Output |
|------|-----------|--------|--------|
| R1 | Request is project-level | Use `project-orchestrator` | Triage decision + command sequence |
| R2 | User explicitly requests plan artifact | Use `plan-maker` | `roadmap.md` |
| R3 | Task meets Decision Gate | Use `create-dev-docs-plan` | Task bundle (00-05) |
| R4 | Trivial task | Execute directly | No dev-docs |

### 9.2 Execution Rules
### 9.3 Completion Rules
### 9.4 Skill Responsibilities
```

### 4.3 task-starter skill (新建)

**路径**: `.ai/skills/workflows/planning/task-starter/SKILL.md`

**功能**: 统一入口，基于规则表路由到正确的下游 skill

```markdown
## Routing Rules
| Rule | Condition | Target | Output |
|------|-----------|--------|--------|
| R1 | Project-level | `project-orchestrator` | Triage decision |
| R2 | Plan artifact request | `plan-maker` | roadmap.md |
| R3 | Decision Gate met | `create-dev-docs-plan` | Task bundle |
| R4 | Trivial task | Direct execution | No docs |
```

### 4.4 project-orchestrator 输出优化

**原**: 两个完整示例 (~40 行)  
**新**: 字段表 + 决策类型表 (~15 行)

```markdown
### Output Fields
| Field | Description | Example |
|-------|-------------|---------|
| Decision | `REUSE_TASK` / `NEW_TASK` / `PROJECT_UPDATE` | `NEW_TASK` |
| Rationale | One sentence | "No existing task covers OAuth2" |
| ...

### Next Actions by Decision Type
| Decision | Next Actions |
|----------|--------------|
| NEW_TASK | 1. `create-dev-docs-plan` 2. `projectctl sync` 3. `projectctl lint` |
| ...
```

### 4.5 create-dev-docs-plan Steps 优化

**原**: 散文式 7 步 (~20 行)  
**新**: 单一表格 (~10 行)

```markdown
| Step | File | Required Content |
|------|------|------------------|
| 1 | Create directory | `dev-docs/active/<task-slug>/` |
| 2 | `00-overview.md` | problem, status, goal, non-goals, acceptance |
| ...
```

### 4.6 plan-maker Steps 优化

**原**: Phase 0/1/2 散文式 (~70 行)  
**新**: 3 个表格 (~30 行)

### 4.7 projectctl map 命令

**路径**: `.ai/scripts/projectctl.mjs`

**用法**:
```bash
node .ai/scripts/projectctl.mjs map --task T-001 --feature F-002 --apply
node .ai/scripts/projectctl.mjs map --task T-001 --milestone M-001 --apply
node .ai/scripts/projectctl.mjs map --task T-001 --requirement R-003 --apply
```

**功能**: 将任务映射到 Feature/Milestone/Requirement，自动更新 registry.yaml

### 4.8 审计补充修正（post-PR）

| 项目 | 修正 | 说明 |
|------|------|------|
| `task_id` 分配策略 | 改为单调递增（max+1）并将 registry 里的历史 id 计入占用集 | 降低“复用历史 ID”风险（符合契约精神） |
| CLI 操作指引 | `Run: projectctl init ...` → `node .ai/scripts/projectctl.mjs init ...` | 避免误导 |
| pre-commit 多 root dev-docs | staged 文件匹配 `(^|/)dev-docs/`；stage `**/.ai-task.yaml` 使用 Git pathspec | 覆盖模块化仓库结构 |

### 4.9 二次审计修正

| 项目 | 修正 | 说明 |
|------|------|------|
| CLI 命令简写 | 表格中 `projectctl sync` → `node .ai/scripts/projectctl.mjs sync` | 完整可执行路径，提升 LLM 可执行性 |
| 涉及文件 | `task-starter`, `project-orchestrator`, `CONTRACT.md` | 统一命令格式 |

### 4.10 多项目支持增强

| 项目 | 修正 | 说明 |
|------|------|------|
| pre-commit 多项目 | 自动扫描 `.ai/project/*/registry.yaml` 并同步所有项目 | 支持多项目场景 |
| CONTRACT.md | `--project main` → `--project <project>` | 占位符格式，多项目友好 |

---

## 5. 当前状态

### 5.1 验证结果

| 检查项 | 状态 |
|--------|------|
| `lint-skills.mjs --strict` | ✅ 60/60 通过 |
| `sync-skills.mjs` | ✅ 已同步到 .claude/ 和 .codex/ |
| `projectctl lint --check` | ✅ 通过 |
| `projectctl sync --apply` | ✅ 通过（已生成/更新 hub 派生视图） |
| `projectctl sync --dry-run` | ✅ 通过（无副作用预览可用） |

### 5.2 最终评估

| 维度 | 评分 | 说明 |
|------|------|------|
| 项目进度管理 + dev-docs 联动 | ✅ 满足 | SoT 清晰，同步机制完整 |
| 层级划分一致性 | ✅ 满足 | Milestone (M-xxx) vs Phase (任务内) |
| LLM 鲁棒性 | 9/10 | 规则表格式，显式优先级 |
| LLM 可执行性 | 9/10 | 输出格式明确，命令可复制 |
| 自动化能力 | 8/10 | Git hooks 支持，CLI 工具完整 |

### 5.3 文件变更清单

| 文件 | 操作 |
|------|------|
| `.ai/project/CONTRACT.md` | 修改：添加第 9 节 |
| `.ai/skills/workflows/planning/task-starter/SKILL.md` | 新建 |
| `.ai/skills/workflows/planning/project-orchestrator/SKILL.md` | 修改：优化 Output |
| `.ai/skills/workflows/planning/plan-maker/SKILL.md` | 修改：Steps 表格化 |
| `.ai/skills/workflows/dev-docs/create-dev-docs-plan/SKILL.md` | 修改：Steps 表格化 |
| `.ai/skills/workflows/dev-docs/create-dev-docs-plan/templates/01-plan.md` | 修改：术语 |
| `.ai/skills/workflows/dev-docs/create-dev-docs-plan/examples/sample-task-bundle.md` | 修改：术语 |
| `.ai/skills/workflows/planning/plan-maker/templates/roadmap.md` | 修改：术语 |
| `.ai/skills/workflows/planning/plan-maker/reference/detailed-docs-convention.md` | 修改：术语 |
| `.ai/skills/workflows/dev-docs/update-dev-docs-for-handoff/SKILL.md` | 修改：术语 |
| `.ai/scripts/projectctl.mjs` | 修改：添加 map 命令；修正 task_id 分配与提示文案 |
| `.githooks/install.mjs` | 新增：hooks 安装器（core.hooksPath） |
| `.githooks/pre-commit` | 新增/修改：dev-docs 变更自动 sync（支持多 root） |
| `.githooks/commit-msg` | 新增：conventional commit 校验 |
| `.ai/project/AGENTS.md` | 修改：补充 hooks 使用说明 |
| `dev-docs/active/project-progress-monitoring-audit/00-overview.md` | 新增：审计 bundle（评估记录） |

---

## 6. 后续建议

| 项目 | 优先级 | 说明 |
|------|--------|------|
| `projectctl map` 的校验与联动 | 中 | 校验 `F-/M-/R-` ID 格式；或在文档中明确 “map 后需要 sync 刷新派生视图” |
| 单元测试 | 低 | 为 `projectctl`（尤其 lint/sync/map）补最小单测，降低回归风险 |
| milestone/requirement 视图增强 | 低 | dashboard 增强：按 milestone 汇总、按 requirement 反查任务（非必需） |

---

## 7. 后续补充：description-only 路线调整（2026-02-05）

为降低 skill 触发条件冗余与语义漂移风险，仓库改为以 skill frontmatter `description` 作为唯一触发 SSOT。

- 删除 `task-starter` skill（包含 `.codex/` 与 `.claude/` 的对应 stubs）。
- 移除 `AGENTS.md`、`.ai/AGENTS.md`、`.ai/project/AGENTS.md`、`.ai/project/CONTRACT.md` 中的路由表与 “what to use when”。
- 将 `project-orchestrator`、`project-sync-lint`、`project-status-reporter`、`plan-maker` 的 `description` 改为语义描述，去除关键词列表与强触发词模式。
- `.ai/project/CONTRACT.md` 不再承载 LLM 导航逻辑，仅保留 SoT 与不变量。

触发不稳定时，优先调整对应 skill 的 `description`，避免新增外部路由表导致语义漂移。
