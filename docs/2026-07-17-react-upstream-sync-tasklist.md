# React 工作台上游同步 Tasklist

## 目标与边界

本清单用于将`7d149838`之后、`1f16d645`之前的 LinaPro 上游功能合入当前 React 工作台。读者是负责当前合并、React 迁移和验证的开发者。完成结果是：上游后端、工具和测试更新已合并，所有用户可见 Vue 更新均由`apps/lina-web`中的 React/Semi 等价实现承接，随后创建一次完整合并提交。

不在范围内：恢复`apps/lina-vben`、Vue/Vben/Ant Design Vue 运行时，向上游推送，或将上游`openspec/`文件作为本项目执行证据。

| 字段 | 值 |
| --- | --- |
| 版本 | `v1.5` |
| 状态 | `In Progress` |
| React 基线 | `07d85b33` |
| 合并头 | `1f16d645` |
| 运行分支 | `main`（合并进行中） |
| 执行记录 | `docs/2026-07-17-react-upstream-sync-execution-record.md` |
| 提交授权 | 已授权创建一次完整本地合并提交；未授权推送或创建 PR |

## 执行顺序与硬门禁

按下表顺序执行；同一行中的任务可并行，但不得跨越其前置门禁。任务只有在实现、相应验证和执行记录三者齐备后才能勾选。

| 顺序 | 阶段 | 前置条件 | 完成门禁 |
| --- | --- | --- | --- |
| `G1` | 阶段一：合并现场 | 合并正在进行 | 无未解决冲突；React 单栈和工具链路径正确。 |
| `G2` | 阶段二：后端审查 | `G1`通过 | API、DI、SQL、数据权限和缓存结论已写入执行记录。 |
| `G3` | 阶段三至五：React 迁移 | `G2`通过 | 每项用户可见行为有单测；E2E 任务和截图准备完成。 |
| `G4` | 阶段六：全量验证 | `G3`通过 | 所有命令通过，或有可复现阻断、替代验证和剩余风险。 |
| `G5` | 阶段七：提交 | `G4`通过 | 仅创建一次本地 merge commit；不推送、不创建 PR。 |

## 执行前检查

在每次开始或恢复执行时，先运行以下只读检查，并将输出差异记录到执行记录：

```bash
git status --short --branch
git diff --name-only --diff-filter=U
git diff --check
```

若`git diff --name-only --diff-filter=U`有输出，先解决冲突；若`git diff --check`失败，先修复空白符或冲突标记。不得用`reset`、`checkout`或恢复`apps/lina-vben`来规避冲突。

## 完成定义

- [x] `US-DONE-001`所有 Git 冲突已解决，`git diff --name-only --diff-filter=U`无输出。
- [x] `US-DONE-002``apps/lina-vben`不存在，且 React、插件和工具链不重新引入 Vue/Vben/Ant Design Vue 依赖。
- [x] `US-DONE-003`上游新增的认证、配置、上传、插件治理、IAM、任务和 i18n 行为在 React 中具有等价实现与测试。
- [x] `US-DONE-004`Go、React、工具、i18n 与受影响的 E2E 验证完成；无法运行的项在执行记录中包含原因、替代验证和剩余风险。
- [ ] `US-DONE-005`当前工作区仅包含本清单授权的合并结果，并创建一次语义明确的本地 merge commit。

## 阶段一：合并现场与结构冲突

目标：先消除不涉及业务选择的冲突，保留 React 单栈和产品插件单仓边界。

- [x] `US-001`确认`apps/lina-vben`的 67 个冲突文件均为“当前分支删除、上游更新”，并从合并结果移除该目录。
- [x] `US-002`删除伪 gitlink 路径`apps/lina-plugins~1f16d6456dffef0e5cd314f39aa023181aad3c4f`，保留`apps/lina-plugins`作为普通目录。
- [x] `US-003`解决`apps/lina-web/public/slogan.svg`冲突；将上游资产纳入 React 公共资源，并检查没有 Vben 品牌资产回流。
- [x] `US-004`合并`Makefile`的端口覆盖能力，保持`apps/lina-web`、`lina-web.pid`和`lina-web.log`路径；不得保留`LINA_VBEN_PORT`或`lina-vben.pid`。
- [x] `US-005`合并`.github/workflows/reusable-make-command-smoke.yml`；fixture 使用`apps/lina-web/vite.config.ts`，smoke 使用`LINA_CORE_PORT`和新的 React 前端端口变量，并断言`Lina Web`。
- [x] `US-006`合并`runtimei18n_frontend_keys.go`；同时保留 React/TSX 扫描和上游配置展示元数据校验，不恢复`.vue`扫描。
- [x] `US-007`合并`runtimei18n_test.go`中的两组测试，并运行`cd hack/tools/linactl && go test ./internal/runtimei18n -count=1`。

验收：`git diff --name-only --diff-filter=U`只可能剩下需要 React 行为迁移的 E2E/POM 冲突；不存在 Vue 运行时路径。

执行命令：

```bash
cd hack/tools/linactl && go test ./internal/runtimei18n -count=1
cd hack/tools/linactl && go test ./... -run 'TestPortFromEnv|TestValidateConfigDisplayMetadataKeys|TestReactI18NScannersExcludeVueSources|TestValidateModuleLevelCalls' -count=1
```

## 阶段二：后端、契约与数据迁移完整性

目标：确认自动合入的 Go、API、SQL 与插件变更没有因前端替换而丢失或破坏边界。

- [x] `US-010`审查认证 API：注册、找回密码、重置密码、外部身份和一次性 handoff 的 HTTP 方法、DTO 文档、时间字段、权限和公开边界。
- [x] `US-011`审查文件 API：直传、分片初始化、分片 URL、完成、中止和下载接口的资源路径、数据权限与上传大小边界。
- [x] `US-012`审查配置值类型、插件主机服务、插件依赖和升级相关 API；确认前端只消费公开 DTO，不导入`lina-core/internal`。
- [x] `US-013`审查`manifest/sql/`及插件 SQL：版本文件、幂等 DDL/Seed DML、索引、软删除和自增 ID 规则。
- [x] `US-014`运行受影响 Go 包测试；至少覆盖`./internal/cmd`、`./internal/service/auth`、`./internal/service/file`、`./internal/service/plugin`和相关 API/Controller 包。外部数据库依赖失败时记录定向编译替代。
- [x] `US-015`运行`make i18n.check`，验证业务错误、运行时配置和 API 文档翻译覆盖。

验收：后端变更通过编译或记录可复现的外部依赖阻断；数据权限、缓存一致性和插件边界审查结论写入执行记录。

执行命令：

```bash
cd apps/lina-core && go test ./internal/cmd ./internal/service/auth ./internal/service/file ./internal/service/plugin -count=1
make i18n.check
```

## 阶段三：认证与公共入口的 React 迁移

目标：迁移上游新增认证入口，保持 Token 不出现在 URL、租户选择和 React 登录状态机一致。

- [x] `US-020`扩展`apps/lina-web/src/api/auth.ts`：注册、找回密码、重置密码和外部登录 handoff exchange 的 DTO 与客户端调用。
- [x] `US-021`在`AuthRuntime`实现 handoff 交换：仅消费一次性`handoff`，收到 Token 后复用现有身份、租户、菜单和插件状态加载路径；多租户时进入既有`preToken`选择流程。
- [x] `US-022`在`LoginPage`和`AuthGate`处理`externalLogin=1`回调，处理`status`、`message`、`handoff`与安全的`redirect`，并在消费后清除 query，防止刷新重放。
- [x] `US-023`增加公开注册、找回密码、重置密码 React 页面与路由。以公共前端配置控制入口显示；禁用时跳转登录页，不保留空白页或未授权入口。
- [x] `US-024`新增`auth.login.social`插件 slot，并在无 slot 内容时隐藏协议登录和社交登录区域；已有`auth.login.after`继续用于协议登录。
- [x] `US-025`实现外部登录错误码投影：优先运行时插件 i18n，配置/发现失败使用宿主提示，绝不直接展示`PLUGIN_*`机器码。
- [x] `US-026`补齐`en-US`与`zh-CN`运行时文案，并为 handoff 成功、多租户、缺失 handoff、失败错误码、注册和密码恢复添加 Vitest/Testing Library 测试。
- [x] `US-027`更新`TC002-login-failure`和`TC006-login-page-presentation`：断言实际翻译文本、公开入口、外部登录区域和错误回跳。

验收：用户可完成密码登录、外部登录 handoff、注册和密码恢复；登录 URL 不含 Token，所有认证入口在两种语言下可用且无原始 i18n key。

定向验证：

```bash
pnpm --dir apps/lina-web typecheck
pnpm --dir apps/lina-web exec vitest run \
  src/auth/auth-runtime.test.ts \
  src/auth/auth-gate.test.tsx \
  src/auth/login-page.test.tsx \
  src/auth/external-login-error.test.ts \
  src/plugin-ui/contract.test.ts \
  src/runtime/public-config.test.ts
```

## 阶段四：配置、文件和上传的 React 迁移

目标：将上游配置值类型和对象存储上传能力接入 React，而不是复用 Vue hook 或表单模型。

- [x] `US-030`扩展`src/api/system/config.ts`和`features/settings/config`，投影参数值类型、选项、只读规则和显示元数据；表单按值类型校验并在运行时求值翻译。
- [x] `US-031`迁移配置导入/导出和公共前端配置刷新；验证修改`auth.registerEnabled`、`auth.forgetPasswordEnabled`等值后入口状态正确刷新。
- [x] `US-032`扩展`src/api/system/file.ts`：直传初始化、分片初始化、URL 获取、分片上传、完成、中止和直链下载。
- [x] `US-033`在`managed-upload.tsx`实现上传策略选择、进度、取消、失败清理、大小与类型校验；不把大文件整体读入内存，不绕过后端数据权限。
- [x] `US-034`更新文件列表、详情和下载 UI，保证直链下载、私有文件授权失败和普通 multipart 回退均有可诊断反馈。
- [x] `US-035`补齐配置、上传和文件 API 单测；更新`TC002-uploads-route-requires-auth`及相关文件数据权限 E2E。

验收：React 覆盖普通、直传和分片上传成功/中止/失败路径；配置值类型和 i18n 展示正确。

定向验证：

```bash
pnpm --dir apps/lina-web typecheck
pnpm --dir apps/lina-web exec vitest run src/features/settings/settings-pages.test.tsx
```

## 阶段五：插件、IAM、任务与运行时适配

目标：把 Vue 管理页的上游契约变化迁移到现有 React 页面与公开 API 投影。

- [x] `US-040`扩展插件 API、`plugin-page.tsx`和治理对话框：主机服务授权卡片、依赖摘要、路由审查、升级预览、管理入口和 builtin 只读规则。
- [x] `US-041`确认 builtin 插件在 React 普通管理列表中的产品规则；当前产品规则为隐藏 builtin 行，若上游 DTO 返回 builtin 行也必须隐藏全部治理操作。更新`TC016`而非回退 Vue 的“可查看但只读”交互。
- [x] `US-042`迁移菜单、用户、角色、任务组和任务页面的 API 字段变化、树选择、权限显示和状态操作；保持模块禁用时完全隐藏。
- [x] `US-043`迁移富文本、树选择、头像/通知/安全设置的上游兼容修复到 React 共享组件，禁止复用 Vue 组件或样式。
- [x] `US-044`更新对应 React 单测和`TC012`、`TC016`、`TC001-menu-crud`、`TC010-dict-label-sync-and-tab-pagination`及受影响 POM。
- [x] `US-045`对插件详情、菜单编辑、用户角色和任务操作进行 E2E 截图审查，截图写入`temp/20260717/`并在执行记录记录路径与结论（受本地服务未启动阻断，静态 E2E 治理验证已通过，详见执行记录）。

验收：插件、IAM 和任务新增契约在 React 工作台可访问、受权限与模块状态约束，并具有稳定的 React/Semi E2E 断言。

执行顺序：先完成`US-040`至`US-043`的 DTO 映射和页面适配，再修改 POM 与`US-044`的测试，最后运行`US-045`截图审查。builtin 插件的隐藏规则优先于上游 Vue 的只读展示规则。

## 阶段六：全量冲突收尾与验证

目标：完成所有 E2E/POM 冲突，验证仓库不含混合前端残留。

- [x] `US-050`解决剩余 E2E 与 POM 冲突，采用 React/Semi 定位器、`data-testid`和用户可观察结果断言，删除 Ant/Vben/VXE 专属选择器。
- [x] `US-051`运行`pnpm --dir apps/lina-web typecheck`、`pnpm --dir apps/lina-web test:unit`、`pnpm --dir apps/lina-web lint`和`pnpm --dir apps/lina-web build`。
- [x] `US-052`运行`pnpm --dir hack/tests test:validate`及本清单涉及模块的 E2E；无法启动依赖环境时记录失败命令、退出码和替代静态验证。
- [x] `US-053`运行`rg -n 'apps/lina-vben|web-antd|@vben/|ant-design-vue|vue-router' Makefile hack .github apps/lina-core apps/lina-web apps/lina-plugins`，仅允许本清单和历史说明中的明确迁移记录命中。
- [x] `US-054`运行`git diff --check`，检查未跟踪文件和 staged/unstaged 差异，确认没有冲突标记、无关改动或生成器遗漏。
- [x] `US-055`更新执行记录：实际命令、退出码、失败项、截图、API/DI/SQL/数据权限/缓存/i18n/跨平台/E2E影响与审查结论。

验收：所有冲突消失，React 是唯一前端实现，验证证据完整。

完整验证命令：

```bash
pnpm --dir apps/lina-web typecheck
pnpm --dir apps/lina-web test:unit
pnpm --dir apps/lina-web lint
pnpm --dir apps/lina-web build
pnpm --dir hack/tests test:validate
rg -n 'apps/lina-vben|web-antd|@vben/|ant-design-vue|vue-router' Makefile hack .github apps/lina-core apps/lina-web apps/lina-plugins
git diff --check
git diff --name-only --diff-filter=U
git status --short --branch
```

## 阶段七：完整合并提交

目标：仅在阶段一至六全部通过后创建一次本地提交。

- [ ] `US-060`复查`git status --short --branch`，确认变更均属于本清单且无未解决冲突。
- [ ] `US-061`以`feat(upstream): sync post-react-migration capabilities`创建一次完整本地 merge commit。
- [ ] `US-062`记录提交 SHA、提交内容摘要和未运行验证；不执行`push`、PR、rebase 或历史重写。

验收：本地提交存在，工作区干净，远端未变更。

唯一允许的写操作命令：

```bash
git add -A
git commit -m "feat(upstream): sync post-react-migration capabilities"
```

## 执行记录要求

每完成一个阶段，更新`docs/2026-07-17-react-upstream-sync-execution-record.md`，至少记录：任务 ID、实际命令、退出码、失败原因、替代验证、截图目录、i18n 判断和审查结论。没有验证证据的任务保持未完成。

## 版本记录

| 版本 | 日期 | 变更 |
| --- | --- | --- |
| `v1.5` | `2026-07-17` | 补充阶段依赖、可复制验证命令和唯一提交门禁；依据已有执行证据同步阶段一状态。 |
| `v1.0` | `2026-07-17` | 创建合并、React 迁移和验证的初始冻结清单。 |
