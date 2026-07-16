# React 工作台阶段四执行记录

## 阶段信息

| 字段 | 值 |
| --- | --- |
| 阶段 | 阶段四：认证、用户、租户与权限 |
| Tasklist 版本 | `v1.2` |
| 任务范围 | `RW-080`至`RW-104` |
| 状态 | `Passed` |
| 开始时间 | `2026-07-12 15:11 CST` |
| 完成时间 | `2026-07-12 15:40 CST` |
| 执行分支 | `feat/react-workbench-replacement` |
| 宿主基线 | `7d149838e77fe3d2b1bdda5ebb9d46679f79fd23` |
| 插件基线 | `1b90535404d1563a045efe3888dd9db6d1bf5e29` |

## 范围与边界

- 目标：React 工作台只消费现有 LinaPro 身份体系，完成用户名密码登录、多租户预登录、会话恢复、刷新、退出、租户切换、平台代入、权限隐藏和模块 capability 投影。
- 修改范围：`apps/lina-web/src/`、应用内测试、阶段四执行记录、冻结 Tasklist 和执行性 Review。
- 禁止范围：不修改`apps/lina-core`、`apps/lina-vben`、`apps/lina-plugins`、`hack`、`.github/workflows`或根构建入口；不新增或改变后端认证、用户、租户、RBAC 和数据权限契约。
- 前置门禁：阶段三已通过；现有 LinaPro HTTP API、DTO、Bearer Token 和`X-Tenant-Code`语义是权威契约。
- 缓存边界：用户、菜单、插件 capability、字典和消息由服务端接口提供；浏览器只持久化 Token 与最小恢复信息，租户或会话变化时按作用域取消并移除 Query cache。

## 任务状态

| 任务 | 状态 | 证据 |
| --- | --- | --- |
| `RW-080`至`RW-083` | `Passed` | 五个前端 API 投影文件和 3 个接口测试覆盖现有认证、用户、菜单、租户与插件状态路径 |
| `RW-084`至`RW-087` | `Passed` | 会话只持久化 Token 与代入恢复信息；状态机和多租户`preToken`测试通过 |
| `RW-088`至`RW-092` | `Passed` | React/Semi 登录页、四个稳定租户`data-testid`、`AuthGate`和三请求并行装配测试通过 |
| `RW-093`至`RW-103` | `Passed` | 租户 store、原子请求快照、切换前取消、上下文刷新、代入恢复、`Can`和 capability 专项测试通过 |
| `RW-104` | `Passed` | Go、HTTP DTO、认证模型、RBAC、租户和数据权限语义均未修改 |

## 命令与结果

| 序号 | 命令 | 退出码 | 结果 |
| --- | --- | --- | --- |
| 1 | 阶段开始前读取`AGENTS.md`及命中的规则文件 | `0` | workflow、documentation、architecture、frontend-ui、api-contract、testing、i18n、cache-consistency、data-permission 和 Markdown instructions 已读取 |
| 2 | 阶段三最终复验 | `0` | 41 个测试、类型检查、Lint、构建、Markdown 和禁止路径检查通过 |
| 3 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH corepack pnpm@10.30.3 --dir apps/lina-web install --frozen-lockfile` | `0` | lockfile 无变化，依赖安装可复现 |
| 4 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH corepack pnpm@10.30.3 --dir apps/lina-web typecheck` | `0` | 严格 TypeScript 检查通过 |
| 5 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH corepack pnpm@10.30.3 --dir apps/lina-web test:unit` | `0` | 18 个测试文件、69 个测试通过 |
| 6 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH corepack pnpm@10.30.3 --dir apps/lina-web lint` | `0` | ESLint 无错误或警告 |
| 7 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH corepack pnpm@10.30.3 --dir apps/lina-web build` | `0` | 根路径生产构建通过，无 JavaScript chunk 体积警告 |
| 8 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH LINA_WEB_BASE_PATH=/console corepack pnpm@10.30.3 --dir apps/lina-web build` | `0` | 自定义 basePath 构建和`dist/index.html`资产前缀检查通过 |
| 9 | 静态扫描 Vue/Ant、根 Semi 导入、OAuth 等入口预留、模块顶层翻译、危险类型逃逸、尾随空格和四个稳定`data-testid` | `0` | 禁止项均为`0`，四个稳定测试标识全部存在 |
| 10 | 检查禁止路径的 unstaged 与未跟踪变化 | `0` | `apps/lina-core`、旧工作台、插件、工具链和 CI 均无本阶段新增变化 |

## 失败项

- 当前失败：无。
- 已解决失败：修复 Semi`Form`子路径类型导入；按 Semi UI、Foundation 和 runtime 拆分 vendor，消除 JavaScript chunk 体积告警；拆分 Fast Refresh 上下文文件；使用会话修订号阻断旧授权上下文重用；修复匿名登录`401`误触发刷新；引入原子请求快照保证 Token 与`X-Tenant-Code`同时切换。
- 外部阻断：无。

## 截图与人工审查

- 截图目录：不适用；本地开发服务启动成功，但桌面浏览器运行时返回可用浏览器列表为空，未生成伪造截图。
- 视觉审查：以 5 个登录页和认证守卫组件测试替代，覆盖匿名跳转、用户名密码入口、租户选择、租户过渡和受保护内容；实际截图留在阶段十 E2E 执行。
- E2E 质量审查：触发；本阶段改变登录、租户和权限等用户可观察工作流，阶段内以组件、状态机和接口自动化测试证明，正式成功、失败、权限和截图链在 Tasklist 阶段十按既有宿主基线执行。

## 影响评估

| 规则域 | 结论 | 证据或说明 |
| --- | --- | --- |
| 架构 | 有影响 | 前端适配层直接编排会话、租户和授权投影；原子请求快照隔离跨 store 变化，不改变 LinaPro 领域 owner |
| 插件 | 有有限影响 | 登录后读取`/plugins/dynamic`并投影 capability；不修改插件实现或扩大插件权限 |
| 前端 UI | 有影响 | 新增 React/Semi 登录、租户选择、认证守卫、权限和 capability 完全隐藏行为 |
| API | 有前端适配影响 | 只消费现有 LinaPro API；HTTP 方法、路径、后端 DTO 和 Bearer Token 语义未改变 |
| 后端与 DI | 无影响 | 未修改 Go 或后端启动装配；前端 API、store、QueryClient 和运行时依赖显式传入 |
| 数据库 | 无影响 | 不修改 SQL、DAO、表、索引或数据 |
| 数据权限 | 无语义变化 | 前端仅隐藏无权 UI，后端继续执行最终 RBAC、租户和数据权限校验 |
| 缓存一致性 | 有影响 | 用户、菜单、插件、字典和消息权威源为宿主接口；租户变化前取消敏感请求，变化后移除旧作用域并重取，不跨租户复用 |
| i18n | 有影响 | 登录和租户文案使用英文源内容与中文资源，错误沿用 API 本地化投影，全部在渲染期求值 |
| 开发工具 | 有应用内影响 | 仅调整 Vite vendor 分块并完成根路径与 basePath 构建；未修改根脚本、CI 或跨平台入口 |
| 测试 | 有影响 | 累计 18 个测试文件、69 个测试；新增 API、状态机、刷新失败、租户、代入、权限、capability 和用户可观察组件覆盖 |
| 文档 | 有影响 | 更新冻结 Tasklist、执行性 Review 和阶段四执行记录 |

## 变更文件

- 新增：认证、用户、菜单、租户和插件状态 API 投影；会话与认证运行时；登录页、认证守卫和上下文；租户 store；权限与 capability 组件；本执行记录及专项测试。
- 修改：API Client、启动编排、运行时路由、i18n、双语资源、全局页面样式、Vite 分块、冻结 Tasklist 和执行性 Review。
- 删除：无。
- 未经授权的 Git 操作：无；不得执行 commit、push 或 PR。

## 审查结论

- 审查范围：`git status --short`、未跟踪文件展开、阶段四生产代码、69 个测试、双构建、静态安全扫描和禁止路径。
- 已读取规则：`AGENTS.md`、workflow、documentation、architecture、frontend-ui、api-contract、testing、i18n、cache-consistency、data-permission 和 Markdown instructions。
- 严重问题：`0`。
- 警告：`0`。
- 剩余风险：当前桌面环境无可用浏览器实例，实际登录页截图和真实后端端到端联调按冻结 Tasklist 阶段十执行；不影响本阶段明确要求的单元、组件和构建门禁。

## 阶段验收

- Tasklist 阶段验收：React 工作台可以使用 LinaPro 身份体系登录，并正确处理租户和权限上下文。
- 验收结果：`Passed`。
- Tasklist 勾选：`RW-080`至`RW-104`已更新为完成；`GATE-010`继续保持未完成。
