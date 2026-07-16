# TapCanvas Studio 阶段四执行记录

## 结论

阶段四以项目和章节为首个 Go 业务垂直切片，正式把 TapCanvas Team 边界替换为 LinaPro Tenant 硬隔离。当前状态为`Passed`：项目和章节已经由 Go 插件唯一写入，React + Semi Design 项目入口完成双语 CRUD，Tenant、数据范围、权限、聚合和原子排序门禁全部通过。

本文面向继续实施和审查`linapro-tapcanvas-studio`的开发者。默认读者已了解 LinaPro 源码插件、GoFrame 代码生成和 React 插件 UI；Flow 持久化、资产、生成任务和 Agent 不在本阶段实现范围内。

## 阶段信息

| 字段 | 值 |
| --- | --- |
| 阶段 | 阶段四：项目和章节 Go 垂直切片 |
| Tasklist 版本 | `v1.1`，`Frozen` |
| 任务范围 | `TS-090～TS-109` |
| 状态 | `Passed` |
| 开始时间 | `2026-07-16 11:24 CST` |
| 完成时间 | `2026-07-16 12:45 CST` |
| 执行分支 | `feat/react-workbench-replacement` |
| 宿主基线 | `7d149838` |
| 插件基线 | 父仓库当前工作区；插件无独立仓库 |

## 范围与边界

- 目标：项目和章节由 Go 插件唯一写入，前端通过`host.api.plugin()`访问，不再调用对应 Hono 模块。
- 修改范围：`apps/lina-plugins/linapro-tapcanvas-studio/`、本阶段文档和冻结 Tasklist 状态。
- 禁止范围：`../TapCanvas`保持只读；不修改`apps/lina-core/`、`hack/`和其他插件；不实现 Team、成员、邀请或 TapCanvas 权限模型。
- 前置门禁：`TS-001～TS-089`已经通过；`.contributing`存在；统一 React、双语、Builtin 源码插件和多租户边界已经冻结。

## 冻结契约

### 数据模型

| 资源 | 关键字段 | 约束 |
| --- | --- | --- |
| 项目 | `id`、`tenant_id`、`owner_id`、`name`、`description`、`created_at`、`updated_at`、`deleted_at` | 服务端生成字符串 ID；`tenant_id`和`owner_id`只由服务端上下文写入；软删除 |
| 章节 | `id`、`tenant_id`、`project_id`、`owner_id`、`chapter_index`、`title`、`summary`、`status`、`sort_order`、`last_worked_at`、时间字段 | 服务端生成字符串 ID；项目内`chapter_index`唯一；软删除；所有访问先约束祖先项目可见 |

项目列表按`tenant_id`、数据范围、关键词和分页在数据库侧过滤，并用一次集合化聚合查询投影章节数。响应保留可空的最近 Flow 摘要字段；本阶段数据库尚不存在 Flow，因此该投影为`null`，阶段五建立 Flow 真源后使用批量查询填充，禁止逐项目查询。

章节状态使用字典`tapcanvas_chapter_status`维护，值固定为`draft`、`planning`、`producing`、`review`、`approved`、`locked`和`archived`。英文为源内容，`zh-CN`维护完整镜像。

### API 与权限

| 方法 | 路径 | permission | 语义 |
| --- | --- | --- | --- |
| `GET` | `/projects` | `tapcanvas:project:view` | 最大`pageSize=100`的分页列表 |
| `POST` | `/projects` | `tapcanvas:project:create` | 创建当前 Tenant、当前用户拥有的项目 |
| `GET` | `/projects/{projectId}` | `tapcanvas:project:view` | 可见项目详情与章节数投影 |
| `PUT` | `/projects/{projectId}` | `tapcanvas:project:update` | 更新可见项目 |
| `DELETE` | `/projects/{projectId}` | `tapcanvas:project:delete` | 软删除项目，并使章节通过祖先约束不可见 |
| `GET` | `/projects/{projectId}/chapters` | `tapcanvas:project:view` | 有界章节列表 |
| `POST` | `/projects/{projectId}/chapters` | `tapcanvas:project:update` | 在可见项目中创建章节 |
| `GET` | `/chapters/{chapterId}` | `tapcanvas:project:view` | 返回祖先项目仍可见的章节 |
| `PUT` | `/chapters/{chapterId}` | `tapcanvas:project:update` | 更新标题、摘要、状态或排序 |
| `DELETE` | `/chapters/{chapterId}` | `tapcanvas:project:update` | 软删除可见章节 |
| `PUT` | `/projects/{projectId}/chapters/order` | `tapcanvas:project:update` | 原子替换当前项目全部可见章节顺序 |

公开响应中的`createdAt`、`updatedAt`和`lastWorkedAt`统一为 Unix 毫秒时间戳。客户端不能提交`tenantId`、`ownerId`、`chapterIndex`或审计身份。

### Tenant、授权和数据范围

- 普通 Studio API 必须具有非零`tenant_id`。平台管理员必须先进入一个 Tenant；`PlatformBypass`不能无界读取业务数据。
- 路由中间件执行认证、Tenancy 和`g.Meta permission`授权；service 同时显式注入`bizctxcap.Service`、`tenantcap.Service`和`authz.Service`，不创建独立服务图。
- 所有读取先添加当前`tenant_id`。`DataScope=1`或`2`读取当前 Tenant 全部项目，`DataScope=4`只读取`owner_id=当前用户`。
- `DataScope=0`、`3`、未知值、`DataScopeUnsupported=true`或缺失用户上下文全部 fail closed。当前普通插件能力不暴露组织范围 SQL 构造器，因此部门范围不得退化为全 Tenant 或仅凭内存过滤；后续只有稳定宿主契约可用时才能新增部门投影。
- 详情、更新、删除、章节写入和排序在数据库操作前复用同一可见性查询。排序请求只要包含重复、缺失、额外或不可见章节 ID，就整体拒绝。
- 聚合查询复用相同的 Tenant 和 owner 条件，不能通过数量、分页总数或排序泄露范围外记录。
- `acting_user_id`仅用于后续审计扩展；业务所有权始终使用被代理 Tenant 中的当前`user_id`，不把真实 acting user 写为`owner_id`。

## 任务状态

| 任务 | 状态 | 证据 |
| --- | --- | --- |
| `TS-090～TS-093` | `Passed` | API DTO、`001`安装 SQL、`999`卸载 SQL、字典 Seed、两次数据库初始化和生成 DAO/DO/Entity |
| `TS-094～TS-101` | `Passed` | project/chapter service、可见性约束、集合化聚合、Controller、路由、稳定错误码和双语错误资源 |
| `TS-102～TS-104` | `Passed` | `project-client.ts`只通过`host.api.plugin()`和宿主字典 API；React + Semi 项目/章节 CRUD 与原子排序完成 |
| `TS-105～TS-107` | `Passed` | project/chapter service 单测、跨 Tenant、Self、不可见详情、聚合不泄露、整体拒绝和无逐项目查询审查 |
| `TS-108` | `Passed` | Studio Go 全测、15 个 Go module lint、启动绑定、typecheck、371 个前端单测、i18n 和 build 通过 |
| `TS-109` | `Passed` | `TC001～TC003`最终`6/6`通过；TC003 项目/章节/API/权限/Tenant/双语`3/3`通过 |

## 命令与结果

| 序号 | 命令 | 退出码 | 结果 |
| --- | --- | --- | --- |
| 1 | `linactl db.init confirm=init rebuild=true`，使用阶段配置 | `0` | 首次应用 Studio SQL；重复启动显示`pluginChanged=0`，验证幂等 |
| 2 | PostgreSQL 查询`sys_plugin`和`to_regclass` | `0` | `linapro-tapcanvas-studio=v0.1.1|installed=1|status=1`；项目表和章节表存在 |
| 3 | `GOWORK=off ... go test ./...`，Go cache 与临时目录放在工作区卷 | `0` | project/chapter service 和插件全部 Go package 通过 |
| 4 | `go run ./hack/tools/linactl lint.go plugins=1` | `0` | 15/15 module 通过，Studio `0 issues` |
| 5 | `pnpm --dir apps/lina-web typecheck` | `0` | 宿主、插件 UI 和 TapCanvas Studio 三套 TypeScript 检查通过 |
| 6 | `pnpm --dir hack/tests exec tsc --noEmit` | `0` | Studio POM 和 E2E 类型检查通过 |
| 7 | `pnpm --dir apps/lina-web test:unit` | `0` | 106 个文件、371/371 测试通过；项目入口聚焦测试 5/5 |
| 8 | `pnpm --dir apps/lina-web lint` | `0` | 工作台 ESLint 无 warning、无 error |
| 9 | `pnpm --dir apps/lina-web lint:tapcanvas` | `0` | 0 error；保留复制画布既有 74 条 React Hook/无效 disable warning |
| 10 | `pnpm --dir apps/lina-web i18n:check` | `0` | 硬编码违规 0、allowlist 命中 0、消息覆盖和前端 key 覆盖通过 |
| 11 | `pnpm --dir apps/lina-web build` | `0` | 10,663 modules transformed；项目入口和 TapCanvas 重型依赖保持懒加载 chunk |
| 12 | Playwright `TC001～TC003 --workers=1` | `0` | 最终 6/6 通过，包含启动、主题、Tenant 切换、只读和 CRUD |
| 13 | Playwright `TC003-tapcanvas-project-chapter-crud.ts --workers=1` | `0` | 最终 3/3 通过，明确断言中文`策划中`、英文`Planning`和 mutation 权限隐藏 |
| 14 | `git diff --check` | `0` | 最终工作区无空白错误 |
| 15 | `git status --short --branch` | `0` | 未执行 commit、push、PR、tag 或发布；`../TapCanvas`未修改 |

## 失败项

- 当前失败：无。
- 已解决失败：
  - 只读用户最初缺少父菜单`tapcanvas:studio:view`，API 可读但前端路由不可达；补齐父入口权限后通过。
  - 单 Tenant 直登只签发 tenant JWT、不返回前端 Tenant 投影，项目页按设计 fail closed；TC003 改为先取得 A 的 API token，再增加 B membership，通过正式 Tenant 选择流验证只读 UI。宿主契约缺口保留为后续平台项，本阶段未越界修改`apps/lina-core`或`apps/lina-web`认证运行时。
  - 人工截图发现原始`keyword`标签、`pages.common.addSuccess`、英文动作裁切和中文状态`Planning`；分别通过无标签搜索控件、正确 common key、表格列宽和插件状态 i18n 权威展示修复，并增加 E2E 断言。
  - 首轮并行最终门禁占满系统临时盘，Go 报`no space left on device`且 6 个 Vitest 懒加载测试超时；把 Go/TMP 放到工作区卷并串行复跑后 Go 全测和 371/371 单测通过。
- 外部阻断：无。

## 截图与人工审查

- 截图目录：`temp/20260716/`。
- 最终中文项目/章节截图：`20260716044511-tapcanvas-project-chapter-crud.png`。
- 最终英文项目/章节截图：`20260716044512-tapcanvas-project-chapter-english.png`。
- 其他证据：Tenant 缺失、首次画布加载、明暗主题、Tenant 可编辑和只读截图均保存在同目录。
- 视觉审查：通过。搜索区无原始 field 名，成功提示无 raw key，项目和章节动作未裁切，中英文标题、列名、日期和章节状态正确，Tenant 缺失页 fail closed。
- E2E 质量审查：通过。测试真实调用 Go API 和 PostgreSQL，不使用 scanner allowlist、翻译服务或 Hono 回退。

## 影响评估

| 规则域 | 结论 | 证据或说明 |
| --- | --- | --- |
| 架构 | 有影响 | 新增 Studio 插件内部项目/章节垂直切片，不修改宿主领域模型 |
| 插件 | 有影响 | Builtin 源码插件内部闭环；不新增跨插件领域能力 |
| 前端 UI | 有影响 | 项目入口从占位页变为 React + Semi CRUD 页面 |
| API | 有影响 | 新增版本化项目和章节 REST DTO |
| 后端与 DI | 有影响 | 运行期依赖从`registrar.Services()`在装配层显式传入 |
| 数据库 | 有影响 | 新增`001-tapcanvas-project-chapter.sql`、索引、字典和生成模型 |
| 数据权限 | 有影响 | 数据库侧 Tenant 与 owner 范围；部门和未知范围 fail closed |
| 缓存一致性 | 无影响 | 本阶段不增加缓存；数据库是真源 |
| i18n | 有影响 | 英文 API 源文本、双语 apidoc、错误、字典和 UI 资源 |
| 开发工具 | 无影响 | 复用已有`make dao`、`make ctrl`和仓库命令；不修改工具链 |
| 测试 | 有影响 | 增加 service、controller/绑定和 Playwright E2E 覆盖 |
| 文档 | 有影响 | 新增本阶段执行记录；完成后更新冻结 Tasklist 状态 |

## 变更文件

- 新增：项目/章节 API DTO、生成 Controller/DAO/DO/Entity、service 与测试、安装/卸载 SQL、项目/章节 React 页面、client、单测、TC003 E2E 和本记录。
- 修改：Studio 插件装配、manifest/双语资源、项目入口样式、POM、冻结迁移 Tasklist 和 React 工作台后续任务映射。
- 删除：无。
- 未经授权的 Git 操作：无；不得执行 commit、push 或 PR。

## 审查结论

- 审查范围：`git status --short`、未跟踪文件展开和`TS-090～TS-109`映射。
- 已读取规则：`AGENTS.md`、`workflow.md`、`architecture.md`、`data-permission.md`、`plugin.md`、`api-contract.md`、`backend-go.md`、`database.md`、`frontend-ui.md`、`testing.md`、`i18n.md`和`documentation.md`。
- 严重问题：0。
- 警告：2。其一是复制画布保留 74 条既有 lint warning，当前阶段没有用批量依赖数组改写掩盖风险；其二是单 Tenant 直登缺少前端 Tenant 投影，需在独立宿主认证任务中修复，不能在 Studio 插件内解析 JWT 或伪造 Tenant。
- 剩余风险：Flow 表在阶段五创建，因此阶段四项目列表中的最近 Flow 摘要必然为`null`；该字段不得触发 Hono 回退。系统盘空间偏低，后续 Go 全量门禁应继续把`GOCACHE`和`GOTMPDIR`放在工作区卷。

## 阶段验收

- Tasklist 阶段验收：项目和章节由 Go 插件唯一写入，前端不再调用对应 Hono 模块。
- 验收结果：`Passed`。
- Tasklist 勾选：`TS-090～TS-109`已根据当前工作区证据更新为完成；React工作台清单不再维护重复状态映射。
