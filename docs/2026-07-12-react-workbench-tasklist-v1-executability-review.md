# React 工作台 Tasklist v1.2 执行性审查

## 结论

`docs/2026-07-12-react-workbench-replacement-tasklist.md`已完成代码库对照审查并冻结为`v1.2`。审查修复了动态插件功能丢失、阶段顺序、依赖闭包、共享前端能力、源码插件导入边界、工具链文件范围和测试覆盖等问题。产品 owner 已明确`lina-tapcanvas`不采用 OpenSpec，并要求插件代码由产品仓库直接维护；因此 OpenSpec 和独立插件 fork 均不属于执行链。修订后未发现阻塞 Tasklist 开始执行的文档问题。

本次转换了插件仓库结构并同步治理文档，没有修改前端、Go、插件业务内容或测试代码，也没有执行 Git 提交或推送。

2026-07-12，阶段一首批治理任务`RW-001`至`RW-008`已完成并通过静态扫描、Markdown 格式检查和项目审查。Tasklist 当前为 31 项完成、374 项待执行；`GATE-010`作为覆盖全部 14 个阶段的持续门禁仍保持未完成。

2026-07-12，阶段二`RW-020`至`RW-049`已完成。独立`apps/lina-web`已通过锁定安装、5 个单元测试、类型检查、lint、根路径与 basePath 构建、静态资产校验和 HTTP smoke。Tasklist 当前为 61 项完成、344 项待执行。

2026-07-12，阶段三`RW-050`至`RW-079`已完成。API Client、公共配置、运行时双语、ETag/7 天缓存、Query cache 作用域和启动顺序已通过 41 个单元测试、类型检查、lint、无告警分块构建和静态契约审查。Tasklist 当前为 91 项完成、314 项待执行。

2026-07-12，阶段四`RW-080`至`RW-104`已完成。现有 LinaPro 认证、用户、菜单、租户和插件状态 API 已由 React 工作台直接消费；会话状态机、多租户`preToken`、原子请求上下文、租户切换、平台代入、权限与 capability 隐藏已通过 69 个单元和组件测试、类型检查、lint、根路径与 basePath 无告警构建及静态安全审查。Tasklist 当前为 116 项完成、289 项待执行。

2026-07-12，阶段五`RW-110`至`RW-127`已完成。显式页面注册、菜单投影、访问守卫、sandbox iframe、新标签页、Semi 桌面与移动导航、Header、租户切换、标签元数据、两种页面表面和四类错误页已通过 80 个单元与组件测试、类型检查、lint、根路径与 basePath 构建及 URL 安全审查。Tasklist 当前为 134 项完成、271 项待执行。

2026-07-12，阶段六`RW-130`至`RW-159`已完成。源码插件 React UI 清单、8 个 slot key、Vite 虚拟 registry、稳定宿主上下文、插件页面/插槽投影、generation 定向刷新、外部目录与 React 单例治理、静态导入边界和 28 个 Vue 文件/helper 逐项映射已通过 103 个单元与组件测试、类型检查、lint、根路径与 basePath 构建及静态扫描。Tasklist 当前为 164 项完成、241 项待执行。

## 审查范围

- 宿主基线：`7d149838e77fe3d2b1bdda5ebb9d46679f79fd23`。
- 插件基线：`1b90535404d1563a045efe3888dd9db6d1bf5e29`。
- 主审查文件：`docs/2026-07-12-react-workbench-replacement-tasklist.md`。
- 关联设计：`docs/2026-07-11-react-workbench-replacement-design.md`。
- 冻结前参考计划：`docs/superpowers/plans/2026-07-11-react-workbench-replacement.md`。
- 事实源：`apps/lina-vben`、`apps/lina-core`、`apps/lina-plugins`、`hack`、`.github/workflows`和根`Makefile`。
- 范围来源：`git status --short`、`git ls-files --others --exclude-standard`、gitlink 转换前后清单与摘要、静态检索和 npm registry 元数据。

当前`docs/`为未跟踪目录，`.contributing`被 Git 忽略。用户未授权提交或推送，因此冻结状态只记录在文档中，不代表已创建 Git commit 或 tag。

## 已读取规则

- `AGENTS.md`
- `.agents/instructions/markdown-format.instructions.md`
- `.agents/rules/documentation.md`
- `.agents/rules/openspec.md`
- `.agents/rules/architecture.md`
- `.agents/rules/plugin.md`
- `.agents/rules/frontend-ui.md`
- `.agents/rules/testing.md`
- `.agents/rules/i18n.md`
- `.agents/rules/dev-tooling.md`
- `.agents/rules/backend-go.md`
- `.agents/rules/api-contract.md`
- `.agents/rules/data-permission.md`
- `.agents/rules/cache-consistency.md`
- `.agents/skills/lina-review/SKILL.md`

仓库中没有插件本地`AGENTS.md`。当前上层规则不允许未经用户明确要求启用子代理，因此本次审查采用本地串行方式完成。

## 代码库基线证据

| 检查项 | 结果 |
| --- | --- |
| Lina 工作台源码 | 90 个 Vue 文件、122 个 TypeScript 文件 |
| Lina 工作台 API | 37 个文件 |
| Lina 定制前端单测 | 13 个文件 |
| 宿主 E2E | 105 个用例 |
| 共享组件与运行时支持文件 | 62 个文件 |
| 工作台 public assets | 10 个文件，其中 1 个为 Vben logo |
| 官方源码插件 Vue UI | 9 个插件、28 个文件 |
| 已发布源码插件 slot | 8 个 key |
| 动态插件旧入口 | `mount.js` 2529 行 |
| 动态插件 standalone | `standalone.html` 441 行 |
| Vben 工具链硬编码 | 25 个文件 |
| 受影响 workflow | 6 个直接路径引用文件，另有 1 个 OpenSpec 门禁调用文件需要清理 |

Tasklist 固定的 React、React DOM、Vite、TypeScript、React Router、TanStack Query、Zustand、Semi UI、Semi Icons、i18next、react-i18next 和 Vitest 版本均已从 npm registry 验证存在。补充的 Vite React 插件、类型、Testing Library、jsdom、ESLint、ECharts、TipTap React、cropperjs 和 dayjs 版本也已验证存在并满足 Node.js`22.22.0`约束。

Semi UI`2.101.0`包内容已验证包含`dist/css/semi.min.css`、`lib/es/locale/source/en_US.js`和`zh_CN.js`。

## 已修复的阻塞问题

1. 动态插件原计划直接用展示型`standalone.html`替换完整`mount.js`，会丢失分页、CRUD、附件、权限和 host-service 演示。Tasklist 阶段九现要求先实现受限消息桥接和完整功能等价，再删除`mount.js`。
2. 原顺序先修改动态插件 manifest，后修改`lina-core`契约，阶段十会被旧 hosted frontend contract 拒绝。通用`iframe/new-window`契约、桥接和插件迁移现已合并到阶段九。
3. 原依赖清单缺少 React Vite 插件、React 类型、Router DOM、ECharts、TipTap React、cropperjs、dayjs、完整 Testing Library 和 lint 工具。阶段二已固定可安装版本。
4. 原页面任务没有覆盖 public assets、字典、上传、头像裁剪、富文本、JSON 预览、权限树、导出和图表等共享能力。阶段二和阶段七已补齐。
5. 官方插件当前大量引用宿主私有`#/*`、`@vben/*`、Vue 和 Ant Design Vue。阶段六现发布`@linapro/plugin-ui`稳定导入面，并增加 Vite 外部目录、依赖解析、React 单例和静态导入边界门禁。
6. 原运行时任务没有完整覆盖公共配置的品牌、水印和 Cron 投影，也没有明确`i18n.enabled=false`、locale endpoints 和语言切换副作用。阶段三已补齐。
7. 原工具链任务没有逐项覆盖`internal/frontend`、`devservice`、`toolutil`、`portcheck`、`runtimei18n`、`wasmbuilder`、E2E fixture 和`main_test.go`。阶段十一现以 25 个文件、6 个直接引用 workflow 和 1 个 OpenSpec 门禁调用 workflow 为复查基线。
8. 原验收没有要求追踪 13 个 Lina 定制单测和全部 105 个宿主 E2E。阶段七和阶段十三现要求逐项映射并全量执行。
9. 原计划保留 LinaPro 上游插件子模块，导致产品需要第二套仓库、分支和指针交付流程。`v1.2`已把插件目录扁平化为父仓库普通目录，并同步改写`GATE-012`、`RW-279`、`RW-397`和`RW-416`。

## 已修复的警告

- 详细设计仍写根目录缺少`.contributing`，与当前产品仓库事实不符；已改为范围受限的本地授权记录。
- 冻结前实施计划可能被误当成权威任务源；已明确其仅为历史实现参考，冻结 Tasklist 是唯一执行清单。
- 动态插件原设计删除通用 access-mode key，会同时失去 iframe/new-window 的稳定查询契约；现只删除`embedded-mount`和`embeddedSrc`，保留通用模式并新增`pluginAssetUrl`。
- 最终机械复查发现冻结前实施计划仍残留“删除`DynamicAccessModeQueryKey`”和直接以展示页替换`mount.js`的旧步骤；已改为保留通用 key，并明确完整桥接、功能等价和安全门禁通过后才删除旧入口。
- 产品 owner 明确`lina-tapcanvas`不使用 OpenSpec；已将该决策记录为`v1.1`，移除 OpenSpec 条件门禁，并要求从产品 CI 编排中删除 OpenSpec 完成状态检查。
- 产品 owner 明确插件代码与产品共同演进；已将`apps/lina-plugins`从 gitlink 转成父仓库普通目录，转换前后插件内容摘要保持一致。

## 规则域结论

- 文档：通过。冻结元数据、基线、审查记录和变更控制已补齐；根`README`与`CONTRIBUTING`中英文镜像已同步更新为产品单仓事实。
- OpenSpec：不适用。产品明确不采用该流程；继承自上游的 OpenSpec 文件不作为本项目需求、验证或交付证据。
- 架构：通过。React 发现仍完全属于`lina-web`；`lina-core`只维护通用 hosted page 契约，不扫描 React 文件。
- 插件：通过。源码插件使用稳定 React 导入面；动态插件使用 sandbox iframe 和受限桥接；所有插件文件由产品父仓库直接跟踪，不再存在独立 fork 门禁。
- 前端：通过。Semi Design 是宿主唯一管理 UI；依赖、公共资产、共享能力、路由、错误和页面迁移任务已形成闭包。
- 测试：通过。`linactl`全量单测和动态插件构建测试通过；结构转换不改变 UI、API 或用户工作流，因此不触发 E2E 质量审查。
- i18n：通过。宿主和插件双语、运行时 locale/messages、ETag、禁用模式、API Docs 和扫描路径均已覆盖。本次文档修订不修改运行时语言资源。
- 开发工具：通过。仓库自带的跨平台`linactl plugins.init`完成转换，二次执行正确报告普通目录；未修改工具源代码。
- 后端与 API：通过。后续 Go 任务明确编译、启动绑定、lint、apidoc 和 DI 门禁；本次未修改 Go 或 HTTP API。
- 数据权限：无运行时影响。工作台继续隐藏无权操作，后端仍是权威校验；动态桥接只能调用当前插件既有 API，不能扩大权限。
- 缓存一致性：无后端缓存变更。Tasklist 保留运行时 i18n 7 天本地缓存和按会话、租户、generation 精确失效。
- 数据库：无影响。没有新增表、SQL、索引、迁移或种子数据任务。

## 验证证据

- Task ID 完整性：405 个 checkbox 均有合法 ID，无重复 ID。
- Task 状态：134 项已完成，271 项待执行。
- Markdown 静态检查：无尾随空格、无奇数反引号、无未闭合代码围栏。
- 占位词检查：仅命中 TipTap 包名`extension-placeholder`，不是文档占位内容。
- 插件盘点：9 个源码 UI 插件的 28 个 Vue 文件与 Tasklist 一致。
- 插件目录转换：来源基线为`1b90535404d1563a045efe3888dd9db6d1bf5e29`；转换前后均为 966 个文件、3,532,555 字节，聚合摘要均为`bc050b6bda56ca648033a21dd59e2faabbc6ce1f`。
- Git 结构：`.gitmodules`、插件目录内部`.git`和`.git/modules/apps/lina-plugins`均已移除；父仓库索引不再包含`160000`模式。
- 父仓库跟踪：964 个交付文件已进入父仓库索引；其余 2 个文件是插件基线中已有且被`.gitignore`明确排除的`.DS_Store`，不属于交付内容。
- 工具测试：`GOPROXY=https://goproxy.cn,direct GOSUMDB=off go test ./... -count=1`在`hack/tools/linactl`下全部通过。
- 插件治理：`GOPROXY=off GOSUMDB=off go run ./hack/tools/linactl plugins.check`扫描 459 个文件、10 个配置和 11 个 manifest，发现 0 项问题。
- 转换幂等：再次运行`linactl plugins.init`返回`Plugin workspace already ordinary`。
- OpenSpec：未运行且不要求运行；产品决策明确该流程不适用于`lina-tapcanvas`。
- E2E：未运行，原因是插件内容摘要、运行时行为、UI、API、数据库和测试资产均未改变。
- 空白检查：文档无尾随空格；父仓库首次纳入插件基线时，`git diff --cached --check`报告 10 个上游 JSON 文件已有的 EOF 空行，转换为保持内容一致未改写这些文件。

## 剩余执行门禁

1. 产品仓库仍没有实际`origin`URL，不阻塞本地阶段一至七，但交付前必须配置。
2. 未获得用户明确授权前，不执行 Git commit、push 或 PR。

除上述已记录的外部门禁外，未发现阻塞`v1.2`开始执行的问题。

## 2026-07-15 最终执行更新

React 工作台替换已完成阶段十三代码与运行门禁，并进入阶段十四文档收口。冻结的`v1.2`任务语义、顺序、依赖和验收标准没有变化；本节只追加最终执行事实，不回写或覆盖冻结时的历史计数。

### 最终变更范围

| 域 | 最终范围 |
| --- | --- |
| 宿主工作台 | 删除`apps/lina-vben`；新增并切换到`apps/lina-web` |
| 官方插件 | `apps/lina-plugins`由父仓普通目录直接维护；9 个源码插件 UI 使用 React，动态示例使用 sandbox iframe/new-window |
| 核心宿主 | 仅修改仓库根识别、通用 hosted page/菜单/资源契约、打包资源和迁移所需回归测试；不扫描 React 或 TSX |
| 工具与 CI | `Makefile`、`hack/tools/linactl`、E2E、主/夜间/发布 workflow 和复用 workflow 统一使用`apps/lina-web` |
| 治理与文档 | `.agents/rules`、根 README、CONTRIBUTING、linactl README、插件 README、阶段记录和 Tasklist 证据同步更新 |

阶段十三全面审查时，工作区相对宿主基线有 1,502 个已改或已删除路径、291 个新增未跟踪路径。该数量包含删除的旧工作台及直接纳入父仓的插件基线，不表示 1,793 个独立逻辑功能。随后已把`apps/lina-plugins`最终交付加入父仓索引：999 个交付路径被直接跟踪，插件未跟踪文件为 0。未执行 commit、push、PR、tag 或发布。

### 最终规则域结论

- 架构：`apps/lina-web`是唯一默认工作台；没有 Vue/React 产品开关。源码插件 UI 发现只属于 React 工作台，`lina-core`不解析 React、TSX 或 Semi Design。
- 前端：React 与 ReactDOM 统一为`19.2.7`；宿主使用 Semi Design 和 Semi Icons，不含 Ant Design React、Vue、Vben 或 Ant Design Vue 运行时依赖。
- 插件：源码插件只导入`@linapro/plugin-ui`公开面和插件相对模块；动态 iframe 无`allow-same-origin`、无宿主 Token，并通过按 window、nonce、插件、generation 和 request ID 限制的桥接调用当前插件 API。
- 后端与 API：认证、用户、租户、RBAC、数据权限、数据库和核心业务语义没有因工作台替换而改变；插件 API 与`/x-assets`仍由宿主治理。
- i18n 与缓存：`en-US`、`zh-CN`、Semi locale、运行时消息、ETag、租户和插件 generation 失效路径通过自动化验证。
- 开发工具：macOS 本地和 OrbStack Linux/amd64 构建已通过；CI、linactl、资源嵌入和 E2E 的默认前端路径已切换。

### 最终验证命令与结果

| 门禁 | 结果 |
| --- | --- |
| React typecheck / lint / unit / build | 通过；Vitest`62/62`文件、`215/215`测试 |
| E2E 静态验证 | 通过；`257`个文件、`17`个 scope |
| 宿主 E2E | 105 个宿主`TC*.ts`全量通过 |
| 官方插件 E2E | `309 passed`、`7 skipped`、`0 failed`；跳过项只属于专用 demo-control 启动模式 |
| Go 脚本、i18n、lint | 全部通过；14 个 Go 模块 lint 为 0 issues，i18n 为 0 violation |
| host-only / plugin-full build | 两类 Linux/amd64 最终构建均通过 |
| OrbStack 最终 smoke | `/admin/`、主 chunk、favicon 200；登录和源码插件 ping 为`code=0`；动态插件安装态生命周期 1/1 通过 |
| 视觉审查 | 当前最终构建 4/4 张截图通过，0 console error、0 page error；阶段十另有 37/37 广度截图 |
| 静态清理 | `.vue`、Vue/Vben/Ant Design 导入、`.gitmodules`、嵌套`.git`均为 0；`git diff --check`通过 |

详细命令、失败修复、包图和截图路径见`docs/2026-07-15-react-workbench-phase-13-execution-record.md`。

### 无影响判断

- 未新增或修改本阶段之外的数据库表、宿主 SQL、DAO 或索引。
- 未替换 LinaPro 认证、用户、租户、RBAC、数据权限或插件生命周期 owner。
- 未实施 TapCanvas 画布、Hono 到 Go 业务迁移、第三方模型网关或 Agents Bridge。
- 未使用 OpenSpec 或 GSD 规划 artifact 作为产品证据；项目继续以冻结 Tasklist 与阶段记录为权威执行链。

### 剩余风险与交付边界

1. `RW-397`已经通过父仓索引完成；`RW-279`仍要求正式父仓版本历史。当前没有 commit 授权，不能把索引状态声称为 Git 提交历史。
2. 产品仓库仍没有实际`origin`，`upstream`推送地址已禁用；本地验证不受影响，后续提交或 PR 需要用户先决定目标仓库。
3. `make i18n.check`仍有 14 条非阻断 warning；0 violation，不阻塞本次替换。
4. 未经用户新授权，不执行 commit、push、PR、tag、镜像发布或环境发布。
