# React 工作台阶段六执行记录

## 阶段信息

| 字段 | 值 |
| --- | --- |
| 阶段 | 阶段六：前端拥有的源码插件 UI 契约 |
| Tasklist 版本 | `v1.2` |
| 任务范围 | `RW-130`至`RW-159` |
| 状态 | `Passed` |
| 开始时间 | `2026-07-12 15:58 CST` |
| 完成时间 | `2026-07-12 16:21 CST` |
| 执行分支 | `feat/react-workbench-replacement` |
| 宿主基线 | `7d149838e77fe3d2b1bdda5ebb9d46679f79fd23` |
| 插件基线 | 扁平化来源`1b90535404d1563a045efe3888dd9db6d1bf5e29` |

## 范围与边界

- 目标：建立由`apps/lina-web`拥有的源码插件 React UI 清单、Vite 发现、稳定宿主上下文、运行时页面/插槽 registry、generation 刷新规划和静态边界门禁。
- 修改范围：`apps/lina-web/src/plugin-ui/`、`apps/lina-web/build/`、`apps/lina-web/vite.config.ts`、必要的工作台接入点、阶段六文档、冻结 Tasklist 和执行性 Review。
- 禁止范围：不修改`apps/lina-core`、`apps/lina-vben`、`apps/lina-plugins`、`hack`或`.github/workflows`；不新增后端 React 扫描器；不执行后端字符串动态 import。
- 前置门禁：阶段五已通过；`GATE-010`继续保持未完成。

## 任务状态

| 任务 | 状态 | 证据 |
| --- | --- | --- |
| `RW-130`至`RW-145` | `Passed` | 契约、8 个 slot key、Vite 清单发现、虚拟模块、运行时 registry、宿主上下文和 slot outlet 已实现并通过全量门禁 |
| `RW-146`至`RW-151` | `Passed` | generation 签名、定向刷新规划、定向 Query cache 清理和聚焦测试通过 |
| `RW-152`至`RW-159` | `Passed` | 外部目录读取、依赖去重、稳定导入面、静态边界扫描、集成测试和逐文件迁移映射通过 |

## 命令与结果

| 序号 | 命令 | 退出码 | 结果 |
| --- | --- | --- | --- |
| 1 | 本阶段重新读取`AGENTS.md`及命中的规则文件 | `0` | workflow、documentation、architecture、frontend-ui、plugin、testing、i18n、cache-consistency、dev-tooling 和 Markdown instructions 已读取 |
| 2 | `pnpm exec vitest run src/plugin-ui build/plugin-ui-registry.test.ts` | `0` | 5 个测试文件、20 个测试通过 |
| 3 | `pnpm typecheck` | `0` | 阶段中间严格 TypeScript 检查通过 |
| 4 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH corepack pnpm@10.30.3 --dir apps/lina-web test:unit` | `0` | 25 个测试文件、103 个测试通过 |
| 5 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH corepack pnpm@10.30.3 --dir apps/lina-web typecheck` | `0` | 严格 TypeScript 检查通过 |
| 6 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH corepack pnpm@10.30.3 --dir apps/lina-web lint` | `0` | ESLint 无错误或警告 |
| 7 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH corepack pnpm@10.30.3 --dir apps/lina-web build` | `0` | 根路径生产构建通过，未出现 JavaScript chunk 体积告警 |
| 8 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH LINA_WEB_BASE_PATH=/console corepack pnpm@10.30.3 --dir apps/lina-web build` | `0` | `/console`basePath 构建与资产前缀检查通过 |
| 9 | `pnpm list react react-dom react-router react-router-dom @tanstack/react-query --depth 100` | `0` | React/React DOM 统一为`19.2.7`，Router 统一为`7.18.1`，TanStack Query 统一为`5.101.2` |
| 10 | 静态扫描后端 React 发现器、禁止导入、首屏插件 chunk、迁移映射和 Markdown 格式 | `0` | `lina-core`无 React 扫描器；首屏无 plugin/editor/chart/canvas chunk；28 个 Vue 文件均有映射 |

## 失败项

- 当前失败：无。
- 已解决失败：修正含 JSX 的测试文件扩展名；构建集成测试改为不加载会受`jsdom`全局污染的`esbuild`运行时；修正严格类型下 slot record 初始化。
- 外部阻断：无。

## 截图与人工审查

- 截图目录：不适用；本阶段新增的是插件 UI 基础设施和空状态接入，未新增独立业务页面。
- 视觉审查：不适用；slot outlet 的用户可观察渲染由 Testing Library 覆盖，真实插件页面在阶段八迁移时截图审查。
- E2E 质量审查：不触发新增 E2E；本阶段为构建发现、运行时注册和内部刷新规划，使用单元测试、组件测试、构建集成测试和静态扫描验证。阶段八再验证真实源码插件页面端到端行为。

## 影响评估

| 规则域 | 结论 | 证据或说明 |
| --- | --- | --- |
| 架构 | 有影响 | 源码插件 React UI 发现完全归`apps/lina-web`，没有污染`lina-core` |
| 插件 | 有影响 | 发布`frontend/plugin-ui.ts`清单、8 个 slot key和`@linapro/plugin-ui`稳定导入面 |
| 前端 UI | 有影响 | 工作台按规范化菜单路由装配源码插件页面，并接入 Header slot |
| API | 无 HTTP 契约变化 | 仅把既有`ApiClient`投影为无 Token 的稳定请求面 |
| 后端与 DI | 无影响 | 不修改 Go、后端服务或依赖注入 |
| 数据库 | 无影响 | 不修改 SQL、DAO、表或索引 |
| 数据权限 | 无语义变化 | 前端 capability/权限过滤不替代后端鉴权和数据权限 |
| 缓存一致性 | 有前端影响 | 插件动态状态为权威源；签名不变不重建，generation 变化只规划对应插件定向清理 |
| i18n | 无资源变化 | 宿主上下文复用运行时 locale 与`t()`；本阶段未新增用户可见固定文案 |
| 开发工具 | 有影响 | 新增跨平台 Node/Vite 构建发现；使用 Node`path`、`fs`和 URL API，不依赖 shell 或 POSIX 路径语义 |
| 测试 | 有影响 | 新增契约、发现、边界、lazy、slot、禁用隐藏、上下文和 generation 测试 |
| 文档 | 有影响 | 新增阶段六执行记录和 28 个 Vue 文件/helper 逐项迁移映射 |

## 变更文件

- 新增：`apps/lina-web/src/plugin-ui/`契约、宿主上下文、registry、slot outlet、generation 刷新、虚拟模块类型和测试；`apps/lina-web/build/plugin-ui-registry.ts`及测试；阶段六执行记录和迁移映射。
- 修改：Vite/TypeScript 配置、工作台页面/slot 接入、路由 generation 元数据和启动装配。
- 删除：无。
- 未经授权的 Git 操作：无；不得执行 commit、push 或 PR。

## 审查结论

- 审查范围：`git status --short`、阶段六生产代码和测试、未跟踪`apps/lina-web`/`docs`展开、103 个测试、双构建、依赖树和静态边界扫描。
- 已读取规则：`AGENTS.md`、workflow、documentation、architecture、frontend-ui、plugin、testing、i18n、cache-consistency、dev-tooling 和 Markdown instructions。
- 严重问题：`0`。
- 警告：`0`。
- 剩余风险：阶段八之前官方插件仍保留 Vue/Vben 迁移输入；静态边界扫描只从新`frontend/plugin-ui.ts`入口遍历可达 React/TypeScript 图，不把未迁移 legacy 文件误判为已交付 React UI。真实插件页面视觉与 E2E 证据在阶段八补齐。

## 阶段验收

- Tasklist 阶段验收：源码插件 React 页面发现完全在`apps/lina-web`闭环，`lina-core`不知道 React 或 Semi Design。
- 验收结果：`Passed`。
- Tasklist 勾选：`RW-130`至`RW-159`已更新为完成；`GATE-010`继续保持未完成。
