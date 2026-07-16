# React 工作台阶段八执行记录

## 阶段信息

| 字段 | 值 |
| --- | --- |
| 阶段 | 阶段八：官方源码插件迁移 |
| Tasklist 版本 | `v1.2` |
| 任务范围 | `RW-200`至`RW-279` |
| 状态 | `In Progress` |
| 开始时间 | `2026-07-12 20:02 CST` |
| 当前批次 | 官方源码插件总门禁，`RW-270`至`RW-279` |
| 执行分支 | `feat/react-workbench-replacement` |
| 宿主基线 | `7d149838e77fe3d2b1bdda5ebb9d46679f79fd23` |
| 插件基线 | 扁平化来源`1b90535404d1563a045efe3888dd9db6d1bf5e29` |

## 范围与边界

- 目标：把 9 个官方源码插件的 28 个 Vue 页面或插槽迁移为由`apps/lina-web`发现和承载的 React/Semi UI。
- 当前完成：9 个官方源码插件的 28 个 Vue 输入已由 React/Semi 页面、SideSheet、Modal 或 Header slot 替换。
- 当前未完成：`apps/lina-plugins`全部交付文件已进入父仓索引，但`RW-279`仍缺少正式提交历史；阶段状态保持`In Progress`。
- 边界：插件页面只导入`@linapro/plugin-ui`稳定宿主面；插件业务接口走`api.plugin()`或`api.pluginBlob()`，宿主字典读取走公开`api.request()`；不引用`#/*`、`@vben/*`、Vue、Ant Design 或宿主 store。

## 任务状态

| 任务 | 状态 | 证据 |
| --- | --- | --- |
| `RW-200` | `Passed` | `frontend/plugin-ui.ts`以字面量懒加载注册四条 AI 页面路由 |
| `RW-201`至`RW-209` | `Passed` | 四个管理页和五个 SideSheet 已迁移为 React/Semi，9 个对应 Vue 文件已删除 |
| `RW-210` | `Passed` | `ai-client.ts`改为`createAiCoreApi(PluginHostApi)`；`ai-data.ts`只保留 React 无关纯类型与格式化 helper |
| `RW-211` | `Passed` | 4 个路由懒加载测试、宿主 API 测试、双语资源测试和`TC008-react-plugin-ui.ts`已加入 |
| `RW-220`至`RW-224` | `Passed` | 通知公告管理、TipTap React 编辑、附件上传、HTML allowlist 预览、字典选项、测试与双语资源已完成 |
| `RW-230`至`RW-233` | `Passed` | 规范 extension 路由、记录 CRUD、multipart 附件、Blob 下载、权限动作和 Semi POM 定位器已完成 |
| `RW-240`至`RW-249` | `Passed` | 四个监控路由、6 个 React 页面或弹层、纯 TypeScript helper、双语资源、单测和 Semi E2E 定位器已完成 |
| `RW-250`至`RW-255` | `Passed` | 部门、岗位 React/Semi 页面、宿主用户部门筛选、capability 降级、双语资源、测试与 Semi E2E 定位器已完成 |
| `RW-260`至`RW-266` | `Passed` | 租户 CRUD、租户插件治理、Header 代入 slot、高层租户动作通道、双语资源、测试与 Semi E2E 定位器已完成 |
| `RW-270`至`RW-272` | `Passed` | guard 插件只有说明文件；插件根无本地`AGENTS.md`；所有启用 i18n 的官方插件均有`en-US`和`zh-CN`资源 |
| `RW-273` | `Passed` | 9 个官方源码插件的 React 聚焦单测、TypeScript 检查和完整真实 E2E 全部通过，E2E 合计`288/288`；租户插件全量 Go 测试通过隔离容器共享 LinaPro PostgreSQL 网络完成 |
| `RW-274`至`RW-278` | `Passed` | 全仓 Vue、插件独立 React、CSS 覆盖、旧 POM 定位器与禁用导入门禁已完成；`TC008`保留一条拒绝 Ant/VXE DOM 的否定断言 |
| `RW-279` | `Blocked` | 父仓索引已直接跟踪 999 个插件交付路径，未跟踪文件、嵌套`.git`和 gitlink 均为 0；未获得 commit 授权，不能把索引状态表述为正式版本历史 |

## 当前批次命令与结果

| 序号 | 命令 | 退出码 | 结果 |
| --- | --- | --- | --- |
| 1 | 读取源码插件迁移映射、插件 UI 契约、Vite registry、旧 Vue 页面、helper、i18n 和 AI 插件 E2E | `0` | 四路由、9 个 Vue 输入和 API/权限行为已建立代码对照 |
| 2 | UI/UX 设计规则检索与 LinaPro 现有 Semi 管理页对照 | `0` | 沿用 LinaPro 管理页密度、语义 token、响应式表单、明确 loading/error 和可访问标签；未采用不适合后台页的落地页布局 |
| 3 | `pnpm exec tsc --noEmit -p tsconfig.plugin-ui.json` | `0` | AI 插件外部源码目录严格 TypeScript 检查通过 |
| 4 | `../lina-web/node_modules/.bin/eslint linapro-ai-core/frontend --max-warnings 0` | `0` | 插件前端 ESLint 无错误或警告 |
| 5 | `pnpm test:unit` | `0` | 48 个测试文件、146 个测试通过，包含 AI 插件 6 个新增测试 |
| 6 | `pnpm build` | `0` | 3,136 个模块转换；四个 AI 页面为独立懒加载 chunk；最大 JavaScript chunk 627.58 kB，低于 700 kB 告警线 |
| 7 | AI 插件前端禁止导入静态扫描 | `0` | React/TypeScript 可达图无`#/*`、`@vben/*`、Vue、Ant Design、宿主 store 或旧 request client |
| 8 | 并行执行全量单测、构建、类型与 lint | `1` | 资源竞争使既有 Profile 测试超过 10 秒；AI 插件测试无失败，随后单独重跑全量单测通过 |
| 9 | `pnpm exec tsc --noEmit -p tsconfig.plugin-ui.json`与 content-notice 独立 ESLint | `0` | 通知插件源码严格类型检查和 lint 通过 |
| 10 | `pnpm test:unit` | `0` | 49 个测试文件、150 个测试通过；新增 notice route、API、HTML allowlist 与双语测试 |
| 11 | `pnpm build` | `0` | 3,255 个模块转换；notice 页面独立 chunk，TipTap 独立 307.70 kB chunk且未出现在`dist/index.html`preload |
| 12 | Demo 插件严格 TypeScript、独立 ESLint 与聚焦测试 | `0` | 规范路由、multipart CRUD、Blob 下载及双语测试通过 |
| 13 | `pnpm test:unit` | `0` | 50 个测试文件、153 个测试通过 |
| 14 | `pnpm build` | `0` | 3,260 个模块转换；`sidebar-entry`独立 7.91 kB chunk，首屏未预加载 |
| 15 | 读取四个监控插件旧 Vue 页面、API DTO、字典资源、E2E 和宿主插件 UI 契约 | `0` | 登录日志、在线用户、操作日志和服务监控行为及权限边界完成代码对照 |
| 16 | `pnpm exec tsc --noEmit -p tsconfig.plugin-ui.json`与四个监控插件独立 ESLint | `0` | 四个插件 React 源码严格类型和 Lint 通过，无错误或警告 |
| 17 | 四个监控插件聚焦 Vitest | `0` | 4 个测试文件、12 个测试通过，覆盖路由懒加载、宿主 API、JSON/格式化 helper 和双语资源 |
| 18 | `node hack/tests/scripts/validate-e2e.mjs`、禁止导入扫描、Ant/VXE 定位器扫描和 Vue 文件扫描 | `0` | 257 个 E2E 文件治理校验通过；四个监控前端无禁用导入、旧定位器或 Vue 文件；官方源码插件剩余 8 个 Vue 文件 |
| 19 | `pnpm typecheck`与`pnpm lint` | `0` | 宿主和已纳入的源码插件全量 TypeScript、ESLint 门禁通过 |
| 20 | 并行执行`pnpm test:unit` | `1` | 监控测试全部通过；既有`profile.test.tsx`首个用例在并行高负载下超过 10 秒 |
| 21 | `pnpm exec vitest run src/features/profile/profile.test.tsx` | `0` | 既有 Profile 2 个测试独立复跑通过，确认上一步为资源型超时 |
| 22 | 独立执行`pnpm test:unit` | `0` | 54 个测试文件、165 个测试全部通过 |
| 23 | `pnpm build` | `0` | 3,282 个模块转换；四个监控页面独立懒加载，页面 chunk 为 3.53 至 10.38 kB，最大 JavaScript chunk 627.59 kB |
| 24 | 监控插件与运行时 i18n 聚焦测试后再次执行`pnpm build` | `0` | 5 个测试文件、18 个测试通过；宿主通用清空、详情、导出、重置和导出确认文案进入最终构建 |
| 25 | 读取组织插件旧 Vue 页面、client/data、API DTO、POM、E2E、宿主用户页和 capability 投影，并运行 UI/UX 设计规则检索 | `0` | 两条组织路由、4 个 Vue 输入、部门树筛选、岗位计数和用户部门/岗位联动完成代码对照 |
| 26 | `pnpm exec tsc --noEmit -p tsconfig.plugin-ui.json`、宿主/组织插件 ESLint 和组织聚焦 Vitest | `0` | 严格类型与 Lint 通过；5 个测试文件、17 个测试通过，覆盖路由、API、树构造、capability、用户筛选和数据权限降级 |
| 27 | `node hack/tests/scripts/validate-e2e.mjs`、组织前端禁止导入、Ant/VXE 定位器、CSS 边界和 Vue 文件扫描 | `0` | 257 个 E2E 文件治理通过；组织前端无禁用导入、旧定位器、全局 Semi 覆盖或 Vue 文件；官方源码插件只剩租户插件 4 个 Vue 文件 |
| 28 | 首次并行运行`pnpm typecheck`和`pnpm lint` | 类型`2`、Lint`0` | Lint 通过；类型检查发现 Semi`Tree`类型未公开`selectedKey`，改用受控`value`后消除失败 |
| 29 | 修复后运行`pnpm typecheck`及用户页/组织插件聚焦测试 | `0` | 双 TypeScript 配置通过；2 个测试文件、8 个测试通过 |
| 30 | `pnpm test:unit` | `0` | 55 个测试文件、172 个测试全部通过 |
| 31 | `pnpm build` | `0` | 3,293 个模块转换；部门、岗位页面独立懒加载，最大 JavaScript chunk 627.59 kB |
| 32 | 读取租户插件 4 个 Vue 输入、client、菜单/API 契约、双语资源、POM/E2E，以及宿主租户 store、`AuthRuntime`、Header 和插件上下文 | `0` | 平台租户、租户插件、切换、代入、退出代入和 slot 行为完成代码对照 |
| 33 | 新增并测试宿主高层租户动作通道 | `0` | 插件只提交租户投影；宿主负责切换、代入、Token 恢复、租户敏感缓存、菜单和插件 capability 刷新，不向插件暴露 Token、store 或`AuthRuntime` |
| 34 | `pnpm typecheck`、宿主/租户插件 ESLint 和租户聚焦 Vitest | `0` | 双 TypeScript 配置与 Lint 通过；6 个测试文件、21 个测试通过 |
| 35 | `node hack/tests/scripts/validate-e2e.mjs`、租户前端禁止导入、旧定位器、CSS 边界、Vue 文件和 React 依赖扫描 | `0` | 257 个 E2E 文件治理通过；无禁用导入、Ant/VXE 定位器、全局 Semi 覆盖或 Vue 文件 |
| 36 | `pnpm lint` | `0` | 宿主全量 ESLint 通过 |
| 37 | `pnpm test:unit` | `0` | 57 个测试文件、180 个测试全部通过 |
| 38 | `pnpm build` | `0` | 3,302 个模块转换；租户管理、租户插件与 Header slot 独立懒加载，最大 JavaScript chunk 627.59 kB |
| 39 | 平台 Header 选择走代入、租户内选择走切换的分支修复后复跑类型、Lint 与聚焦测试 | `0` | TypeScript 通过；4 个测试文件、16 个测试通过，租户选择、切换、代入与退出代入边界保持一致 |
| 40 | 重写 AI`SmartCenterPage.ts`并迁移 AI、通知、Demo Source 直接定位器 | `0` | AI POM 从约 2,600 行收敛到 React/Semi 语义 POM；保留既有公开方法、`TC{NNN}`编号和成功、失败、权限、双语业务断言；删除 Vben 主容器和 Ant/VXE 正向定位 |
| 41 | `node hack/tests/scripts/validate-e2e.mjs` | `0` | 257 个 E2E 文件治理校验通过；6 个 smoke 文件、239 个 serial 文件 |
| 42 | 官方插件旧定位器扫描 | `0` | 仅`TC008-react-plugin-ui.ts`保留`.ant-btn, .ant-table, .vxe-table`不存在的拒绝测试；无生产性旧框架定位器 |
| 43 | `find apps/lina-plugins -type f -name '*.vue'`、插件根`AGENTS.md`、插件`package.json`、i18n 双语目录检查 | `0` | Vue 文件、插件本地规则和独立前端依赖均为 0；9 个启用 i18n 的官方插件均维护`en-US`与`zh-CN` |
| 44 | 官方插件禁用导入、CSS、嵌套`.git`和 gitlink 扫描 | `0` | 无`#/*`、Vben、Vue、Ant 导入；移除 3 处插件 CSS 对`.semi-form-field`的覆盖后，`body`、`:root`、`.semi-*`覆盖为 0；无嵌套仓库或 gitlink |
| 45 | `GOWORK=off GOPROXY=https://goproxy.cn,direct go test ./... -count=1`逐个运行 9 个官方插件 | AI、通知、Demo、四个监控、组织为`0`；租户为`1` | 8 个插件全量通过；租户纯单元包大多通过，数据库集成包因本机拒绝硬编码`postgres/postgres`测试账户失败，未修改本机数据库或伪造通过 |
| 46 | `pnpm typecheck`与`pnpm lint` | `0` | 双 TypeScript 配置和宿主/插件 ESLint 全量通过；当前 Node 20.19.5 仍低于目标 22.22.0 |
| 47 | 并行运行单测与构建 | 单测`1`、构建`0` | 并发资源竞争使既有 Plugin/Profile 两条测试超过 10 秒；构建完成 3,302 个模块，最大 JavaScript chunk 627.59 kB |
| 48 | 聚焦顺序复跑 Plugin/Profile 测试 | `0` | 2 个文件、3 个测试通过，确认上一步为并发超时 |
| 49 | 顺序执行`pnpm test:unit` | `0` | 57 个文件、180 个测试全部通过 |
| 50 | CSS 修复后顺序执行`pnpm build` | `0` | 3,302 个模块转换，最大 JavaScript chunk 627.59 kB |
| 51 | 使用 Node.js`22.22.0`逐个运行 9 个官方源码插件`frontend/plugin-ui.test.ts`并执行`pnpm typecheck` | `0` | 9 个插件 React 注册、API、交互、双语资源和 Header slot 聚焦单测全部通过；宿主与插件 UI TypeScript 检查通过 |
| 52 | 使用真实 PostgreSQL、Go、React 工作台和`--workers=1`逐个运行 9 个官方源码插件完整 E2E | `0` | AI`23`、通知`48`、Demo Source`32`、登录日志`22`、在线用户`16`、操作日志`20`、服务监控`11`、组织`49`、租户`67`，合计`288/288`通过 |
| 53 | 在临时 Linux Go 1.25.3 容器中只读挂载源码和宿主 Go 模块缓存，共享`linapro-phase10-postgres`网络后执行`GOWORK=off GOPROXY=off go test ./... -count=1` | `0` | 租户插件全部 Go 包通过；硬编码`127.0.0.1:5432`在隔离网络中指向本项目 PostgreSQL，不占用或停止本机其他项目数据库 |
| 54 | 检查根`.gitmodules`、`apps/lina-plugins`嵌套`.git`、gitlink、未跟踪文件和忽略文件 | `0` | 无`.gitmodules`、嵌套`.git`或 gitlink；仍有 64 个未跟踪交付文件和 2 个被忽略的`.DS_Store`，因此`RW-279`保持`Blocked` |
| 55 | `git add -A -- apps/lina-plugins`、`git ls-files --others --exclude-standard apps/lina-plugins`、`git ls-files --stage apps/lina-plugins`和`git diff --cached --check -- apps/lina-plugins` | `0` | 999 个插件交付路径由父仓索引直接跟踪；未跟踪文件、嵌套`.git`和`160000`gitlink 均为 0；未执行 commit 或 push |

## 设计与实现决策

- Vite 继续拥有源码插件发现；新增 Semi 包根 alias，仅解决外部插件目录的依赖解析，不向插件暴露宿主私有源码。
- 新增`tsconfig.plugin-ui.json`，让外部插件 React 源码进入严格类型门禁；阶段后续插件迁移时扩展 include。
- 插件 API helper自行编码 query 与 JSON`RequestInit`，不导入宿主`ApiClient`、Token 或 store。
- provider、model、tier 和 invocation 页面均保留后端权限为权威；前端权限只决定动作是否展示。
- AI 插件补充稳定 table/page test ID；旧 POM 已在`RW-277`收敛为 test ID、role、表格行、listbox/option 和 dialog 语义定位。`TC008`中的 Ant/VXE 类名仅用于断言旧 DOM 不存在，不作为页面操作定位器。
- Playwright Chromium 已通过真实后端完成 9 个官方源码插件完整 E2E；应用内浏览器仍没有可用实例，因此不把功能回归冒充为截图或视觉验收证据。
- 通知编辑器通过`@linapro/plugin-ui/rich-text-editor`稳定子入口复用宿主 TipTap；TipTap 单独分块，避免污染首屏 vendor。
- 通知预览对编辑器 HTML 采用标签、属性与 URL allowlist 后再渲染；不直接信任历史`v-html`内容。
- 通知类型和状态继续读取宿主`sys_notice_type`、`sys_notice_status`字典；附件和图片上传通过宿主 API 投影，不读取 Token。
- 稳定宿主 API 新增`pluginBlob`/`requestBlob`二进制下载投影；插件只获得 Blob，不获得 Token 或底层 client。
- Demo 菜单页注册实际规范化路由`/extension/linapro-demo-source-sidebar-entry`，沿用后端菜单相对路径投影。
- 登录日志继续读取`sys_login_status`，操作日志继续读取`sys_oper_type`和`sys_oper_status`；字典通过宿主公开 API 投影读取，不在插件 React 页面硬编码枚举文案。
- 登录和操作日志的筛选、远程排序、导出、清空及按日期范围删除迁入 Semi；范围删除使用两个原生`type="date"`输入并保留既有稳定 test ID。
- 在线用户列表保持分页、筛选和权限控制的强制下线确认流程，页面不读取宿主会话内部状态。
- 服务监控保持首次加载、30 秒轮询、页面隐藏暂停、恢复可见后立即刷新、多节点折叠，以及数据库、服务、系统、CPU、内存、网络和磁盘指标展示。
- 服务监控客户端按后端 DTO 把节点内部指标声明为可空，避免节点采集不完整时产生渲染异常；磁盘表继续保留`.server-monitor-disk-table`稳定定位器。
- 组织插件通过`organization.management`注册部门和岗位路由；CRUD、部门树、负责人远程检索、岗位分页/导出及后端权限码保持原权威边界。
- 宿主用户页补齐 React/Semi 部门树筛选：启用 capability 时加载`user/dept-tree`并以`deptId`过滤，禁用时不请求组织数据且隐藏部门树、列、抽屉字段和组织路由。
- 用户状态筛选继续读取`sys_normal_disable`运行时字典，避免 React 页面硬编码状态标签而破坏字典全局生效语义。
- 部门和岗位 POM/E2E 已改用稳定 test ID、角色和 Semi 语义；插件测试目录中的 Ant/VXE 定位器为`0`。
- 租户页面通过一个宿主注册的高层动作通道发起代入和退出代入；该通道只接受租户 ID/代码/名称投影，不暴露 Token、Zustand、QueryClient 或`AuthRuntime`，保持`RW-143`上下文边界。
- React 宿主 Header 继续拥有唯一租户切换控件；`layout.header.actions.before`插件 slot 只呈现代入状态和退出入口，避免宿主与插件存在两个权威切换器。
- 平台上下文在 Header 选择租户时调用`runtime.impersonate()`，租户上下文选择其他租户时调用`runtime.switchTenant()`；两者均执行租户敏感查询取消、身份原子提交、菜单/capability/字典/消息刷新和默认路由恢复。
- 租户插件注册`/platform/tenants`与内部`/tenant/plugins`页面清单；平台租户页面保持权限隐藏、状态启停、批量删除和显式代入，租户插件页面按当前租户重新读取治理状态。
- 租户 POM/E2E 的实际 Ant/VXE DOM 定位器已迁到 test ID、role、listbox/option 和语义表格行；双语资源覆盖页面、状态、表单、代入和安装模式。

## 影响评估

| 规则域 | 结论 | 证据或说明 |
| --- | --- | --- |
| 架构 | 有影响 | 官方源码插件 UI 从 Vue/Vben 迁入 React 插件契约，未修改`lina-core`领域契约 |
| 插件 | 有影响 | 已完成的官方插件只消费`@linapro/plugin-ui`稳定宿主上下文 |
| 前端 UI | 有影响 | 9 个官方源码插件全部改为 React 与 Semi Design；宿主用户页恢复部门树筛选，Header 统一承载租户切换与插件代入状态 |
| API | 无后端变化 | 复用现有插件 REST API；列表保持分页上限，未引入逐行详情瀑布调用 |
| DI | 无后端影响 | 未修改 Go 构造函数或服务装配；前端通过`useLinaPluginHost()`显式获取宿主投影 |
| 数据库 | 无影响 | 未修改 SQL、DAO、索引或数据模型 |
| 数据权限 | 无语义变化 | 后端继续在查询、导出、清空和强制下线路径执行既有权限边界；前端只隐藏无权限动作 |
| 缓存 | 无影响 | 未修改缓存 key、失效或快照逻辑；服务监控仅维护页面局部轮询状态 |
| i18n | 有影响 | 插件双语日期与运行时标签补齐；宿主通用操作和导出确认文案补齐英文、简体中文资源 |
| 跨平台 | 有影响且已控制 | Semi Icons alias 使用`fileURLToPath`，避免硬编码平台路径；当前在 macOS/Node.js 20.19.5 验证，项目目标仍为 Node.js 22.22.0 |
| E2E | 有影响 | 9 个官方插件 POM/E2E 已迁到 test ID、role、表格行、listbox/option、dialog 和原生控件；完整真实回归`288/288`通过 |
| 测试 | 有影响 | 9 个插件 React 聚焦单测、TypeScript 检查和真实 E2E 通过；租户插件全量 Go 测试在隔离的项目 PostgreSQL 网络中通过 |
| 文档 | 有影响 | Tasklist 已完成`RW-270`至`RW-278`；`RW-279`仅因缺少父仓正式版本历史证据保持未完成 |

## 当前批次验收

- `linapro-ai-core`原 9 个 Vue 文件已被 React 页面或 SideSheet 替换并删除。
- `linapro-content-notice`原 3 个 Vue 文件已被 React 页面或 Modal 替换并删除。
- `linapro-demo-source`原 2 个 Vue 文件已被 React 页面和 Modal 替换并删除。
- 四个监控插件原 6 个 Vue 文件已被 React 页面、Modal 或 SideSheet 替换并删除。
- 组织插件原 4 个 Vue 文件已被部门、岗位 React 页面和 SideSheet 替换并删除；用户页组织筛选及 capability 降级完成。
- 租户插件原 4 个 Vue 文件已被租户管理、租户插件 React 页面、Modal 和 Header slot 替换并删除；高层租户 transition 由宿主安全执行。
- 四路由使用`plugin-ui.ts`字面量懒加载，生产构建没有把管理页预载到首屏。
- Playwright Chromium 已完成 9 个官方源码插件完整真实 E2E，合计`288/288`通过；应用内浏览器仍不可用，未把功能回归冒充为视觉验收证据。
- `RW-270`至`RW-278`通过；租户插件全量 Go 数据库集成测试已通过隔离容器共享项目 PostgreSQL 网络完成。
- 插件目录 999 个交付路径已由父仓索引直接跟踪，无未跟踪文件、嵌套`.git`或 gitlink；没有 commit 授权，不把索引状态表述为已进入正式版本历史。
- 当前批次结果：`Partial`；阶段八整体仍为`In Progress`，仅待父仓交付历史满足后关闭`RW-279`。
