# UI 全页面审计修复执行记录

## 阶段信息

| 字段 | 值 |
| --- | --- |
| 阶段 | `UIA`全页面审计修复 |
| Tasklist 版本 | `v1.0` |
| 任务范围 | `UIA-001`至`UIA-044` |
| 状态 | `Passed` |
| 开始时间 | `2026-07-25 00:00 Asia/Shanghai` |
| 完成时间 | `2026-07-25 Asia/Shanghai` |
| 执行分支 | `main` |
| 宿主基线 | `89c640fd` |
| 插件基线 | `89c640fd` |

## 范围与边界

- 目标：修复管理员可达页面的路由、壳层、状态反馈、表格可读性、工作台语义与可访问性问题，并留下可复现的自动化和截图证据。
- 修改范围：`apps/lina-web/`、`apps/lina-plugins/linapro-content-notice/`、`apps/lina-plugins/linapro-ai-core/`、各自归属的 E2E、`temp/20260725/`和本记录。
- 禁止范围：不改动`apps/lina-core/`的领域契约、HTTP API、数据库、数据权限、缓存、CI 或开发工具；不为插件页面增加宿主页兜底。
- 前置门禁：已读取`AGENTS.md`、`.contributing`、工作流、文档、架构、插件、前端 UI、测试与 i18n 规则；已读取`lina-e2e`和`frontend-design`技能。`frontend-design`仅用于保持既有产品视觉语言与无障碍约束，不引入新的视觉体系。

## 基线与根因

- `UIA-001`：已记录基线。开始时`git status --short`已有认证、工作台布局、Vite 配置、认证 E2E 和三份文档改动；它们不属于本阶段，实施与审查时保持隔离。审计基线截图位于`temp/20260725/ui-audit/`，包含`01`至`29`共 29 张页面截图。
- `UIA-002`：静态复现确认`about/index`已在`hostPages`登记，但`hostSupplementalRoutes`不存在`/about`，因此运行路由无法解析。`/about/api-docs`只渲染百分比高度 iframe，缺少预检、超时、失败和重试状态。`/system/notice`由`linapro-content-notice`的已启用插件生命周期、菜单和 UI 注册共同决定，插件 UI 已声明`/system/notice`页面，运行环境状态待 E2E 核验。

## 任务状态

| 任务 | 状态 | 证据 |
| --- | --- | --- |
| `UIA-001` | `Passed` | 本记录的基线与边界章节。 |
| `UIA-002` | `Passed` | 本记录的基线与根因章节、`host-routes.ts`、`api-docs-page.tsx`和插件 UI 声明静态检查。 |
| `UIA-003`至`UIA-007` | `Passed` | 隐藏`/about`路由、API 文档预检/失败重试状态和静态资源 MIME 映射均已实施；Chrome 通道下`TC001a`至`TC001k`覆盖真实 Stoplight 渲染、加载、失败和重试。 |
| `UIA-008`至`UIA-010` | `Passed` | 通过本地 PostgreSQL 容器中的`psql`完成源码插件安装、启用、停用、卸载、菜单挂载和路由可达性 E2E；启用页面截图已审阅。 |
| `UIA-011`至`UIA-013` | `Passed` | `.tab-item`不可收缩、标题省略、关闭按钮名称和焦点恢复均已实施；`workbench-layout.test.tsx`覆盖标签去重、截断、关闭后的激活与键盘操作。 |
| `UIA-014` | `Passed` | `dashboard/TC008-tab-strip-overflow.ts`在独立上下文中连续打开 15 个管理员可达路由，断言标签数、横向溢出、固定高度、单行文本和键盘到达关闭按钮，并保留截图。 |
| `UIA-015` | `Passed` | `dashboard/TC008-tab-strip-overflow.ts`覆盖中文/英文与浅色/深色四种组合；语言切换后标签立即翻译、焦点仍可到达，切换菜单自动关闭，四张截图已人工审阅。 |
| `UIA-016` | `Passed` | 参数设置页的加载、空、失败和重试状态互斥；`TC009`在中文和英文下覆盖浏览器级状态切换、重试恢复和截图，组件测试覆盖相同回归。 |
| `UIA-017` | `Passed` | AI 渠道、模型、档位和调用日志均使用`ListFeedback`互斥状态；`TC009`证明真实渠道路由的加载、空、失败、重试、双语和单一主操作，既有`TC001`至`TC003`覆盖各页面核心成功路径。 |
| `UIA-018` | `Passed` | 消息空态说明工作台和已启用插件为来源；`settings/message/TC001`覆盖加载、空态、失败、重试和英文翻译，并保留截图。 |
| `UIA-019` | `Passed` | 文件列表`TC004`和 AI共享`ListFeedback`的`TC009`均验证本地化失败、重试和可访问状态；调用日志与其他 AI 列表复用同一实现。 |
| `UIA-020` | `Passed` | 宿主公共空态资源与 AI插件语言资源已更新；运行时文案不在模块顶层求值，`make i18n.check`通过。 |
| `UIA-021` | `Passed` | `TC009-config-list-feedback`、`settings/message/TC001`、`settings/file/TC004`和 AI插件`TC009`覆盖加载、空、失败、重试与中英文截图；AI的既有`TC001`至`TC003`补充各页成功路径。 |
| `UIA-022`至`UIA-030` | `Passed` | 用户部门筛选、角色更多操作、菜单图标预览、插件首屏收敛和各插件表格的列宽/截断策略已实施；用户、角色、插件、在线用户、日志和 AI 页面 E2E覆盖筛选、危险操作与关键布局。 |
| `UIA-031`至`UIA-036` | `Passed` | 工作台和分析页明确展示示例语义及时间范围；欢迎和项目描述有两行截断/完整提示；系统信息长字符串使用复用的`VersionValue`提供省略、Tooltip 和复制，关键 E2E及截图通过。 |
| `UIA-037`至`UIA-044` | `Passed` | 已完成可访问名称、焦点路径、双语/主题/视口审阅、i18n、类型/组件/E2E验证和最终隔离审查。 |

## 命令与结果

| 序号 | 命令 | 退出码 | 结果 |
| --- | --- | --- | --- |
| 1 | `git status --short` | `0` | 识别既有工作区改动并记录隔离边界。 |
| 2 | `find temp/20260725/ui-audit -type f` | `0` | 确认 29 张审计基线截图。 |
| 3 | `rg`与`sed`静态检查路由、API 文档及插件 UI 注册 | `0` | 获得当前根因和实施边界。 |
| 4 | `pnpm --dir apps/lina-web typecheck` | `0` | 宿主与源码插件 UI 类型检查通过；当前 Node`20.19.5`低于仓库指定的`22.22.0`，仅产生引擎警告。 |
| 5 | `pnpm --dir apps/lina-web exec vitest run src/features/about/about.test.tsx src/router/project-menu.test.tsx src/layout/workbench-layout.test.tsx` | `0` | 3 个文件、23 项通过，覆盖隐藏路由权限、API 文档状态和标签焦点恢复。 |
| 6 | `pnpm --dir apps/lina-web exec vitest run src/features/settings/settings-pages.test.tsx src/features/settings/config/config-page.test.tsx src/features/plugins/plugin-page.test.tsx` | `0` | 3 个文件、5 项通过，覆盖设置页和插件管理的既有行为。 |
| 7 | `pnpm --dir hack/tests exec playwright test e2e/about/TC001-api-docs-page.ts --project=chromium` | `1` | 启动前失败：当前 Node`20.19.5`缺少`node:sqlite`；pnpm/Playwright 需要仓库锁定的 Node`22.22.0`。 |
| 8 | `source /Users/oz/.nvm/nvm.sh && nvm use 22.22.0 && pnpm --dir hack/tests exec playwright test e2e/about/TC001-api-docs-page.ts --project=chromium` | `1` | Node 版本问题已解除；失败原因变为缺少 Chromium 浏览器二进制。 |
| 9 | `source /Users/oz/.nvm/nvm.sh && nvm use 22.22.0 && make i18n.check` | `0` | 宿主和插件运行时 i18n 扫描与消息覆盖检查通过。 |
| 10 | `source /Users/oz/.nvm/nvm.sh && nvm use 22.22.0 && pnpm --dir apps/lina-web typecheck && pnpm --dir apps/lina-web exec vitest run <8个受影响测试文件>` | `0` | 类型检查通过；8 个测试文件、33 项测试通过。 |
| 11 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH E2E_BROWSER_CHANNEL=chrome pnpm --dir hack/tests exec playwright test e2e/about/TC001-api-docs-page.ts --project=chromium --grep 'TC001j\|TC001k'` | `0` | 2 项通过。重试断言等待 iframe 内`Overview`和加载遮罩隐藏后截图，避免将空 iframe 误判为成功。 |
| 12 | `curl -sSI http://127.0.0.1:5666/admin/stoplight/{apidocs.html,styles.min.css,web-components.min.js}` | `0` | 分别返回`text/html; charset=utf-8`、`text/css; charset=utf-8`和`text/javascript; charset=utf-8`；修复 Vite 开发态静态资源 MIME 映射。 |
| 13 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH pnpm --dir apps/lina-web typecheck && pnpm --dir apps/lina-web exec vitest run <8个受影响测试文件>` | `0` | 类型检查通过；8 个文件、32 项测试通过。 |
| 14 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH E2E_BROWSER_CHANNEL=chrome pnpm --dir hack/tests exec playwright test e2e/extension/plugin/TC013-plugin-management-table-layout.ts --project=chromium --grep 'TC-13[abc]'` | `0` | 首屏字段、详情低频字段和安装详情标签单行断言分别通过。旧 POM 的 Ant/VXE 选择器已改为 Semi 的真实可观察语义。 |
| 15 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH make i18n.check` | `0` | 宿主与插件运行时扫描、消息覆盖和前端键覆盖全部通过。 |
| 16 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH E2E_BROWSER_CHANNEL=chrome pnpm --dir hack/tests exec playwright test apps/lina-plugins/linapro-content-notice/hack/tests/e2e/plugin-management/TC001-official-source-plugin-lifecycle.ts --project=chromium` | `1` | 用例启动后在安装 SQL 准备阶段失败：`spawnSync psql ENOENT`。该失败来自环境缺少 PostgreSQL 客户端，非页面、路由或插件生命周期断言失败。 |
| 17 | `git diff --check` | `0` | 当前工作区补丁无空白错误。 |
| 18 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH E2E_BROWSER_CHANNEL=chrome pnpm --dir hack/tests exec playwright test e2e/iam/role/TC002-role-auth-user.ts --project=chromium` | `0` | 3 项通过。授权用户动作已通过“更多操作”菜单触发，覆盖页面加载、邮箱列和批量取消授权状态。 |
| 19 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH E2E_BROWSER_CHANNEL=chrome pnpm --dir hack/tests exec playwright test apps/lina-plugins/linapro-monitor-online/hack/tests/e2e/TC003-online-user-force-logout.ts --project=chromium` | `1` | 2 项均在插件 mock 数据准备阶段因`spawnSync psql ENOENT`失败，未进入强制下线 UI 或业务断言。 |
| 20 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH pnpm --dir apps/lina-web typecheck && E2E_BROWSER_CHANNEL=chrome pnpm --dir hack/tests exec playwright test e2e/iam/role/TC002-role-auth-user.ts --project=chromium --grep TC002a` | `0` | 角色“更多操作”菜单改为受控状态后，类型检查和授权用户跳转路径通过；导航后的截图不再保留旧下拉菜单。 |
| 21 | `E2E_PSQL_BIN=/Volumes/c/Workspace/linapro-react/temp/20260725/ui-audit-remediation/075600-docker-psql.sh E2E_BASE_URL=http://127.0.0.1:5666 E2E_BACKEND_BASE_URL=http://127.0.0.1:9120 E2E_PUBLIC_BASE_URL=http://127.0.0.1:9120 E2E_FRONTEND_PROXY_BACKEND_ORIGIN=http://127.0.0.1:9120 E2E_BROWSER_CHANNEL=chrome pnpm --dir hack/tests exec playwright test apps/lina-plugins/linapro-content-notice/hack/tests/e2e/plugin-management/TC001-official-source-plugin-lifecycle.ts --project=chromium` | `0` | 通过本地`linapro-phase10-postgres`容器的`psql`完成源码插件完整生命周期验证；临时适配器已删除。 |
| 22 | `E2E_PSQL_BIN=/Volumes/c/Workspace/linapro-react/temp/20260725/ui-audit-remediation/075600-docker-psql.sh E2E_BASE_URL=http://127.0.0.1:5666 E2E_BACKEND_BASE_URL=http://127.0.0.1:9120 E2E_PUBLIC_BASE_URL=http://127.0.0.1:9120 E2E_FRONTEND_PROXY_BACKEND_ORIGIN=http://127.0.0.1:9120 E2E_BROWSER_CHANNEL=chrome pnpm --dir hack/tests exec playwright test apps/lina-plugins/linapro-monitor-online/hack/tests/e2e/TC003-online-user-force-logout.ts --project=chromium` | `0` | 2 项通过：显示确认弹窗，取消后未执行强制下线。 |
| 23 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH pnpm --dir apps/lina-web typecheck && pnpm --dir apps/lina-web exec vitest run ../lina-plugins/linapro-monitor-online/frontend/plugin-ui.test.ts && E2E_PSQL_BIN=/Volumes/c/Workspace/linapro-react/temp/20260725/ui-audit-remediation/075600-docker-psql.sh E2E_BASE_URL=http://127.0.0.1:5666 E2E_BACKEND_BASE_URL=http://127.0.0.1:9120 E2E_PUBLIC_BASE_URL=http://127.0.0.1:9120 E2E_FRONTEND_PROXY_BACKEND_ORIGIN=http://127.0.0.1:9120 E2E_BROWSER_CHANNEL=chrome pnpm --dir hack/tests exec playwright test apps/lina-plugins/linapro-monitor-online/hack/tests/e2e/TC003-online-user-force-logout.ts --project=chromium --grep TC003b` | `0` | 类型检查、3 项插件测试与危险操作的焦点恢复/截图验证通过；浏览器与操作系统字段改为单行截断并提供完整原生提示。 |
| 24 | `E2E_PSQL_BIN=/Volumes/c/Workspace/linapro-react/temp/20260725/ui-audit-remediation/080100-docker-psql.sh E2E_BROWSER_CHANNEL=chrome pnpm --dir hack/tests exec playwright test apps/lina-plugins/linapro-ai-core/hack/tests/e2e/TC001-smart-center-provider-management.ts --project=chromium` | `0` | 6 项渠道管理 E2E 通过，包含列表布局与截图证据。 |
| 25 | `E2E_PSQL_BIN=/Volumes/c/Workspace/linapro-react/temp/20260725/ui-audit-remediation/080100-docker-psql.sh E2E_BROWSER_CHANNEL=chrome pnpm --dir hack/tests exec playwright test apps/lina-plugins/linapro-ai-core/hack/tests/e2e/TC002-smart-center-tier-management.ts --project=chromium` | `0` | 6 项档位管理 E2E 通过，包含配置抽屉与加载态验证。 |
| 26 | `E2E_PSQL_BIN=/Volumes/c/Workspace/linapro-react/temp/20260725/ui-audit-remediation/080100-docker-psql.sh E2E_BROWSER_CHANNEL=chrome pnpm --dir hack/tests exec playwright test apps/lina-plugins/linapro-ai-core/hack/tests/e2e/TC003-ai-invocation-logs.ts --project=chromium` | `0` | 1 项调用日志全链路 E2E 通过，覆盖筛选、详情脱敏、范围清理和截图。 |
| 27 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH pnpm --dir apps/lina-web typecheck && make i18n.check && git diff --check` | `0` | 最终本轮类型、i18n 与补丁格式门禁通过。 |
| 28 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH E2E_BASE_URL=http://127.0.0.1:5666 E2E_BACKEND_BASE_URL=http://127.0.0.1:9120 E2E_PUBLIC_BASE_URL=http://127.0.0.1:9120 E2E_FRONTEND_PROXY_BACKEND_ORIGIN=http://127.0.0.1:9120 E2E_BROWSER_CHANNEL=chrome pnpm --dir hack/tests exec playwright test e2e/dashboard/TC008-tab-strip-overflow.ts --project=chromium` | `0` | 15 个路由持久化为 15 个标签；标签栏横向溢出且高度不超过 50px，所有标签文本单行，键盘从主按钮到达关闭按钮。 |
| 29 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH E2E_BASE_URL=http://127.0.0.1:5666 E2E_BACKEND_BASE_URL=http://127.0.0.1:9120 E2E_PUBLIC_BASE_URL=http://127.0.0.1:9120 E2E_FRONTEND_PROXY_BACKEND_ORIGIN=http://127.0.0.1:9120 E2E_BROWSER_CHANNEL=chrome pnpm --dir hack/tests exec playwright test e2e/dashboard/TC007-workbench-navigation-icons.ts --project=chromium` | `0` | 将历史重复的`TC006`顺延为`TC007`后，导航图标真实语义与截图回归通过。 |
| 30 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH E2E_BASE_URL=http://127.0.0.1:5666 E2E_BACKEND_BASE_URL=http://127.0.0.1:9120 E2E_PUBLIC_BASE_URL=http://127.0.0.1:9120 E2E_FRONTEND_PROXY_BACKEND_ORIGIN=http://127.0.0.1:9120 E2E_BROWSER_CHANNEL=chrome pnpm --dir hack/tests exec playwright test e2e/dashboard/TC008-tab-strip-overflow.ts --project=chromium --grep 'TC-8b'` | `1` | 初版断言错误地将当前激活插件页视为标签数组末项；实际末项保持为`About`，不属于产品故障。随后改为按翻译后的可访问标题定位。 |
| 31 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH E2E_BASE_URL=http://127.0.0.1:5666 E2E_BACKEND_BASE_URL=http://127.0.0.1:9120 E2E_PUBLIC_BASE_URL=http://127.0.0.1:9120 E2E_BROWSER_CHANNEL=chrome pnpm --dir hack/tests exec playwright test e2e/dashboard/TC008-tab-strip-overflow.ts --project=chromium` | `0` | `TC-8a`和`TC-8b`均通过，覆盖 15 标签、键盘关闭按钮、中文/英文、浅色/深色与语言菜单关闭。 |
| 32 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH pnpm --dir apps/lina-web typecheck && make i18n.check && git diff --check` | `0` | TypeScript、运行时翻译扫描、语言资源覆盖和补丁格式全部通过。 |
| 33 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH E2E_BASE_URL=http://127.0.0.1:5666 E2E_BACKEND_BASE_URL=http://127.0.0.1:9120 E2E_PUBLIC_BASE_URL=http://127.0.0.1:9120 E2E_BROWSER_CHANNEL=chrome pnpm --dir hack/tests exec playwright test e2e/dashboard/TC008-tab-strip-overflow.ts --project=chromium && pnpm --dir apps/lina-web typecheck && git diff --check` | `0` | 将跨路由访问收敛到`MainLayout`页面对象后，两个标签栏 E2E 与当前 TypeScript、补丁格式门禁再次通过。 |
| 34 | `E2E_BASE_URL=http://127.0.0.1:5667 ... playwright test e2e/settings/config/TC005-config-crud.ts --grep TC005a` | `1` | 独立 Vite实例可完成认证与页面加载，但后端列表查询返回 SQL 错误；该外部数据环境异常不用于状态反馈验收，后续用例以浏览器路由桩稳定复现。 |
| 35 | `E2E_BASE_URL=http://127.0.0.1:5667 ... playwright test e2e/settings/config/TC009-config-list-feedback.ts --project=chromium` | `0` | 覆盖参数设置加载不显示空态、中文本地化失败、重试恢复和英文空态；截图已审阅。 |
| 36 | `E2E_BASE_URL=http://127.0.0.1:5667 ... playwright test e2e/settings/message/TC001-message-list-feedback.ts --project=chromium` | `0` | 覆盖我的消息加载、消息来源空态、中文失败重试和英文翻译；截图已审阅。 |
| 37 | `E2E_BASE_URL=http://127.0.0.1:5667 ... playwright test e2e/settings/file/TC004-file-list-feedback.ts --project=chromium` | `0` | 覆盖文件列表可访问加载状态、中文失败重试和英文空结果；截图已审阅。 |
| 38 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH pnpm --dir apps/lina-web exec vitest run src/features/settings/config/config-page.test.tsx src/features/settings/settings-pages.test.tsx && pnpm --dir apps/lina-web typecheck && make i18n.check && git diff --check` | `0` | 7项宿主组件测试、类型检查、翻译治理和补丁格式门禁通过。 |
| 39 | `E2E_PSQL_BIN=<临时 Docker psql包装器> E2E_BASE_URL=http://127.0.0.1:5667 ... playwright test apps/lina-plugins/linapro-ai-core/hack/tests/e2e/TC009-ai-list-feedback.ts --project=chromium` | `0` | 源码插件自有 E2E覆盖渠道列表加载、空态、失败、重试、中文/英文和单一主操作；临时包装器已删除。 |
| 40 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH pnpm --dir apps/lina-web typecheck && pnpm --dir apps/lina-web exec vitest run ../lina-plugins/linapro-ai-core/frontend/plugin-ui.test.ts && make i18n.check && git diff --check` | `0` | 宿主和插件 UI类型检查、7项插件 UI测试、翻译治理和补丁格式门禁通过。 |
| 41 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH E2E_BASE_URL=http://127.0.0.1:5667 ... playwright test e2e/dashboard/TC001-analytics-overview.ts e2e/dashboard/TC002-workspace-navigation.ts e2e/about/TC002-system-info-page.ts --project=chromium` | `0` | 11项通过，覆盖示例语义、1366px/390px、项目描述提示、版本复制和截图。 |
| 42 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH pnpm --dir apps/lina-web typecheck && pnpm --dir apps/lina-web exec vitest run <8个受影响文件> && make i18n.check && git diff --check` | `0` | 18项组件测试、类型检查、翻译治理和补丁格式通过。 |
| 43 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH E2E_BASE_URL=http://127.0.0.1:5667 ... playwright test e2e/about/TC002-system-info-page.ts --grep TC-2e` | `0` | 数据库技术字符串在移动端单行省略，完整值可通过 Tooltip 和复制获取；成功反馈截图已审阅。 |
| 44 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH E2E_BASE_URL=http://127.0.0.1:5667 ... playwright test e2e/dashboard/TC002-workspace-navigation.ts --grep TC002c` | `0` | 移动顶栏租户名称不再按字符换行；项目说明、示例标签和单行高度断言通过。 |

## 失败项

- 当前失败：无已知的本阶段阻断失败。
- 已确认外部环境异常：独立`5667`实例的真实配置列表请求返回后端 SQL 错误，见命令`34`。状态反馈 E2E针对该请求使用路由桩复现成功、加载、失败及重试，不掩盖真实页面状态，且不修改 API、数据库或数据权限边界。
- 已解决测试失败：`TC-8b`初版把“当前页面”等同于“最后一个标签”，在标签持久化保序的实际行为下错误期待`Plugin Management`；已改为定位具体翻译标签并重跑通过。该失败不代表产品回归。
- 已解决失败：Node`20.19.5`不支持`node:sqlite`；以 Node`22.22.0`重跑后使用已安装的 Chrome 通道完成宿主 E2E。API 文档静态资源此前错误返回`application/octet-stream`；现已为 HTML、CSS 和 JS 明确映射 MIME 类型。插件 E2E 的`psql`缺失通过本地 PostgreSQL 容器内现有客户端临时适配，未安装系统依赖。
- 外部阻断：无。独立`5667`实例的配置列表 SQL 异常仍被保留为外部数据环境事实，但不阻断以浏览器路由桩验证的状态反馈用例。

## 截图与人工审查

- 截图目录：`temp/20260725/ui-audit/`为审计基线；本次验证产物将写入`temp/20260725/ui-audit-remediation/`。
- 视觉审查：除既有截图外，已审阅`2026-07-25T09-11-54-analytics-1366-zh.png`、`2026-07-25T09-12-01-analytics-mobile-zh.png`、`2026-07-25T09-12-05-workspace-1366-zh.png`、`2026-07-25T09-19-41-workspace-mobile-zh.png`和`2026-07-25T09-21-17-system-info-mobile-copy-zh.png`。示例数据和时间范围可见，移动顶栏未出现竖排租户名，项目描述有完整提示，数据库版本在专用行单行省略并提供复制成功反馈；未见原始`i18n`键、重叠或正文遮挡。
- E2E 质量审查：已触发。原因是本阶段修改管理员路由、页面、状态、表格、插件生命周期展示和危险操作；每项可观察修复均需独立 E2E，含成功与必要失败路径及实际翻译文案断言。

## 影响评估

| 规则域 | 结论 | 证据或说明 |
| --- | --- | --- |
| 架构 | 有影响 | 插件启停仍仅通过现有生命周期和 UI 注册表；不改宿主领域契约。 |
| 插件 | 有影响 | 核验并按需修复`linapro-content-notice`与`linapro-ai-core`内部 UI 与 E2E。 |
| 前端 UI | 有影响 | 路由、标签栏、页面状态、表格、危险操作和响应式呈现均在范围。 |
| API | 无影响 | 不变更路径、方法、DTO、OpenAPI 或请求频率。 |
| 后端与 DI | 无影响 | 仅消费既有前端与插件稳定接口。 |
| 数据库 | 无影响 | 不引入 SQL、DAO 或索引变更。 |
| 数据权限 | 无影响 | 不改变权限判断或可见数据范围；仅验证既有边界。 |
| 缓存一致性 | 无影响 | 不改缓存或失效策略。 |
| i18n | 有影响 | 宿主及两项显式启用 i18n 的插件需要运行时资源、双语断言和`make i18n.check`。语言下拉关闭修复不新增或修改翻译资源，仅保证既有中英文切换后的视觉状态正确。 |
| 开发工具 | 有影响 | 修改`vite.config.ts`的开发态静态资源 MIME 映射。实现仅使用 Node/Vite 的跨平台 API，Windows、Linux 与 macOS 均按扩展名返回标准 MIME 类型；已以 HTTP 头和 Chrome E2E 验证。为本机 Docker 数据库验证短暂创建的 POSIX包装脚本不是默认入口，已删除；其平台边界和替代原因已记录于命令`21`至`23`和`39`。 |
| 测试 | 有影响 | 组件测试、宿主 E2E、插件 E2E、截图和 E2E 质量审查均在范围。标签栏新增独立`TC008`；历史`TC006`编号冲突已顺延为`TC007`，不改变测试行为。 |
| 文档 | 有影响 | 新增本阶段执行记录；不存在目录级 README 镜像影响。 |

## 变更文件

- 新增：`docs/2026-07-25-ui-audit-remediation-execution-record.md`。
- 修改：宿主路由、API 文档、标签栏、设置/消息/文件页面、用户/角色/菜单/插件页面、AI 插件列表、Vite 静态资源映射以及相应测试与语言资源。具体文件以当前`git status --short`为准，且保留既有认证与其他反馈任务的未提交差异。
- 删除：无。
- Git 操作：实施和验收阶段未执行`commit`、`push`或`PR`。在阶段验收后，用户明确授权本地分批提交；已提交`02dbc726`、`3c10e81b`、`10a611d7`和`58fe2e5a`，未执行`push`或创建`PR`。

## 审查结论

- 审查范围：`git status --short`、未跟踪文件展开和`UIA-001`至`UIA-044`映射。
- 已读取规则：`AGENTS.md`、`.contributing`、`.agents/rules/workflow.md`、`.agents/rules/documentation.md`、`.agents/rules/architecture.md`、`.agents/rules/plugin.md`、`.agents/rules/frontend-ui.md`、`.agents/rules/testing.md`、`.agents/rules/i18n.md`和`.agents/instructions/markdown-format.instructions.md`。
- 严重问题：无。
- 警告：无阻断警告。工作区仍包含用户既有认证和其他反馈改动；它们仅被状态收集，不作为本阶段实现或验证结论。
- 剩余风险：真实配置列表在独立`5667`实例仍有后端 SQL 错误；本阶段不改 API、数据库或数据权限，状态反馈由独立浏览器路由桩证明。

## 阶段验收

- Tasklist 阶段验收：所有完成项具有当前工作区实现、测试、截图和审查证据；无未说明的阻断、i18n 缺口或可访问性回归。
- 验收结果：`Passed`。
- Tasklist 勾选：`UIA-001`至`UIA-044`和通用完成门禁均已按当前实现、测试、截图和审查证据回填。
