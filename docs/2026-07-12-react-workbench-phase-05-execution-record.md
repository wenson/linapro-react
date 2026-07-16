# React 工作台阶段五执行记录

## 阶段信息

| 字段 | 值 |
| --- | --- |
| 阶段 | 阶段五：路由和工作台外壳 |
| Tasklist 版本 | `v1.2` |
| 任务范围 | `RW-110`至`RW-127` |
| 状态 | `Passed` |
| 开始时间 | `2026-07-12 15:43 CST` |
| 完成时间 | `2026-07-12 15:54 CST` |
| 执行分支 | `feat/react-workbench-replacement` |
| 宿主基线 | `7d149838e77fe3d2b1bdda5ebb9d46679f79fd23` |
| 插件基线 | `1b90535404d1563a045efe3888dd9db6d1bf5e29` |

## 范围与边界

- 目标：把服务端菜单安全投影为显式 React 页面注册、访问守卫、桌面与移动工作台外壳、标签元数据、页面表面和可诊断错误状态。
- 修改范围：`apps/lina-web/src/`、应用内测试、阶段五执行记录、冻结 Tasklist 和执行性 Review。
- 禁止范围：不修改`apps/lina-core`、`apps/lina-vben`、`apps/lina-plugins`、`hack`、`.github/workflows`或根构建入口；不执行任意后端字符串动态 import，不实现动态插件受保护 API bridge。
- 前置门禁：阶段四已通过；菜单树和用户权限由现有 LinaPro API 提供，后端继续执行最终鉴权。

## 任务状态

| 任务 | 状态 | 证据 |
| --- | --- | --- |
| `RW-110`至`RW-117` | `Passed` | 路由契约、字面量 lazy 注册、菜单投影、未知页、元数据、URL 安全和访问守卫测试通过 |
| `RW-118`至`RW-125` | `Passed` | Semi Layout/Navigation/SideSheet、Header、租户切换、标签、页面表面、图标和错误页完成 |
| `RW-126`至`RW-127` | `Passed` | 20 个测试文件、80 个测试、类型检查、Lint 和双构建通过 |

## 命令与结果

| 序号 | 命令 | 退出码 | 结果 |
| --- | --- | --- | --- |
| 1 | 阶段开始前读取`AGENTS.md`及命中的规则文件 | `0` | workflow、documentation、architecture、frontend-ui、plugin、api-contract、testing、i18n、cache-consistency 和 Markdown instructions 已读取 |
| 2 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH corepack pnpm@10.30.3 --dir apps/lina-web typecheck` | `0` | 严格 TypeScript 检查通过 |
| 3 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH corepack pnpm@10.30.3 --dir apps/lina-web test:unit` | `0` | 20 个测试文件、80 个测试通过 |
| 4 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH corepack pnpm@10.30.3 --dir apps/lina-web lint` | `0` | ESLint 无错误或警告 |
| 5 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH corepack pnpm@10.30.3 --dir apps/lina-web build` | `0` | 根路径构建通过，无 JavaScript chunk 体积告警 |
| 6 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH LINA_WEB_BASE_PATH=/console corepack pnpm@10.30.3 --dir apps/lina-web build` | `0` | basePath 构建和资产前缀检查通过 |
| 7 | 静态扫描动态 import、iframe sandbox、危险 URL、Semi 全局覆盖、模块顶层翻译和禁止路径 | `0` | 只有显式字面量 lazy import；其余禁止项均为`0` |

## 失败项

- 当前失败：无。
- 已解决失败：修正页面表面测试定位；为租户选择器补充稳定无障碍名称；修正重复菜单/标签标题断言；增加统一 URL 安全投影并拒绝`javascript:`、协议相对地址和路径逃逸。
- 外部阻断：无。

## 截图与人工审查

- 截图目录：不适用；阶段四已确认当前桌面浏览器运行时可用浏览器列表为空，本阶段没有伪造截图。
- 视觉审查：以工作台布局组件测试替代，覆盖桌面侧栏、移动 SideSheet、Header、租户选择、用户菜单、标签和页面内容；实际截图留在后续 E2E 阶段。
- E2E 质量审查：触发；本阶段涉及导航、路由、权限、iframe、外链和移动端用户可观察行为，先用组件与路由自动化测试覆盖，正式 E2E 按冻结 Tasklist 后续阶段执行。

## 影响评估

| 规则域 | 结论 | 证据或说明 |
| --- | --- | --- |
| 架构 | 有影响 | 路由与页面装配保持在`lina-web`展示适配层，不污染`lina-core` |
| 插件 | 有有限影响 | 本阶段只消费后端已治理的 iframe/外链元数据，不修改插件或实现动态 bridge |
| 前端 UI | 有影响 | 新增 React Router、Semi Layout/Navigation/SideSheet、Header、标签和页面表面 |
| API | 无契约变化 | 复用阶段四菜单、用户和插件状态投影，不新增 HTTP 请求 |
| 后端与 DI | 无影响 | 不修改 Go 或后端装配 |
| 数据库 | 无影响 | 不修改 SQL、DAO、表或索引 |
| 数据权限 | 无语义变化 | 前端守卫与隐藏不替代后端鉴权和数据权限 |
| 缓存一致性 | 有前端影响 | 标签只缓存元数据；菜单仍由认证上下文 Query cache 管理，不缓存页面 DOM 树 |
| i18n | 有影响 | 菜单标题、布局操作和错误页文案在渲染期求值并支持双语 |
| 开发工具 | 无影响 | 不修改根工具和 CI |
| 测试 | 有影响 | 新增菜单投影、访问拒绝、页面注册、iframe/外链、标签和响应式布局测试 |
| 文档 | 有影响 | 新增阶段五执行记录，验收后更新 Tasklist 和执行性 Review |

## 变更文件

- 新增：路由契约、显式页面注册、菜单投影、访问守卫、URL 安全、路由渲染、工作台布局/导航/Header/标签/页面表面/图标、错误与空页面、测试和本执行记录。
- 修改：运行时路由、启动期标签清理、双语资源、全局页面样式、冻结 Tasklist 和执行性 Review。
- 删除：无。
- 未经授权的 Git 操作：无；不得执行 commit、push 或 PR。

## 审查结论

- 审查范围：`git status --short`、未跟踪文件展开、阶段五生产代码、80 个测试、双构建和静态安全扫描。
- 已读取规则：`AGENTS.md`、workflow、documentation、architecture、frontend-ui、plugin、api-contract、testing、i18n、cache-consistency 和 Markdown instructions。
- 严重问题：`0`。
- 警告：`0`。
- 剩余风险：当前浏览器运行时不可用，真实后端菜单与响应式截图在后续 E2E 阶段验证；业务页面仍按 Tasklist 阶段七迁移，未注册页面会显示可诊断错误而非执行任意代码。

## 阶段验收

- Tasklist 阶段验收：登录后可以进入具备菜单、Header、标签、权限和错误边界的空工作台。
- 验收结果：`Passed`。
- Tasklist 勾选：`RW-110`至`RW-127`已更新为完成；`GATE-010`继续保持未完成。
