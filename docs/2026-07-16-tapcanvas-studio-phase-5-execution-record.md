# TapCanvas Studio 阶段五执行记录

## 结论

阶段五当前状态为`In Progress`。本阶段把 Flow 当前快照、revision、幂等 mutation 日志和受控版本保存点迁入 Go 插件，并把用户画布与后续 Agent 写入统一到`FlowMutation v1`。当前代码对照确认：复制画布仍以 Tenant 隔离后的`localStorage`作为主保存路径，模板 Flow 仍存在旧 Hono 调用，因此这些路径必须在本阶段硬切换，不能只新增后端表或保留双写。

## 阶段信息

| 字段 | 值 |
| --- | --- |
| 阶段 | 阶段五：Flow 数据模型和`FlowMutation v1` |
| Tasklist 版本 | `v1.1`，`Frozen` |
| 任务范围 | `TS-110～TS-141` |
| 状态 | `In Progress` |
| 执行日期 | `2026-07-16` |
| 执行分支 | `feat/react-workbench-replacement` |
| 来源基线 | 父仓库当前工作区；阶段四状态为`Passed` |
| 提交授权 | 未授权；不得执行 commit、push、PR、tag 或发布 |

## 范围与边界

- 修改范围：`apps/lina-plugins/linapro-tapcanvas-studio/`、本阶段执行记录和验收后的冻结 Tasklist 状态。
- 只读来源：`../TapCanvas`仅用于对照原 Flow、版本和 Agent patch 路径，不写入任何文件。
- 禁止范围：不修改`apps/lina-core/`、`hack/`、LinaPro认证、Tenant、RBAC和数据权限语义；不回退 Hono；不手写或修改生成的 DAO、DO、Entity和 Controller骨架。
- 前置门禁：`TS-001～TS-109`已经通过；项目和章节以 LinaPro Tenant和角色数据范围为唯一边界。

## 冻结契约

### 数据模型

| 资源 | 权威内容 | 关键约束 |
| --- | --- | --- |
| Flow | 当前快照、revision、名称、项目和所有者投影 | PostgreSQL唯一真源；软删除；快照不进入缓存 |
| Mutation | mutation ID、请求摘要、base/result revision、actor和 operations | 不软删除；唯一`(tenant_id, flow_id, mutation_id)`和`(tenant_id, flow_id, result_revision)` |
| Version | 指定 revision的受控快照保存点和名称 | 不软删除；唯一`(tenant_id, flow_id, revision)`；列表最大 100 |

Flow 创建只建立空快照和`revision=0`。所有图数据变化，包括初始导入、用户编辑、生成结果和 Agent patch，统一调用同一个 mutation service；Flow 元数据更新接口只允许修改名称和描述，不得绕过 mutation 更新图。

### `FlowMutation v1`

固定操作集合为`node.add`、`node.update`、`node.delete`、`node.moveBatch`、`edge.add`、`edge.update`、`edge.delete`、`group.update`和`flow.metadata.update`。服务端拒绝未知 operation字段、未知 patch字段、任意 JSON Patch path、脚本、表达式、客户端 actor和审计字段覆盖。

单次 mutation最多 200 个 operations，规范化请求最大 1 MiB，结果快照默认最大 20 MiB。节点 ID、边 ID、group父子关系、边端点、handle和资产引用结构必须在写入前验证；任何无效引用整体拒绝，不产生部分 revision。

### 写入与一致性

1. service先以当前 Tenant和角色数据范围验证 Flow及祖先项目可见。
2. 事务内按`tenant_id + flow_id`锁定 Flow行。
3. 先查询幂等键；相同摘要返回原 revision，不同摘要返回幂等键冲突。
4. 校验`baseRevision`；不一致返回包含`currentRevision`的结构化业务错误。
5. 在内存一次应用有界 operations，写入新快照并把 revision增加 1。
6. 同一事务写入 mutation审计日志；事务失败时两者一起回滚。
7. 事务提交后把精确 revision写入宿主注入的共享插件缓存命名空间，作为跨实例 revision通知；缓存失败返回可重试错误，幂等重试不得重复应用 mutation。

缓存只保存短期 revision通知，不保存 Flow快照，也不参与可见性或冲突判断。通知缺失、过期或后端不可用时，重新读取 PostgreSQL revision恢复。

### actor与调用入口

- 用户 HTTP请求不接受`actor`、`actorId`、`tenantId`或`ownerId`字段；actor只从`bizctxcap.Service`当前用户上下文生成。
- Agent入口由同一插件内部受信 service调用，传入已验证的 Agent run ID，但 Tenant、目标 Flow可见性和 revision算法仍复用同一个 mutation核心。
- 用户与 Agent产生相同的 revision、幂等、冲突和审计语义；差异只体现在服务端写入的`actor_type`和`actor_id`。

## 任务状态

| 任务 | 状态 | 证据 |
| --- | --- | --- |
| `TS-110～TS-113` | `In Progress` | 本记录冻结数据模型、操作集合、actor和大小边界 |
| `TS-114～TS-141` | `Not Started` | 待实现和验证 |

## 变更范围

| 域 | 路径 | 变更 |
| --- | --- | --- |
| 插件后端 | `apps/lina-plugins/linapro-tapcanvas-studio/backend/` | Flow API、service、事务、校验和测试 |
| SQL | `apps/lina-plugins/linapro-tapcanvas-studio/manifest/sql/` | `002`安装 SQL和`998`卸载 SQL |
| 插件前端 | `apps/lina-plugins/linapro-tapcanvas-studio/frontend/` | Flow client、持久化协调器、冲突与版本交互 |
| i18n | `apps/lina-plugins/linapro-tapcanvas-studio/manifest/i18n/` | API文档、错误和 UI双语资源 |
| E2E | `apps/lina-plugins/linapro-tapcanvas-studio/hack/tests/` | Flow创建、保存、冲突、重放和版本验证 |
| 文档 | `docs/` | 本阶段执行记录和验收后的 Tasklist状态 |

## 命令与结果

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| 当前仅完成只读代码对照 | `0` | 确认旧`localStorage`主保存和 Hono Flow调用仍存在 |

## 失败与修复

当前无执行失败。代码对照发现的迁移缺口属于本阶段预期工作，不作为测试失败记录。

## 数据与协议门禁

- SQL幂等、软删除、自增 ID、Seed/Mock和索引结论：待实现后验证。
- DAO、DO、Entity和 Controller生成结论：待通过仓库生成命令验证，禁止手写。
- Tenant、数据权限、不可见资源和聚合不泄露结论：待 service和集成测试验证。
- API、`FlowMutation`、任务、Agent token或 tool call协议结论：本阶段只实现 Flow契约；生成任务和 Agent token不在范围内。
- 缓存、集群、事件、租约和恢复结论：快照不缓存；精确 revision通知复用宿主共享 cache；租约不涉及。

## 测试与视觉证据

| 门禁 | 结果 | 证据路径 |
| --- | --- | --- |
| 单元/集成 | `pending` | 待实现 |
| E2E | `pending` | 待实现 |
| 构建/OrbStack | `pending` | 待实现 |
| 视觉审查 | `pending` | 待实现 |

## 影响评估

| 规则域 | 结论 | 说明 |
| --- | --- | --- |
| 架构 | 有影响 | 新增插件内部 Flow权威写入协议，不污染宿主领域模型 |
| 插件 | 有影响 | Builtin源码插件内部闭环，不新增跨插件公开能力 |
| 前端 UI | 有影响 | 画布加载、保存、冲突和版本交互改为服务端权威 |
| API | 有影响 | 新增 Flow、mutation和 version REST契约 |
| Go与 DI | 有影响 | Flow service显式接收宿主 bizctx、tenant、authz、cache和数据库 |
| 数据库 | 有影响 | 新增 Flow、mutation和 version表与索引 |
| 数据权限 | 有影响 | 所有读写先验证 Tenant、角色数据范围和祖先项目可见性 |
| 缓存与集群 | 有影响 | 仅发布 revision通知；PostgreSQL保持唯一真源 |
| i18n | 有影响 | 新增英文源 API元数据、中文 apidoc、双语错误和 UI文案 |
| 开发工具与跨平台 | 无影响 | 复用现有 GoFrame生成、测试和构建入口，不修改工具链 |
| 测试 | 有影响 | 新增逻辑、数据库并发、前端和 E2E覆盖 |

## 审查结论

阶段尚未进入最终审查。实施前已重新读取`AGENTS.md`、命中的规则文件、`goframe-v2`技能、冻结 Tasklist和专项设计。

## Git与回退边界

- 父仓跟踪状态：Studio插件仍包含未跟踪交付文件；本阶段不执行 Git写入。
- commit、push、PR、tag、镜像和环境发布：均未执行。
- 原子提交候选：Studio插件阶段五后端、SQL、前端、测试、i18n和本记录。
- 阶段回退点：阶段四`Passed`工作区状态；不得修改只读来源`../TapCanvas`。

## 阶段验收

- Tasklist阶段验收：Flow只有一个服务端权威写入协议，用户和 Agent不再存在双写竞争。
- 验收结果：`In Progress`。
- 未完成项和下一步：实现`TS-114～TS-141`并完成全部门禁；React工作台清单不再维护重复状态映射。
