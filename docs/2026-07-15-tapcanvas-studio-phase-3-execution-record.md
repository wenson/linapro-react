# TapCanvas Studio 阶段三执行记录

## 结论

阶段三已完成。TapCanvas Studio 只消费 LinaPro 的用户、Tenant、权限、语言和请求边界，旧认证、Team、商业与管理底座已删除。原有`400`条 i18n 违规已正式迁移为插件自有的`341`条英文源文案和`zh-CN`完整镜像；类型检查、lint、`366`个单元测试、生产构建、i18n 门禁和 Studio E2E 均通过。

## 阶段信息

| 字段 | 值 |
| --- | --- |
| 阶段 | 阶段三：剔除认证、Team、权限底座和商业能力 |
| Tasklist 版本 | `v1.0` |
| 任务范围 | `TS-070`至`TS-089` |
| 状态 | `Completed` |
| 开始时间 | `2026-07-15 21:25 CST` |
| 完成时间 | `2026-07-16 11:17 CST` |
| 执行分支 | `feat/react-workbench-replacement` |
| 宿主基线 | `7d149838e77fe3d2b1bdda5ebb9d46679f79fd23` |
| 来源基线 | `680b0243cd8bb7e5a8926d49eadd942dbc0151f4` |
| 提交授权 | 未授权 |

## 范围与边界

- 目标：删除旧身份、Team、商业和管理壳，让 Studio 严格绑定 LinaPro Tenant 与 permission set。
- 修改范围：`apps/lina-plugins/linapro-tapcanvas-studio/`、对应插件测试、本文和冻结 Tasklist 状态。
- 禁止范围：不修改`../TapCanvas`；不为旧 Hono API 创建兼容代理；不提前实现后续 Go 业务切片；不修改`apps/lina-core/`、`apps/lina-vben/`或`hack/`。
- 外部操作：不执行`commit`、`push`、PR、tag、镜像发布或环境发布。
- 前置门禁：阶段二已通过；来源`../TapCanvas/apps/web`在阶段开始时无工作区改动。

## 任务状态

| 任务 | 状态 | 证据 |
| --- | --- | --- |
| `TS-070`至`TS-084` | `Passed` | 旧底座已删除；身份、Tenant、权限、语言、请求和 storage 均由 LinaPro Host Runtime 驱动 |
| `TS-085` | `Passed` | 旧 auth、Team、billing、commerce、product、order 和支付精确扫描为`0` |
| `TS-086` | `Passed` | 已删除旧登录、Team、积分和商业资源；插件入口文案保持中英文镜像 |
| `TS-087` | `Passed` | Tenant 缺失、模块缺失、权限、Tenant 切换和 impersonation 边界测试`12/12`通过 |
| `TS-088` | `Passed` | typecheck、lint、unit、build 和 i18n 检查全部通过；扫描违规与 allowlist 命中均为`0` |
| `TS-089` | `Passed` | Studio Playwright E2E 最终同批复跑`3/3`通过 |

## 初始审计

- 旧认证目录仍包含`GithubGate`、JWT 解析、`tap_token`cookie/localStorage、独立`401`拦截器、手机号和密码设置逻辑。
- `api/server.ts`仍注入 TapCanvas Bearer Token，并保留认证、管理员、Team、积分、billing、commerce、product、order与 wechat-pay DTO 和调用。
- 画布生产闭包中的任务执行、媒体编辑和项目输入仍读取旧 auth store。
- 独立`Home`、`Account`、`Stats`和充值模块仍作为生产源码存在，即使没有注册为当前 LinaPro 页面也不满足静态治理门禁。
- 多处本地持久化 key 未按 LinaPro 用户和 Tenant 隔离；Tenant 变化尚未统一取消请求和清理运行期状态。

## 命令与结果

| 序号 | 命令 | 退出码 | 结果 |
| --- | --- | ---: | --- |
| 1 | `git branch --show-current` | `0` | 当前分支为`feat/react-workbench-replacement` |
| 2 | `git rev-parse HEAD` | `0` | 宿主基线为`7d149838e77fe3d2b1bdda5ebb9d46679f79fd23` |
| 3 | `git -C ../TapCanvas rev-parse HEAD` | `0` | 来源基线为`680b0243cd8bb7e5a8926d49eadd942dbc0151f4` |
| 4 | `git -C ../TapCanvas status --short -- apps/web` | `0` | 无输出，来源保持只读 |
| 5 | Studio 三组 TypeScript 检查 | `0` | `3/3`通过 |
| 6 | LinaPro Host ESLint | `0` | `0`个 error |
| 7 | TapCanvas Studio ESLint | `0` | `0`个 error；保留`74`条复制源码基线 warning |
| 8 | Studio 定向边界测试 | `0` | `12/12`通过 |
| 9 | LinaPro 前端全量单测 | `0` | `104`个文件、`366/366`通过 |
| 10 | LinaPro 前端生产构建 | `0` | 构建`10,662`个 modules，退出码为`0` |
| 11 | 旧底座精确扫描 | `0` | 旧 auth、Team、billing、commerce、product、order 和支付生产调用为`0` |
| 12 | i18n message 和 frontend key coverage | `0` | 两项 key coverage 均通过；插件英文源与中文镜像各有`341`条画布文案 |
| 13 | `pnpm --dir apps/lina-web i18n:check` | `0` | UserMessage 违规`0`、allowlist 命中`0`；TapCanvas Studio 模块顶层`t()`调用`0` |
| 14 | Studio Playwright E2E | `0` | 同批复跑`3/3`通过，用时`30.3s` |
| 15 | E2E TypeScript 检查与`git diff --check` | `0` | 无类型错误和空白错误 |

## 失败项

- 当前失败：无。
- 已解决 i18n 门禁：阶段二记录的原基线为`1,039`条；删除旧底座后降至`400`条。本阶段把`47`个文件中的`400`个出现点归并为`341`条真实用户文案，完成语境化英文翻译、`zh-CN`镜像和静态 key 迁移。
- i18n 处理边界：未使用 scanner allowlist，未修改`hack/`。Host Runtime 在挂载画布前激活 LinaPro translator，卸载时按 token 清理；模块级选项通过延迟 getter 求值，避免语言资源加载前固化。
- 已解决失败：Playwright 初次启动被 macOS 沙箱拒绝，改为用户已授权的沙箱外 CLI 后恢复。
- 已解决失败：旧 E2E 假定平台管理员已有 Tenant，现先验证 Tenant 缺失阻断，再通过真实 LinaPro impersonation 进入 Tenant。
- 已解决失败：本机无`psql`，测试数据准备改为调用 OrbStack 容器内置`psql`；未修改镜像和发布配置。
- 已解决失败：Tenant 候选列表权限不是当前插件可授予菜单权限。E2E 仅模拟候选列表投影，真实`select-tenant`、`switch-tenant`、Token 和 Tenant 上下文仍调用 Go API。
- 外部阻断：无。

## 截图与人工审查

- 截图目录：`temp/20260715/`。
- 项目入口：`20260716021751-tapcanvas-project-entry.png`。
- Tenant 缺失：`20260716021752-tapcanvas-studio-tenant-required.png`。
- 首次画布：`20260716021757-tapcanvas-studio-first-load.png`。
- 亮色与暗色：`20260716021803-tapcanvas-studio-light.png`、`20260716021803-tapcanvas-studio-dark.png`。
- Tenant 可编辑与只读：`20260716020248-tapcanvas-studio-tenant-editable.png`、`20260716020250-tapcanvas-studio-tenant-readonly.png`。
- 视觉审查：通过。画布限制在 LinaPro workspace 内，亮暗主题一致，浮层未泄漏；Tenant 缺失状态已改为主题兼容的居中告警卡片。
- E2E 质量审查：通过。覆盖登录后进入 Studio、平台管理员 Tenant 阻断、真实 impersonation、真实 Tenant Token 切换、权限隐藏、画布重挂载、旧 auth state 和旧 API 零请求。

## 影响评估

| 规则域 | 结论 | 证据或说明 |
| --- | --- | --- |
| 架构 | 有影响 | 身份、Tenant 和权限 owner 从 TapCanvas 切换为 LinaPro 宿主公开契约 |
| 插件 | 有影响 | source plugin UI 只通过`@linapro/plugin-ui`消费宿主上下文 |
| 前端 UI | 有影响 | Tenant 缺失阻断、权限隐藏和 Tenant 切换重挂载均改变页面行为 |
| API | 有影响 | 删除旧认证与商业 client；创作 API 仅保留为后续 Go 迁移输入，不伪接宿主 API |
| 后端与 DI | 无影响 | 本阶段不修改 Go、Controller、Service 或依赖注入 |
| 数据库 | 无影响 | 本阶段不修改 SQL、DAO、DO、Entity 或索引 |
| 数据权限 | 有影响 | 前端只消费 LinaPro permission set；服务端数据权限在后续 Go 垂直切片接入 |
| 缓存一致性 | 有影响 | Tenant 变化必须取消请求、卸载画布并清理 Tenant 绑定的本地运行状态 |
| i18n | 有影响 | 删除旧登录、Team、积分和商业文案，维护插件英文源与中文镜像 |
| 开发工具 | 无影响 | 不修改构建、测试、CI、脚本或跨平台入口 |
| 测试 | 有影响 | 新增宿主边界单测与插件 E2E，并运行 typecheck、lint、unit、build 和 i18n 检查 |
| 文档 | 有影响 | 新增本文，完成后更新冻结 Tasklist 状态和证据 |

## 变更文件

- 新增 Host Runtime 边界：`runtime/storageScope.ts`、`runtime/hostLocaleScope.ts`及对应测试。
- 修改 Studio 入口：Tenant 缺失 fail-closed、模块加载 Error Boundary、Tenant/impersonation key 重挂载和双语状态文案。
- 修改画布运行时：Host locale、permission set、request abort、Query/Zustand reset 和 Tenant scoped storage。
- 修改画布 i18n：新增 Host translator scope，把`400`个硬编码出现点迁移到插件双语资源，并补充资源镜像和 translator 生命周期测试。
- 修改 E2E：补齐平台 impersonation、真实双 Tenant 切换、可编辑/只读权限、旧 API 零请求和截图证据。
- 删除：旧 GitHub OAuth、guest/email/phone/password 登录、TapCanvas token/auth store、Team/成员/邀请/积分、billing/commerce/product/order/payment、独立 Home/Account/Stats 壳及无引用`projects/projectFs.ts`。
- 未修改：`../TapCanvas`、`apps/lina-core/`、`apps/lina-vben/`和产品`hack/`代码。
- 未经授权的 Git 操作：无。

## 审查结论

- 审查范围：当前工作区、插件生产源码、测试、清单映射和只读来源状态。
- 已读取规则：`AGENTS.md`、`.agents/rules/workflow.md`、`.agents/rules/architecture.md`、`.agents/rules/data-permission.md`、`.agents/rules/plugin.md`、`.agents/rules/frontend-ui.md`、`.agents/rules/testing.md`、`.agents/rules/i18n.md`、`.agents/rules/documentation.md`、`.agents/rules/api-contract.md`和 Markdown 格式说明。
- 严重问题：未发现旧认证、Team、商业能力或权限边界回归。
- 未决门禁：无。UserMessage 扫描、message coverage、frontend key coverage 和模块顶层调用审计均通过。
- 已接受基线：`74`条复制源码 lint warning 不属于本轮新增 error，后续专项任务继续清理。
- 剩余风险：E2E 的 Tenant 候选列表使用确定性投影；真实 Tenant 选择、切换、Token 撤销和页面 Host Context 均由后端执行，候选权限模型应由 Tenant 插件专项验证继续覆盖。

## 阶段验收

- Tasklist 阶段验收：TapCanvas 前端只使用 LinaPro 身份、Tenant 和权限，没有自有平台底座或商业入口。
- 验收结果：`Passed`。
- Tasklist 勾选：`TS-070`至`TS-089`已按当前工作区证据更新为完成；React工作台清单不再维护重复状态映射。
