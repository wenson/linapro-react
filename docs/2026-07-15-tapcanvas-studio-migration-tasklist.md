# TapCanvas Studio 迁移 Tasklist

## 文档定位

本文是`linapro-tapcanvas-studio`从设计、前端迁移、Go 业务实现、`FlowMutation`、AI、Agents Bridge 到硬切换的唯一执行清单。详细设计见`docs/2026-07-15-tapcanvas-studio-plugin-design.md`。

本清单只修改产品仓库`lina-tapcanvas`。`../TapCanvas`保持只读迁移来源；目标产品不复制或部署 Hono、Prisma、BullMQ、TapCanvas JWT、Team 或`new-api`运行时。删除外部参考仓库源码不属于本清单。

| 冻结项 | 值 |
| --- | --- |
| 版本 | `v1.1` |
| 状态 | `Frozen` |
| 创建日期 | `2026-07-15` |
| 冻结日期 | `2026-07-15` |
| 产品仓库 | `lina-tapcanvas` |
| 来源仓库 | `../TapCanvas`，只读 |
| 总架构 | `docs/2026-07-11-tapcanvas-react-platform-migration-design.md` |
| 详细设计 | `docs/2026-07-15-tapcanvas-studio-plugin-design.md` |
| 执行性审查 | `docs/2026-07-15-tapcanvas-studio-tasklist-v1-executability-review.md` |

冻结前必须完成代码库对照审查。冻结后不得静默修改任务语义、顺序或验收门禁；范围变化必须追加变更记录并升级版本。

### v1.1 变更记录

2026-07-16，产品 owner要求删除 React工作台清单中的后续占位任务，再独立细化后续工作。`v1.1`删除跨清单状态同步任务`TS-342`；Studio清单不再读写`NEXT-*`映射。该变更不调整`TS-001～TS-341`、`TSDONE-*`的语义、顺序和验收门禁。

## 执行规则

- 严格按“执行边界 → 阶段一至十三 → 最终完成定义”推进；前一阶段验收未通过时，不得把后一阶段标记完成。
- 关键依赖顺序固定为`Flow → 资产/素材/分镜/Memory → 生成任务 → 完整画布 → Agents Bridge`。
- Go API先定义`api/`DTO，再执行`make ctrl`并只在生成骨架中填写业务逻辑；SQL通过幂等检查和两次初始化后执行`make dao`。禁止绕开生成器创建 Controller骨架，禁止手写或修改 DAO、DO和 Entity。
- 数据库阶段分别维护`001`至`005`单迭代安装 SQL；卸载脚本使用`995`至`999`反向依赖顺序。已通过阶段的 SQL不得静默回写，Mock 数据必须独立。
- 每个阶段维护独立执行记录，记录任务映射、命令、退出码、失败修复、截图、影响评估和审查结论。
- `../TapCanvas`只读。任何删除仅作用于目标仓已明确纳入范围的迁移产物；未获单独确认不得删除来源文件。
- 本项目不使用 OpenSpec，也不引入 GSD`.planning`体系；冻结 Tasklist和阶段执行记录是唯一执行链。

## 执行边界

- [x] `TS-001`确认`apps/lina-web`React 工作台替换的运行、代码、视觉和文档门禁继续通过。
- [x] `TS-002`确认`.contributing`存在并覆盖 TapCanvas builtin 插件所需宿主、工具和测试变更。
- [x] `TS-003`确认统一 React 是硬约束，宿主和源码插件共享 React 19 单例。
- [x] `TS-004`确认 TapCanvas workspace 首次迁移可保留 Mantine，但不得覆盖`body`、`:root`、`.semi-*`或宿主 token。
- [x] `TS-005`确认插件启用`en-US`和`zh-CN`，`i18n.default`为`en-US`，英文为源内容。
- [x] `TS-006`确认插件支持多租户，所有业务数据强制`tenant_id`，Team 不进入目标模型。
- [x] `TS-007`确认项目、章节、Flow、资产、素材、分镜镜头和 Memory 使用软删除；版本、引用、任务、attempt、mutation、Agent run、token、event 和 tool call不使用软删除。
- [x] `TS-008`确认`distribution: builtin`、`scope_nature: tenant_aware`和`default_install_mode: global`。
- [x] `TS-009`确认`linapro-ai-core`是 AI 能力 owner；目标产品把它改为 builtin并先于 Studio装配，第三方模型服务是外部依赖，不实现`new-api`。
- [x] `TS-010`确认`agents-cli`保持独立服务，浏览器和`agents-cli`都不获得 LinaPro Token。
- [x] `TS-011`确认不迁移历史数据，不建立旧 JWT、Team、Hono API 或 Prisma 兼容层。
- [x] `TS-012`确认 billing、commerce、product、order 和 wechat-pay 不进入创作主链，后续由独立商业插件工作流处理。
- [x] `TS-013`创建统一阶段执行记录模板，包含任务映射、命令、退出码、失败修复、截图、影响评估和审查结论。
- [x] `TS-014`完成 Tasklist 路径、任务 ID、依赖、命令和验收门禁的执行性审查。
- [x] `TS-015`修复审查问题并冻结`v1.0`，冻结前不得开始批量迁移。

阶段验收：产品边界、软删除、多租户、AI、Agent、旧运行时和商业能力处置没有未决歧义，Tasklist 进入`Frozen`。

## 阶段一：迁移基线和插件骨架

- [x] `TS-020`记录`../TapCanvas/apps/web`文件数、TypeScript/TSX 行数、最大文件、依赖和测试基线。
- [x] `TS-021`记录 Hono 每个模块的路由、调用方、表、后台任务、配置和测试基线。
- [x] `TS-022`生成 Hono 模块处置矩阵，逐项映射到 LinaPro、TapCanvas 插件、`linapro-ai-core`、后续商业插件或删除。
- [x] `TS-023`记录当前前端认证、Team、商业、Hono 源码 alias、Flow 双写和模型目录耦合点。
- [x] `TS-024`记录当前画布 1,000 节点和 2,000 边的加载、拖动、框选和保存性能基线；无法达到规模时记录真实上限。
- [x] `TS-025`创建`apps/lina-plugins/linapro-tapcanvas-studio`目录和双语 README。
- [x] `TS-026`创建`plugin.yaml`并声明 source、builtin、tenant-aware、global、多租户和双语配置。
- [x] `TS-027`声明`linapro-ai-core >=0.1.0 <0.2.0`插件版本硬依赖，不声明软依赖或自动降级。
- [x] `TS-028`创建项目入口和 Studio workspace 菜单、按钮权限及双语资源。
- [x] `TS-029`创建`plugin_embed.go`、`backend/plugin.go`、`go.mod`、`go.sum`、`Makefile`和`hack/config.yaml`；`go.mod`声明匹配的 AI Core module依赖。
- [x] `TS-030`创建`frontend/plugin-ui.ts`，显式懒加载`/tapcanvas/projects`和`/tapcanvas/studio`，并纳入宿主插件 UI typecheck注册表。
- [x] `TS-031`创建最小 React 项目入口和 workspace 页面，只读取`useLinaPluginHost()`投影。
- [x] `TS-032`创建插件 config、SQL、i18n、apidoc和测试目录，并从统一模板创建阶段一执行记录。
- [x] `TS-033`检查插件根是否存在本地`AGENTS.md`；存在时读取并记录优先规则。
- [x] `TS-039`把`linapro-ai-core`改为 builtin，删除重复`plugin.autoEnable`项，验证干净数据库按 AI Core、Studio顺序自动安装启用。
- [x] `TS-034`运行 plugin manifest、i18n、React registry、Go 编译和 builtin 装配 smoke。
- [x] `TS-035`验证 builtin 插件不出现在普通安装、停用、卸载或手动升级入口。
- [x] `TS-036`验证`linapro-ai-core`缺失或版本不兼容时装配显式失败。
- [x] `TS-037`验证 Tenant 切换后插件页面重新装配，不复用旧 Tenant 状态。
- [x] `TS-038`记录架构、插件、i18n、数据权限、缓存、数据库、跨平台和测试影响。

阶段验收：空的 TapCanvas builtin 插件可以随宿主编译、启动和路由，且保持 LinaPro 通用宿主边界。

## 阶段二：React 画布源码复制和构建接入

- [x] `TS-040`机械复制`../TapCanvas/apps/web/src`到插件`frontend/tapcanvas`，保存来源 commit、文件数和内容摘要。
- [x] `TS-041`复制仍被真实入口引用的 Web 静态资产和测试 fixture，不复制构建产物、缓存、日志或密钥。
- [x] `TS-042`在复制后立即运行文件数和摘要复核，记录复制不是完成态。
- [x] `TS-043`按来源 lockfile和真实 import闭包固定 Mantine`7.17.8`、React Flow`12.10.2`、Tabler Icons`3.41.1`、WebAV`1.2.8`、Framer Motion`12.38.0`、Three`0.183.2`、Zod`3.25.76`及实际表单依赖。
- [x] `TS-044`不在插件创建独立 React 依赖、独立 lockfile 或第二套 Vite 应用。
- [x] `TS-045`更新 Vite alias、dedupe、TypeScript include和 ESLint覆盖，使插件源码统一解析宿主 React`19.2.7`、ReactDOM`19.2.7`和 Zustand`5.0.14`。
- [x] `TS-046`删除复制后的`main.tsx`、`index.html`、独立 Vite 配置和独立 React root。
- [x] `TS-047`创建只包裹 TapCanvas workspace 的 Mantine Provider和主题入口。
- [x] `TS-048`把 Mantine CSS variables 绑定到`.tapcanvas-studio-root`，禁止修改宿主根主题属性。
- [x] `TS-049`扫描并移除业务 CSS 对`body`、`:root`、`.semi-*`和宿主 token 的覆盖。
- [x] `TS-050`把`App.tsx`拆为 workspace shell、画布、工具条和延迟面板，不保留独立应用路由 owner。
- [x] `TS-051`让 Studio workspace 使用宿主`workspace`surface并填满可用高度。
- [x] `TS-052`将重型面板、Three、WebAV、媒体编辑器和 Agent 对话改为显式 lazy chunk。
- [x] `TS-053`把原 Web 单测迁入宿主 Vitest或插件聚焦测试，删除只验证独立应用壳的测试。
- [x] `TS-054`将 Playwright POM和 E2E 基础路径改为 LinaPro`/admin`下的插件路由。
- [x] `TS-055`对已注册页面的完整 import闭包运行 React 19 typecheck，修复 React 18 类型和生命周期不兼容。
- [x] `TS-056`对已注册页面的完整 import闭包运行 ESLint并清零错误；复制但尚未接入的文件只作迁移输入，不用批量`any`改写伪造完成。
- [x] `TS-057`运行迁移后前端单测和生产构建。
- [x] `TS-058`验证 bundle 只有 React 19 主版本。
- [x] `TS-059`验证 TapCanvas、Mantine、React Flow、Three和 WebAV 不进入宿主首屏 preload。
- [x] `TS-060`在 Studio根内创建专用 portal root，把 Modal、Popover、Menu、Tooltip和 Notification浮层限制在该节点。
- [x] `TS-061`捕获最小 workspace 首次加载、暗色和亮色截图并执行视觉审查。

阶段验收：复制后的画布源码由 LinaPro React 19构建和懒加载，尚未连接业务 API，但不再拥有独立应用启动壳。

## 阶段三：剔除认证、Team、权限底座和商业能力

- [x] `TS-070`删除`GithubGate`、GitHub OAuth callback和 GitHub client环境变量。
- [x] `TS-071`删除 TapCanvas guest、email、phone、password和验证码登录页面与 API。
- [x] `TS-072`删除`tap_token`、TapCanvas auth store、独立`401`拦截器和 JWT解析。
- [x] `TS-073`把用户显示信息改为只读取`PluginHostUserProjection`。
- [x] `TS-074`删除 Team store、Team selector、成员、邀请和 Team角色 UI。
- [x] `TS-075`删除 Team积分、充值、余额、ledger和`team_required`错误分支。
- [x] `TS-076`删除 TapCanvas管理员用户、权限和系统管理页面。
- [x] `TS-077`删除 billing、commerce、product、order、wechat-pay和套餐页面入口。
- [x] `TS-078`删除商业 DTO、API client、状态类型和专属环境变量。
- [x] `TS-079`删除独立 Home、Account、Stats管理壳中与创作主链无关的页面。
- [x] `TS-080`把页面动作权限全部改为 LinaPro permission set显式隐藏。
- [x] `TS-081`把 Team ID、Team role和 Team credits从项目、Flow、任务和 Agent前端模型移除。
- [x] `TS-082`把用户本地 storage key改为包含 LinaPro user和 tenant，或删除不必要持久化。
- [x] `TS-083`Tenant切换时取消请求、清空 Query cache、卸载画布和本地草稿。
- [x] `TS-084`平台管理员必须 impersonate进入具体 Tenant后才能使用 Studio。
- [x] `TS-085`运行禁用导入和文本扫描，确认无旧 auth、Team、billing、commerce、product、order和支付生产调用。
- [x] `TS-086`更新双语文案，删除登录、Team、积分和商业翻译键。
- [x] `TS-087`为无权限、模块缺失、Tenant缺失和 Tenant切换添加单元测试。
- [x] `TS-088`运行前端 typecheck、lint、unit、build和 i18n检查。
- [x] `TS-089`运行登录后进入 Studio、权限隐藏、Tenant切换和 impersonation E2E。

阶段验收：TapCanvas 前端只使用 LinaPro身份、Tenant和权限，没有自有平台底座或商业入口。

## 阶段四：项目和章节 Go 垂直切片

- [x] `TS-090`设计项目与章节 API DTO，时间点统一 Unix毫秒并补齐`g.Meta`、`dc`、`eg`和 permission。
- [x] `TS-091`创建当前迭代项目 SQL，包含项目、章节、索引和必要字典 Seed。
- [x] `TS-092`验证 SQL幂等、软删除、无显式自增 ID和 Seed/Mock分离。
- [x] `TS-093`执行`make db.init`和`make dao`生成 DAO、DO和 Entity，不手写或修改生成文件。
- [x] `TS-094`实现 project service，显式注入 bizctx、tenant、authz和数据库依赖。
- [x] `TS-095`实现 chapter service并通过 project可见性约束所有读写。
- [x] `TS-096`列表在数据库侧执行 Tenant、数据权限、过滤、排序和分页。
- [x] `TS-097`详情、更新、删除和批量动作在操作前执行目标可见性校验。
- [x] `TS-098`项目列表一次性投影章节数和最近 Flow摘要，不产生逐行查询。
- [x] `TS-099`根据 API DTO执行`make ctrl`生成 Controller骨架，再实现项目、章节 REST路由，不手写生成骨架。
- [x] `TS-100`注册 service、controller和路由，初始化错误全部返回`error`。
- [x] `TS-101`实现稳定`bizerr.Code`和插件双语错误资源。
- [x] `TS-102`把项目入口前端 API改为`host.api.plugin()`，删除对应 Hono client。
- [x] `TS-103`迁移项目创建、列表、详情、更新和删除页面行为。
- [x] `TS-104`迁移章节创建、排序、更新和删除行为。
- [x] `TS-105`为项目和章节 service添加自包含单元测试。
- [x] `TS-106`覆盖跨 Tenant、仅本人、不可见详情、聚合不泄露和批量整体拒绝。
- [x] `TS-107`增加查询次数或等价静态审查，证明项目列表无`N+1`。
- [x] `TS-108`运行插件 Go全量测试、启动绑定测试、`make lint`和 i18n检查。
- [x] `TS-109`运行项目和章节 CRUD、权限、双语和 Tenant E2E。

阶段验收：项目和章节由 Go插件唯一写入，前端不再调用对应 Hono模块。

## 阶段五：Flow 数据模型和`FlowMutation v1`

- [ ] `TS-110`冻结 Flow snapshot、revision、mutation和 version数据模型。
- [ ] `TS-111`冻结`FlowMutation v1`的 node、edge、group和 metadata操作集合。
- [ ] `TS-112`规定 actor只能由服务端用户上下文或 Agent run确定，拒绝客户端 actor。
- [ ] `TS-113`规定每次最多 200 operations、请求最大 1 MiB和快照默认最大 20 MiB。
- [ ] `TS-140`定义 Flow、mutation和 version API DTO，补齐`g.Meta`、`dc`、`eg`、permission和结构化 conflict响应。
- [ ] `TS-114`创建 Flow、mutation和 version SQL及索引。
- [ ] `TS-115`创建唯一`(tenant_id, flow_id, mutation_id)`幂等约束和`(tenant_id, flow_id, revision)`索引。
- [ ] `TS-116`运行数据库初始化两次并生成 DAO、DO和 Entity。
- [ ] `TS-141`执行`make ctrl`生成 Flow Controller骨架，不手写生成骨架。
- [ ] `TS-117`实现 Flow service、Controller、列表、创建、元数据更新、软删除和当前快照读取。
- [ ] `TS-118`实现 operation结构验证，拒绝任意 JSON Patch path、脚本和未知字段。
- [ ] `TS-119`实现节点、边、group、handle和资产引用验证。
- [ ] `TS-120`实现事务内 Flow行锁、mutation幂等查询和 base revision检查。
- [ ] `TS-121`实现有界 operation应用和新 revision写入。
- [ ] `TS-122`同一 mutation ID和相同请求摘要重复提交返回原结果；同一 ID复用不同请求时返回幂等键冲突。
- [ ] `TS-123`revision不一致返回结构化 conflict和当前 revision，不静默覆盖。
- [ ] `TS-124`事务内原子写入 Flow和 mutation日志。
- [ ] `TS-125`事务提交后发布精确 Flow revision事件或缓存失效。
- [ ] `TS-126`实现受控版本保存点和有界版本列表。
- [ ] `TS-127`不缓存 Flow快照；记录 PostgreSQL为权威源。
- [ ] `TS-128`实现前端 Flow API client和类型，不从 Hono源码导入。
- [ ] `TS-129`把用户画布写入改为`FlowMutation v1`。
- [ ] `TS-130`把 Agent flow patch转换为同一 mutation service调用。
- [ ] `TS-131`删除 canvas plan直接落地和旧服务端 patch双写路径。
- [ ] `TS-132`拖动期间只更新本地热状态，drag stop合并一个`node.moveBatch`。
- [ ] `TS-133`冲突时保留本地 operations并展示刷新、重放和放弃，不自动覆盖。
- [ ] `TS-134`为全部 operation、无效引用、大小上限和权限拒绝添加单元测试。
- [ ] `TS-135`为幂等、revision conflict和并发提交添加数据库集成测试。
- [ ] `TS-136`验证用户和 Agent写入产生相同 revision与审计语义。
- [ ] `TS-137`验证每次 mutation数据库操作次数有界，不按节点数查询。
- [ ] `TS-138`运行 Go测试、启动绑定、lint、React测试和构建。
- [ ] `TS-139`运行 Flow创建、加载、编辑、保存、冲突、重放和版本 E2E。

阶段验收：Flow 只有一个服务端权威写入协议，用户和 Agent不再存在双写竞争。

## 阶段六：资产、素材、分镜和 Memory

- [ ] `TS-150`盘点 asset、material、storyboard、draft和 memory模块的路由、表、文件写入、后台任务和调用方。
- [ ] `TS-151`冻结资产、素材版本、分镜镜头、镜头素材引用、Memory和 Draft归并数据模型。
- [ ] `TS-152`创建资产、素材、素材版本、分镜镜头、镜头素材引用和 Memory SQL、索引、字典及卸载脚本。
- [ ] `TS-153`运行 SQL幂等验证和两次数据库初始化，再执行`make dao`生成 DAO、DO和 Entity。
- [ ] `TS-154`定义资产、素材、分镜和 Memory API DTO，补齐`g.Meta`、`dc`、`eg`和 permission。
- [ ] `TS-155`执行`make ctrl`生成 Controller骨架，不手写生成骨架。
- [ ] `TS-156`实现资产列表、详情、上传、关联、下载和软删除 service及 Controller。
- [ ] `TS-157`用户上传使用`Files().Upload`，已有 file ID使用`Files().EnsureVisible`。
- [ ] `TS-158`私有中间产物使用插件`Storage()`，进入文件中心时使用`Files().CreateFromStorage`。
- [ ] `TS-159`禁止公开契约保存本地绝对路径、provider key、长期临时 URL和 base64。
- [ ] `TS-160`实现角色、场景、道具、风格素材及版本 service。
- [ ] `TS-161`实现章节分镜镜头、原子排序、连续性元数据和镜头素材版本引用 service。
- [ ] `TS-162`把旧 storyboard render job归并到阶段七生成任务；时间线只由镜头、素材版本和资产投影。
- [ ] `TS-163`实现项目、书籍、章节、session和 task范围的 Memory service，并把 Draft建议和使用记录映射到 Memory。
- [ ] `TS-164`所有列表在数据库侧分页、数据权限过滤和批量装配。
- [ ] `TS-165`下载、更新、删除、镜头重排和执行前验证目标与项目可见性。
- [ ] `TS-166`把前端 AssetPanel、素材、分镜和 Memory面板切换到插件 API。
- [ ] `TS-167`迁移书籍、章节素材、角色卡、视觉参考和 storyboardChunks的持久化行为。
- [ ] `TS-168`把`project-data`事实迁入数据库或受控 Storage投影，明确唯一权威源和重建路径。
- [ ] `TS-169`删除运行时自行建表和旧文件系统权威写入。
- [ ] `TS-170`为 CRUD、版本、排序、上传、下载、不可见资源和跨 Tenant添加单元与集成测试，并验证无`N+1`和范围外数量泄露。
- [ ] `TS-171`运行 Go测试、启动绑定、lint、i18n、前端测试、构建以及资产、素材、分镜、Memory双语权限 E2E。

阶段验收：创作数据和二进制资产具有明确 owner，前端不再依赖 Hono、Prisma或无治理项目文件写入。

## 阶段七：生成任务、Worker和`linapro-ai-core`

- [ ] `TS-180`冻结生成任务、attempt、租约、取消、超时、重试和结果状态机。
- [ ] `TS-181`使用 LinaPro字典维护 task kind、status和 failure category。
- [ ] `TS-182`创建生成任务与 attempt SQL、索引和卸载脚本。
- [ ] `TS-183`运行 SQL幂等验证和两次数据库初始化，再执行`make dao`生成 DAO、DO和 Entity。
- [ ] `TS-184`定义任务 API DTO并执行`make ctrl`生成 Controller骨架。
- [ ] `TS-185`实现任务创建、列表、详情、取消和重试 service及 Controller。
- [ ] `TS-186`任务创建与可领取调度状态在同一事务内可靠写入。
- [ ] `TS-187`使用有界批次和`FOR UPDATE SKIP LOCKED`或等价语义实现领取、租约、续租、超时和崩溃恢复。
- [ ] `TS-188`Redis只用于唤醒和协调，不作为任务真源。
- [ ] `TS-189`集群模式使用宿主 coordination、共享 revision或分布式锁，禁止节点本地唯一状态。
- [ ] `TS-190`实现 LinaPro Job超时扫描、补偿、清理和对账入口。
- [ ] `TS-191`通过`aicap`类型化调用文本、图片、音频、视频和视觉能力。
- [ ] `TS-192`保存`ProviderOperationRef`但不复制 provider内部日志或密钥。
- [ ] `TS-193`删除 dreamina、model、model-catalog、new-api-models和 Hono AI直接调用。
- [ ] `TS-194`浏览器模型列表来自`linapro-ai-core`治理投影，不回退硬编码枚举。
- [ ] `TS-195`把生成结果通过`FlowMutation v1`回填节点和资产引用。
- [ ] `TS-196`后处理失败时保留供应商已生成资产、attempt和诊断。
- [ ] `TS-197`任务重试复用业务幂等键，不重复创建节点或资产。
- [ ] `TS-198`为成功、失败、取消、超时、限流、凭证失效和重试添加测试。
- [ ] `TS-199`为 Worker双领取、租约过期、进程崩溃和集群协调添加测试。
- [ ] `TS-200`验证`linapro-ai-core`不可用时生成显式失败，普通画布编辑继续可用。
- [ ] `TS-201`运行 Go测试、启动绑定、lint、任务 E2E和 OrbStack恢复 smoke。

阶段验收：生成任务由插件可靠持久化和恢复，所有模型调用通过`linapro-ai-core`直连第三方服务。

## 阶段八：画布工作区完整迁移

- [ ] `TS-210`把 canvas、node、edge、group、viewport和 selection模块接入插件 workspace。
- [ ] `TS-211`拆分`TaskNode.tsx`，每个节点种类使用职责明确组件和 hooks。
- [ ] `TS-212`拆分`Canvas.tsx`，渲染、交互、热状态和持久化协调分别负责。
- [ ] `TS-213`拆分`store.ts`，持久图状态、历史、选择和执行状态不共享无界订阅。
- [ ] `TS-214`拆分`remoteRunner.ts`，执行输入解析、任务提交、轮询和结果 mutation分离。
- [ ] `TS-215`拆分原`server.ts`为 project、flow、asset、generation、memory和 agent client。
- [ ] `TS-216`删除所有 Hono协议源码 alias，协议类型归属插件前端。
- [ ] `TS-217`删除 React Router页面 owner，使用宿主路由参数和受控 workspace状态。
- [ ] `TS-218`迁移模板、subflow、library、inspector和历史面板。
- [ ] `TS-219`迁移图片、视频、音频、字幕、分镜和媒体预览节点的结构性行为。
- [ ] `TS-220`所有模型选项从受治理 API动态读取，空列表显式显示未配置。
- [ ] `TS-221`禁止用正则、关键词、prompt includes或硬编码 route做语义判断。
- [ ] `TS-222`前置资产执行只接受真实 URL事实，缺失时显式失败。
- [ ] `TS-223`生成成功的资产在后处理失败时保留节点结果、日志和元数据。
- [ ] `TS-224`恢复暗色、亮色和 reduced-motion行为。
- [ ] `TS-225`保证工具栏 icon按钮具有 aria-label、tooltip和可见焦点。
- [ ] `TS-226`保证移动端可以完成查看、选择、基础编辑和任务状态查看。
- [ ] `TS-227`运行 1,000节点、2,000边加载、拖动、框选和 mutation合并基线。
- [ ] `TS-228`检查热路径每帧 0网络、0全量序列化和0持久化。
- [ ] `TS-229`运行节点、画布、历史、序列化和协议单元测试。
- [ ] `TS-230`运行工作区关键操作 E2E和截图视觉审查。

阶段验收：无限画布主要交互完整运行在 LinaPro workspace，性能和视觉不因宿主嵌入退化。

## 阶段九：Agents Bridge和短期能力令牌

- [ ] `TS-240`冻结 Agent run、事实上下文、remote tool、事件游标、tool call和 delivery verification协议版本。
- [ ] `TS-241`创建 Agent run、token、event和 tool call SQL、索引及卸载脚本。
- [ ] `TS-242`运行 SQL幂等验证和两次数据库初始化，再执行`make dao`生成 DAO、DO和 Entity。
- [ ] `TS-243`定义 Agent API DTO并执行`make ctrl`生成 Controller骨架。
- [ ] `TS-244`实现 256-bit不透明 token生成，只保存 hash。
- [ ] `TS-245`token绑定 run、Tenant、用户、项目、Flow、工具 allowlist、资源范围和 5分钟 TTL。
- [ ] `TS-246`实现创建、查询、取消 Agent run API。
- [ ] `TS-247`实现按`afterSequence + limit`有界读取持久化脱敏事件，不建立节点本地事件真源。
- [ ] `TS-248`实现`/agent-tools/execute`回调，只接受短期 token和稳定`toolCallId`。
- [ ] `TS-249`每次工具调用验证 token、过期、撤销、run状态、tool和资源范围。
- [ ] `TS-250`工具调用再次执行当前数据权限和目标可见性检查。
- [ ] `TS-251`按`tenant_id + run_id + tool_call_id`保存请求摘要和结果；相同请求重试返回原结果，不同请求复用 ID时拒绝。
- [ ] `TS-252`Flow工具只调用`FlowMutation v1`，不直接更新快照。
- [ ] `TS-253`资产和生成工具只调用所属 service，不访问 DAO内部实现。
- [ ] `TS-254`实现仅接受`agents-cli`服务凭证的 token rotate API，轮换不得扩大原 scope。
- [ ] `TS-255`完成、失败、取消和过期时撤销该 run全部未过期 token。
- [ ] `TS-256`日志、错误、event、trace和数据库不包含 token明文、LinaPro Token或服务凭证。
- [ ] `TS-257`使用宿主 Secret提供的独立服务凭证调用`agents-cli /chat`，默认配置和仓库不保存凭证明文。
- [ ] `TS-258`向`agents-cli`注入事实上下文、remote tool schema、短期 token和交付契约。
- [ ] `TS-259`保留`expectedDelivery -> deliveryEvidence -> deliveryVerification`通用收口链。
- [ ] `TS-260`禁止在 Go插件或前端实现关键词路由、固定 prompt套餐和 case-specific完成补丁。
- [ ] `TS-261`把 Agent任务迁入`backend/internal/service/agent/` Worker，前端只提交、观察和取消。
- [ ] `TS-262`把 AiChatDialog切换到插件 Agent run API和持久事件游标。
- [ ] `TS-263`删除旧 Hono`/public/agents/chat`、API key和 direct flow patch调用方。
- [ ] `TS-264`为有效、过期、撤销、错 run、错 Tenant、错 tool和错资源添加安全测试。
- [ ] `TS-265`为长任务 token轮换、旧 token撤销、scope不扩张和非服务调用拒绝添加测试。
- [ ] `TS-266`为 tool call重复、请求摘要冲突、并发提交和结果复用添加幂等测试。
- [ ] `TS-267`验证`agents-cli`不可用时只阻断 Agent任务，不阻断手工编辑和直接生成。
- [ ] `TS-268`验证进程重启或节点切换后，Agent run、事件游标、token撤销和 tool call结果可从 PostgreSQL恢复。
- [ ] `TS-269`运行 Agent单元、集成、E2E、trace脱敏和交付验收测试。

阶段验收：Agent使用独立服务和短期受限工具权限完成创作，不获得 LinaPro Token或数据库访问。

## 阶段十：剩余 Hono 领域处置

- [ ] `TS-270`以只读方式逐个复核`../TapCanvas`的 Hono模块处置矩阵、路由、前端调用、表、任务、配置和测试。
- [ ] `TS-271`确认 auth、user、user-admin和 team已由 LinaPro替代且目标调用为 0。
- [ ] `TS-272`确认 project、project-admin、chapter和 flow已由插件唯一承载。
- [ ] `TS-273`确认 asset、material、storyboard、draft和 memory已由插件唯一承载。
- [ ] `TS-274`确认 execution和 task已由插件任务与 Worker唯一承载。
- [ ] `TS-275`确认 agents和 apiKey已由 Agent run、短期 token和`agents-cli`承载。
- [ ] `TS-276`确认 ai、model、model-catalog、new-api-models和 dreamina已由`linapro-ai-core`替代。
- [ ] `TS-277`拆分 observability和 stats；平台指标复用 LinaPro，业务指标使用有界聚合。
- [ ] `TS-278`确认 billing、commerce、product、order和 wechat-pay调用方已从创作主链删除并记录后续工作流。
- [ ] `TS-279`确认 internal、Nest/Hono壳、Prisma和运行时建表不进入目标产品。
- [ ] `TS-280`对每个领域保存新 owner、验证证据和旧调用删除结论。
- [ ] `TS-281`扫描目标生产源码、依赖和配置，确认无 Hono、Prisma、BullMQ、TapCanvas JWT、Team和`new-api`运行依赖；只读来源路径和迁移记录文字不计运行依赖。
- [ ] `TS-282`确认目标 CI、Docker、配置和运行文档不启动 Hono或`new-api`，且未修改或删除`../TapCanvas`。
- [ ] `TS-283`运行全量前端、插件 Go、数据库和领域 E2E回归。

阶段验收：Hono处置矩阵全部关闭，目标产品只包含 LinaPro宿主、TapCanvas插件、`linapro-ai-core`、`agents-cli`和第三方模型服务。

## 阶段十一：工具链、构建和硬切换

- [ ] `TS-290`把 TapCanvas前端类型、lint、单测和构建纳入现有 linactl入口。
- [ ] `TS-291`把插件 Go生成、测试、lint和 SQL检查纳入插件自身和根工具链。
- [ ] `TS-292`更新源码插件 registry、chunk策略和依赖扫描测试。
- [ ] `TS-293`更新宿主 E2E manifest和插件自有 POM，保留连续`TC{NNN}`编号。
- [ ] `TS-294`更新 CI前端单测、Go测试、插件构建、E2E和 host-only smoke。
- [ ] `TS-295`更新 Windows、Linux和 macOS等价开发、构建、测试和服务入口。
- [ ] `TS-296`不得新增 shell业务工具；复杂入口使用 Go或 Node。
- [ ] `TS-297`构建 host-only、plugin-full和动态插件组合，确保 builtin依赖顺序稳定。
- [ ] `TS-298`验证最终 packed资源包含 TapCanvas懒加载 chunk和必要静态资产。
- [ ] `TS-299`验证首屏不预加载 TapCanvas重型 chunk。
- [ ] `TS-300`使用 OrbStack启动最终二进制和 PostgreSQL，验证`/admin`、插件 API、AI和 Agent链。
- [ ] `TS-301`验证没有 Vue/React、Hono/Go、旧 Flow/new mutation或旧模型/新模型双轨开关。
- [ ] `TS-302`记录硬切换回退点；回退恢复整个阶段版本，不保留运行时兼容分支。

阶段验收：默认开发、构建、测试和运行入口交付单一路径的 LinaPro + TapCanvas插件产品。

## 阶段十二：全量验收

- [ ] `TS-310`运行`apps/lina-web`typecheck、lint、unit和 build。
- [ ] `TS-311`运行插件全部 Go测试、API contract、启动绑定和数据库集成测试。
- [ ] `TS-312`运行`make lint`、`make i18n.check`和仓库治理检查。
- [ ] `TS-313`运行 SQL两次初始化、DAO生成一致性和卸载边界检查。
- [ ] `TS-314`运行项目、章节、Flow、资产、任务和 Agent完整 E2E。
- [ ] `TS-315`运行跨 Tenant、impersonation、仅本人、不可见资源和聚合不泄露 E2E。
- [ ] `TS-316`运行 Flow幂等、冲突、并发和 Agent/用户统一 mutation测试。
- [ ] `TS-317`运行 Worker崩溃恢复、超时、取消、重试和资产保留测试。
- [ ] `TS-318`运行 Agent token安全、trace脱敏和 delivery verification测试。
- [ ] `TS-319`运行`linapro-ai-core`、`agents-cli`和第三方模型服务故障边界测试。
- [ ] `TS-320`运行 1,000节点、2,000边大画布基线并比较迁移前结果。
- [ ] `TS-321`捕获项目入口、workspace、节点面板、资产、任务、Agent、冲突和错误截图。
- [ ] `TS-322`在中文、英文、暗色、亮色、1366px、大屏和移动视口执行视觉审查。
- [ ] `TS-323`确认无 raw i18n key、截断、重叠、空白页、错误反馈缺失和宿主样式污染。
- [ ] `TS-324`运行 dependency graph，确认 React 19单例且无 Vue、Ant Design React或旧 TapCanvas运行时依赖。
- [ ] `TS-325`运行静态扫描，确认 Hono处置矩阵和剔除清单全部为 0残留。
- [ ] `TS-326`运行等价全面代码审查，修复所有严重问题和警告。
- [ ] `TS-327`保存命令、退出码、失败修复、查询次数、包图、截图和剩余风险。

阶段验收：功能、安全、数据权限、一致性、性能、故障、跨平台和视觉门禁全部通过。

## 阶段十三：文档和交付

- [ ] `TS-330`更新根 README和中文镜像的 TapCanvas插件架构、命令和依赖。
- [ ] `TS-331`创建插件 README和中文镜像，记录目录、API、Flow、AI和 Agent边界。
- [ ] `TS-332`记录项目、Flow、资产、任务和 Agent数据模型及软删除策略。
- [ ] `TS-333`记录`FlowMutation v1`操作、幂等、冲突、大小上限和错误语义。
- [ ] `TS-334`记录短期能力令牌、工具 allowlist、过期、撤销和日志脱敏。
- [ ] `TS-335`记录 Hono模块最终 owner和目标产品不部署 Hono的结论。
- [ ] `TS-336`记录第三方模型服务配置属于`linapro-ai-core`和`agents-cli`，不提供`new-api`。
- [ ] `TS-337`记录 i18n、数据权限、缓存、数据库、DI、性能和跨平台影响。
- [ ] `TS-338`同步所有阶段执行记录和最终验证证据。
- [ ] `TS-339`运行 Markdown、链接、路径、任务 ID、占位词和中英文镜像检查。
- [ ] `TS-340`核对 Git工作区和索引，确认全部交付文件由`lina-tapcanvas`父仓直接跟踪。
- [ ] `TS-341`记录原子提交候选和阶段回退点；未获授权时不 commit、push、PR、tag或发布。

阶段验收：实现、设计、Tasklist、执行记录、双语说明和交付边界完整可追溯。

## 最终完成定义

- [ ] `TSDONE-001``linapro-tapcanvas-studio`是 builtin、tenant-aware源码插件。
- [ ] `TSDONE-002`TapCanvas工作区运行在 LinaPro React 19宿主并共享单一 React实例。
- [ ] `TSDONE-003`TapCanvas没有自有认证、用户、Team、成员、邀请、权限或商业底座。
- [ ] `TSDONE-004`所有业务数据按 LinaPro Tenant和数据权限隔离。
- [ ] `TSDONE-005`项目、章节、Flow、资产、素材、分镜、Memory、任务和 Agent业务闭环在插件。
- [ ] `TSDONE-006`用户和 Agent写入 Flow都使用`FlowMutation v1`。
- [ ] `TSDONE-007`Flow revision、幂等、冲突和并发验证通过。
- [ ] `TSDONE-008`生成任务可恢复、可取消、可重试，且不丢弃成功资产。
- [ ] `TSDONE-009`直接生成只通过`linapro-ai-core`调用第三方模型服务。
- [ ] `TSDONE-010``agents-cli`使用独立服务凭证、可轮换短期能力令牌和幂等 tool call调用 TapCanvas工具。
- [ ] `TSDONE-011`浏览器和`agents-cli`都不获得 LinaPro Token或第三方模型密钥。
- [ ] `TSDONE-012`目标产品没有 Hono、Prisma、BullMQ、TapCanvas JWT、Team或`new-api`运行依赖。
- [ ] `TSDONE-013`宿主首屏不包含 TapCanvas重型页面和媒体依赖。
- [ ] `TSDONE-014`中英文、权限、Tenant切换、impersonation和模块故障行为通过 E2E。
- [ ] `TSDONE-015`大画布热路径没有逐帧网络、持久化或全量序列化。
- [ ] `TSDONE-016`所有列表和聚合没有前端瀑布或后端`N+1`。
- [ ] `TSDONE-017`React、Go、SQL、lint、i18n、E2E、构建、OrbStack smoke和视觉审查全部通过。
- [ ] `TSDONE-018`所有完成项都有当前工作区验证证据，不依赖历史口头结论，且 Agent事件与工具结果可在重启后恢复。
- [ ] `TSDONE-019`所有交付文件由父仓直接跟踪，无嵌套 Git或仅本机文件。
- [ ] `TSDONE-020`未经用户授权，没有执行 commit、push、PR、tag、镜像发布或环境发布。
