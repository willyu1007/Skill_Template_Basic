# 项目进度监控改动说明

读完本文，你应当能够：
- 理解项目级进度监控的动机与边界
- 知道进度 SoT 在哪里，以及如何被汇总
- 使用最少命令完成查询、校验、同步和可选的变更日志追加

## 动机
- 以 LLM 为主要执行者时，需要一个**项目级视图**来汇总多任务进度，但不能打破 `dev-docs/**` 的既有执行流程。
- 需要**可机器校验**的进度来源（SoT），避免“元数据自说自话”。
- 需要兼容多 `dev-docs` 根目录的模块化仓库结构。
- 需要可集成到 CI 的轻量检查，防止任务信息漂移。

## 方案
- 进度 SoT MUST 在任务执行层：`dev-docs/**/active/<task>/00-overview.md` 的 `- State:`。
- 任务身份 SoT MUST 在 `.ai-task.yaml`（`task_id`），`status` 仅作展示。
- 项目语义图 SoT MUST 在 `.ai/project/<project>/registry.yaml`（Milestone/Feature/Requirement/Task）。
- 项目级派生视图（dashboard / task-index / feature-map）MUST NOT 作为 SoT。

## 实施细节
- 新增项目治理入口与契约：
  - `.ai/project/AGENTS.md`
  - `.ai/project/CONTRACT.md`
- 新增两项 workflow skills（SSOT）：
  - `.ai/skills/workflows/planning/project-orchestrator/`
  - `.ai/skills/workflows/planning/project-sync-lint/`
- 新增治理脚本（依赖 Node ESM，无第三方依赖）：
  - `.ai/scripts/ctl-project-governance.mjs`
  - 命令：`init`、`lint`、`sync`、`query`
  - 选项：`sync --changelog` 追加注册/状态变更事件到 `changelog.md`
- `dev-docs` 模版对齐：`00-overview.md` 的 `- State:` 统一为单值，默认 `planned`。
- CI 集成：`ctl-ci.mjs` 生成的 GitHub Actions / GitLab CI 模版内置治理 lint。
- 多根 `dev-docs`：优先使用 `registry.yaml.project.task_doc_roots`，缺省自动发现。

## 期望效果
- LLM 只需维护 `dev-docs/**` 进度，即可通过 `ctl-project-governance sync` 自动汇总到项目级视图。
- 去重/检索靠 `ctl-project-governance query`（JSONL 输出，便于 LLM 消费）。
- CI 通过 `ctl-project-governance lint --check` 提前发现漂移或不一致。
- 项目级 `changelog.md` 在需要时可由 `sync --changelog` 自动追加关键事件。

## 使用与验证
推荐最小命令集：
```bash
node .ai/scripts/ctl-project-governance.mjs query --project main --text "<keywords>"
node .ai/scripts/ctl-project-governance.mjs lint --check --project main
node .ai/scripts/ctl-project-governance.mjs sync --apply --project main
node .ai/scripts/ctl-project-governance.mjs sync --apply --project main --changelog
```

注意：`sync --changelog` 只追加“注册/状态变更”类事件，其他事件仍需手工补充。
