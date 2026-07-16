# React 工作台阶段十执行记录

阶段十已在独立端口接通官方源码插件模式的 LinaPro 后端，并完成 React 静态门禁、宿主与官方插件完整 i18n、认证、租户、Dashboard、About、个人中心、IAM、配置、字典、文件、消息、Scheduler、插件治理、全部官方源码插件及动态插件安全回归。最终`37/37`截图已完整重拍并逐张审查，阶段状态为`Passed`。

## 阶段信息

| 字段 | 值 |
| --- | --- |
| 阶段 | 阶段十：切换前功能等价验收 |
| Tasklist 版本 | `v1.2` |
| 任务范围 | `RW-300`至`RW-315` |
| 状态 | `Passed` |
| 开始时间 | `2026-07-13 13:00 CST` |
| 最近更新 | `2026-07-14 12:43 CST` |
| 执行分支 | `feat/react-workbench-replacement` |
| 宿主基线 | `7d149838e77fe3d2b1bdda5ebb9d46679f79fd23` |
| 插件基线 | 扁平化来源`1b90535404d1563a045efe3888dd9db6d1bf5e29` |

## 范围与边界

- 目标：使用真实 LinaPro 后端、PostgreSQL、React 工作台和官方插件运行链，证明切换前的宿主、源码插件与动态插件功能等价。
- 修改范围：`apps/lina-web`、React 源码插件前端、宿主与插件 E2E/POM、阶段十执行记录，以及验证发现的前端迁移缺陷；视觉审查发现的登录错误本地化问题仅修正`AUTH_INVALID_CREDENTIALS`的标准`messageKey`并增加测试。
- 禁止范围：不改变认证判定、用户、租户、RBAC、数据权限、数据库或通用 service 语义；不删除测试或降低业务断言；不修改`apps/lina-vben`；不执行 commit、push、PR、merge、tag 或发布。
- 前置门禁：PostgreSQL、`lina-core`和`apps/lina-web`已在本机独立端口运行；Node.js 固定为`22.22.0`；源码插件模式使用`official_plugins`构建标签和`LINAPRO_SOURCE_PLUGINS=1`。

## 任务状态

| 任务 | 状态 | 证据 |
| --- | --- | --- |
| `RW-300` | `Passed` | React Vite 工作台运行于`http://127.0.0.1:5667/admin/`，未占用旧工作台端口`5666` |
| `RW-301` | `Passed` | Vite 代理目标为`http://127.0.0.1:9120`；真实 API、登录态、插件和 i18n E2E 已通过该链路执行 |
| `RW-302` | `Passed` | 最终完整 auth E2E`21/21`通过，覆盖中英文登录失败、登录成功、未认证跳转、退出、access token 刷新重试和 refresh token 失效退出 |
| `RW-303` | `Passed` | 宿主与官方插件完整 i18n 回归`40/40`通过，覆盖中英文、运行时消息、菜单、面包屑和标签标题 |
| `RW-304` | `Passed` | 租户定向 E2E`10/10`通过，覆盖登录选择租户、切换并重签 Token、旧 Token 失效、平台代入与退出代入、平台/租户路由裁剪及治理动作隐藏 |
| `RW-305` | `Passed` | React 定向单元测试`9/9`及真实 E2E`29/29`通过，覆盖 Dashboard、About、API Docs、资料展示/更新、头像裁剪、密码、安全和通知页签 |
| `RW-306` | `Passed` | 菜单`23/23`、角色`18/18`、用户`29/29`分别通过；IAM 全量串行回归`70/70`通过，覆盖 CRUD、授权、权限、批量操作、自操作保护、导入导出、密码和异常交互 |
| `RW-307` | `Passed` | 配置`35/35`、字典`36/36`、文件`22/22`、消息`10/10`通过，共`103/103`；覆盖 CRUD、导入导出、筛选、上传/下载/预览、排序、详情、批量删除、未读投影、单条/全部已读、单删、清空、分页和用户消息自隔离 |
| `RW-308` | `Passed` | Scheduler 18 个测试文件、实际`19/19`通过，覆盖任务组、任务、任务日志、权限、插件降级、Shell 开关、Cron/时区、触发、终止、清理和数据权限 |
| `RW-309` | `Passed` | 插件治理目录完整回归`38 passed / 1 skipped / 0 failed`；唯一跳过项为非 host-only 环境专用`TC009`，摘要、详情、安装、启停、授权、升级、菜单/页签刷新、owner 能力和 builtin 隐藏均通过 |
| `RW-310` | `Passed` | 9 个官方源码插件页面和租户 Header slot 的 React 聚焦单测、TypeScript 检查及完整 E2E 全部通过；E2E 合计`288/288` |
| `RW-311` | `Passed` | iframe/bridge 聚焦单测`25/25`及 TypeScript 检查通过；动态插件 5 个文件、真实 E2E`19/19`通过，覆盖 iframe/new-window、CRUD、附件、恶意消息拒绝、generation 刷新和运行时治理 |
| `RW-312` | `Passed` | 32 个可达核心页面首次加载截图完整归档，页面均处于稳定终态 |
| `RW-313` | `Passed` | SideSheet、Modal、提交成功、筛选结果和登录失败 5 个交互终态截图完整归档 |
| `RW-314` | `Passed` | 最终`37/37`逐张图片审查通过；无页面错误、空白页、组件重叠、错误反馈缺失或真实 raw i18n key |
| `RW-315` | `Passed` | React 工作台已达到切换条件；按冻结边界继续保留`apps/lina-vben`，直到阶段十三执行硬切换 |

## 当前运行环境

| 组件 | 地址或配置 | 状态 |
| --- | --- | --- |
| PostgreSQL | `127.0.0.1:55432/linapro`，`postgres/postgres` | `Running` |
| Lina Core | `http://127.0.0.1:9120` | `Running` |
| React Vite | `http://127.0.0.1:5667/admin/` | `Running` |
| Node.js | `22.22.0` | 所有 Node 与 Playwright 命令显式设置`PATH` |
| 源码插件 | `official_plugins`与`LINAPRO_SOURCE_PLUGINS=1` | `Enabled` |

## 命令与结果

| 序号 | 命令 | 退出码 | 结果 |
| --- | --- | --- | --- |
| 1 | `GOWORK=temp/go.work.plugins GOFLAGS=-tags=official_plugins LINAPRO_SOURCE_PLUGINS=1 GF_GCFG_FILE=temp/phase10/config.yaml go run main.go`，目录`apps/lina-core` | `Running` | Lina Core 在端口`9120`装配官方源码插件 |
| 2 | `PATH="$HOME/.nvm/versions/node/v22.22.0/bin:$PATH" LINAPRO_SOURCE_PLUGINS=1 LINA_WEB_BASE_PATH=/admin LINA_API_PROXY_TARGET=http://127.0.0.1:9120 pnpm exec vite --host 127.0.0.1 --port 5667`，目录`apps/lina-web` | `Running` | React 工作台在独立端口提供`/admin/` |
| 3 | `PATH="$HOME/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm --dir apps/lina-web typecheck` | `0` | 应用与源码插件 UI TypeScript 检查通过 |
| 4 | `PATH="$HOME/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm --dir apps/lina-web lint` | `0` | React ESLint 门禁通过 |
| 5 | 完整`hack/tests/e2e/i18n`，真实后端、端口`5667`、PostgreSQL fixture、`--workers=1` | `1` | 首轮`34/40`通过；6 项失败均由 VXE 选择器残留和字典页缺稳定筛选契约导致 |
| 6 | 定向运行`TC003`、`TC004`、`TC005`和`TC010` | `0` | 原失败范围`9/9`通过 |
| 7 | 完整`hack/tests/e2e/i18n`，同一真实运行环境 | `0` | `40/40`通过，耗时`1.9 min` |
| 8 | 完整`hack/tests/e2e/auth`，同一真实运行环境 | `1` | 首轮`19/20`通过；品牌 Logo 用例错误地把图片直接父节点当作品牌容器 |
| 9 | 定向运行`TC007-brand-logo-assets.ts`后重跑完整 auth | `0` | 定向`3/3`、完整 auth`20/20`通过 |
| 10 | 定向运行租户`TC001`、`TC002`、`TC006`和`TC009` | `1` | 首轮`6/10`通过；3 项因宿主机缺少`psql`客户端未进入业务断言，1 项暴露登录租户 POM仍使用旧文案 |
| 11 | 通过临时 Docker `psql`适配器重跑首轮失败范围 | `1` | 数据库型用例`3/3`通过；登录选择租户用例进入用户页后因测试场景漏 mock 页面 API，被假 Token 的真实`401`清理会话 |
| 12 | 补齐页面 API mock 并定向重跑登录选择租户 | `1` | 已稳定进入 React 用户页；追踪确认旧鼠标动作只聚焦 Beta 选项，实际仍提交默认 Alpha |
| 13 | 使用键盘完成 Semi Select 变更并显式断言 Beta 后定向重跑 | `0` | 登录选择租户`1/1`通过 |
| 14 | 完整重跑租户`TC001`、`TC002`、`TC006`和`TC009` | `0` | `10/10`通过，耗时`38.7 s` |
| 15 | `pnpm --dir apps/lina-web exec vitest run src/features/dashboard src/features/about src/features/profile` | `0` | 6 个测试文件、9 个测试通过，覆盖图表、插件 slot、API Docs 语言、系统信息、资料更新、头像失败重试、密码校验、安全和通知页签 |
| 16 | 完整`hack/tests/e2e/dashboard`、`hack/tests/e2e/about`及个人资料/密码定向 E2E | `0` | `29/29`通过，耗时`1.9 min` |
| 17 | 完整`hack/tests/e2e/iam/menu`，真实后端、端口`5667`、PostgreSQL fixture、`--workers=1` | `0` | 菜单 CRUD 与权限`23/23`通过 |
| 18 | 完整`hack/tests/e2e/iam/role`，同一真实运行环境 | `0` | 角色 CRUD、授权用户、批量删除、权限抽屉关闭和选择模式`18/18`通过，耗时`1.1 min` |
| 19 | `pnpm --dir apps/lina-web exec vitest run src/features/iam/user/user-page.test.tsx` | `0` | 用户 capability 与`system:user:resetPwd`权限契约`3/3`通过 |
| 20 | 完整`hack/tests/e2e/iam/user`，同一真实运行环境 | `0` | 用户工作流`29/29`通过，耗时`2.0 min` |
| 21 | 完整`hack/tests/e2e/iam`，同一真实运行环境 | `0` | IAM 串行门禁`70/70`通过，耗时`4.2 min` |
| 22 | `pnpm --dir apps/lina-web typecheck` | `0` | 宿主应用和源码插件 UI TypeScript 检查通过 |
| 23 | `pnpm --dir apps/lina-web test:unit -- src/layout/workbench-layout.test.tsx src/features/settings/dict/dict-options.test.tsx` | `0` | 脚本执行完整 React 单测，61 个文件、202 个测试通过；新增 keepAlive 状态保留用例通过 |
| 24 | 完整`hack/tests/e2e/settings/dict`，真实后端、端口`5667`、PostgreSQL fixture、`--workers=1` | `1` | 首轮`35/36`通过；`TC002b`因两个同名创建 Toast 导致全页面文本定位违反严格模式 |
| 25 | 定向运行`TC002b` | `0` | 等待字典数据`POST /dict/data`响应并将断言限定到最新 Semi Toast 后`1/1`通过 |
| 26 | 增加字典表格列宽、横向滚动和固定操作列后重跑完整字典目录 | `130` | 发现整行点击落入固定删除列；已人工检查`TC002b`失败截图和`TC002c`中断截图后主动终止无效回归 |
| 27 | 修复字典类型 POM点击业务单元格后完整运行`TC002-dict-data-crud.ts` | `0` | 字典数据选择、创建、编辑和删除`4/4`通过 |
| 28 | 完整`hack/tests/e2e/settings/dict`，同一真实运行环境 | `0` | 字典串行门禁`36/36`通过，耗时`3.2 min` |
| 29 | `pnpm --dir apps/lina-web exec eslint src/features/settings/dict/dict-page.tsx src/layout/workbench-layout.test.tsx --max-warnings 0` | `0` | 本轮 React 文件定向 ESLint 通过 |
| 30 | `pnpm --dir apps/lina-web lint` | `1` | 当前完整 lint 仅在未由本轮修改的`src/features/iam/role/role-drawer.tsx`报告 2 个错误，已作为独立存量问题记录 |
| 31 | 检索字典 E2E 与 POM中的`.ant-*`、`.vxe-*`及 Ant Design 导入 | `0` | 无匹配，字典测试资产已清除 Ant/VXE 契约 |
| 32 | 完整`hack/tests/e2e/settings/config`，真实后端、端口`5667`、PostgreSQL fixture、`--workers=1` | `0` | 配置串行门禁`35/35`通过，耗时约`2.5 min` |
| 33 | 首轮完整`TC001-file-management.ts` | `1` | `10/18`通过；8 项失败暴露 Semi 上传双 input、图片上传空白、排序点击点、详情标题、开关 ARIA 和复选框点击层契约差异 |
| 34 | 修复文件页和 POM 后定向重跑首轮 8 个失败项 | `0` | `8/8`通过；图片上传弹窗恢复为可拖拽和可点击区域 |
| 35 | 完整`TC001-file-management.ts` | `0` | 独立造数和清理后的文件页面工作流`18/18`通过，耗时`47.6 s` |
| 36 | 完整`hack/tests/e2e/settings/file` | `0` | 文件页面、公共上传访问和上传人数据权限`22/22`通过，耗时`48.7 s` |
| 37 | `pnpm --dir apps/lina-web typecheck`及`vitest run src/router/project-menu.test.tsx src/features/settings/settings-pages.test.tsx` | `0` | TypeScript 通过；隐藏宿主路由和 Settings 投影`15/15`通过 |
| 38 | 首轮完整源码插件消息 E2E | `1` | `3/10`通过；7 项失败一致证明`/system/message`未注册到宿主补充路由，页面只渲染工作台空壳 |
| 39 | 新增消息隐藏宿主路由后定向重跑首轮 7 个失败项 | `0` | 直达、详情并单条已读、全部已读、单删、清空确认和分页`7/7`通过 |
| 40 | 完整`apps/lina-plugins/linapro-content-notice/hack/tests/e2e/message` | `0` | 消息面板、列表完整工作流和用户消息自隔离`10/10`通过，耗时`1.1 min` |
| 41 | 检索文件和消息 E2E/POM中的`.ant-*`、`.vxe-*`及 Ant/VXE 标识 | `0` | 无匹配，文件和消息测试资产已使用 React/Semi 稳定契约 |
| 42 | `pnpm --dir apps/lina-web exec vitest run src/api/system/job.test.ts src/features/scheduler/scheduler.test.tsx` | `0` | Scheduler API 路径契约和三个 React 页面渲染测试`2/2`通过 |
| 43 | `pnpm --dir apps/lina-web typecheck` | `0` | Scheduler 页面、API 适配和源码插件 UI TypeScript 检查通过 |
| 44 | 定向 ESLint：Scheduler API 与三个页面，`--max-warnings 0` | `0` | 本轮 Scheduler TypeScript/TSX 文件无 ESLint 错误或警告 |
| 45 | `make i18n.check` | `0` | 宿主和插件运行时消息、前端 key 覆盖全部通过；仅报告旧 Vue 工作台既有 module-level `$t()`警告 |
| 46 | `pnpm --dir hack/tests test:validate` | `0` | E2E 治理通过，共校验 17 个 scope 下的 257 个测试文件 |
| 47 | 完整`hack/tests/e2e/scheduler/job`，增加`E2E_HOST_ONLY_PLUGINS=1` | `0` | 18 个测试文件、实际`19/19`通过，耗时`58.1 s` |
| 48 | Scheduler 作用域`git diff --check`、未跟踪文件尾随空白扫描、JSON 解析及 Ant/VXE 静态检索 | `0` | 差异和资源格式通过；Scheduler 页面、POM 与 E2E 无 Ant/VXE 残留 |
| 49 | 完整`hack/tests/e2e/extension/plugin`，真实后端、端口`5667`、PostgreSQL fixture、`--workers=1` | `0` | `38 passed / 1 skipped / 0 failed`，耗时`5.1 min`；唯一跳过项为非 host-only 环境专用`TC009` |
| 50 | `pnpm --dir hack/tests test:validate` | `0` | 校验 17 个 scope 下的 257 个 E2E 文件；6 个 smoke 文件、239 个串行文件，治理门禁通过 |
| 51 | `pnpm --dir apps/lina-web test:unit` | `0` | 最终完整 React 单测 62 个文件、`211/211`通过 |
| 52 | `pnpm --dir apps/lina-web typecheck`、`lint`和`build` | `0` | 双 TypeScript 配置、完整 ESLint 与生产构建通过；构建转换 3318 个模块 |
| 53 | `make i18n.check`及插件治理范围 JSON、`git diff --check`、Ant/VXE 生产依赖与源码扫描 | `0` | i18n 三项覆盖、JSON 与差异格式通过；React 生产代码无 Ant/VXE 依赖、导入或样式残留 |
| 54 | lint 修复后定向运行角色`TC004`、`TC005`和插件`TC006` | `1` | 角色抽屉`5/5`通过；插件详情 API 返回`200`，但按需挂载的 Semi Modal 未进入可见 Portal |
| 55 | 将插件治理 Modal 改为首帧提交后打开，再定向运行`TC006-plugin-host-service-authorization-review.ts` | `0` | 安装、授权、启用和详情完整链路`1/1`通过，耗时`39.6 s` |
| 56 | 使用 Node.js`22.22.0`逐个运行 9 个官方源码插件`frontend/plugin-ui.test.ts`并执行`pnpm typecheck` | `0` | 全部 React 插件页面、API 投影、i18n 资源和租户 Header slot 聚焦单测通过；TypeScript 检查通过 |
| 57 | 使用真实 PostgreSQL、Go、React 工作台和`--workers=1`逐个运行 9 个官方源码插件完整 E2E | `0` | AI`23`、通知`48`、Demo Source`32`、登录日志`22`、在线用户`16`、操作日志`20`、服务监控`11`、组织`49`、租户`67`，合计`288/288`通过 |
| 58 | `pnpm --dir apps/lina-web exec vitest run src/plugin-ui/hosted-bridge.test.ts src/plugin-ui/hosted-page.test.tsx src/router/project-menu.test.tsx`及`pnpm --dir apps/lina-web typecheck` | `0` | 受限消息桥接、HostedPage 和动态菜单聚焦单测`25/25`通过；覆盖 sandbox、source/nonce/generation、路径、请求 ID、超时/取消、大小限制、上传下载和会话失效；TypeScript 检查通过 |
| 59 | 从`hack/tests`运行`apps/lina-plugins/linapro-demo-dynamic/hack/tests/e2e/runtime`，使用真实 PostgreSQL、Go、React 工作台和`--workers=1` | `0` | 5 个动态插件测试文件、`19/19`通过，耗时`10.6 min`；覆盖上传安装、iframe/new-window、Wasm bridge、CRUD、附件、分页、上传限制、双语、权限树和 manifest 投影 |
| 60 | `GF_GCFG_FILE=manifest/config/config.template.yaml go test ./internal/service/auth -run '^TestCodeAuthInvalidCredentialsMessageKey$' -count=1`，目录`apps/lina-core` | `0` | 登录失败业务错误使用标准键`error.auth.login.invalidCredentials` |
| 61 | 设置阶段十 Playwright 环境、`E2E_VISUAL_AUDIT_DIR=temp/20260714/phase-10-visual-audit/accepted`和`E2E_DYNAMIC_WASM_PATH=temp/output/linapro-demo-dynamic.wasm`，运行`playwright test --config=hack/tests/temp/phase10-visual-audit/playwright.config.ts --workers=1 --reporter=list` | `0` | 最终完整重拍`37/37`通过，耗时`2.0 min`；`audit-results.jsonl`共 37 行且无页面错误 |
| 62 | `jq -s`汇总最终`audit-results.jsonl`并逐张打开`01`至`37`截图审查 | `0` | 仅`32-demo-dynamic.png`命中`plugin.yaml`和`profile.yaml`，人工确认两者为业务文件名而非 raw i18n key |
| 63 | 从`hack/tests`使用 Playwright CLI 依次打开 6 个宽表页面，等待可见`.semi-table-body`后比较`clientWidth`、`scrollWidth`并写入`scrollLeft` | `0` | 用户、任务、执行日志、登录日志、在线用户和岗位页面`6/6`均存在可工作的横向滚动区域 |
| 64 | 完整`hack/tests/e2e/auth`，真实后端、端口`5667`、PostgreSQL fixture、`--workers=1` | `0` | 最终 auth`21/21`通过；中文显示“用户名或密码错误”，英文显示“Invalid username or password” |
| 65 | `GF_GCFG_FILE=temp/phase10/config.yaml go test ./internal/service/auth -count=1`，目录`apps/lina-core` | `0` | 认证 service 完整包测试通过 |
| 66 | `make i18n.check` | `0` | 运行时文案、消息覆盖和前端 key 覆盖通过；37 条警告均来自阶段十三前保留的`apps/lina-vben`旧代码 |
| 67 | `pnpm --dir hack/tests test:validate` | `0` | 校验 17 个 scope 下的 257 个 E2E 文件；6 个 smoke 文件、239 个串行文件 |
| 68 | `make lint` | `0` | `lina-core`、`linactl`、官方插件工作区及全部官方源码插件无 lint 或 deadcode 问题 |
| 69 | `git diff --check` | `0` | 当前工作区差异无尾随空白或补丁格式错误 |

Playwright 命令统一使用以下运行参数：

```bash
PATH="$HOME/.nvm/versions/node/v22.22.0/bin:$PATH" \
E2E_BASE_URL=http://127.0.0.1:5667 \
E2E_BACKEND_BASE_URL=http://127.0.0.1:9120 \
E2E_API_BASE_URL=http://127.0.0.1:9120/api/v1/ \
E2E_PUBLIC_BASE_URL=http://127.0.0.1:9120 \
E2E_WORKSPACE_BASE_PATH=/admin \
E2E_PG_URL='postgres://postgres:postgres@127.0.0.1:55432/linapro?sslmode=disable' \
E2E_PSQL_BIN="$PWD/temp/20260714/psql-docker-e2e" \
./hack/tests/node_modules/.bin/playwright test <scope> \
  --config=hack/tests/playwright.config.ts \
  --workers=1 --reporter=list
```

Scheduler 完整回归额外设置`E2E_HOST_ONLY_PLUGINS=1`。当前数据库中`linapro-monitor-server`为`uninstalled`，因此不存在该插件注册的“服务监控采集”任务；测试使用宿主内置任务基线反映当前真实安装状态，不为测试擅自安装插件。

## 失败项

- 当前失败：无。`RW-300`至`RW-315`均具备当前工作区验证证据。
- 已解决失败：菜单、角色、字典、任务组、任务与任务日志测试残留`.vxe-*`定位；React 页面缺少菜单、角色、字典与调度表格稳定分区；字典页缺少真实类型和数据筛选。修复后定向`9/9`及完整 i18n`40/40`通过。品牌 Logo POM改为读取`.workbench-brand`容器，修复 React 图片与文本为相邻节点时的错误断言；定向`3/3`及完整 auth`20/20`通过。租户 POM已迁移到 React storage、Semi Select/SideSheet、React 404 和当前 i18n 文案；补齐登录成功后页面 API mock，并保持 Token、租户 ID、权限隐藏和路由业务断言。IAM POM已迁移到 Semi SideSheet、Modal、Table、Select 和严格 textbox 定位；用户重置密码权限由错误的`system:user:reset-password`改为 Lina 权威契约`system:user:resetPwd`；导出确认兼容当前“确定/OK”文案；角色多选改用 Semi 可见选项契约。字典 POM已迁移到 Semi Table、SideSheet、Popconfirm 和 Toast，CRUD 用例改为独立造数与清理；统一双 Sheet 导入导出、内置记录保护、级联删除、运行时字典失效和 Tab 分页保持均通过完整`36/36`回归。文件页补齐稳定行锚点、三类预览、上传反馈、详情、批量确认和图片上传可见区域，18 个页面用例均独立造数和清理。消息中心补齐 Semi 铃铛面板、隐藏宿主路由、详情、已读、删除、清空和分页反馈；插件 E2E 通过单独 ESM package 边界执行，不引入前端依赖或独立仓库。Scheduler 页面已完整迁移到 React/Semi，公共新增只允许 Shell，内建任务保持只读；Shell 开关、插件暂停降级、Cron/时区预览、触发/终止、日志详情与清理均通过完整`19/19`回归。插件治理补齐动态权限文案、路由标题词典、停用/卸载后的历史页签清理和 generation 刷新提示；完整插件目录`38 passed / 1 skipped`。完整 React lint 的角色抽屉 2 个错误已通过纯函数拆分和会话组件重置修复；插件治理 Modal 改为首帧提交后打开，定向 E2E 重新通过。全量单测中用户权限用例复用同一`Response`导致并发消费失败，改为每次请求创建新响应并只放宽该异步断言至 5 秒后，最终`211/211`通过。
- 视觉审查解决项：角色权限字符原先可能覆盖相邻列，现使用固定列宽、Tag 内部省略和 Tooltip 收口；服务监控运行时长原先泄漏`{value}`，现正确插值；登录失败原先因错误键`error.auth.invalid.credentials`回退英文，现改为标准键`error.auth.login.invalidCredentials`并增加 Go 与中英文 E2E 覆盖。三项修复后重新完整捕获`37/37`，没有复用局部补拍作为最终证据。
- 工具诊断：宽表首轮通用 overflow 探测在页面未稳定或命中隐藏表体时产生假阴性；改为等待可见`.semi-table-body`后，6 个页面全部确认`scrollWidth > clientWidth`且`scrollLeft`可写。该诊断失败不属于产品失败。
- 当前环境限制：PostgreSQL、Go、Vite 和 Playwright Chromium 可用；宿主机未安装`psql`，本轮通过不入库的临时 Docker 适配器调用容器内客户端。应用内浏览器没有可用实例；用户已明确允许 Playwright CLI，本阶段通过该入口完成正式截图、交互检查和图片审查。

## 截图与人工审查

- 首次加载矩阵：共 32 个可达页面，以真实`menus/all`叶子路由、`apps/lina-web/src/router/host-routes.ts`补充路由、认证入口和动态插件菜单契约为权威来源；运行时统一增加`/admin`前缀。`host-pages.tsx`中没有路由投影的`about/index`及源码插件清单中按治理要求未投影的`/tenant/plugins`不属于可达核心页面。

| 页面组 | 数量 | 路由 | 状态 |
| --- | ---: | --- | --- |
| 认证 | 1 | `/auth/login` | `Passed` |
| Dashboard 与 About | 4 | `/dashboard/analytics`、`/dashboard/workspace`、`/about/system-info`、`/about/api-docs` | `Passed` |
| 个人中心与宿主管理 | 13 | `/profile`、`/system/menu`、`/system/user`、`/system/role`、`/system/role-auth/user/1`、`/system/config`、`/system/dict`、`/system/file`、`/system/message`、`/system/job-group`、`/system/job`、`/system/job-log`、`/system/plugin` | `Passed` |
| AI 源码插件 | 4 | `/ai/providers`、`/ai/models`、`/ai/tiers`、`/ai/invocations` | `Passed` |
| 通知与 Demo 源码插件 | 2 | `/system/notice`、`/extension/linapro-demo-source-sidebar-entry` | `Passed` |
| 监控源码插件 | 4 | `/monitor/loginlog`、`/monitor/online`、`/monitor/operlog`、`/monitor/server` | `Passed` |
| 组织与租户源码插件 | 3 | `/system/dept`、`/system/post`、`/platform/tenants` | `Passed` |
| 动态插件 | 1 | `/extension/linapro-demo-dynamic` | `Passed` |

- 交互矩阵：用户新建 SideSheet、插件详情 Modal、配置提交成功、用户筛选结果和登录失败反馈各捕获 1 张，共 5 张；全部显示稳定终态，没有 loading、骨架屏或半渲染状态。
- 图片审查矩阵：已逐张检查 raw i18n key、文本截断、组件重叠、空白页和错误反馈缺失；最终结果无页面错误。`32-demo-dynamic.png`命中的`plugin.yaml`和`profile.yaml`是页面展示的真实业务文件名，不是翻译键。
- 截图目录：最终接受集位于`temp/20260714/phase-10-visual-audit/accepted/`，审查元数据位于同目录`audit-results.jsonl`。
- 失败截图人工检查：已检查租户用户编辑 SideSheet、创建/更新结果、登录租户选择页、登录失效页和租户工作台；并逐一检查用户 CRUD 4 张、导出 1 张、重置密码 2 张和角色关联 3 张失败截图。字典范围检查 3 张失败截图：首张确认创建类型和创建数据产生两个同名 Toast，后两张确认固定操作列使整行点击误触删除确认框。文件范围逐张检查 8 张截图，确认页面无崩溃，失败分别来自上传双 input、图片上传空白、排序点击点、详情标题、开关 ARIA 和复选框点击层。消息范围逐张检查 13 张截图，确认未读数正常但主内容为空，根因是消息页面未进入宿主补充路由。Scheduler 回归产生的失败截图也已逐张检查，未发现页面崩溃、raw i18n key 或明显布局重叠。这些历史截图只用于根因诊断，最终结论仅使用本次完整重拍的接受集。
- 视觉审查：`RW-314`已完成。32 个首次加载页面和 5 个交互终态均为可接受状态；`09-system-role.png`、`28-monitor-server.png`和`37-interaction-login-error.png`分别证明三项视觉缺陷已消失。宽表的右侧固定操作列在首屏会覆盖尚未横向滚动到的中间列，但 6 个页面均有可工作的横向滚动区域，未发现单元格越界。
- 无障碍证据限制：截图只能证明可见文案、布局、颜色以外的错误表达和稳定终态，不能单独证明完整键盘顺序、焦点恢复、屏幕阅读器名称、缩放回流或 WCAG 符合性。现有 E2E 与 DOM 语义断言覆盖关键交互，但本阶段不声明完整无障碍合规。
- E2E 质量审查：已触发。当前修复保留菜单、角色、字典、调度、租户 ID、Token 重签、旧 Token 失效、权限隐藏和路由裁剪业务断言；Dashboard/About/API Docs/个人中心按既有全目录和关键写入用例验证，未用元素存在性替代业务结果；IAM 已通过完整`70/70`串行回归。配置、字典、文件和消息共`103/103`通过；Scheduler 完整`19/19`通过。插件治理完整目录`38 passed / 1 skipped`，覆盖热升级、Host Services、授权、操作权限、生命周期、依赖、状态反馈、菜单/页签刷新、builtin 隐藏和 owner 能力；最终 Modal 修复后再跑授权审查`1/1`。9 个官方源码插件完整 E2E 合计`288/288`，覆盖页面、slot、CRUD、权限、双语、生命周期和模块降级。动态插件聚焦单测`25/25`、真实 E2E`19/19`通过，覆盖消息桥接攻击面、会话失效、Wasm 运行时、CRUD、附件、分页、上传限制、双语和权限投影。

## 影响评估

| 规则域 | 结论 | 证据或说明 |
| --- | --- | --- |
| 架构 | 有宿主隐藏路由影响 | `/system/message`与`/profile`一样由 React 宿主补充路由提供，不依赖侧边栏菜单；不改变`lina-core`、插件或后端能力边界 |
| 插件 | 有测试执行边界影响 | `apps/lina-plugins/package.json`仅声明`private`和 ESM 类型，支持父仓库内 Playwright 加载；不创建独立仓库、不声明依赖，插件发现、装配和动态隔离契约不变 |
| 前端 UI | 有影响 | 配置、字典、文件、消息、Scheduler 和插件治理全部使用 Semi；插件详情、安装、授权、升级和卸载统一使用按需加载 Modal，首帧提交后打开，避免 Portal 丢失；工作台 keepAlive 保留 Tab 切换状态并清理已失效插件页签 |
| API | 有错误本地化元数据修正 | `AUTH_INVALID_CREDENTIALS`的`messageKey`由错误的派生值修正为既有标准键`error.auth.login.invalidCredentials`；`errorCode`、HTTP 路径、字段结构、权限标签和认证判定不变 |
| 后端与 DI | 有局部错误定义影响 | 修改`auth_code.go`并增加同包单元测试；未修改 service 构造、依赖注入、路由、数据库访问或运行时装配 |
| 数据库 | 无影响 | 未修改 SQL、DAO、DO、Entity、索引或数据模型 |
| 数据权限 | 无影响 | 未改变数据读取、写入、权限标签或租户边界；Scheduler 数据权限用例已通过 |
| 缓存一致性 | 有前端失效影响 | 服务端仍为权威源；Scheduler 写入刷新对应 TanStack Query 列表；插件状态变化刷新认证上下文、菜单、插件 UI registry 和 generation，未新增跨实例或进程内后端缓存 |
| i18n | 有资源与验证影响 | Scheduler、插件治理和认证错误反馈均使用现有中英文资源；`make i18n.check`通过，旧`apps/lina-vben`保留 37 条非阻断 module-level`$t()`警告 |
| 开发工具 | 无持久化影响 | 未修改脚本、构建或 CI；命令固定使用 Node.js`22.22.0`；Shell 支持状态来自后端公开配置，未新增平台专属脚本 |
| 测试 | 有影响 | Scheduler 与插件治理 POM/E2E 已迁移到 React/Semi 契约；插件目录`38 passed / 1 skipped`、React 单测`211/211`、官方源码插件 E2E`288/288`、最终 auth`21/21`和视觉捕获`37/37`通过；E2E 治理校验 257 个文件通过 |
| 文档 | 有影响 | 本阶段执行记录已更新为`Passed`，Tasklist 已在证据完整后勾选`RW-312`至`RW-315` |

## 变更文件

- 新增：`docs/2026-07-13-react-workbench-phase-10-execution-record.md`。
- 修改：`apps/lina-web`菜单、角色、用户、配置、字典、文件、消息、插件治理、工作台 keepAlive/generation 刷新、宿主补充路由和调度页面；对应宿主 POM、Settings、IAM、i18n、auth、租户、内容通知和插件治理 E2E；插件集合 ESM 测试边界及中英文资源；`apps/lina-core/internal/service/auth/auth_code.go`、对应单元测试和登录失败 E2E。
- 删除：无。
- 未执行：commit、push、PR、merge、tag 或发布。

## 审查结论

- 审查范围：当前阶段相关`apps/lina-web`页面、源码插件 React 页面、宿主与插件 POM、认证错误定义和测试、i18n/插件治理 E2E、最终`37/37`截图、完整运行输出与未跟踪文件。
- 已读取规则：`AGENTS.md`、`.agents/rules/workflow.md`、`.agents/rules/documentation.md`、`.agents/rules/architecture.md`、`.agents/rules/cache-consistency.md`、`.agents/rules/api-contract.md`、`.agents/rules/backend-go.md`、`.agents/rules/frontend-ui.md`、`.agents/rules/testing.md`、`.agents/rules/i18n.md`、`.agents/instructions/markdown-format.instructions.md`、`goframe-v2`、`product-design:audit`和`DCjanus-tech-doc`。
- 严重问题：`0`。
- 警告：`make i18n.check`仍报告阶段十三前保留的`apps/lina-vben`旧代码 37 条 module-level`$t()`警告；`32-demo-dynamic.png`的自动扫描命中两个业务文件名；截图不能证明完整无障碍合规。三项均不阻塞阶段十。
- 剩余风险：旧工作台仍存在，工具和 CI 仍指向旧路径；必须按阶段十一至十三顺序完成切换，当前不得提前删除`apps/lina-vben`。

## 阶段验收

- Tasklist 阶段验收：React 工作台在独立端口达到宿主和官方插件功能等价。
- 验收结果：`Passed`。
- Tasklist 勾选：`RW-300`至`RW-315`均已勾选；阶段十完成，下一阶段为阶段十一`RW-320`至`RW-349`。
