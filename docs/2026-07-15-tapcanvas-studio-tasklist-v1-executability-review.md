# TapCanvas Studio Tasklist v1.0 执行性审查

## 结论

`docs/2026-07-15-tapcanvas-studio-migration-tasklist.md`已完成代码库对照审查并冻结为`v1.0`。审查把原 286 项草案修订为 302 项可追踪任务，关闭了 builtin依赖顺序、插件目录违规、阶段倒置、缺失数据模型、Go生成门禁、Agent长任务安全、Mantine portal隔离和 Hono来源删除歧义等问题。修订后没有阻塞阶段一执行的文档问题。

本次只修改授权边界和文档，没有创建插件生产代码、修改数据库、运行发布操作或改动`../TapCanvas`。React工作台当前验证基线仍是单测`215/215`、宿主 E2E`105/105`、插件 E2E`309 passed / 7 skipped / 0 failed`、14 个 Go模块 lint 0 issues、host-only与 plugin-full构建通过、视觉审查`4/4`。

## 审查范围

| 项目 | 事实 |
| --- | --- |
| 产品仓库 | `/Volumes/c/Workspace/TapCanvas_remix/lina-tapcanvas` |
| 产品基线 | `7d149838e77fe3d2b1bdda5ebb9d46679f79fd23` |
| 当前分支 | `feat/react-workbench-replacement` |
| 只读来源仓库 | `/Volumes/c/Workspace/TapCanvas_remix/TapCanvas` |
| 来源基线 | `680b0243cd8bb7e5a8926d49eadd942dbc0151f4` |
| 主审查文件 | `docs/2026-07-15-tapcanvas-studio-migration-tasklist.md` |
| 详细设计 | `docs/2026-07-15-tapcanvas-studio-plugin-design.md` |
| 上层架构 | `docs/2026-07-11-tapcanvas-react-platform-migration-design.md` |

事实源包括`apps/lina-web`、`apps/lina-core`、`apps/lina-plugins`、`hack`、`.github/workflows`和只读来源仓的`apps/web`、`apps/hono-api`及 lockfile。本项目不使用 OpenSpec，也不引入 GSD`.planning`体系。

## 代码库基线

| 检查项 | 结果 |
| --- | --- |
| TapCanvas Web源码 | 305 个文件 |
| TypeScript/TSX | 290 个文件、118,174 行 |
| 最大前端文件 | `TaskNode.tsx` 8,675 行；`server.ts` 6,669 行；`remoteRunner.ts` 5,475 行；`Canvas.tsx` 4,004 行 |
| Hono业务模块 | 30 个 |
| 目标工作台 | `apps/lina-web`，React/ReactDOM`19.2.7`、Zustand`5.0.14` |
| AI Core当前清单 | `distribution: managed`、`version: v0.1.0` |
| builtin启动顺序 | builtin先于`plugin.autoEnable`收敛；builtin之间按硬依赖排序 |
| 插件本地规则 | 当前`apps/lina-plugins/*/AGENTS.md`为 0 |

来源 lockfile确认 Mantine`7.17.8`支持 React 19，React Flow`12.10.2`支持 React 17及以上；Tabler Icons`3.41.1`、WebAV`1.2.8`、Framer Motion`12.38.0`、Three`0.183.2`和 Zod`3.25.76`均存在。来源应用自己的 React`18.3.1`和 Zustand`4.5.7`不进入目标依赖。

## 已修复的阻塞问题

1. 设计把 Worker放到`backend/internal/worker/`，违反插件业务逻辑必须收敛到`backend/internal/service/`的规则。现改为`service/generation`和`service/agent`。
2. Studio计划为 builtin，但硬依赖的`linapro-ai-core`当前为 managed；干净数据库会先安装 Studio、后执行 AI Core的`plugin.autoEnable`，启动必然失败。现要求 AI Core同步改为 builtin、删除重复 autoEnable配置，并验证依赖排序。
3. 原阶段先完成媒体画布，后实现资产和生成 API，无法形成真实垂直切片。现固定为`Flow → 资产/素材/分镜/Memory → 生成任务 → 完整画布 → Agents Bridge`。
4. 原数据模型没有素材版本、分镜镜头、镜头素材引用、Agent事件和 tool call表，API也缺少对应资源。现补齐表、索引、软删除边界和 REST资源。
5. 原 Flow幂等查询和 revision索引遗漏 Tenant，且没有规定同一 mutation ID复用不同请求的行为。现使用 Tenant完整键并保存请求摘要，摘要冲突显式拒绝。
6. 原 Go阶段没有完整要求`make ctrl`，部分阶段把 SQL和手写实现直接串联。现统一为 API DTO后生成 Controller骨架、SQL两次初始化后生成 DAO/DO/Entity。
7. 原 5 分钟 Agent token没有长任务轮换，所谓“重放测试”也没有稳定幂等键。现增加仅服务凭证可调用的 scope不扩张轮换、`toolCallId`请求摘要和结果复用协议。
8. 原 Agent事件只有口头描述，没有持久真源和恢复方式。现使用 PostgreSQL有序 event，并以`afterSequence + limit`有界轮询；重启或节点切换可恢复。
9. 原设计可能被理解为删除`../TapCanvas/apps/hono-api`。现明确来源仓只读，目标产品不复制或启动 Hono；任何来源删除都不在授权范围。
10. 原`.contributing`只授权 React工作台替换。现补充 TapCanvas Studio范围、允许的 AI Core/工作台/工具变更和来源仓只读边界。

## 已修复的警告

- Mantine变量虽然计划 scoped，但浮层默认 portal仍可能逃逸到`document.body`。现增加 Studio专用 portal root任务。
- 原依赖只写包名，没有冻结已验证版本和 React 19边界。现记录来源 lockfile版本与宿主唯一版本。
- 原数据库任务没有冻结单迭代单 SQL和卸载反序。现固定安装`001`至`005`、卸载`995`至`999`。
- 原`draft`、storyboard render job和时间线 owner不清晰。现把 Draft归入 Memory、render job归入生成任务、时间线定义为受控投影。
- 原执行记录只在任务中口头要求。现创建`docs/2026-07-15-tapcanvas-studio-execution-record-template.md`。
- 原插件前端 client写成无参数`host.api.plugin()`。现固定真实签名和`pluginBlob`边界。

## 依赖与阶段结论

| 阶段 | 前置门禁 | 主要产物 |
| --- | --- | --- |
| 一 | Tasklist冻结 | AI Core与 Studio builtin骨架、依赖顺序 |
| 二至三 | 插件最小装配 | React迁移输入、宿主嵌入、底座剔除 |
| 四至五 | 身份和 Tenant边界稳定 | 项目、章节、FlowMutation |
| 六 | Flow可写 | 资产、素材版本、分镜、Memory |
| 七 | 资产与 Flow可用 | 可恢复生成任务和 AI Core调用 |
| 八 | 资产与生成 API可用 | 完整无限画布 |
| 九 | Flow、资产、生成闭环 | Agents Bridge和短期能力令牌 |
| 十至十三 | 所有领域 owner已切换 | Hono清零、工具链、全量验收和交付记录 |

阶段顺序不存在循环依赖。不同领域可以依次切换，但目标产品的同一资源不得双写，也不得以 Hono兼容代理填补未完成阶段。

## 规则域结论

| 规则域 | 结论 |
| --- | --- |
| 架构 | 通过；TapCanvas业务闭环在 builtin插件，`lina-core`不感知画布领域 |
| 插件 | 通过；React UI使用稳定导入面，Go业务收敛在`internal/service`，跨插件只用`aicap`公开契约 |
| 前端 | 通过；宿主管理页继续 Semi，Studio允许隔离 Mantine，React 19保持单例 |
| API | 通过；REST资源、Unix毫秒、权限、错误、幂等和 conflict边界均有任务 |
| Go与 DI | 通过；`make ctrl`、`make dao`、显式依赖和启动错误门禁完整 |
| 数据库 | 通过；软删除、审计保留、Tenant索引、单迭代 SQL和反序卸载已冻结 |
| 数据权限 | 通过；列表、详情、批量、聚合、祖先可见性和 impersonation均覆盖 |
| 缓存与集群 | 通过；PostgreSQL为真源，Flow不缓存，任务租约和 Agent事件可恢复 |
| i18n | 通过；`en-US`为源与默认，`zh-CN`为第二语言，菜单、错误、字典和 apidoc均覆盖 |
| 开发工具 | 通过；要求复用 linactl、Go或 Node跨平台入口，不新增 shell业务工具 |
| 测试 | 通过；单元、集成、E2E、OrbStack、恢复、安全、性能和视觉门禁形成闭包 |

## 静态验证证据

- Tasklist共有 302 个合法 checkbox ID，其中 282 个`TS-*`任务和 20 个`TSDONE-*`定义；ID无重复。
- 执行边界`TS-001`至`TS-015`已经完成，当前为 15 项完成、287 项待执行。
- 设计、Tasklist和执行记录模板无尾随空格或未决占位标记。
- Markdown代码围栏成对；反引号检查只命中合法围栏行。
- 设计和 Tasklist引用的现有架构、规则、工作台、AI Core、来源 Web、Hono和 lockfile路径均存在。
- `git diff --check`对本次授权与文档范围通过。
- 本次没有修改前端、Go、SQL或运行配置，因此没有用文档检查替代应运行的代码测试；运行门禁从阶段一实际变更开始执行。

## 剩余外部门禁

1. `RW-279`仍要求正式父仓版本历史。当前没有 commit授权，不能把索引或文档冻结表述为已提交历史。
2. 产品仓库没有实际`origin`；本地迁移和验证不受影响，后续 push或 PR需要用户指定目标仓库。
3. 删除任何意外复制进目标仓的 Hono运行目录仍需单独确认；`../TapCanvas`始终不在删除范围。

上述门禁不阻塞阶段一的本地实现。未经用户授权，不执行 commit、push、PR、tag、镜像发布或环境发布。
