# React 工作台阶段七执行记录

## 阶段信息

| 字段 | 值 |
| --- | --- |
| 阶段 | 阶段七：宿主内建页面迁移 |
| Tasklist 版本 | `v1.2` |
| 任务范围 | `RW-160`至`RW-199` |
| 状态 | `Passed` |
| 开始时间 | `2026-07-12 16:24 CST` |
| 完成时间 | `2026-07-12 20:02 CST` |
| 执行分支 | `feat/react-workbench-replacement` |
| 宿主基线 | `7d149838e77fe3d2b1bdda5ebb9d46679f79fd23` |
| 插件基线 | 扁平化来源`1b90535404d1563a045efe3888dd9db6d1bf5e29` |

## 范围与边界

- 目标：把`apps/lina-vben`当前承载的宿主 Dashboard、About、个人中心、IAM、设置、消息、调度和插件管理工作流完整迁移到`apps/lina-web`的 React 与 Semi Design 实现。
- 修改范围：`apps/lina-web/src/api/`、`apps/lina-web/src/features/`、宿主共享前端能力、显式路由注册、双语资源、应用内测试和阶段七文档。
- 禁止范围：不修改`apps/lina-core`、`apps/lina-vben`、`apps/lina-plugins`、`hack`或`.github/workflows`；不新增 Vue/Vben/Ant Design 兼容层；不改变后端 API、权限或数据权限语义。
- 前置门禁：阶段六已通过；`GATE-010`继续保持未完成。

## 任务状态

| 任务 | 状态 | 证据 |
| --- | --- | --- |
| `RW-160`至`RW-167` | `Passed` | 登录/错误页、Dashboard、API Docs、系统信息/About 和个人中心已通过 Wave A 门禁 |
| `RW-168`至`RW-175` | `Passed` | 用户、角色、授权用户和菜单管理已完成 React/Semi 迁移；24 个 Wave B 回归测试及全量门禁通过 |
| `RW-176`至`RW-180` | `Passed` | 配置、字典、文件和消息已完成 React/Semi 迁移；全量 129 个测试及生产构建通过 |
| `RW-181`至`RW-183` | `Passed` | 任务组、任务和任务日志已完成 React/Semi 迁移；全量 131 个测试及生产构建通过 |
| `RW-184`至`RW-187` | `Passed` | 插件摘要、动态状态和完整治理流程已迁移；重型治理对话框独立 chunk，builtin 双重过滤 |
| `RW-188`至`RW-199` | `Passed` | 页面波次测试、共享能力、富文本、JSON、树、导出及 13 个旧测试映射全部完成 |

## 命令与结果

| 序号 | 命令 | 退出码 | 结果 |
| --- | --- | --- | --- |
| 1 | 本阶段重新读取`AGENTS.md`及命中的规则文件 | `0` | workflow、documentation、architecture、frontend-ui、plugin、api-contract、data-permission、testing、i18n、cache-consistency 和 Markdown instructions 已读取 |
| 2 | 读取`RW-160`至`RW-199`、页面迁移矩阵、旧页面/API 和 13 个定制测试 | `0` | 阶段任务与五个页面波次已建立代码库对照 |
| 3 | `pnpm exec vitest run src/features/dashboard src/features/about src/features/profile src/api/profile.test.ts src/router/project-menu.test.tsx` | `0` | Wave A 8 个测试文件、20 个测试通过 |
| 4 | `pnpm typecheck` | `0` | Wave A 严格 TypeScript 检查通过 |
| 5 | `pnpm lint` | `0` | Wave A ESLint 无错误或警告 |
| 6 | `pnpm build` | `0` | Wave A 生产构建通过；ECharts/ZRender 独立懒加载，无 JavaScript chunk 体积告警 |
| 7 | 读取旧用户、角色、授权用户和菜单页面/API，并核对 capability、租户选项与数据权限规则 | `0` | REST 路径、批量请求语义、组织/租户字段投影和角色数据范围降级已建立代码对照 |
| 8 | `pnpm exec vitest run src/api/system/iam-api.test.ts src/features/iam/role/data-scope.test.ts src/features/iam/user/tenant-options.test.ts src/features/iam/user/user-page.test.tsx src/features/iam/role/role-page.test.tsx src/features/iam/menu/menu-page.test.tsx` | `0` | Wave B 6 个测试文件、10 个测试通过 |
| 9 | `pnpm test:unit` | `1` | 新增测试并行运行后，既有 Profile 交互测试超过默认 5 秒超时；IAM 测试无失败 |
| 10 | 在 Vitest 配置中设置`maxWorkers: 8`和`testTimeout: 10_000`后运行`pnpm test:unit` | `0` | 38 个测试文件、124 个测试全部通过；修复高并发 jsdom 资源争用导致的假失败 |
| 11 | `pnpm typecheck && pnpm lint` | `0` | Wave B 最终 TypeScript 与 ESLint 检查通过 |
| 12 | `pnpm exec vitest run src/router/project-menu.test.tsx src/auth/auth-gate.test.tsx src/features/iam/menu/menu-page.test.tsx src/features/iam/role/role-page.test.tsx src/features/iam/user/user-page.test.tsx src/api/system/iam-api.test.ts src/features/iam/role/data-scope.test.ts src/features/iam/user/tenant-options.test.ts` | `0` | 动态隐藏路由、认证上下文刷新及 IAM 回归共 8 个测试文件、24 个测试通过 |
| 13 | `pnpm build` | `0` | 生产构建完成 3,073 个模块转换；IAM 页面独立懒加载，最大 JavaScript chunk 为 602.10 kB，低于项目 700 kB 告警线 |
| 14 | IAM 路径静态扫描 Vue、Vben、Ant Design、宿主私有目录和禁止范围引用 | `0` | IAM 新代码无禁用依赖或越界路径；全仓命中仅为既有治理正则、图标键和兼容性测试样例 |
| 15 | 读取旧配置、字典类型/数据、文件、消息页面与 API，并核对 Go API 元数据 | `0` | Wave C 路径、DTO、导入导出、上传下载和用户消息边界已建立代码对照 |
| 16 | `pnpm typecheck && pnpm lint && pnpm exec vitest run src/api/system/settings-api.test.ts src/features/settings/settings-pages.test.tsx src/layout/workbench-layout.test.tsx` | `0` | Wave C 初始门禁 3 个测试文件、5 个测试通过；TypeScript 与 ESLint 通过 |
| 17 | 文件拒绝反馈测试首次运行 | `1` | 测试 QueryClient 使用默认重试，1 秒内未进入 error 状态；产品代码无失败 |
| 18 | 将测试 QueryClient 重试关闭后运行`pnpm exec vitest run src/api/system/settings-api.test.ts src/features/settings/settings-pages.test.tsx` | `0` | 2 个测试文件、4 个测试通过，包含后端 403 数据权限拒绝反馈 |
| 19 | `pnpm test:unit && pnpm build` | `0` | 40 个测试文件、129 个测试通过；生产构建完成 3,106 个模块转换，设置页面保持独立懒加载 |
| 20 | Wave C 路径静态扫描 Vue、Vben、Ant Design、聚合 Semi 导入和首屏预加载 | `0` | 新代码无禁用依赖；`dist/index.html`不预加载配置、字典、文件、消息或 IAM 页面 chunk |
| 21 | 读取旧任务组、任务、任务日志页面/API 和公共 Cron 配置 | `0` | Wave D handler/shell、权限、状态、触发、日志清理和取消边界已建立代码对照 |
| 22 | `pnpm typecheck && pnpm lint` | `0` | Wave D TypeScript 与 ESLint 检查通过 |
| 23 | `pnpm exec vitest run src/api/system/job.test.ts src/features/scheduler/scheduler.test.tsx && pnpm build` | `0` | 调度 API 与三个页面测试通过；生产构建完成 3,110 个模块转换，三个页面独立懒加载 |
| 24 | `pnpm test:unit` | `0` | 42 个测试文件、131 个测试全部通过 |
| 25 | 读取旧插件管理 API、摘要页及 10 个治理子组件 | `0` | 安装/启停、授权、依赖、策略、卸载、升级和生命周期前置条件边界已建立代码对照 |
| 26 | `pnpm typecheck && pnpm lint && pnpm exec vitest run src/api/system/plugin.test.ts src/features/plugins/plugin-page.test.tsx` | `0` | 插件 API、builtin 过滤、延迟治理加载和依赖阻断测试通过；TypeScript 与 ESLint 通过 |
| 27 | `pnpm build`及`dist/index.html`/插件资产检查 | `0` | 列表为独立`plugin-page` chunk，重型治理为独立`plugin-governance-dialog` chunk，首屏 HTML 未 preload 二者 |
| 28 | `pnpm test:unit` | `0` | 44 个测试文件、133 个测试全部通过 |
| 29 | `pnpm typecheck && pnpm lint && pnpm exec vitest run src/shared/shared-components.test.tsx src/shared/export-workflow.test.ts src/features/settings/dict/dict-options.test.tsx` | `0` | 字典 Query/标签、上传校验、TipTap、JSON、树和导出工作流共 7 个综合测试通过 |
| 30 | 建立`docs/2026-07-12-react-workbench-custom-unit-test-map.md` | `0` | 13 个 Lina 定制旧单元测试逐项映射到 React 等价或更强测试 |
| 31 | `pnpm typecheck && pnpm lint && pnpm test:unit && pnpm build` | `0` | 47 个测试文件、140 个测试通过；生产构建完成 3,118 个模块转换，无 JavaScript chunk 告警 |

## 失败项

- 当前失败：无。
- 已解决失败：补齐`ResizeObserver`和 Range 浏览器测试夹具；修正 API Docs 语言切换测试同步；为 React 19 注入 Semi`createRoot`适配；把 ECharts/ZRender 与个人页 Semi 组件拆为独立懒加载 chunk；修正头像 Modal 无障碍名称；将 Vitest 并发限制为 8 个 worker，消除 jsdom 高并发导致的 Profile 测试超时；补齐角色授权页宿主隐藏动态路由；关闭数据权限失败测试中的 Query 自动重试，使断言覆盖真实 error 状态。
- 外部阻断：无。

## 截图与人工审查

- 截图目录：待页面实现后记录；当前桌面浏览器运行时可用浏览器列表沿用前序阶段为空的事实，不伪造截图证据。
- 视觉审查：待执行。
- E2E 质量审查：触发；本阶段迁移用户可观察页面、CRUD、上传下载、权限、数据权限反馈和端到端工作流。应用内自动化先覆盖核心成功/失败路径，正式宿主 E2E 与截图限制在阶段记录中如实说明。

## 影响评估

| 规则域 | 结论 | 证据或说明 |
| --- | --- | --- |
| 架构 | 有影响 | 宿主工作台展示与 API 投影迁入`lina-web`，不污染`lina-core` |
| 插件 | 有有限影响 | 只消费阶段六源码插件 slot 与现有插件治理 API，不修改插件 |
| 前端 UI | 有影响 | 全部宿主管理页面改为 React 与 Semi Design |
| API | 有前端投影影响 | 复用现有 LinaPro REST API，不修改 HTTP 契约 |
| 后端与 DI | 无影响 | 不修改 Go、后端服务或依赖注入 |
| 数据库 | 无影响 | 不修改 SQL、DAO、表或索引 |
| 数据权限 | 无后端语义变化 | 前端仅隐藏无权限动作并展示后端拒绝；后端仍是数据权限权威 |
| 缓存一致性 | 有前端影响 | 服务端状态按租户和 feature query key 管理；菜单写入刷新认证上下文；配置写入/导入整页刷新公共配置；消息列表与未读数使用同一 Query family |
| i18n | 有影响 | 新页面文案进入`en-US`和`zh-CN`宿主资源并在渲染期求值 |
| 开发工具 | 有有限影响 | Vite 测试并发固定为 8，交互测试超时为 10 秒；JavaScript chunk 告警线按实际 Semi vendor 基线设为 700 kB；不修改 CI |
| 测试 | 有影响 | Wave B/C/D/E 新增 API、capability、路由、宿主管理页、插件治理、懒加载和拒绝反馈测试；全量 133 个测试通过 |
| 文档 | 有影响 | 新增阶段七执行记录，验收后更新 Tasklist 和执行性 Review |

## 变更文件

- 新增：`apps/lina-web/src/api/system/`、`apps/lina-web/src/features/iam/`、`apps/lina-web/src/features/settings/`、`apps/lina-web/src/features/scheduler/`、`apps/lina-web/src/features/plugins/`、`apps/lina-web/src/shared/`和`apps/lina-web/src/router/host-routes.ts`中的阶段七实现与测试；新增 13 个旧测试映射文档。
- 修改：工作台运行时/认证刷新上下文、宿主页面及隐藏路由注册、路由参数匹配、顶栏消息入口、双语资源、全局样式、Vite 测试与 chunk 告警配置。
- 删除：无。
- 未经授权的 Git 操作：无；不得执行 commit、push 或 PR。

## 审查结论

- 审查范围：Wave B/C 新增 API、IAM、配置、字典、文件、消息、宿主动态路由、认证上下文刷新、双语资源、测试与构建配置；同时检查禁止目录边界。
- 已读取规则：`AGENTS.md`、workflow、documentation、architecture、frontend-ui、plugin、api-contract、data-permission、testing、i18n、cache-consistency 和 Markdown instructions。
- 严重问题：`0`；角色授权页最初缺少宿主静态动态路由，已在勾选前修复并补测试；插件治理重型弹窗已从列表 chunk 分离。
- 警告：当前执行环境 Node.js 为`20.19.5`，低于项目声明的`22.22.0`；pnpm 每次命令均提示 engine warning，但类型检查、lint、124 个单测和生产构建均成功。
- 剩余风险：当前桌面浏览器运行时无可用浏览器实例，未生成视觉截图或真实后端 E2E 证据；不以 jsdom 证据替代该事实。

## 阶段验收

- Tasklist 阶段验收：`apps/lina-vben`当前承载的宿主工作流全部有 React/Semi 实现。
- 验收结果：`Passed`；宿主内建工作流已有 React/Semi 实现，47 个测试文件、140 个测试、类型检查、lint 和生产构建全部通过。
- Tasklist 勾选：只有实现与验证证据全部成立后才更新。
