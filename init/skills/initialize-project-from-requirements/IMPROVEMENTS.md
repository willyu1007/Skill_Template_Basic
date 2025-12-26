# 改进方案总结

本文档总结了对 `initialize-project-from-requirements` 技能的四项核心改进。

---

## 改进概览

| # | 改进 | 解决的问题 | 新增文件 |
|---|------|-----------|---------|
| 1 | 对话流程状态追踪 | AI 可能不遵循对话流程 | `init-state.*.json` |
| 2 | 语义质量自检 | check-docs 只检查结构 | `quality-checklist.md` |
| 3 | 脚手架增强 | 只生成目录不生成配置 | `scaffold-configs/`, `scaffold-configs.js` |
| 4 | 阶段确认检查点 | 流程可能一路到底 | `stage-checkpoints.md` |

---

## 改进 1：对话流程状态追踪

### 问题

当前对话引导依赖 AI "自觉"遵循 `conversation-prompts.md`，没有状态追踪机制。如果会话中断或 AI 跳过某些问题，无法检测。

### 解决方案

引入 `init/.init-state.json` 状态文件，追踪：

- 当前阶段 (`stage: A/B/C/complete`)
- Stage A 每个必问问题的状态 (`asked`, `answered`, `writtenTo`)
- 分支模块的适用性和完成状态
- 文档撰写进度
- 用户批准状态
- 历史事件日志

### 新增文件

```
templates/
├── init-state.schema.json    # 状态文件的 JSON Schema
└── init-state.example.json   # 初始状态模板
```

### 使用方式

状态文件存放在 `init/.init-state.json`，会在 `cleanup-init` 时一起删除。

```bash
# 查看当前状态
node init-pipeline.js status

# 开始新的初始化（创建状态文件）
node init-pipeline.js start

# 进入下一阶段（检查条件 + 更新状态）
node init-pipeline.js advance
```

---

## 改进 2：语义质量自检机制

### 问题

`check-docs` 命令只验证：
- 文件是否存在
- 必需章节是否存在
- 模板占位符是否已替换

它**不验证**内容的语义质量，比如：
- 需求是否可测试
- 用户旅程是否完整
- 成功指标是否可量化

### 解决方案

引入 `quality-checklist.md`，包含每个阶段的语义检查清单。AI 必须在请求用户批准前完成自检。

### 新增文件

```
templates/
└── quality-checklist.md    # 语义质量自检清单
```

### 检查清单示例

**Stage A - A3. MUST Requirements**:
- [ ] Does each MUST requirement have a **testable** acceptance criterion?
- [ ] Are MUST requirements **independent** (not duplicating each other)?
- [ ] Are there **3–10** MUST requirements (not too few, not too many)?
- [ ] Would a developer know when this requirement is "done"?

### 使用方式

AI 在每个阶段结束时：
1. 打开 `quality-checklist.md`
2. 逐项回答 Yes/No
3. 如果有 No，与用户迭代
4. 全部 Yes 后才请求用户批准

---

## 改进 3：脚手架增强

### 问题

当前 `scaffold` 命令只生成目录结构和占位 README，不生成任何配置文件。用户还需要手动创建 `package.json`、`tsconfig.json` 等。

### 解决方案

新增 `scaffold-configs.js` 脚本，根据 blueprint 中的 `repo.language` 和 `repo.packageManager` 生成基础配置文件。

### 新增文件

```
scripts/
└── scaffold-configs.js           # 配置文件生成脚本

templates/scaffold-configs/
└── typescript-pnpm/
    ├── package.json.template     # package.json 模板
    ├── tsconfig.json.template    # tsconfig.json 模板
    ├── pnpm-workspace.yaml.template  # monorepo workspace 配置
    └── .gitignore.template       # .gitignore 模板
```

### 使用方式

```bash
# 预览（dry-run）
node init/skills/initialize-project-from-requirements/scripts/scaffold-configs.js \
  --blueprint docs/project/project-blueprint.json \
  --repo-root .

# 应用
node init/skills/initialize-project-from-requirements/scripts/scaffold-configs.js \
  --blueprint docs/project/project-blueprint.json \
  --repo-root . \
  --apply
```

### 模板变量

模板文件支持 `{{variable}}` 语法，变量从 blueprint 中提取：

- `{{project.name}}` - 项目名称
- `{{project.description}}` - 项目描述
- `{{repo.layout}}` - 仓库布局
- `{{repo.language}}` - 语言
- `{{repo.packageManager}}` - 包管理器

### 扩展

要支持更多语言/包管理器组合，只需创建对应的模板目录：

```
templates/scaffold-configs/
├── typescript-pnpm/     # TypeScript + pnpm
├── typescript-npm/      # TypeScript + npm
├── python-poetry/       # Python + poetry
└── go/                  # Go
```

---

## 改进 4：阶段确认检查点

### 问题

原流程可以一路执行到底，没有强制的用户确认机制。用户可能：
- 不知道当前进度
- 无法在关键点审查输出
- 被动接受 AI 的决定

### 解决方案

引入强制检查点，AI 必须在阶段转换时：
1. 展示当前阶段的输出摘要
2. 使用标准化的提示请求用户批准
3. 等待明确的用户确认（"继续"/"approved"/"yes"）
4. 不得在没有确认的情况下进入下一阶段

### 新增文件

```
templates/
└── stage-checkpoints.md    # 阶段确认提示模板
```

### 检查点

| 检查点 | 触发条件 | 用户需确认 |
|--------|---------|-----------|
| A → B | Stage A 文档完成 + check-docs 通过 | 需求文档是否符合预期 |
| B → C | Blueprint 完成 + validate 通过 | 蓝图配置是否正确 |
| C Complete | Scaffold + Sync 完成 | 初始化是否完成 |

### 提示示例

```markdown
## Stage A 完成检查点

我已完成需求文档的撰写：
- ✅ requirements.md
- ✅ non-functional-requirements.md  
- ✅ domain-glossary.md
- ✅ risk-open-questions.md

验证结果：
- `check-docs`: PASS
- 质量自检: 已完成

### 确认进入下一阶段

如果您对 Stage A 满意，请回复 **"继续"** 或 **"approved"**。
```

### 紧急停止

用户随时可以说 "停止"/"stop"/"cancel"，AI 必须：
1. 立即停止当前操作
2. 保存当前状态
3. 等待用户指示

---

## 集成到 SKILL.md

所有改进已集成到 `SKILL.md` 的流程描述中：

1. **Critical Process Rules** 新章节定义了三条必须遵循的规则
2. Stage A/B/C 步骤中增加了自检和检查点步骤
3. **Included assets** 章节更新，列出所有新增文件

---

## 未来改进方向

1. **init-pipeline.js 集成** - 将状态追踪和检查点逻辑集成到主脚本中
2. **更多语言模板** - 添加 Python、Go、Java 等语言的 scaffold 配置模板
3. **LLM 语义验证** - 使用 AI 自动检查文档语义质量（而非仅靠检查清单）
4. **交互式 CLI** - 提供交互式命令行界面引导用户完成初始化

