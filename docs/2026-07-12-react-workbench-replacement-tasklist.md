# React 工作台替换完整 Tasklist

## 文档定位

本文是`apps/lina-web`替换`apps/lina-vben`的唯一执行清单，供开发者逐项勾选和记录验证证据。详细设计见`docs/2026-07-11-react-workbench-replacement-design.md`。`docs/superpowers/plans/2026-07-11-react-workbench-replacement.md`是冻结前的实现参考，任何未映射到本清单的示例不得直接执行。

本清单只覆盖 LinaPro 通用 React 工作台、官方插件 UI 和最终构建切换。TapCanvas 画布、Hono 到 Go 插件迁移、AI 任务和 Agents Bridge 不属于本清单；本清单不再保存其占位任务或完成状态，后续工作在各自独立 Tasklist 中重新细化。

| 冻结项 | 值 |
| --- | --- |
| 版本 | `v1.3` |
| 状态 | `Frozen` |
| 冻结日期 | `2026-07-12` |
| 宿主基线 | `7d149838e77fe3d2b1bdda5ebb9d46679f79fd23` |
| 插件基线 | `1b90535404d1563a045efe3888dd9db6d1bf5e29` |
| 执行性审查 | `docs/2026-07-12-react-workbench-tasklist-v1-executability-review.md` |

冻结后不得静默修改任务语义、顺序或验收门禁。修复文字错误可以保持当前版本；新增范围、改变架构或调整验收标准必须先记录变更原因并升级清单版本。

### v1.1 变更记录

2026-07-12，产品 owner 明确`lina-tapcanvas`不使用 OpenSpec。`v1.1`移除 OpenSpec 创建、更新和校验门禁，并把继承自上游的 OpenSpec CI 门禁从产品执行链中移除。该决策不改变 React 工作台、插件隔离、测试或交付范围。

### v1.2 变更记录

2026-07-12，产品 owner 确认`apps/lina-plugins`由`lina-tapcanvas`产品仓库直接维护。已使用仓库自带的`linactl plugins.init`把 LinaPro 上游 gitlink 转为普通目录，保留原基线`1b90535404d1563a045efe3888dd9db6d1bf5e29`的插件内容。`v1.2`关闭插件 fork 和子模块指针门禁，插件迁移与父仓库代码在同一版本历史中交付。

### v1.3 变更记录

2026-07-16，产品 owner 要求删除后续独立 Tasklist 的占位任务，再按独立范围重新细化。`v1.3`不再维护`NEXT-*`映射；TapCanvas Studio、AI、Agents Bridge 和其他后续工作只在各自 Tasklist 中记录任务和状态。本次变更不修改`RW-*`任务、既有验收证据或 React 工作台实现。

## 仓库实例

- 产品执行仓库：`lina-tapcanvas`，当前开发分支为`feat/react-workbench-replacement`。
- 上游参考仓库：`linapro`，保持干净，只用于检查和同步 LinaPro 上游变化。
- 产品仓库使用`upstream`读取`git@github.com:linaproai/linapro.git`，并禁用向该远端推送。
- 产品`origin`等待实际新仓库 URL，不使用虚构地址，也不向 LinaPro 上游提交产品代码。

## 执行边界

- [x] `GATE-001`由仓库 owner 创建根目录`.contributing`；已于 2026-07-12 创建并记录本次 React 工作台替换的授权范围。
- [x] `GATE-002`已确认插件来源基线为`1b90535404d1563a045efe3888dd9db6d1bf5e29`，并将`apps/lina-plugins`转换为产品仓库直接跟踪的普通目录；转换前后 966 个文件、3,532,555 字节和内容摘要一致。
- [x] `GATE-003`产品 owner 已确认`lina-tapcanvas`不采用 OpenSpec；不得创建、更新或校验 OpenSpec 变更，也不得把 OpenSpec 状态作为实施或交付门禁。
- [x] `GATE-004`已确认未获得 Git 提交或推送授权，只修改工作区，不执行`git commit`或`git push`。
- [x] `GATE-005`已确认第一阶段只新增或修改`apps/lina-web`和治理文档，不修改`apps/lina-core`、`apps/lina-vben`、`hack`和 CI。
- [x] `GATE-006`已确认正式切换前不提供 Vue/React 产品开关，不让同一页面存在两个权威写入实现。
- [x] `GATE-007`已确认宿主管理页面统一使用`@douyinfe/semi-ui@2.101.0`和`@douyinfe/semi-icons@2.101.0`，不得依赖`antd`或`@ant-design/icons`。
- [x] `GATE-008`已确认源码插件 UI 统一使用 React，动态插件 UI 只使用 iframe 或新标签页。
- [x] `GATE-009`已确认`en-US`和`zh-CN`为唯一目标语言，英文为源内容。
- [x] `GATE-010`为每个阶段创建执行记录，包含命令、退出码、失败项、截图目录和影响评估；统一模板为`docs/2026-07-12-react-workbench-execution-record-template.md`，阶段一记录已创建，全部 14 个阶段记录完成后再勾选本持续门禁。
- [x] `GATE-011`已于 2026-07-12 将产品执行仓库拆分为`lina-tapcanvas`，保留独立的干净`linapro`上游参考目录。
- [x] `GATE-012`已由`v1.2`产品单仓决策关闭：不创建独立插件 fork，`apps/lina-plugins`不得包含嵌套`.git`或 gitlink，插件变更直接由`lina-tapcanvas`父仓库跟踪。
- [x] `GATE-013`已完成代码库对照的执行性审查，并在记录 OpenSpec 与插件单仓决策后冻结本清单`v1.2`；审查证据见冻结表中的执行性审查文档。

## 阶段一：治理契约与基线冻结

- [x] `RW-001`更新`.agents/rules/frontend-ui.md`，删除 Vben、Vue、Ant Design Vue 和`ruoyi-plus-vben5`强绑定要求。
- [x] `RW-002`在`.agents/rules/frontend-ui.md`中规定宿主 React、Semi Design、`SideSheet`、`Table`、`Form`、`Modal`和 Semi Icons 的使用边界。
- [x] `RW-003`在`.agents/rules/frontend-ui.md`中规定不创建`LinaTable`、`LinaForm`、`LinaModal`等转发型通用包装层。
- [x] `RW-004`更新`.agents/rules/plugin.md`，规定源码插件通过`frontend/plugin-ui.ts`贡献 React 页面和插槽。
- [x] `RW-005`更新`.agents/rules/plugin.md`，规定动态插件前端框架只能在 iframe 或新标签页中运行，需要受保护 API 的 iframe 只能使用宿主受限消息桥接。
- [x] `RW-006`从产品治理入口移除 OpenSpec 强制流程，并在`.agents/rules/plugin.md`和本设计中定义`iframe/new-window`、`pluginAssetUrl`和受限消息桥接；继承自上游的`openspec/`内容不作为需求、任务、验证或交付证据。
- [x] `RW-007`在插件 UI 规范中保留`system/plugin/dynamic-page`作为通用工作台承载组件。
- [x] `RW-008`在插件 UI 规范中规定源码 React 页面由`apps/lina-web`按菜单路由匹配，`lina-core`不解析 React 页面 key。
- [x] `RW-009`已确认`docs/2026-07-11-tapcanvas-react-platform-migration-design.md`与本清单边界一致。
- [x] `RW-010`已确认`docs/2026-07-11-react-workbench-replacement-design.md`不再要求`lina-core`扫描`.tsx`。
- [x] `RW-011`已确认`docs/superpowers/plans/2026-07-11-react-workbench-replacement.md`不再包含`DiscoverReactPaths`任务。
- [x] `RW-012`已记录现有基线：宿主应用 90 个 Vue 文件、122 个 TypeScript 文件、37 个 API 文件、13 个 Lina 定制单元测试和 105 个宿主 E2E。
- [x] `RW-013`已记录官方插件基线：9 个源码插件共有 28 个`.vue`页面或插槽，11 个官方插件均启用`en-US`和`zh-CN`。
- [x] `RW-014`已记录动态插件基线：`linapro-demo-dynamic`的`mount.js`共有 2529 行并承载受保护 API、CRUD 和附件流程，`standalone.html`共有 441 行且仅为展示页。
- [x] `RW-015`已运行文档占位词、Markdown 围栏、尾随空格、任务 ID 和路径存在性检查。
- [x] `RW-016`已记录静态资产和共享前端基线：10 个`public/`文件、62 个组件/布局/store/helper 文件和 8 个已发布 slot key。
- [x] `RW-017`已记录工具链基线：25 个文件和 6 个 GitHub Actions workflow 直接引用`lina-vben`或`web-antd`；产品还需移除调用 OpenSpec 门禁的`reusable-test-verification-suite.yml`编排项。
- [x] `RW-018`已通过 npm registry 验证本清单固定的 React、Vite、TypeScript、Router、Query、Zustand、Semi、i18n 和 Vitest 版本真实存在且满足 Node.js`22.22.0`约束。
- [x] `RW-019`已把动态插件受限消息桥接、通用 iframe 查询契约、完整依赖、共享组件、工具链文件、OpenSpec 退出决策和插件单仓交付边界写入`v1.2`。

阶段验收：治理规则明确 React/Semi 单栈和非 OpenSpec 执行链；设计与计划不再把 React 文件发现放进`lina-core`。

## 阶段二：独立创建`apps/lina-web`

- [x] `RW-020`创建`apps/lina-web/.node-version`并固定 Node.js`22.22.0`。
- [x] `RW-021`创建`apps/lina-web/package.json`，固定 pnpm`10.30.3`。
- [x] `RW-022`创建`apps/lina-web/pnpm-lock.yaml`。
- [x] `RW-023`创建`apps/lina-web/tsconfig.json`并启用严格模式、Bundler 模块解析和`#/*`路径别名。
- [x] `RW-024`创建`apps/lina-web/vite.config.ts`，支持工作台 basePath、Stoplight 静态页和`/api`、`/x`、`/x-assets`开发代理。
- [x] `RW-025`创建`apps/lina-web/index.html`和`src/main.tsx`。
- [x] `RW-026`添加 React`19.2.7`和 React DOM`19.2.7`。
- [x] `RW-027`添加 Vite`7.3.1`和 TypeScript`5.9.3`。
- [x] `RW-028`添加`react-router@7.18.1`和`react-router-dom@7.18.1`。
- [x] `RW-029`添加`@tanstack/react-query@5.101.2`和`zustand@5.0.14`。
- [x] `RW-030`添加`@douyinfe/semi-ui@2.101.0`和`@douyinfe/semi-icons@2.101.0`。
- [x] `RW-031`添加`i18next@26.3.6`和`react-i18next@17.0.9`。
- [x] `RW-032`添加`@vitejs/plugin-react@5.2.0`、`@types/react@19.2.17`、`@types/react-dom@19.2.3`和`@types/node@22.20.0`。
- [x] `RW-033`添加`echarts@6.0.0`、`dayjs@1.11.19`、`cropperjs@1.6.2`及`@tiptap/react`、`@tiptap/core`、`@tiptap/pm`、`@tiptap/starter-kit`、`@tiptap/extension-image`、`@tiptap/extension-link`、`@tiptap/extension-placeholder`和`@tiptap/extension-underline`的`2.27.2`版本。
- [x] `RW-034`添加 Vitest`4.0.18`、`@testing-library/react@16.3.2`、`@testing-library/dom@10.4.1`、`@testing-library/jest-dom@6.9.1`、`@testing-library/user-event@14.6.1`和 jsdom`27.4.0`。
- [x] `RW-035`添加`eslint@10.7.0`、`@eslint/js@10.0.1`、`typescript-eslint@8.63.0`、`globals@17.4.0`、`eslint-plugin-react-hooks@7.1.1`和`eslint-plugin-react-refresh@0.5.3`，创建只覆盖 React 工作台的前端 lint 配置。
- [x] `RW-036`创建`src/test/setup.ts`并加载 jest-dom matcher。
- [x] `RW-037`创建`src/app/providers.tsx`，装配`QueryClientProvider`和 Semi`LocaleProvider`。
- [x] `RW-038`创建`src/app/error-boundary.tsx`并提供可恢复错误页面。
- [x] `RW-039`创建`src/styles/tokens.css`和`src/styles/global.css`。
- [x] `RW-040`只加载一次`@douyinfe/semi-ui/dist/css/semi.min.css`。
- [x] `RW-041`使用`theme-mode="dark"`切换 Semi 深色主题。
- [x] `RW-042`迁移 favicon、LinaPro/Goframe logo、默认头像和 Stoplight 三个 API Docs 静态文件；不得复制`vben-logo.webp`等 Vben 品牌资产。
- [x] `RW-043`定义`dev`、`typecheck`、`test:unit`、`lint`和`build`脚本，并创建 Provider smoke test。
- [x] `RW-044`运行`pnpm --dir apps/lina-web typecheck`。
- [x] `RW-045`运行`pnpm --dir apps/lina-web test:unit`。
- [x] `RW-046`运行`pnpm --dir apps/lina-web lint`。
- [x] `RW-047`运行`pnpm --dir apps/lina-web build`并确认`dist/index.html`和`dist/stoplight/apidocs.html`存在。
- [x] `RW-048`检查 lockfile，确认依赖版本与本清单一致且没有第二份 React 主版本。
- [x] `RW-049`确认本阶段没有修改`apps/lina-core`、`apps/lina-vben`、`hack`和`.github/workflows`。

阶段验收：`apps/lina-web`可以独立安装、测试和构建，只显示最小 React/Semi 启动页。

## 阶段三：运行时基础设施

- [x] `RW-050`创建`src/api/contracts.ts`，定义包含`code`、`data`、`error`、`message`、`messageKey`和`messageParams`的`ApiEnvelope<T>`与`ApiError`。
- [x] `RW-051`创建`src/api/client.ts`，默认 API 基址为`/api/v1`。
- [x] `RW-052`实现`Authorization`、`Accept-Language`和`X-Tenant-Code`请求头。
- [x] `RW-053`实现`code !== 0`响应错误投影，优先使用`messageKey`和`messageParams`本地化，并保留英文 fallback。
- [x] `RW-054`实现单飞 Token 刷新。
- [x] `RW-055`限制每个失败请求最多刷新后重放一次。
- [x] `RW-056`实现下载`Blob`和 multipart 上传，不经过普通 JSON 包络。
- [x] `RW-057`实现插件 API 路径`/x/{pluginId}/api/v1/{path}`规范化。
- [x] `RW-058`为请求头、错误投影、并发`401`、刷新失败和下载添加单元测试。
- [x] `RW-059`创建`src/runtime/public-config.ts`。
- [x] `RW-060`实现`GET /api/v1/config/public/frontend`加载和默认值，完整投影`app`、`auth`、`cron`、`user`、`ui`和`workspace`。
- [x] `RW-061`实现`workspace.basePath`校验，拒绝`/api`、`/x`、`/x-assets`、URL、query、hash 和 wildcard。
- [x] `RW-062`实现工作台资产 URL 解析，保留`/api.json`、`/api`、`/x`和`/x-assets`根路径语义。
- [x] `RW-063`为品牌、登录布局、默认头像、水印、主题、Cron shell/时区/日志保留策略、basePath 和资产 URL 添加单元测试。
- [x] `RW-064`创建`src/runtime/i18n.ts`。
- [x] `RW-065`创建`src/locales/en-US`基础语言包。
- [x] `RW-066`创建`src/locales/zh-CN`基础语言包。
- [x] `RW-067`映射 LinaPro`en-US`到 Semi`en_US`。
- [x] `RW-068`映射 LinaPro`zh-CN`到 Semi`zh_CN`。
- [x] `RW-069`接入`GET /api/v1/i18n/runtime/locales`和`GET /api/v1/i18n/runtime/messages`，实现 ETag 和`If-None-Match`。
- [x] `RW-070`实现 7 天本地持久缓存和最多 2 次请求。
- [x] `RW-071`实现`304`、网络失败缓存回退和空消息处理。
- [x] `RW-072`确保所有翻译在渲染期求值，不在模块顶层调用`t()`。
- [x] `RW-073`为 i18n 缓存、语言切换和 Semi locale 添加单元测试。
- [x] `RW-074`创建`src/app/bootstrap.ts`，按公共配置、i18n、Router、React 根节点顺序启动。
- [x] `RW-075`运行运行时基础设施单元测试、类型检查和构建。
- [x] `RW-076`宿主`i18n.enabled=false`时隐藏语言切换并使用后端返回的默认语言；启用时只接受`en-US`和`zh-CN`。
- [x] `RW-077`语言切换时同步刷新公共前端配置、dayjs、菜单、面包屑、标签标题、插件文案和 API Docs`lang`参数，不重新请求`/user/info`。
- [x] `RW-078`定义前端缓存权威源与失效边界：运行时消息最长本地缓存 7 天，Query cache 按会话、租户和插件 generation 精确清理。
- [x] `RW-079`运行`pnpm --dir apps/lina-web lint`并把公共配置、i18n 和 API 客户端验证结果写入阶段记录。

阶段验收：新工作台可以在不接业务页面的情况下正确加载配置、语言和 API 客户端。

## 阶段四：认证、用户、租户与权限

- [x] `RW-080`创建`src/api/auth.ts`并接入登录、刷新和退出接口。
- [x] `RW-081`创建`src/api/user.ts`并接入当前用户接口。
- [x] `RW-082`创建`src/api/menu.ts`并接入动态菜单接口。
- [x] `RW-083`创建`src/api/tenant.ts`并接入登录租户、选择租户、切换租户和代入接口。
- [x] `RW-084`创建`src/auth/session-store.ts`，只持久化 Token 和最小恢复信息。
- [x] `RW-085`禁止在 session store 持久化菜单和权限作为授权事实。
- [x] `RW-086`实现匿名、认证中、租户选择、已认证、刷新中状态转换。
- [x] `RW-087`实现多租户`preToken`选择流程。
- [x] `RW-088`创建`src/auth/login-page.tsx`，只提供 LinaPro 用户名和密码登录。
- [x] `RW-089`保留登录页既有稳定`data-testid`。
- [x] `RW-090`删除 TapCanvas OAuth、短信、邮箱和访客入口的任何设计预留。
- [x] `RW-091`创建`src/auth/auth-gate.tsx`。
- [x] `RW-092`登录成功后并行加载用户、菜单和公共插件状态。
- [x] `RW-093`创建`src/tenant/tenant-store.ts`。
- [x] `RW-094`实现`currentTenant`和`X-Tenant-Code`原子更新。
- [x] `RW-095`实现租户切换前取消租户敏感查询。
- [x] `RW-096`实现租户切换后清空 Query cache、菜单、标签和默认路由。
- [x] `RW-097`实现平台管理员租户代入和退出代入。
- [x] `RW-098`创建`src/layout/can.tsx`，按权限码完全隐藏无权操作。
- [x] `RW-099`创建组织、租户 capability 投影，模块禁用时隐藏字段、列、筛选和按钮。
- [x] `RW-100`为登录状态机、多租户、刷新失败、退出、租户切换和权限隐藏添加单元测试。
- [x] `RW-101`运行认证与租户单元测试、类型检查和构建。
- [x] `RW-102`保留平台代入前的原始 access/refresh Token 恢复语义，但不得把菜单、权限或插件状态持久化为授权事实。
- [x] `RW-103`租户切换和退出代入必须刷新用户、菜单、插件 capability、字典和消息状态，并验证不会跨租户复用 Query cache。
- [x] `RW-104`记录认证与租户状态只消费现有 LinaPro API，不新增或改变后端认证、租户和 RBAC 契约。

阶段验收：React 工作台可以使用 LinaPro 身份体系登录，并正确处理租户和权限上下文。

## 阶段五：路由和工作台外壳

- [x] `RW-110`创建`src/router/contracts.ts`。
- [x] `RW-111`创建`src/router/host-pages.tsx`显式页面注册表。
- [x] `RW-112`创建`src/router/project-menu.tsx`，把`MenuRouteItem`投影为 React 路由。
- [x] `RW-113`禁止根据后端 component 字符串执行任意动态 import。
- [x] `RW-114`为未知 component 渲染可诊断错误页。
- [x] `RW-115`实现隐藏菜单、隐藏面包屑、隐藏标签和外链元数据。
- [x] `RW-116`实现 iframe 路由和新标签页路由，识别后端投影的`iframeSrc`、`link`和`openInNewWindow`元数据。
- [x] `RW-117`创建`src/router/access-gate.tsx`。
- [x] `RW-118`创建`src/layout/workbench-layout.tsx`。
- [x] `RW-119`使用 Semi`Layout`和`Navigation`实现侧栏。
- [x] `RW-120`使用 Semi`SideSheet`实现移动端导航。
- [x] `RW-121`创建工作台 Header、用户菜单、租户切换和插件插槽区域。
- [x] `RW-122`创建`src/layout/tab-strip.tsx`，只缓存标签元数据，不缓存隐藏页面 DOM 树。
- [x] `RW-123`创建`page`和`workspace`两种页面表面。
- [x] `RW-124`创建 Semi Icons 显式映射，未知图标回退`IconGridStroked`。
- [x] `RW-125`实现 403、404、500 和离线错误页面。
- [x] `RW-126`为菜单投影、权限拒绝、未知页面、iframe、外链、标签和两种页面表面添加测试。
- [x] `RW-127`运行路由与布局单元测试、类型检查和构建。

阶段验收：登录后可以进入具备菜单、Header、标签、权限和错误边界的空工作台。

## 阶段六：前端拥有的源码插件 UI 契约

- [x] `RW-130`创建`src/plugin-ui/contract.ts`。
- [x] `RW-131`定义`PluginPageSurface`、`PluginPageDefinition`、`PluginSlotDefinition`和`PluginUIDefinition`。
- [x] `RW-132`固定发布 8 个宿主 slot key。
- [x] `RW-133`定义`frontend/plugin-ui.ts`为每个源码插件唯一 UI 清单入口。
- [x] `RW-134`规定 page map key 使用规范化菜单路由，不使用后端 React component key。
- [x] `RW-135`创建`build/plugin-ui-registry.ts`。
- [x] `RW-136`Vite 只扫描`apps/lina-plugins/*/frontend/plugin-ui.ts`。
- [x] `RW-137`插件 ID由直接目录名确定，清单不得覆盖。
- [x] `RW-138`页面和插槽只通过清单内`load()`懒加载。
- [x] `RW-139`校验重复 route、重复 slot item、未知 slot 和目录逃逸。
- [x] `RW-140`创建`virtual:linapro-plugin-ui`类型声明。
- [x] `RW-141`创建`src/plugin-ui/registry.ts`。
- [x] `RW-142`创建`src/plugin-ui/plugin-host-context.tsx`。
- [x] `RW-143`宿主上下文只暴露 locale、用户投影、租户投影、权限、API 和`t()`。
- [x] `RW-144`禁止上下文暴露 Token、Zustand、QueryClient、Semi 配置对象或后端内部 DTO。
- [x] `RW-145`创建`src/plugin-ui/slot-outlet.tsx`并按 order、插件状态和 capability 过滤。
- [x] `RW-146`创建 generation 签名和定向刷新逻辑。
- [x] `RW-147`插件状态签名不变时禁止重建路由。
- [x] `RW-148`当前不在变更插件页面时禁止打断用户。
- [x] `RW-149`为清单校验、React 懒加载、slot 排序、禁用隐藏和 generation 刷新添加测试。
- [x] `RW-150`静态确认本阶段没有修改`apps/lina-core`，没有新增`DiscoverReactPaths`或其他 React 后端扫描器。
- [x] `RW-151`运行插件 UI 单元测试、类型检查和构建。
- [x] `RW-152`在 Vite`server.fs.allow`中显式允许`apps/lina-plugins`，只允许插件 UI 清单引用所属插件`frontend/`内的模块。
- [x] `RW-153`配置 Vite`resolve.dedupe`和插件源码依赖解析，使 React、React DOM、Router 和 TanStack Query 始终解析到`apps/lina-web/node_modules`。
- [x] `RW-154`发布`@linapro/plugin-ui`稳定前端导入面，只导出`definePluginUI`、类型、`useLinaPluginHost`和允许的宿主投影。
- [x] `RW-155`禁止官方插件前端引用宿主私有`#/*`路径、`@vben/*`、Vue、Ant Design Vue、宿主 store 或内部 DTO；插件 client 必须通过`@linapro/plugin-ui`提供的 API 投影调用后端。
- [x] `RW-156`为外部插件目录的 dev server 读取、裸依赖解析、React 单例、HMR 和生产构建添加集成测试。
- [x] `RW-157`清单读取不得 eager import 页面或插槽 chunk，插件详情、编辑器和图表不得进入工作台首屏 bundle。
- [x] `RW-158`建立 28 个 Vue 文件及其 client/data helper 到 React 文件的逐文件映射，禁止只删除 Vue 文件而遗漏 helper 迁移。
- [x] `RW-159`运行静态导入边界扫描、插件 registry 测试、类型检查、lint 和构建。

阶段验收：源码插件 React 页面发现完全在`apps/lina-web`闭环，`lina-core`不知道 React 或 Semi Design。

## 阶段七：宿主内建页面迁移

- [x] `RW-160`迁移登录、coming-soon、403、404、500 和离线页面。
- [x] `RW-161`迁移 Dashboard Analytics 页面。
- [x] `RW-162`迁移 Dashboard Workspace 页面和上下两个插件 slot。
- [x] `RW-163`迁移 API Docs 页面，加载`public/stoplight/apidocs.html`并保持`/api.json`与 iframe`lang`参数。
- [x] `RW-164`迁移系统信息和 About 页面。
- [x] `RW-165`迁移个人资料概览、基础设置和头像裁剪上传。
- [x] `RW-166`迁移个人密码设置。
- [x] `RW-167`迁移个人安全和通知设置。
- [x] `RW-168`迁移用户列表、查询、排序和分页。
- [x] `RW-169`迁移用户创建、编辑`SideSheet`。
- [x] `RW-170`迁移用户导入、导出、重置密码和批量编辑。
- [x] `RW-171`迁移用户租户字段与 capability 隐藏逻辑。
- [x] `RW-172`迁移角色列表、创建、编辑和批量删除。
- [x] `RW-173`迁移角色数据权限选项与 capability 降级。
- [x] `RW-174`迁移角色授权用户页面。
- [x] `RW-175`迁移菜单树、创建、编辑、删除和权限分配。
- [x] `RW-176`迁移配置列表、编辑、导入、导出和公共前端配置刷新。
- [x] `RW-177`迁移字典类型列表、编辑、导入、导出和级联删除。
- [x] `RW-178`迁移字典数据列表、编辑、样式和导出。
- [x] `RW-179`迁移文件列表、普通上传、图片上传、详情、下载、删除、后缀/场景筛选和数据权限反馈。
- [x] `RW-180`迁移消息未读数、可见页轮询、列表、详情预览、单条/全部已读、删除和清空。
- [x] `RW-181`迁移任务组列表、创建、编辑和删除。
- [x] `RW-182`迁移任务列表、handler/shell 表单、Cron preview、handler 详情、启停、触发和 reset。
- [x] `RW-183`迁移任务日志列表、详情、单条/全部清理和执行取消。
- [x] `RW-184`迁移插件管理摘要列表、动态状态、同步和安装/启停入口。
- [x] `RW-185`迁移插件详情、动态上传、宿主服务授权、依赖检查、租户供应策略、卸载、升级预览/执行和生命周期前置条件弹窗。
- [x] `RW-186`确保插件管理首屏不加载重型弹窗 chunk。
- [x] `RW-187`确保 builtin 插件不出现在普通列表且不显示普通治理动作。
- [x] `RW-188`为每个页面波次补充 Vitest 和 Testing Library 测试。
- [x] `RW-189`为关键成功路径和必要失败路径保留稳定`data-testid`。
- [x] `RW-190`每完成一个页面波次运行对应单元测试、类型检查和构建。
- [x] `RW-191`迁移字典 store、`DictTag`、时间格式化、下载和弹窗辅助函数，保持局部、可测试且不重建 Vben 适配层。
- [x] `RW-192`迁移普通文件上传和图片上传共享组件，覆盖 multipart、进度、大小/类型校验和失败反馈。
- [x] `RW-193`迁移头像裁剪组件并继续使用 cropperjs`1.6.2`，覆盖 Blob 转换和上传失败恢复。
- [x] `RW-194`迁移 TipTap React 富文本编辑器及图片上传工具栏，保持通知公告编辑和预览行为。
- [x] `RW-195`迁移 JSON 预览组件，确保操作日志详情不依赖 Vue JSON 组件。
- [x] `RW-196`迁移树、TreeSelect、菜单权限树和部门选择共享逻辑，保持权限显示和模块禁用降级。
- [x] `RW-197`迁移导出确认工作流，保持大数据导出提示、Blob 文件名和错误反馈。
- [x] `RW-198`使用 ECharts`6.0.0`重建 Dashboard 图表封装，覆盖容器 resize、主题和卸载清理。
- [x] `RW-199`将现有 13 个 Lina 定制单元测试逐项映射为 React 等价测试或记录由更强测试替代的证据；不得用删除旧测试表示完成。

阶段验收：`apps/lina-vben`当前承载的宿主工作流全部有 React/Semi 实现。

## 阶段八：官方源码插件迁移

### `linapro-ai-core`，9 个 Vue 文件

- [x] `RW-200`创建`apps/lina-plugins/linapro-ai-core/frontend/plugin-ui.ts`，注册`/ai/providers`、`/ai/models`、`/ai/tiers`和`/ai/invocations`。
- [x] `RW-201`把`provider-management.vue`迁移为`provider-management.tsx`。
- [x] `RW-202`把`provider-drawer.vue`迁移为`provider-side-sheet.tsx`。
- [x] `RW-203`把`endpoint-drawer.vue`迁移为`endpoint-side-sheet.tsx`。
- [x] `RW-204`把`model-management.vue`迁移为`model-management.tsx`。
- [x] `RW-205`把`model-drawer.vue`迁移为`model-side-sheet.tsx`。
- [x] `RW-206`把`tier-management.vue`迁移为`tier-management.tsx`。
- [x] `RW-207`把`tier-drawer.vue`迁移为`tier-side-sheet.tsx`。
- [x] `RW-208`把`invocation-logs.vue`迁移为`invocation-logs.tsx`。
- [x] `RW-209`把`invocation-detail-drawer.vue`迁移为`invocation-detail-side-sheet.tsx`。
- [x] `RW-210`复用或迁移`ai-client.ts`和`ai-data.ts`，不得引用 Vue/Vben 类型。
- [x] `RW-211`补齐 AI 插件四条页面路由的单元测试、i18n 和插件 E2E。

### `linapro-content-notice`，3 个 Vue 文件

- [x] `RW-220`创建`linapro-content-notice/frontend/plugin-ui.ts`并注册`/system/notice`。
- [x] `RW-221`迁移`notice-management.vue`。
- [x] `RW-222`迁移`notice-modal.vue`。
- [x] `RW-223`迁移`notice-preview-modal.vue`。
- [x] `RW-224`复用或迁移`data.ts`和`notice-client.ts`，并补齐测试与 i18n。

### `linapro-demo-source`，2 个 Vue 文件

- [x] `RW-230`创建`linapro-demo-source/frontend/plugin-ui.ts`并注册`linapro-demo-source-sidebar-entry`规范路由。
- [x] `RW-231`迁移`sidebar-entry.vue`。
- [x] `RW-232`迁移`components/demo-record-modal.vue`。
- [x] `RW-233`补齐源码插件页面、权限和启停 E2E。

### 监控插件，6 个 Vue 文件

- [x] `RW-240`创建`linapro-monitor-loginlog/frontend/plugin-ui.ts`并注册`/monitor/loginlog`。
- [x] `RW-241`迁移`loginlog-management.vue`和`loginlog-detail-modal.vue`。
- [x] `RW-242`创建`linapro-monitor-online/frontend/plugin-ui.ts`并注册`/monitor/online`。
- [x] `RW-243`迁移`online-user.vue`。
- [x] `RW-244`创建`linapro-monitor-operlog/frontend/plugin-ui.ts`并注册`/monitor/operlog`。
- [x] `RW-245`迁移`operlog-management.vue`和`operlog-detail-drawer.vue`。
- [x] `RW-246`创建`linapro-monitor-server/frontend/plugin-ui.ts`并注册`/monitor/server`。
- [x] `RW-247`迁移`server-monitor.vue`。
- [x] `RW-248`复用或迁移各插件`data.ts`和`*-client.ts`，不得引用 Vue/Vben 类型。
- [x] `RW-249`补齐登录日志、在线用户、操作日志和服务监控插件 E2E。

### `linapro-org-core`，4 个 Vue 文件

- [x] `RW-250`创建`linapro-org-core/frontend/plugin-ui.ts`并注册`/system/dept`和`/system/post`。
- [x] `RW-251`迁移`dept-management.vue`和`dept-drawer.vue`。
- [x] `RW-252`迁移`post-management.vue`和`post-drawer.vue`。
- [x] `RW-253`复用或迁移部门、岗位 client/data 文件。
- [x] `RW-254`验证组织 capability 禁用后宿主字段、筛选和入口完全隐藏。
- [x] `RW-255`补齐部门和岗位插件 E2E。

### `linapro-tenant-core`，4 个 Vue 文件

- [x] `RW-260`创建`linapro-tenant-core/frontend/plugin-ui.ts`并注册`/platform/tenants`。
- [x] `RW-261`迁移`tenant-management.vue`和`components/tenant-modal.vue`。
- [x] `RW-262`迁移`tenant-plugin-management.vue`。
- [x] `RW-263`迁移`slots/layout/header/actions/tenant-switcher.vue`并注册 Header slot。
- [x] `RW-264`复用或迁移`tenant-client.ts`和`tenant-plugin-client.ts`。
- [x] `RW-265`验证租户选择、切换、代入、退出代入和租户插件治理。
- [x] `RW-266`补齐租户插件 E2E 和双语断言。

### 官方源码插件总门禁

- [x] `RW-270`确认`linapro-ops-demo-guard`没有需要迁移的 Vue 页面。
- [x] `RW-271`逐个读取插件根`AGENTS.md`；当前盘点没有插件本地`AGENTS.md`，执行时仍需复核。
- [x] `RW-272`逐个确认`plugin.yaml i18n.enabled: true`插件维护`en-US`和`zh-CN`资源。
- [x] `RW-273`运行每个插件自己的单元测试和 E2E。
- [x] `RW-274`运行`find apps/lina-plugins -type f -name '*.vue'`并确认无输出。
- [x] `RW-275`确认官方源码插件不安装第二份 React 主版本。
- [x] `RW-276`确认插件 CSS 不覆盖`body`、`.semi-*`或宿主 token。
- [x] `RW-277`更新插件自有 POM、E2E 定位器和截图断言，保留现有`TC{NNN}`编号与成功、失败、权限和双语业务断言。
- [x] `RW-278`运行静态扫描，确认官方插件前端不存在`#/*`、`@vben/*`、`vue`、`vue-router`、`ant-design-vue`、`antd`和`@ant-design/icons`导入。
- [ ] `RW-279`在`lina-tapcanvas`父仓库中直接保存全部插件迁移历史，确认`apps/lina-plugins`没有嵌套`.git`、gitlink 或只存在于本机的未跟踪交付文件。

阶段验收：9 个官方源码插件的 28 个 Vue 文件全部被 React 页面或插槽替换。

## 阶段九：动态插件通用契约与隔离迁移

- [x] `RW-280`在`lina-core`保留通用`DynamicAccessModeQueryKey`，删除`embedded-mount`常量，新增仅允许`iframe`和`new-window`的模式常量及`pluginAssetUrl`查询键。
- [x] `RW-281`修改菜单 controller，把受治理的`pluginAssetUrl`投影为 iframe 或新标签页元数据，并拒绝旧`embedded-mount`和`embeddedSrc`输入。
- [x] `RW-282`把 hosted frontend contract 的 ESM 校验替换为 HTML asset 校验：同插件、同版本、命中`public_assets`、文件存在且扩展名为`.html`。
- [x] `RW-283`同步更新菜单 API 文档、中英文 apidoc、catalog、frontend contract、menu integration、runtime 测试和`apps/lina-core/pkg/plugin`双语文档。
- [x] `RW-284`把`linapro-demo-dynamic/plugin.yaml`改为内部工作台路由、`system/plugin/dynamic-page`、`pluginAccessMode: iframe`和指向`standalone.html`的`pluginAssetUrl`。
- [x] `RW-285`创建 React 工作台`HostedPage`，只渲染 iframe 或触发新标签页，不执行动态`import(assetURL)`；sandbox 不包含`allow-same-origin`。
- [x] `RW-286`HostedPage 只接受后端治理后的同源`/x-assets/`HTML URL，拒绝绝对 URL、协议相对 URL、路径逃逸、非 HTML 和其他插件资产。
- [x] `RW-287`定义版本化`postMessage`桥接协议，包含握手、协议版本、nonce、request ID、超时、取消、错误包络和消息大小上限。
- [x] `RW-288`宿主同时验证 iframe`contentWindow`、nonce、request ID、插件 ID和 generation；opaque origin 场景不得仅依赖`event.origin`。
- [x] `RW-289`桥接只接受当前插件相对 API path，拒绝绝对 URL、`..`、宿主`/api`、其他`/x/{plugin}`和`/x-assets`请求。
- [x] `RW-290`宿主代理请求时附加当前 Authorization、`Accept-Language`和`X-Tenant-Code`，但不得向 iframe 或错误响应回传 Token。
- [x] `RW-291`桥接支持 JSON、multipart、Blob 下载和中止信号，并对请求体、文件、响应、并发和超时设置显式上限。
- [x] `RW-292`桥接只投影 locale、运行时消息和权限的只读最小视图；语言、租户、权限或 generation 变化时旧会话失效并重新握手。
- [x] `RW-293`重写`standalone.html`，恢复原`mount.js`的分页、CRUD、附件、manifest/host-service 演示、错误反馈和双语行为。
- [x] `RW-294`更新动态插件 POM 和 5 个既有 E2E，保留 CRUD、附件、权限、i18n、生命周期、热升级和 standalone 断言。
- [x] `RW-295`为恶意 path、伪造 source、错误 nonce、重复 request ID、超时、取消、过大消息、旧 generation 和卸载后消息添加安全测试。
- [x] `RW-296`运行菜单 controller、frontend contract、plugin integration、启动绑定测试、`make i18n.check`和`make lint`。
- [x] `RW-297`运行 HostedPage/bridge 单元测试、React 类型检查、lint 和构建，再运行动态插件 5 个 E2E。
- [x] `RW-298`在全部功能等价与安全验证通过后删除`frontend/pages/mount.js`，并扫描确认生产代码不再动态 import 插件资产。
- [x] `RW-299`记录 Go DI、缓存、数据权限、数据库、认证和租户语义无新增影响，以及 iframe bridge 的安全审查证据。

阶段验收：动态插件不再向宿主 DOM 或 bundle 注入运行时，不获得 LinaPro Token，同时通过受限消息桥接保持原有受保护 API 和 CRUD 能力。

## 阶段十：切换前功能等价验收

- [x] `RW-300`在端口`5667`独立启动`apps/lina-web`，避免占用旧工作台`5666`。
- [x] `RW-301`使用现有`lina-core`开发后端验证 React API 代理。
- [x] `RW-302`验证登录成功、失败、未认证跳转、刷新失败和退出。
- [x] `RW-303`验证中文、英文、运行时消息、菜单、面包屑和标签标题。
- [x] `RW-304`验证租户选择、切换、代入和权限隐藏。
- [x] `RW-305`验证 Dashboard、About、API Docs 和个人中心。
- [x] `RW-306`验证用户、角色、菜单完整工作流。
- [x] `RW-307`验证配置、字典、文件和消息完整工作流。
- [x] `RW-308`验证任务组、任务和任务日志完整工作流。
- [x] `RW-309`验证插件摘要、详情、安装、启停、授权、升级和 builtin 隐藏。
- [x] `RW-310`验证所有官方源码插件页面和 slot。
- [x] `RW-311`验证动态插件 iframe、受限消息桥接、完整 CRUD/附件、恶意消息拒绝和 generation 刷新。
- [x] `RW-312`为每个核心页面捕获首次加载截图。
- [x] `RW-313`为 SideSheet、Modal、提交结果、筛选结果和异常路径捕获截图。
- [x] `RW-314`使用图片审查确认无 raw i18n key、截断、重叠、空白页和错误反馈缺失。
- [x] `RW-315`记录 React 工作台已达到切换条件，但此时仍不删除`apps/lina-vben`。

阶段验收：React 工作台在独立端口达到宿主和官方插件功能等价。

## 阶段十一：一次性切换开发工具和 CI

- [x] `RW-320`先修改`hack/tools/linactl`测试，使期望路径改为`apps/lina-web`。
- [x] `RW-321`把前端依赖安装目录改为`apps/lina-web`。
- [x] `RW-322`把 Vite 命令改为`apps/lina-web/node_modules/vite/bin/vite.js`。
- [x] `RW-323`把前端工作目录改为`apps/lina-web`。
- [x] `RW-324`把构建产物来源改为`apps/lina-web/dist`。
- [x] `RW-325`把进程显示名改为`Lina Web`。
- [x] `RW-326`把 PID 改为`temp/pids/lina-web.pid`。
- [x] `RW-327`把日志改为`temp/lina-web.log`。
- [x] `RW-328`把 portcheck Vite 配置路径改为`apps/lina-web/vite.config.ts`。
- [x] `RW-329`把运行时 i18n 扫描路径改为`apps/lina-web/src/**/*.{ts,tsx}`。
- [x] `RW-330`把官方源码插件 i18n 扫描路径改为`frontend/**/*.{ts,tsx}`。
- [x] `RW-331`删除 i18n 扫描器中的 Vue 解析路径。
- [x] `RW-332`修改根`Makefile`的前端目录、PID 和日志变量。
- [x] `RW-333`修改`hack/tests/scripts/validate-e2e.mjs`的前端工作目录和包过滤器。
- [x] `RW-334`更新`hack/tests`POM 定位器以适配 Semi DOM，但不得降低业务断言。
- [x] `RW-335`更新 E2E execution manifest，仅在新增或移动测试时调整 scope。
- [x] `RW-336`更新前端单元测试 workflow 的 Node 文件、pnpm lockfile 和工作目录。
- [x] `RW-337`更新 E2E workflow 的 Node 文件、pnpm lockfile 和工作目录。
- [x] `RW-338`更新 host-only build、image publish 和 make smoke workflow 路径；删除`reusable-openspec-changes-complete.yml`，并从`reusable-test-verification-suite.yml`移除对应 input、job 和调用链。
- [x] `RW-339`确认所有新增工具逻辑使用 Go 或 Node，不新增平台专属 Shell 业务逻辑。
- [x] `RW-340`运行`cd hack/tools/linactl && go test ./... -count=1`。
- [x] `RW-341`运行`linactl env.check`、`i18n.check`、`dev`、`status`、`stop`和`build`smoke。
- [x] `RW-342`记录 Windows、Linux、macOS 路径和进程影响。
- [x] `RW-343`更新`hack/tools/linactl/internal/frontend/frontend.go`和`internal/toolutil/toolutil.go`的安装目录与 Vite 二进制路径。
- [x] `RW-344`更新`hack/tools/linactl/internal/devservice/devservice.go`的工作目录、进程归属识别、PID、日志和显示名。
- [x] `RW-345`更新`hack/tools/linactl/internal/portcheck/portcheck.go`和`internal/wasmbuilder/wasmbuilder_output.go`的 Vite 配置与仓库根识别。
- [x] `RW-346`更新`hack/tools/linactl/internal/runtimei18n`的宿主源码、基础语言包和插件 TSX 扫描根，并同步全部测试 fixture。
- [x] `RW-347`更新`hack/tools/linactl/command_build.go`和`main_test.go`中的定向构建、产物复制、进程、环境安装与 smoke fixture。
- [x] `RW-348`更新宿主 E2E 中 Stoplight 文件路径、旧 Vben storage namespace 和 locale JSON 路径，不得通过放宽断言绕过迁移。
- [x] `RW-349`对执行性审查记录的 25 个硬编码文件、6 个直接引用 workflow 和 1 个 OpenSpec 门禁调用 workflow 运行逐文件复查，确认没有遗漏生产路径、测试 fixture 或已退出的 CI 门禁。

阶段验收：默认开发、构建、测试和 CI 入口全部指向`apps/lina-web`。

## 阶段十二：`lina-core`仓库路径与残余清理

- [x] `RW-350`修改`apps/lina-core/internal/service/config/config_path.go`，仓库根识别从`apps/lina-vben/package.json`切换到`apps/lina-web/package.json`。
- [x] `RW-351`更新`config_path_test.go`对应 fixture。
- [x] `RW-352`扫描`apps/lina-core`生产代码，确认没有`apps/lina-vben`、`web-antd`、`embeddedSrc`、`DynamicAccessModeEmbeddedMount`或 ESM mount 残留。
- [x] `RW-353`确认保留的`pluginAccessMode`和`pluginAssetUrl`只属于通用 hosted page 契约，不包含 React、`.tsx`或 Semi Design 语义。
- [x] `RW-354`明确不新增`DiscoverReactPaths`，不修改`lina-core`扫描 React 页面或插件前端源码。
- [x] `RW-355`明确不修改认证、用户、租户、RBAC、数据权限、数据库或通用 service。
- [x] `RW-356`运行`cd apps/lina-core && go test ./internal/service/config ./internal/cmd -count=1`。
- [x] `RW-357`运行阶段九涉及的菜单和插件 contract 回归测试，确认工具链切换没有破坏 iframe/new-window 投影。
- [x] `RW-358`运行`make i18n.check`和`make lint`。
- [x] `RW-359`记录 Go DI、缓存一致性、数据权限、数据库、认证和租户语义无新增影响。

阶段验收：`lina-core`完成仓库路径和残余引用清理，保留通用 hosted page 契约，不感知 React 或 Semi Design。

## 阶段十三：硬切换、删除和全量验证

- [x] `RW-370`确认阶段十至十二全部通过。
- [x] `RW-371`删除`apps/lina-vben`完整目录。
- [x] `RW-372`确认仓库没有产品运行时 Vue/React 选择开关。
- [x] `RW-373`运行`rg`确认`Makefile`、`hack`、CI、`lina-core`根识别不再引用`apps/lina-vben`或`web-antd`。
- [x] `RW-374`运行`find apps/lina-web apps/lina-plugins -name '*.vue'`并确认无输出。
- [x] `RW-375`确认`apps/lina-web`和官方插件不引用`vue`、`vue-router`、`@vben/*`或`ant-design-vue`。
- [x] `RW-376`确认`apps/lina-web`不引用`antd`或`@ant-design/icons`。
- [x] `RW-377`确认 pnpm dependency graph 不包含宿主 Ant Design React 依赖。
- [x] `RW-378`确认 React dependency graph 没有第二个主版本。
- [x] `RW-379`运行`pnpm --dir apps/lina-web typecheck`。
- [x] `RW-380`运行`pnpm --dir apps/lina-web test:unit`。
- [x] `RW-381`运行`pnpm --dir apps/lina-web lint`和`pnpm --dir apps/lina-web build`。
- [x] `RW-382`运行`pnpm --dir hack/tests test:validate`。
- [x] `RW-383`运行 auth、dashboard、about、iam、settings、scheduler、extension 和 i18n focused E2E。
- [x] `RW-384`运行`pnpm --dir hack/tests test:host`。
- [x] `RW-385`运行插件自有 E2E。
- [x] `RW-386`运行`go run ./hack/tools/linactl build plugins=0`。
- [x] `RW-387`运行包含官方插件的完整构建。
- [x] `RW-388`确认`apps/lina-core/internal/packed/public/index.html`来自 React 构建。
- [x] `RW-389`启动最终二进制并验证工作台 basePath、静态资源、API、插件 API 和`/x-assets`。
- [x] `RW-390`完成 E2E 截图视觉审查并记录所有截图路径。
- [x] `RW-391`执行仓库要求的`lina-review`或等价全面审查。
- [x] `RW-392`核对 13 个 Lina 定制旧单元测试的 React 映射表，确认每项都有新测试或更强替代证据。
- [x] `RW-393`运行全部 105 个宿主 E2E，而不仅是 smoke；任何删减都必须有明确的功能删除依据和用户确认。
- [x] `RW-394`运行官方插件自有 E2E，并确认动态插件 5 个既有用例和源码插件既有编号没有静默删除。
- [x] `RW-395`确认 favicon、品牌/logo、默认头像、Stoplight 页面、样式和脚本都进入 React 构建产物，且不存在 Vben 品牌资产。
- [x] `RW-396`运行`go run ./hack/tools/linactl test.scripts`、`make i18n.check`和`make lint`。
- [x] `RW-397`确认父仓库直接跟踪`apps/lina-plugins`全部交付文件，`.gitmodules`不存在，插件目录不包含嵌套 Git 元数据。
- [x] `RW-398`确认最终 bundle 没有把未访问的插件重型页面、TipTap、ECharts 或 TapCanvas 工作区打入首屏 chunk。
- [x] `RW-399`保存最终命令、退出码、包图、截图、失败修复和剩余风险证据后，才允许进入文档交付阶段。

阶段验收：Vue/Vben 工作台已删除，React/Semi 工作台成为唯一默认入口，所有自动化和构建门禁通过。

## 阶段十四：文档和交付记录

- [x] `RW-400`更新根`README.md`和`README.zh-CN.md`中的前端路径、命令和技术栈。
- [x] `RW-401`更新`CONTRIBUTING.md`和`CONTRIBUTING.zh-CN.md`。
- [x] `RW-402`更新`hack/tools/linactl/README.md`和中文镜像。
- [x] `RW-403`更新官方插件 README 中的 React UI 开发方式。
- [x] `RW-404`记录源码插件`frontend/plugin-ui.ts`最小示例。
- [x] `RW-405`记录动态插件 iframe/new-window、`pluginAssetUrl`和受限`postMessage`桥接开发方式与安全边界。
- [x] `RW-406`记录 Semi Design、Semi Icons、locale 和主题规范。
- [x] `RW-407`记录模块禁用隐藏、权限和租户切换约束。
- [x] `RW-408`记录构建、测试、E2E 和截图验证结果。
- [x] `RW-409`记录`i18n`、数据权限、缓存、DI、开发工具跨平台影响评估。
- [x] `RW-410`记录未修改数据库、SQL、认证模型和 LinaPro 核心业务能力。
- [x] `RW-411`确认所有中英文 README 镜像事实一致。
- [x] `RW-412`运行文档格式、链接、占位词和文件存在性检查。
- [x] `RW-413`在用户明确授权后再决定是否提交、推送或创建 PR。
- [x] `RW-414`更新执行性审查报告，列出最终变更文件、规则域、验证命令、无影响判断和剩余风险。
- [x] `RW-415`如果实施期间需要改变`v1.2`任务语义、顺序、依赖或验收标准，先新增变更记录并升级 Tasklist 版本，禁止静默改写冻结清单。
- [x] `RW-416`记录父仓库中宿主、工作台和插件文件的同批提交范围与回退点；未获得授权时只生成待提交清单。

阶段验收：中英文说明、插件开发契约、验证证据、影响评估和双仓交付记录完整一致，冻结 Tasklist 的执行结果可追溯。

## 最终完成定义

- [x] `DONE-001``apps/lina-web`是唯一宿主工作台。
- [x] `DONE-002``apps/lina-vben`不存在。
- [x] `DONE-003`宿主和官方源码插件没有`.vue`文件或 Vue/Vben 运行时依赖。
- [x] `DONE-004`宿主管理 UI 只使用 Semi Design，不使用 Ant Design React。
- [x] `DONE-005`源码插件 React UI 发现只属于`apps/lina-web`。
- [x] `DONE-006``lina-core`不解析 React、`.tsx`或 Semi Design。
- [x] `DONE-007`动态插件只使用 iframe 或新标签页；需要受保护 API 时通过受限消息桥接，不能获得 LinaPro Token。
- [x] `DONE-008`LinaPro 认证、用户、租户、RBAC 和数据权限语义保持不变。
- [x] `DONE-009``en-US`和`zh-CN`宿主、菜单、标签、插件和 Semi locale 一致。
- [x] `DONE-010``linactl`、Makefile、CI、资源嵌入和 E2E 使用`apps/lina-web`。
- [x] `DONE-011`前端单元测试、类型检查、构建、Go 测试、lint、E2E 和最终启动 smoke 全部通过。
- [x] `DONE-012`Tasklist 中每个完成项都有验证证据，没有仅凭代码存在标记完成。
- [x] `DONE-013`现有 13 个 Lina 定制单元测试和 105 个宿主 E2E 均有可追溯的 React 等价验证，没有静默删除覆盖。
- [x] `DONE-014`官方插件前端只依赖`@linapro/plugin-ui`稳定导入面和自身相对模块，不引用宿主私有路径。
- [x] `DONE-015`动态插件在无`allow-same-origin`、无宿主 Token 的 sandbox iframe 中保持分页、CRUD、附件、权限、i18n 和热升级能力。
