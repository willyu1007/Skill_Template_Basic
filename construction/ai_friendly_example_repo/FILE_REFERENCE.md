# 文件参考文档

本文档详细说明每个文件在整体repo中的作用和关键功能。

---

## 根目录文件

### README.md
**1. 在整体repo中的作用：**
- 项目的主要入口文档，提供项目概览和快速开始指南
- 作为用户和Claude Code的第一接触点，引导用户选择适合的集成路径

**2. 关键作用概述：**
- 介绍项目的核心价值（解决技能自动激活问题）
- 提供快速开始路径（技能激活、添加技能、使用代理）
- 展示组件目录（5个技能、6个钩子、10个代理、3个命令）
- 说明关键概念（自动激活、渐进式披露、开发文档模式）
- 列出集成工作流和注意事项

---

### CLAUDE_INTEGRATION_GUIDE.md
**1. 在整体repo中的作用：**
- 专门为Claude Code AI助手编写的集成指南
- 提供详细的集成步骤、技术栈兼容性检查、常见错误避免

**2. 关键作用概述：**
- 指导Claude如何帮助用户集成组件
- 包含技术栈兼容性检查清单（React/MUI、Express/Prisma等）
- 提供技能适配不同技术栈的方法（适配、提取模式、仅参考）
- 详细的集成步骤和验证清单
- 常见错误避免和示例对话

---

### LICENSE
**1. 在整体repo中的作用：**
- 定义项目的许可证类型和使用条款

**2. 关键作用概述：**
- MIT许可证，允许商业和个人自由使用
- 明确版权归属和免责声明

---

## dev/ 目录

### dev/README.md
**1. 在整体repo中的作用：**
- 介绍开发文档模式（Dev Docs Pattern）的方法论
- 解决上下文重置丢失项目知识的问题

**2. 关键作用概述：**
- 定义三文件结构（plan.md、context.md、tasks.md）
- 说明何时使用开发文档模式
- 提供工作流程（开始任务、实施中、上下文重置后）
- 与斜杠命令的集成说明
- 最佳实践和示例

---

## .claude/ 目录

### .claude/settings.json
**1. 在整体repo中的作用：**
- Claude Code的配置文件示例
- 展示如何注册钩子到不同的事件类型

**2. 关键作用概述：**
- 配置UserPromptSubmit钩子（skill-activation-prompt）
- 配置PostToolUse钩子（post-tool-use-tracker）
- 配置Stop钩子（tsc-check、trigger-build-resolver）
- MCP服务器配置示例
- 权限设置示例
- **注意：这是示例文件，不能直接使用，需要根据项目定制**

---

### .claude/settings.local.json
**1. 在整体repo中的作用：**
- 本地设置覆盖文件
- 用于项目特定的权限配置

**2. 关键作用概述：**
- 允许特定Bash命令执行
- 覆盖全局settings.json的权限设置
- 用于开发过程中的临时权限需求

---

## .claude/skills/ 目录

### .claude/skills/README.md
**1. 在整体repo中的作用：**
- 技能系统的总览文档
- 介绍所有可用技能及其用途

**2. 关键作用概述：**
- 解释什么是技能及其作用
- 列出5个可用技能的详细信息（用途、文件数、定制要求）
- 如何添加技能到项目的步骤
- skill-rules.json配置格式说明
- 故障排除指南

---

### .claude/skills/skill-rules.json
**1. 在整体repo中的作用：**
- 技能自动激活的核心配置文件
- 定义每个技能的触发条件（关键词、意图模式、文件路径、内容模式）

**2. 关键作用概述：**
- 配置5个技能的触发规则
- 定义执行级别（suggest/block）
- 设置优先级（high/medium/low）
- 包含路径模式、关键词、意图正则表达式
- 提供配置说明和自定义指南
- **这是技能自动激活系统的核心，必须正确配置才能工作**

---

### .claude/skills/skill-developer/SKILL.md
**1. 在整体repo中的作用：**
- 元技能：用于创建和管理其他技能
- 技能开发者的主要指南

**2. 关键作用概述：**
- 技能创建的基础知识
- YAML frontmatter结构
- 资源文件组织模式
- 技能激活机制说明
- 链接到其他资源文件（ADVANCED.md、TRIGGER_TYPES.md等）

---

### .claude/skills/skill-developer/ADVANCED.md
**1. 在整体repo中的作用：**
- 技能开发的高级主题
- 深入的技术细节和最佳实践

**2. 关键作用概述：**
- 高级技能模式
- 复杂触发条件设计
- 性能优化技巧
- 技能组合策略

---

### .claude/skills/skill-developer/HOOK_MECHANISMS.md
**1. 在整体repo中的作用：**
- 解释技能如何与钩子系统集成
- 钩子机制的技术细节

**2. 关键作用概述：**
- 钩子如何触发技能激活
- UserPromptSubmit钩子的工作原理
- 技能建议注入机制
- 钩子与skill-rules.json的交互

---

### .claude/skills/skill-developer/PATTERNS_LIBRARY.md
**1. 在整体repo中的作用：**
- 技能开发的可重用模式库
- 常见场景的解决方案模板

**2. 关键作用概述：**
- 技能结构模式
- 触发模式示例
- 资源文件组织模式
- 代码示例和模板

---

### .claude/skills/skill-developer/SKILL_RULES_REFERENCE.md
**1. 在整体repo中的作用：**
- skill-rules.json的完整参考文档
- 配置选项的详细说明

**2. 关键作用概述：**
- 所有配置字段的说明
- 触发类型的详细解释
- 执行级别的使用场景
- 优先级设置指南
- 配置示例和最佳实践

---

### .claude/skills/skill-developer/TRIGGER_TYPES.md
**1. 在整体repo中的作用：**
- 技能触发类型的详细说明
- 如何设计有效的触发条件

**2. 关键作用概述：**
- promptTriggers（关键词、意图模式）
- fileTriggers（路径模式、内容模式）
- 触发条件的优先级和组合
- 避免误触发和漏触发的技巧

---

### .claude/skills/skill-developer/TROUBLESHOOTING.md
**1. 在整体repo中的作用：**
- 技能开发和激活问题的故障排除指南
- 常见问题和解决方案

**2. 关键作用概述：**
- 技能不激活的调试步骤
- 技能激活过于频繁的解决方案
- 技能从未激活的排查方法
- 配置错误的识别和修复

---

### .claude/skills/backend-dev-guidelines/SKILL.md
**1. 在整体repo中的作用：**
- 后端开发指南技能的主文件
- Node.js/Express/TypeScript开发模式的核心参考

**2. 关键作用概述：**
- 分层架构说明（Routes → Controllers → Services → Repositories）
- 快速开始清单
- 目录结构规范
- 命名约定
- 链接到12个资源文件进行深入说明
- 自动激活条件（编辑后端文件、使用后端关键词）

---

### .claude/skills/backend-dev-guidelines/resources/architecture-overview.md
**1. 在整体repo中的作用：**
- 后端架构的全面概述
- 分层架构的详细说明

**2. 关键作用概述：**
- 各层的职责定义
- 层间交互模式
- 依赖注入模式
- 架构决策记录

---

### .claude/skills/backend-dev-guidelines/resources/routing-and-controllers.md
**1. 在整体repo中的作用：**
- 路由和控制器模式的详细指南
- Express路由和BaseController模式

**2. 关键作用概述：**
- 路由定义最佳实践
- BaseController扩展模式
- 请求处理流程
- 错误处理模式

---

### .claude/skills/backend-dev-guidelines/resources/services-and-repositories.md
**1. 在整体repo中的作用：**
- 服务和仓库层的实现指南
- 业务逻辑和数据访问分离

**2. 关键作用概述：**
- 服务层设计原则
- 仓库模式实现
- 依赖注入使用
- 事务管理

---

### .claude/skills/backend-dev-guidelines/resources/database-patterns.md
**1. 在整体repo中的作用：**
- Prisma数据库访问模式
- 数据库操作最佳实践

**2. 关键作用概述：**
- Prisma查询模式
- 关系处理
- 迁移管理
- 性能优化

---

### .claude/skills/backend-dev-guidelines/resources/validation-patterns.md
**1. 在整体repo中的作用：**
- Zod验证模式指南
- 输入验证最佳实践

**2. 关键作用概述：**
- Zod schema定义
- 验证中间件
- 错误消息处理
- 类型安全验证

---

### .claude/skills/backend-dev-guidelines/resources/middleware-guide.md
**1. 在整体repo中的作用：**
- Express中间件开发指南
- 认证、授权、错误处理中间件

**2. 关键作用概述：**
- 中间件编写模式
- 认证中间件实现
- 错误处理中间件
- 中间件组合

---

### .claude/skills/backend-dev-guidelines/resources/async-and-errors.md
**1. 在整体repo中的作用：**
- 异步操作和错误处理模式
- Promise和async/await最佳实践

**2. 关键作用概述：**
- 异步错误处理
- Promise链管理
- 错误传播模式
- 异常捕获策略

---

### .claude/skills/backend-dev-guidelines/resources/sentry-and-monitoring.md
**1. 在整体repo中的作用：**
- Sentry错误跟踪和监控集成
- 生产环境错误处理

**2. 关键作用概述：**
- Sentry初始化
- 错误捕获模式
- 面包屑和上下文
- 性能监控

---

### .claude/skills/backend-dev-guidelines/resources/configuration.md
**1. 在整体repo中的作用：**
- 配置管理模式
- UnifiedConfig模式说明

**2. 关键作用概述：**
- 环境变量管理
- 配置验证
- 类型安全配置
- 配置分层

---

### .claude/skills/backend-dev-guidelines/resources/testing-guide.md
**1. 在整体repo中的作用：**
- 后端测试策略和模式
- 单元测试和集成测试

**2. 关键作用概述：**
- 测试结构组织
- 单元测试模式
- 集成测试设置
- Mock和Stub使用

---

### .claude/skills/backend-dev-guidelines/resources/complete-examples.md
**1. 在整体repo中的作用：**
- 完整的代码示例集合
- 端到端的实现参考

**2. 关键作用概述：**
- 完整功能实现示例
- 最佳实践演示
- 常见场景解决方案
- 代码模板

---

### .claude/skills/frontend-dev-guidelines/SKILL.md
**1. 在整体repo中的作用：**
- 前端开发指南技能的主文件
- React/TypeScript/MUI v7开发模式的核心参考

**2. 关键作用概述：**
- React组件模式
- MUI v7兼容性要求（作为护栏，enforcement: "block"）
- 文件组织策略
- 链接到11个资源文件
- 自动激活条件（编辑前端文件、使用前端关键词）

---

### .claude/skills/frontend-dev-guidelines/resources/file-organization.md
**1. 在整体repo中的作用：**
- 前端文件组织策略
- features/模式说明

**2. 关键作用概述：**
- 目录结构规范
- 功能模块组织
- 文件命名约定
- 导入路径管理

---

### .claude/skills/frontend-dev-guidelines/resources/component-patterns.md
**1. 在整体repo中的作用：**
- React组件开发模式
- 组件设计最佳实践

**2. 关键作用概述：**
- 函数组件模式
- Hooks使用规范
- 组件组合策略
- Props类型定义

---

### .claude/skills/frontend-dev-guidelines/resources/data-fetching.md
**1. 在整体repo中的作用：**
- 数据获取模式指南
- TanStack Query使用

**2. 关键作用概述：**
- useSuspenseQuery模式
- 数据缓存策略
- 错误处理
- 加载状态管理

---

### .claude/skills/frontend-dev-guidelines/resources/routing-guide.md
**1. 在整体repo中的作用：**
- TanStack Router使用指南
- 前端路由模式

**2. 关键作用概述：**
- 路由配置
- 路由参数处理
- 导航模式
- 路由守卫

---

### .claude/skills/frontend-dev-guidelines/resources/styling-guide.md
**1. 在整体repo中的作用：**
- MUI v7样式指南
- 样式最佳实践

**2. 关键作用概述：**
- MUI v7 Grid组件（size={{}}属性）
- 主题定制
- 响应式设计
- 样式组织

---

### .claude/skills/frontend-dev-guidelines/resources/typescript-standards.md
**1. 在整体repo中的作用：**
- TypeScript在前端开发中的标准
- 类型安全最佳实践

**2. 关键作用概述：**
- 类型定义规范
- Props类型
- 泛型使用
- 类型推断最佳实践

---

### .claude/skills/frontend-dev-guidelines/resources/performance.md
**1. 在整体repo中的作用：**
- 前端性能优化指南
- React性能最佳实践

**2. 关键作用概述：**
- 代码分割和懒加载
- Memoization策略
- 渲染优化
- 包大小优化

---

### .claude/skills/frontend-dev-guidelines/resources/loading-and-error-states.md
**1. 在整体repo中的作用：**
- 加载和错误状态处理模式
- 用户体验最佳实践

**2. 关键作用概述：**
- Suspense边界使用
- 错误边界实现
- 加载状态UI
- 错误消息展示

---

### .claude/skills/frontend-dev-guidelines/resources/common-patterns.md
**1. 在整体repo中的作用：**
- 常见前端开发模式集合
- 可重用解决方案

**2. 关键作用概述：**
- 表单处理模式
- 模态框实现
- 列表渲染优化
- 状态管理模式

---

### .claude/skills/frontend-dev-guidelines/resources/complete-examples.md
**1. 在整体repo中的作用：**
- 完整的前端组件示例
- 端到端实现参考

**2. 关键作用概述：**
- 完整功能组件示例
- 最佳实践演示
- 常见场景解决方案
- 代码模板

---

### .claude/skills/route-tester/SKILL.md
**1. 在整体repo中的作用：**
- API路由测试技能
- JWT cookie认证测试指南

**2. 关键作用概述：**
- test-auth-route.js脚本模式
- cURL与cookie认证
- 认证测试流程
- 调试认证问题的方法
- 适用于JWT cookie认证的API测试

---

### .claude/skills/error-tracking/SKILL.md
**1. 在整体repo中的作用：**
- Sentry错误跟踪集成指南
- 生产环境错误监控模式

**2. 关键作用概述：**
- Sentry v8初始化
- 错误捕获模式
- 面包屑和用户上下文
- 性能监控集成
- Express和React集成

---

## .claude/hooks/ 目录

### .claude/hooks/README.md
**1. 在整体repo中的作用：**
- 钩子系统的总览文档
- 介绍所有可用钩子及其用途

**2. 关键作用概述：**
- 解释什么是钩子及其作用
- 列出必需钩子和可选钩子
- 集成步骤和配置说明
- 定制要求说明

---

### .claude/hooks/CONFIG.md
**1. 在整体repo中的作用：**
- 钩子配置的详细指南
- 如何注册和定制钩子

**2. 关键作用概述：**
- settings.json配置示例
- 不同钩子类型的说明
- 钩子执行顺序
- 调试和故障排除
- 高级配置选项

---

### .claude/hooks/skill-activation-prompt.sh
**1. 在整体repo中的作用：**
- 技能自动激活钩子的Shell入口脚本
- 调用TypeScript实现

**2. 关键作用概述：**
- 设置工作目录
- 通过npx tsx执行TypeScript文件
- 将stdin传递给TypeScript处理
- **这是技能自动激活系统的关键入口点**

---

### .claude/hooks/skill-activation-prompt.ts
**1. 在整体repo中的作用：**
- 技能自动激活的核心实现
- 分析用户提示和文件上下文，建议相关技能

**2. 关键作用概述：**
- 读取skill-rules.json配置
- 解析用户提示（关键词、意图模式匹配）
- 检查文件上下文（路径模式、内容模式匹配）
- 计算技能匹配分数
- 生成技能建议并注入到Claude上下文
- **这是整个自动激活系统的核心逻辑**

---

### .claude/hooks/post-tool-use-tracker.sh
**1. 在整体repo中的作用：**
- 文件更改跟踪钩子
- 在Edit/Write/MultiEdit工具使用后运行

**2. 关键作用概述：**
- 检测编辑的文件
- 自动识别项目结构（frontend、backend、packages等）
- 记录修改的文件到缓存
- 跟踪受影响的服务/包
- 生成构建和TypeScript检查命令
- 为上下文管理提供数据支持

---

### .claude/hooks/tsc-check.sh
**1. 在整体repo中的作用：**
- TypeScript编译检查钩子
- 在用户停止时运行，检查TypeScript错误

**2. 关键作用概述：**
- 检测多服务monorepo结构
- 识别需要检查的服务（需要定制服务列表）
- 运行tsc --noEmit检查
- 报告编译错误
- **需要根据项目结构定制服务检测逻辑**

---

### .claude/hooks/trigger-build-resolver.sh
**1. 在整体repo中的作用：**
- 构建错误解析器触发器
- 当编译失败时自动启动错误解析代理

**2. 关键作用概述：**
- 检测tsc-check的结果
- 如果发现错误，触发auto-error-resolver代理
- 自动化错误修复流程
- 依赖tsc-check.sh正常工作

---

### .claude/hooks/stop-build-check-enhanced.sh
**1. 在整体repo中的作用：**
- 增强的构建检查钩子
- 在Stop事件时进行更全面的检查

**2. 关键作用概述：**
- 检查多个服务的构建状态
- 验证依赖关系
- 提供详细的构建报告
- 需要根据项目定制

---

### .claude/hooks/error-handling-reminder.sh
**1. 在整体repo中的作用：**
- 错误处理提醒钩子
- 在Stop事件时检查错误处理完整性

**2. 关键作用概述：**
- 检查代码中的错误处理
- 提醒添加Sentry集成
- 验证错误边界
- 需要TypeScript实现支持

---

### .claude/hooks/error-handling-reminder.ts
**1. 在整体repo中的作用：**
- 错误处理提醒的TypeScript实现
- 分析代码中的错误处理模式

**2. 关键作用概述：**
- 扫描代码文件
- 检测错误处理缺失
- 生成提醒消息
- 提供改进建议

---

### .claude/hooks/package.json
**1. 在整体repo中的作用：**
- 钩子目录的npm依赖配置
- 定义TypeScript钩子所需的包

**2. 关键作用概述：**
- 定义tsx等依赖
- 版本锁定
- 用于安装钩子运行环境

---

### .claude/hooks/package-lock.json
**1. 在整体repo中的作用：**
- npm依赖的锁定文件
- 确保依赖版本一致性

**2. 关键作用概述：**
- 锁定所有依赖的精确版本
- 确保跨环境一致性

---

### .claude/hooks/tsconfig.json
**1. 在整体repo中的作用：**
- TypeScript钩子的编译配置
- 定义TypeScript编译选项

**2. 关键作用概述：**
- TypeScript编译设置
- 模块解析配置
- 类型检查选项

---

## .claude/agents/ 目录

### .claude/agents/README.md
**1. 在整体repo中的作用：**
- 代理系统的总览文档
- 介绍所有可用代理及其用途

**2. 关键作用概述：**
- 解释什么是代理及其与技能的区别
- 列出10个可用代理的详细信息
- 集成步骤（通常只需复制文件）
- 使用场景说明

---

### .claude/agents/code-architecture-reviewer.md
**1. 在整体repo中的作用：**
- 代码架构审查代理
- 审查代码的架构一致性和最佳实践

**2. 关键作用概述：**
- 分析代码结构
- 检查架构模式一致性
- 识别设计问题
- 提供改进建议
- 生成审查报告

---

### .claude/agents/code-refactor-master.md
**1. 在整体repo中的作用：**
- 代码重构主代理
- 规划和执行全面重构

**2. 关键作用概述：**
- 分析重构需求
- 制定重构计划
- 执行重构步骤
- 更新导入路径
- 验证重构结果

---

### .claude/agents/documentation-architect.md
**1. 在整体repo中的作用：**
- 文档架构师代理
- 创建全面的技术文档

**2. 关键作用概述：**
- 分析代码库
- 生成API文档
- 创建开发者指南
- 编写架构文档
- 格式化文档输出

---

### .claude/agents/frontend-error-fixer.md
**1. 在整体repo中的作用：**
- 前端错误修复代理
- 调试和修复前端错误

**2. 关键作用概述：**
- 分析浏览器控制台错误
- 检查TypeScript编译错误
- 修复React错误
- 处理构建失败
- 可能需要截图路径配置

---

### .claude/agents/plan-reviewer.md
**1. 在整体repo中的作用：**
- 计划审查代理
- 在实施前审查开发计划

**2. 关键作用概述：**
- 审查实施计划
- 识别潜在问题
- 验证架构决策
- 提供改进建议
- 评估风险

---

### .claude/agents/refactor-planner.md
**1. 在整体repo中的作用：**
- 重构规划代理
- 创建全面的重构策略

**2. 关键作用概述：**
- 分析代码结构
- 识别重构机会
- 制定重构策略
- 规划重构步骤
- 评估影响范围

---

### .claude/agents/web-research-specialist.md
**1. 在整体repo中的作用：**
- 网络研究专家代理
- 在线研究技术问题

**2. 关键作用概述：**
- 搜索技术解决方案
- 研究最佳实践
- 比较实现方法
- 查找错误解决方案
- 汇总研究结果

---

### .claude/agents/auth-route-tester.md
**1. 在整体repo中的作用：**
- 认证路由测试代理
- 测试需要认证的API端点

**2. 关键作用概述：**
- 测试JWT cookie认证路由
- 验证端点功能
- 调试认证问题
- 生成测试报告
- 需要JWT cookie认证配置

---

### .claude/agents/auth-route-debugger.md
**1. 在整体repo中的作用：**
- 认证路由调试代理
- 专门调试认证相关问题

**2. 关键作用概述：**
- 诊断认证失败
- 分析令牌问题
- 检查Cookie设置
- 调试权限错误
- 需要JWT cookie认证配置

---

### .claude/agents/auto-error-resolver.md
**1. 在整体repo中的作用：**
- 自动错误解析代理
- 自动修复TypeScript编译错误

**2. 关键作用概述：**
- 分析TypeScript错误
- 自动修复类型错误
- 更新导入路径
- 修复类型定义
- 验证修复结果

---

## .claude/commands/ 目录

### .claude/commands/dev-docs.md
**1. 在整体repo中的作用：**
- 开发文档创建斜杠命令
- 自动生成三文件结构的开发文档

**2. 关键作用概述：**
- 分析任务需求
- 检查代码库当前状态
- 创建战略计划（plan.md）
- 生成上下文文件（context.md）
- 创建任务清单（tasks.md）
- 使用dev/active/目录结构

---

### .claude/commands/dev-docs-update.md
**1. 在整体repo中的作用：**
- 开发文档更新斜杠命令
- 在上下文重置前更新现有文档

**2. 关键作用概述：**
- 标记已完成的任务
- 添加新发现的任务
- 更新SESSION PROGRESS部分
- 捕获当前状态
- 准备上下文重置

---

### .claude/commands/route-research-for-testing.md
**1. 在整体repo中的作用：**
- 路由研究斜杠命令
- 为测试目的研究API路由模式

**2. 关键作用概述：**
- 分析API结构
- 识别路由模式
- 研究认证要求
- 生成测试策略
- 可能需要服务路径配置

---

## 总结

### 核心文件（必须理解）
1. **skill-rules.json** - 技能自动激活的核心配置
2. **skill-activation-prompt.ts** - 自动激活的核心逻辑
3. **skill-activation-prompt.sh** - 自动激活的入口点
4. **post-tool-use-tracker.sh** - 文件跟踪和上下文管理
5. **README.md** - 项目概览和快速开始

### 关键系统
1. **技能系统** - 模块化知识库（500行规则）
2. **钩子系统** - 自动化触发机制
3. **代理系统** - 专业任务处理
4. **开发文档模式** - 上下文持久化

### 集成优先级
1. **必需**：skill-activation-prompt钩子 + post-tool-use-tracker钩子
2. **推荐**：1-2个相关技能
3. **可选**：代理、斜杠命令、Stop钩子

