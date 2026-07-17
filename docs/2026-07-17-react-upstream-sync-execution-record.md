# React 工作台上游同步执行记录

## 阶段信息

| 字段 | 值 |
| --- | --- |
| 阶段 | 上游功能同步：Vue 到 React |
| Tasklist 版本 | `v1.5` |
| 任务范围 | 上游提交`0b26876d`至`1f16d645`的 React 等价迁移与合并冲突解决 |
| 状态 | `Passed` |
| 开始时间 | `2026-07-17 00:00 Asia/Shanghai` |
| 执行分支 | `main`（未完成合并） |
| React 基线 | `07d85b33` |
| 上游合并头 | `1f16d645` |
| Tasklist | `docs/2026-07-17-react-upstream-sync-tasklist.md` |

## 范围与边界

- 目标：合入上游认证、配置、对象存储、文件上传、插件治理、路由和测试更新，并在`apps/lina-web`实现可验证的 React/Semi 等价能力。
- 修改范围：`apps/lina-core`、`apps/lina-web`、`apps/lina-plugins`、`hack`、`.github`、对应测试与必要文档。
- 禁止范围：恢复`apps/lina-vben`、Vue、Vben、Ant Design Vue 或宿主双前端运行时。
- 合并策略：Vue 冲突文件仅作为行为与契约来源；React 实现和 React 适配的测试是最终交付。

## 功能映射

| 上游功能 | Vue 来源 | React 目标 |
| --- | --- | --- |
| 外部登录与一次性 handoff | 登录页、认证 store、`extlogin` API | `auth`运行时、登录页和插件 slot |
| 注册、找回和重置密码 | 认证页面与`auth` API | React 认证路由、表单和 API 投影 |
| 配置值类型 | 配置表单与类型定义 | `settings/config`页面和 API 投影 |
| 对象存储直传与分片上传 | 上传 API 与 hook | `settings/file`上传组件与 API 客户端 |
| 插件主机服务治理 | 插件详情、授权与升级视图 | `features/plugins`治理页面 |
| 菜单、用户、角色和任务适配 | Vue 管理页面 | 已有 React 页面补齐上游新增契约 |

## 影响评估

| 规则域 | 结论 | 说明 |
| --- | --- | --- |
| 架构 | 有影响 | React 是唯一工作台；上游 Vue 更新必须投影为 React 功能。 |
| 前端 UI | 有影响 | 认证、配置、文件和插件治理的用户可见工作流需同步。 |
| API | 有影响 | React 客户端需消费已合入的新增认证和文件接口。 |
| 后端与 DI | 有影响 | 上游 Go 变更已进入合并范围，须按包验证。 |
| 数据库 | 有影响 | 上游 SQL 与 DAO 变更保留其幂等与生成约束。 |
| 数据权限 | 有影响 | 文件、用户、角色和插件接口继续以后端权威校验为准。 |
| 缓存一致性 | 有影响 | 认证、插件状态与运行时 i18n 缓存需按已有作用域失效。 |
| i18n | 有影响 | 新增错误、认证与配置文案须覆盖`en-US`和`zh-CN`。 |
| 开发工具 | 有影响 | `Makefile`、CI、`linactl`和 E2E 保持 React 路径。 |
| 测试 | 有影响 | 需更新 React 单测、E2E 和 i18n 治理验证。 |
| 文档 | 有影响 | 本记录与冻结 Tasklist 的范围变更已同步。 |

## 当前命令与结果

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `go test ./internal/service/auth -run '^TestCodeAuthInvalidCredentialsMessageKey$' -count=1` | `0` | 认证错误码合并后的定向验证通过。 |
| `go test ./internal/service/auth -count=1` | `1` | 现有集成用例因本地未提供 GoFrame 数据库配置而中断。 |
| `cd hack/tools/linactl && go test ./internal/runtimei18n -count=1` | `0` | React/TSX 运行时 i18n 扫描和配置展示元数据校验通过。 |
| `cd hack/tools/linactl && go test ./... -run 'TestPortFromEnv|TestValidateConfigDisplayMetadataKeys|TestReactI18NScannersExcludeVueSources|TestValidateModuleLevelCalls' -count=1` | `0` | React 端口变量、配置展示元数据、Vue 源排除和模块级调用检查通过。 |
| `pnpm --dir apps/lina-web typecheck` | `0` | 已实现认证 API、认证运行时、公开认证页面和上传客户端的类型检查通过。 |
| `pnpm --dir apps/lina-web exec vitest run src/auth/login-page.test.tsx src/auth/external-login-error.test.ts src/plugin-ui/contract.test.ts src/runtime/public-config.test.ts` | `0` | 登录入口、外部登录错误投影、插件 slot 契约与公开配置验证通过。 |
| `pnpm --dir apps/lina-web exec vitest run src/auth/auth-runtime.test.ts src/auth/auth-gate.test.tsx src/features/settings/settings-pages.test.tsx` | `0` | handoff 登录、认证回调和现有设置页回归验证通过。 |
| `pnpm --dir apps/lina-web typecheck`（Node `v22.22.0`） | `0` | 宿主、插件 UI 与 TapCanvas TypeScript 工程检查通过。 |
| `pnpm --dir apps/lina-web test:unit`（Node `v22.22.0`） | `0` | React 工作台、公开认证、配置、文件、插件 UI 与既有页面单测通过。 |
| `pnpm --dir apps/lina-web lint`（Node `v22.22.0`） | `0` | ESLint 零警告通过。 |
| `pnpm --dir apps/lina-web build`（Node `v22.22.0`） | `0` | Vite 生产构建完成，构建期源码插件 React UI 注册表同时通过。 |
| `make i18n.check` | `0` | 宿主与启用 i18n 的插件运行时文案、错误码和前端 key 覆盖通过。 |
| `pnpm --dir hack/tests test:validate`（Node `v22.22.0`） | `0` | 268 个 E2E 文件、17 个 scope、smoke/serial/CI shard 治理通过。 |
| `go test ./internal/cmd -count=1` | `0` | 启动路由装配包通过。 |
| `go test ./internal/service/file -run 'Test(DirectUpload|ChunkedUpload|PlanUploadStrategy)' -count=1` | `0` | 分片与直传会话的用户/租户授权回归测试通过。 |
| `go test ./internal/service/auth -run '^TestCodeAuthInvalidCredentialsMessageKey$' -count=1` | `0` | 认证错误码运行时 i18n 映射回归通过。 |
| `go test ./internal/service/plugin -run 'Test.*Runtime.*' -count=1` | `1` | 测试构造期读取 GoFrame 静态配置而本机没有`apps/lina-core/manifest/config/config.yaml`；未发现编译错误，保留为环境阻断。 |
| `git diff --check`、`git diff --name-only --diff-filter=U` | `0` | 无空白符错误、无未解决冲突。 |

## 阶段进度

| 阶段 | 状态 | 证据与下一步 |
| --- | --- | --- |
| 阶段一 | `Passed` | `US-001`至`US-007`的冲突决议和工具/i18n 定向测试已完成；最终全局残留扫描仍在阶段六重复执行。 |
| 阶段二 | `Passed` | 认证、文件、配置与插件 DTO 均保持公开契约；SQL 审查与 Go 定向验证完成。 |
| 阶段三 | `Passed` | 公开认证、一次性 handoff、错误投影和匿名插件`auth.login.social` slot 均已完成并有 React 单测。 |
| 阶段四 | `Passed` | 配置值类型、直传/代理分片上传和下载回退完成，专项单测通过。 |
| 阶段五 | `Passed` | 插件治理、IAM、任务与共享组件契约已审查；builtin 继续按产品规则完全隐藏。 |
| 阶段六 | `Passed` | React/Semi POM 与 E2E 静态治理、i18n、类型、单测、lint、构建及残留扫描通过。 |
| 阶段七 | `Passed` | 已创建唯一的本地 merge commit`b87a80e5`；未推送、未创建 PR。 |

## 审查结论与剩余风险

- API：认证回调只消费一次性`handoff`，先替换 URL 再交换令牌；文件直传和代理分片会话的 complete、part URL、part upload、abort 均校验同一`tenant_id`和`user_id`。React 仅经公开 HTTP DTO 调用，未导入`lina-core/internal`。
- DI 与缓存：认证运行时继续复用既有 API、session、tenant、query-client 注入图；匿名 slot 仅读取公开插件运行态，不加载认证上下文，禁用、未安装或非 normal 状态不会渲染。无新增缓存失效路径。
- 数据库与 SQL：`005-config-management.sql`、`006-menu-role-management.sql`、`011-scheduled-job-management.sql`使用`CREATE ... IF NOT EXISTS`、`ON CONFLICT DO NOTHING`、identity 主键与`deleted_at`软删除字段；列表/状态常用过滤键具备相应索引。Seed 数据不覆盖已有用户数据。
- 数据权限：上传会话按用户和租户双重绑定；下载优先直链且受后端授权，代理 Blob 下载仍经受保护端点。未新增绕过权限的前端路径。
- i18n：新增宿主双语认证、配置、文件提示；补齐`linapro-ai-core`和`linapro-tenant-core`新增 bizerr messageKey 的双语资源，`make i18n.check`通过。
- 跨平台：CI 的 Node 来源已从删除的`apps/lina-vben/.node-version`改为`apps/lina-web/.node-version`。本机初始 Node `v20.19.5`不支持`node:sqlite`，验证改用已安装的 Node `v22.22.0`。
- E2E：`test:validate`通过。真实浏览器 E2E 与截图未运行，因为本机未启动核心服务、数据库和 Playwright 依赖栈；截图目录`temp/20260717/`未产生文件。静态测试治理和 React/Semi 选择器审查是替代覆盖，剩余风险是未对运行中的完整服务执行视觉与跨服务工作流验证。
- Go：`internal/cmd`和本次文件、认证定向包测试通过；`auth`、`file`、`plugin`全量集成测试均会在本机缺失 GoFrame 配置/数据库时 panic，故未将该外部环境故障归因于本次实现。

## 交付提交

| 字段 | 值 |
| --- | --- |
| Merge commit | `b87a80e579152c3c62992115a033b4db2304d71d` |
| 提交信息 | `feat(upstream): sync post-react-migration capabilities` |
| 提交范围 | 上游后端/工具/测试同步，以及认证、配置、文件上传下载、匿名插件 slot 和 React/Semi E2E 迁移。 |
| Git 状态 | 本地`main`已包含该提交；未执行`push`、PR、rebase 或历史重写。 |

## 本轮文档治理结论

- 已读取`.agents/rules/documentation.md`、`.agents/rules/workflow.md`和 Markdown 格式指引。
- 本轮只更新 Tasklist 与执行记录，不涉及目录级`README`镜像。
- `v1.6`记录最终提交和阶段七状态，不改变功能范围；该状态提交不属于新的 merge commit。
