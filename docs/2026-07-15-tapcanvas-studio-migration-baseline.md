# TapCanvas Studio 迁移基线

## 结论

本基线把来源仓`../TapCanvas`的 React 画布、30个 Hono模块、前端耦合点和性能证据固定在提交`680b0243cd8bb7e5a8926d49eadd942dbc0151f4`。目标读者是后续执行`TS-020`至`TS-299`的开发者。本文只记录迁移输入和处置，不授权修改来源仓，也不把 Hono、Prisma、BullMQ、TapCanvas认证、Team或`new-api`带入目标产品。

## 来源完整性

| 项目 | 结果 |
| --- | --- |
| 来源仓 | `../TapCanvas` |
| 来源提交 | `680b0243cd8bb7e5a8926d49eadd942dbc0151f4` |
| 来源工作区 | `.gitignore`有修改，`docs/TAPCANVAS_ARCHITECTURE_ANALYSIS.md`未跟踪 |
| 本次读取路径 | `apps/web`、`apps/hono-api`和根 lockfile相关文件 |
| 路径一致性 | 来源工作区已有变更不位于本次读取的 Web或 Hono路径，二者内容对应上述提交 |
| 写入边界 | 未修改、删除或安装依赖到来源仓 |

## React Web 基线

### 规模

| 指标 | 结果 | 口径 |
| --- | --- | --- |
| `apps/web`全部文件 | `369` | 排除`node_modules`和`dist` |
| `apps/web`全部 TS/TSX | `339`个、`122,307`行 | 包含测试与配置 |
| `apps/web/src`源码文件 | `305` | 迁移机械复制的主要输入 |
| `apps/web/src` TS/TSX | `290`个、`118,174`行 | 生产源码口径 |
| Web单元测试 | `44`个文件、`157`个显式`it/test`声明 | 静态扫描口径 |
| 最近一次已记录测试结果 | `215/215 passed` | 冻结审查前历史结果；本次未在只读来源仓安装依赖重跑 |

最大生产文件如下。迁移阶段不得把这些文件直接视为已完成模块，必须先拆入口和依赖闭包。

| 文件 | 行数 |
| --- | ---: |
| `src/canvas/nodes/TaskNode.tsx` | `8,675` |
| `src/api/server.ts` | `6,669` |
| `src/projects/ProjectChapterWorkbenchPage.tsx` | `6,405` |
| `src/runner/remoteRunner.ts` | `5,475` |
| `src/ui/AssetPanel.tsx` | `4,123` |
| `src/canvas/Canvas.tsx` | `4,004` |

### 依赖锁定

下表来自`apps/web/pnpm-lock.yaml`的实际解析版本，不使用`package.json`范围代替锁定值。

| 依赖 | 来源锁定版本 | 目标处置 |
| --- | --- | --- |
| React / ReactDOM | `18.3.1` | 不复制；统一解析宿主`19.2.7`单例 |
| Mantine Core/Hooks/Modals/Notifications | `7.17.8` | 仅保留在 Studio隔离根内 |
| React Flow | `12.10.2` | 迁入 Studio懒加载块 |
| Tabler Icons | `3.41.1` | Studio工作区保留，管理页不使用 |
| WebAV | `1.2.8` | 重型功能显式懒加载 |
| Framer Motion | `12.38.0` | 按真实 import闭包保留 |
| Three | `0.183.2` | 重型功能显式懒加载 |
| Zod | `3.25.76` | 按前端协议验证需求保留 |
| Zustand | `4.5.7` | 迁移后统一解析宿主`5.0.14` |
| React Router DOM | `7.14.1` | 删除独立 Router owner，使用宿主路由 |
| React Hook Form | `7.72.1` | 按真实表单闭包决定是否保留 |

来源 Web没有可复用的大画布性能测试；其 Playwright只有应用壳 smoke。单元测试配置还直接 alias到 Hono协议源码，不能原样作为目标测试入口。

## Hono 模块盘点

### 盘点口径

- 模块目录：`apps/hono-api/src/modules/*`，共`30`个。
- 生产源码：`254`个 TypeScript文件，约`84,138`行；模块目录含测试总计`99,138`行。
- 测试：`45`个测试文件、`254`个显式`it/test`声明。
- 路由：以`src/app.ts`中的挂载根和模块路由文件为准；`storyboard`、`observability`和`user`没有独立挂载根。
- 表：按`prisma/schema.prisma`模型名与模块生产源码引用交叉扫描。共享模型会出现在多个模块，不能据此推断目标表归属。
- 调用方：以`apps/web/src/api/server.ts`为集中调用面，同时记录绕过集中 client的直接调用或协议 alias。

### 逐模块输入

| 模块 | 路由与前端调用 | 数据、后台任务与配置 | 测试 |
| --- | --- | --- | ---: |
| `agents` | `/agents`、`/admin/agents`；`api/server.ts`和技能、诊断管理页 | `agent_pipeline_runs`、`agent_skills`及项目上下文；Agent治理、轮询超时和 storyboard重试环境变量 | `5` |
| `ai` | `/ai`、`/admin/ai`；`api/server.ts`、tool events和 Chat编排 | `llm_node_presets`、`prompt_samples`、Flow/资产投影；无独立 Worker | `0` |
| `apiKey` | `/api-keys`、`/public`；集中 client、401拦截器和公开 API调试页 | `api_keys`、模型/供应商、任务和 vendor日志；`PUBLIC_VENDOR_ROUTING` | `6` |
| `asset` | `/assets`；集中 client、资产面板、视频编辑和 Chat引用 | `assets`、项目、章节、任务；书籍上传/重确认内存队列、轮询、RustFS/S3与本地目录 | `5` |
| `auth` | `/auth`；`GithubGate`、`auth/store`及22个源码调用点 | `users`、email/phone验证码；Redis OTP、GitHub、guest和密码登录 | `2` |
| `billing` | `/billing`；集中 client | `model_credit_cost_specs`、`model_credit_costs`；积分汇率配置 | `0` |
| `chapter` | `/chapters`；集中 client和路由工具 | `chapters`；章节、工作台和镜头 CRUD | `1` |
| `commerce` | `/commerce`；集中 client和旧 Stats入口 | 字典、详情页样本/反馈、积分、订阅和权益表；OpenClaw配置 | `1` |
| `draft` | `/drafts`；集中 client | `video_generation_histories`建议和 used标记；无 Worker | `0` |
| `dreamina` | `/dreamina`；集中 client | 账号和项目绑定，读取项目/资产/用户；`DREAMINA_CLI_PATH` | `0` |
| `execution` | `/executions`；集中 client和执行日志弹窗 | `flow_versions`、workflow execution/event/node run；队列、Worker和调度 | `0` |
| `flow` | `/flows`；App、Canvas、Runner、Inspector和 Chat共9个调用面 | `flows`、`flow_versions`、项目和资产；普通保存与公开 patch均写 Flow和版本 | `1` |
| `internal` | `/internal`；无 Web调用 | credit finalizer和 prompt evolution内部任务；`INTERNAL_WORKER_TOKEN` | `0` |
| `material` | `/materials`；集中 client | 资产、版本和镜头引用；项目影响分析 | `0` |
| `memory` | `/memory`；集中 client及 Memory调试页 | 资产/用户上下文、写入、搜索、Chat artifact和 trace | `1` |
| `model` | `/models`；集中 client | provider、token、endpoint、profile、proxy和 task-token mapping | `0` |
| `model-catalog` | `/model-catalog`；集中 client和模型目录管理页 | vendor、model、mapping和 vendor key；导入导出 | `1` |
| `new-api-models` | `/new-api-models`；没有直接 Web调用 | 第三方模型目录代理；`NEW_API_INTERNAL_BASE_URL`和`NEW_API_INTERNAL_TOKEN` | `0` |
| `observability` | 无独立路由；request trace中间件使用 | `api_request_logs`投影；无模块级配置 | `0` |
| `order` | `/orders`；集中 client | order、item、status event、product和 SKU | `0` |
| `product` | `/products`；集中 client | merchant、product、SKU、image和 entitlement | `0` |
| `project` | `/projects`；App、集中 client、资产和项目页 | project、chapter、flow、asset、任务和 Agent摘要投影 | `3` |
| `project-admin` | `/admin/projects`；集中 client | 项目、用户、Flow和资产管理投影 | `0` |
| `stats` | `/stats`；App、集中 client和旧 Stats入口 | DAU、order、vendor调用和 prompt evolution统计 | `0` |
| `storyboard` | 无独立路由；被 asset、task、agents和 Web协议 alias调用 | storyboard结构与选择协议，复用项目和资产 | `2` |
| `task` | `/tasks`及 Agent工具桥；集中 client、进度流和系统调试页 | task/status/result、vendor ref/log、模型、Team credit；Worker、Agent桥、超时和 API key配置 | `15` |
| `team` | `/teams`；集中 client | team、membership、invite和 credit ledger；任务积分关联 | `1` |
| `user` | 无独立路由；被认证和商业 owner解析使用 | `users`；`COMMERCE_PLATFORM_OWNER_ID` | `1` |
| `user-admin` | `/admin/users`；集中 client | user、team membership和 team credit管理 | `0` |
| `wechat-pay` | `/wechat-pay`；集中 client | order、payment和 callback；商户证书配置与对账恢复 | `0` |

### Hono 处置矩阵

| 模块 | 目标 owner | 处置与切换证据 |
| --- | --- | --- |
| `auth` | LinaPro | 删除实现和调用；以宿主用户投影、登录和 Token为唯一身份边界 |
| `user` | LinaPro | 删除实现；用户显示只读`PluginHostUserProjection` |
| `user-admin` | LinaPro | 删除实现和页面；复用 LinaPro用户管理 |
| `team` | LinaPro Tenant | 删除 Team、成员、邀请和积分；所有业务表使用`tenant_id` |
| `project` | TapCanvas插件 | 阶段四迁为 Go API/service |
| `project-admin` | TapCanvas插件 | 合并到插件项目治理，不复制旧管理员底座 |
| `chapter` | TapCanvas插件 | 阶段四与项目垂直切片迁移 |
| `flow` | TapCanvas插件 | 阶段五迁为`FlowMutation v1`；删除旧全量 patch和非事务双写 |
| `asset` | TapCanvas插件 | 阶段六迁资产、书籍和受治理存储，不复制内存队列 |
| `material` | TapCanvas插件 | 阶段六迁素材版本与镜头引用 |
| `storyboard` | TapCanvas插件 | 阶段六迁分镜镜头和选择协议到插件稳定目录 |
| `draft` | TapCanvas插件 Memory | 合并为受控 Memory建议和使用记录，不保留独立 owner |
| `memory` | TapCanvas插件 | 阶段六迁业务 Memory |
| `execution` | TapCanvas插件 | 阶段七迁 PostgreSQL任务、attempt、租约和 Worker |
| `task` | TapCanvas插件 | 阶段七至九迁生成任务和工具调用，不复制 BullMQ路径 |
| `agents` | TapCanvas插件与`agents-cli` | 阶段十迁 Agent run、事件、短期 token和工具治理 |
| `apiKey` | TapCanvas插件与`agents-cli` | 删除公开长期 API key模型；以5分钟 scoped opaque token替代工具回调认证 |
| `ai` | `linapro-ai-core` | 使用类型化`aicap`，删除旧 Hono AI路由 |
| `model` | `linapro-ai-core` | 供应商、模型和凭证由 AI Core治理 |
| `model-catalog` | `linapro-ai-core` | 目录与能力映射由 AI Core投影替代 |
| `new-api-models` | 第三方模型服务与`linapro-ai-core` | 不实现`new-api`；删除内部代理和密钥配置 |
| `dreamina` | `linapro-ai-core`或后续 provider插件 | 当前不迁 CLI账号管理；模型调用只经`aicap` |
| `observability` | LinaPro与 TapCanvas插件 | 平台观测复用宿主；仅保留有界业务指标 |
| `stats` | LinaPro与 TapCanvas插件 | 删除旧平台管理壳；按业务权限提供有界聚合 |
| `billing` | 后续商业插件 | 当前删除调用方，不进入创作主链 |
| `commerce` | 后续商业插件 | 当前删除调用方和 OpenClaw商业授权逻辑 |
| `product` | 后续商业插件 | 当前删除调用方 |
| `order` | 后续商业插件 | 当前删除调用方 |
| `wechat-pay` | 后续商业插件 | 当前删除调用方、证书配置和回调 |
| `internal` | 无 | 调用方清零后删除，不建立兼容代理 |

## 前端耦合点

| 耦合域 | 当前事实 | 目标门禁 |
| --- | --- | --- |
| 认证 | `GithubGate`、`auth/store.ts`、`tap_token`Cookie/localStorage、独立401拦截器；`server.ts`和多个 Canvas/Runner组件读取旧 token | 全部删除，只读取`useLinaPluginHost()`的 user、tenant、permissions和 API |
| Team | `server.ts`集中暴露 Team、成员、邀请、充值和 ledger；任务仍读取 team credit | 删除 Team前端模型和调用；Tenant切换卸载旧状态 |
| 商业 | `server.ts`含 billing、commerce、product、order、wechat-pay和 OpenClaw DTO/API，旧 Stats页面直接消费 | 创作主链调用清零；后续独立商业插件另行设计 |
| Hono源码 alias | Vite和 TSConfig直接 alias `canvasPlanProtocol.ts`、`flow.anchor-bindings.ts`、`storyboardSelectionProtocol.ts` | 协议移入插件前端稳定目录，目标构建不得读取`../TapCanvas/apps/hono-api` |
| Flow双写 | Hono先写`flows`再写`flow_versions`，未处于同一事务；普通保存、public patch、Agent工具和执行路径各自重复该序列 | 所有写入统一进入事务化`FlowMutation v1`，以 tenant-aware idempotency和 revision校验收敛 |
| 本地 Flow状态 | `canvas/store.ts`仍暴露`tapcanvas-flow`localStorage持久化；App另有服务端自动保存 | 删除非必要持久化；保留项必须包含 LinaPro user和 tenant |
| 模型目录 | Web管理页和`server.ts`直接消费`/models`、`/model-catalog`、`/new-api-models`；任务桥读取 vendor/model表 | 管理面复用 AI Core；Studio只消费`aicap`和最小能力投影 |
| 独立应用壳 | `main.tsx`创建 React root、Router、Mantine Provider和全局 Notifications | 删除 root和 Router；浮层挂到 Studio内部 portal root |

## 大画布性能基线

### 当前可证明范围

| 场景 | `1,000`节点/`2,000`边结果 | 当前真实已测上限 | 延迟证据 |
| --- | --- | --- | --- |
| 初次加载 | 未测 | `0`个大画布样本 | 无 |
| 单节点拖动 | 未测 | `0`个大画布样本 | 无 |
| 框选 | 未测 | `0`个大画布样本 | 无 |
| 保存 | 未测 | `0`个大画布样本 | 无 |

这里的`0`表示“现有自动化性能样本为0”，不表示产品只能承载0个节点。源码中没有性能 fixture、benchmark或包含`1,000`节点和`2,000`边的 E2E；现有 Playwright只验证应用壳。来源仓没有`node_modules`，OrbStack也没有 TapCanvas服务。为保持`../TapCanvas`只读，本阶段没有安装依赖、写入环境配置或启动来源服务，因此不能伪造毫秒数。

### 后续冻结方法

阶段二复制源码并接入宿主后，必须用同一确定性 fixture测量以下指标，测试资产和截图放在目标仓`temp/20260715/`或执行日目录，不回写来源仓：

1. 从路由开始到 React Flow首个稳定帧的加载时间。
2. 拖动期间每帧网络请求数、全量序列化次数和持久化次数，目标均为`0`。
3. 框选`100`、`500`和`1,000`个节点的交互时间与长任务数量。
4. drag stop合并为一个`node.moveBatch`的耗时和请求体大小。
5. `1,000`节点、`2,000`边快照加载和保存的 P50/P95，以及失败时的真实上限。

在上述测量完成前，设计中的`1,000`节点、`2,000`边是验收规模，不是已经通过的性能结论。

## 迁移门禁

- 来源提交、规模、依赖和测试口径变更时，先追加基线差异，不静默覆盖本文。
- 每个 Hono领域切换前，必须重新扫描路由、调用方、表、任务、配置和测试；本文是起点，不替代切换时证据。
- 目标产品不得启动 Hono兼容代理，不得复制 Prisma、BullMQ、TapCanvas JWT、Team和`new-api`运行路径。
- 同一资源只能有一个写入 owner；Flow写入统一进入`FlowMutation v1`。
- 性能数值只能来自可复现的目标工作区命令和 fixture，不能从代码规模或主观体验推导。
