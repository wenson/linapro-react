# React 工作台阶段十一执行记录

## 文档定位

本文记录阶段十一“一次性切换开发工具和 CI”的当前工作区事实，供开发者核对`RW-320`至`RW-349`的实现、验证和审查证据。本文不替代 Git commit、远端 CI 或发布证据；本阶段未执行 commit、push、PR、merge、tag 或发布。

## 阶段信息

| 字段 | 值 |
| --- | --- |
| 阶段 | 阶段十一：一次性切换开发工具和 CI |
| Tasklist 版本 | `v1.2` |
| 任务范围 | `RW-320`至`RW-349` |
| 状态 | `Passed` |
| 开始时间 | `2026-07-14 13:27 CST` |
| 完成时间 | `2026-07-14 15:39 CST` |
| 执行分支 | `feat/react-workbench-replacement` |
| 宿主基线 | `7d149838e77fe3d2b1bdda5ebb9d46679f79fd23` |
| 插件基线 | 父仓普通目录基线`1b90535404d1563a045efe3888dd9db6d1bf5e29` |

## 范围与边界

- 目标：把默认开发、构建、测试、i18n 和 CI 入口从`apps/lina-vben`一次性切换到`apps/lina-web`。
- 修改范围：根`Makefile`、`hack/tools/linactl`、`hack/tests`、`apps/lina-web`的 i18n 入口、相关`lina-core`仓库根 fixture、`.github/workflows`、冻结 Tasklist 和本执行记录。
- 禁止范围：本阶段没有删除`apps/lina-vben`，没有改变认证、用户、租户、RBAC、数据权限、数据库或业务 API。
- 前置门禁：阶段十`RW-300`至`RW-315`已通过；根`.contributing`已授权 React 工作台替换范围；产品不使用 OpenSpec。

## 任务状态

| 任务 | 状态 | 证据 |
| --- | --- | --- |
| `RW-320` | `Passed` | 先把`linactl`测试期望改到 React 路径，红灯覆盖安装、Vite、构建、PID、日志、portcheck 和 i18n |
| `RW-321` | `Passed` | `internal/frontend`安装目录为`apps/lina-web` |
| `RW-322` | `Passed` | Vite 命令为`apps/lina-web/node_modules/vite/bin/vite.js` |
| `RW-323` | `Passed` | 前端进程工作目录为`apps/lina-web` |
| `RW-324` | `Passed` | 构建来源为`apps/lina-web/dist`；真实 build 生成宿主产物 |
| `RW-325` | `Passed` | status 和真实 smoke 显示`Lina Web` |
| `RW-326` | `Passed` | PID 为`temp/pids/lina-web.pid`，stop 后删除 |
| `RW-327` | `Passed` | 日志为`temp/lina-web.log` |
| `RW-328` | `Passed` | portcheck 使用`apps/lina-web/vite.config.ts` |
| `RW-329` | `Passed` | 宿主扫描根为`apps/lina-web/src/**/*.{ts,tsx}` |
| `RW-330` | `Passed` | 官方源码插件扫描根为`frontend/**/*.{ts,tsx}` |
| `RW-331` | `Passed` | 运行时 i18n 扫描器不再解析`.vue`或旧 Vben locale |
| `RW-332` | `Passed` | 根`Makefile`前端目录、PID 和日志变量全部切换 |
| `RW-333` | `Passed` | E2E 校验从`apps/lina-web`执行`@lina/web`的`i18n:check` |
| `RW-334` | `Passed` | POM、共享支持和直接 DOM 用例只依赖 Semi/ARIA/业务 test id；未降低业务断言 |
| `RW-335` | `Passed` | 本阶段没有新增或移动 E2E，用例 scope 无需修改；257 个文件、17 个 scope 校验通过 |
| `RW-336` | `Passed` | 前端单测 workflow 的 Node、lockfile 和工作目录全部切换 |
| `RW-337` | `Passed` | E2E workflow 的 Node、lockfile、安装目录和日志 artifact 全部切换 |
| `RW-338` | `Passed` | host-only build、image publish、make smoke 已切换；OpenSpec 完成门禁 workflow 和调用链已移除 |
| `RW-339` | `Passed` | 新增逻辑仅使用 Go 或 Node；没有新增平台专属 Shell 业务逻辑 |
| `RW-340` | `Passed` | `cd hack/tools/linactl && go test ./... -count=1`通过 |
| `RW-341` | `Passed` | `env.check`、`i18n.check`、`dev`、`status`、`stop`和`build`真实 smoke 通过 |
| `RW-342` | `Passed` | 本文“跨平台影响”记录 Windows、Linux 和 macOS 路径与进程结论 |
| `RW-343` | `Passed` | `frontend.go`和`toolutil.go`路径切换及单测通过 |
| `RW-344` | `Passed` | `devservice.go`工作目录、归属识别、PID、日志和显示名切换并完成真实 smoke |
| `RW-345` | `Passed` | `portcheck.go`和`wasmbuilder_output.go`切换并完成全量 Go 测试 |
| `RW-346` | `Passed` | `runtimei18n`宿主、语言包、插件 TSX 扫描根和 fixture 已同步 |
| `RW-347` | `Passed` | `command_build.go`、`main_test.go`和 make smoke fixture 已切换 |
| `RW-348` | `Passed` | Stoplight、React session namespace 和 locale JSON 路径已更新，断言未放宽 |
| `RW-349` | `Passed` | HEAD 的 25 个直接硬编码文件逐项复查；仅双语`linactl`README 按`RW-402`留到阶段十四 |

## 命令与结果

| 序号 | 命令 | 退出码 | 结果 |
| --- | --- | --- | --- |
| 1 | `cd hack/tools/linactl && go test ./internal/portcheck ./internal/runtimei18n . -count=1` | `0` | 测试先行修改后的定向回归通过 |
| 2 | `cd hack/tools/linactl && go test ./... -count=1` | `0` | 全量`linactl`测试通过 |
| 3 | `pnpm --dir hack/tests test:validate` | `0` | 257 个 E2E 文件、17 个 scope 通过；manifest 无需调整 |
| 4 | `pnpm --dir apps/lina-web typecheck` | `0` | React 工作台与插件 UI 类型检查通过 |
| 5 | `ruby ... YAML.parse_file ... .github/workflows/*.yml` | `0` | 21 个现存 workflow 语法全部可解析 |
| 6 | `go run ./hack/tools/linactl env.check` | `0` | Go、Node、pnpm、Vite、Playwright 和 PostgreSQL 全部满足版本要求 |
| 7 | `go run ./hack/tools/linactl i18n.check` | `0` | 0 个运行时硬编码违规；消息和前端 key coverage 通过 |
| 8 | `go run ./hack/tools/linactl dev plugins=1 skip_wasm=true backend_port=19120 frontend_port=15666` | `0` | `Lina Core`和`Lina Web`均 ready |
| 9 | `go run ./hack/tools/linactl status backend_port=19120 frontend_port=15666` | `0` | 两个服务均为`running`，PID 和日志路径正确 |
| 10 | `go run ./hack/tools/linactl stop backend_port=19120 frontend_port=15666` | `0` | 两个服务停止，两个 PID 文件删除，端口释放 |
| 11 | `go run ./hack/tools/linactl build plugins=0 platforms=darwin/amd64` | `0` | React 前端、packed manifest 和宿主二进制构建通过 |
| 12 | `make i18n.check` | `0` | 根入口 i18n 门禁通过 |
| 13 | `make lint` | `0` | 宿主、工具和 11 个官方插件 lint/deadcode 门禁通过 |
| 14 | `git diff --check` | `0` | 无空白错误 |

所有 Node 命令均显式使用 Node.js`22.22.0`路径。

## 失败项与修复

- 第一次 E2E manifest 校验发现语言选择项硬编码“简体中文”。已增加双语资源键并改为`t()`，重跑后通过。
- 默认后端端口`9120`被同一工作区的非`linactl`旧进程占用。未终止该进程，改用`19120/15666`完成 smoke。
- 第一次备用端口启动使用模板数据库连接，因本机口令不匹配退出；第二次 host-only 启动又被已有插件状态一致性门禁拒绝。最终使用阶段十已验证的本地配置和`plugins=1 skip_wasm=true`通过，随后完整 stop 并恢复临时配置。
- 额外执行的`pnpm --dir hack/tests exec tsc --noEmit`发现 5 个既有 E2E 类型问题。该命令不是阶段十一冻结门禁；问题已保留为阶段十三全量 E2E 前的修复输入，未用忽略或放宽断言掩盖。
- 外部阻断：无。`RW-279`的正式提交历史证据仍受禁止 commit 的授权边界约束，不影响本阶段通过。

## 跨平台影响

| 平台 | 结论 | 证据 |
| --- | --- | --- |
| Windows | 路径仍通过`filepath.Join`和`toolutil.ExecutableName`生成；PID、日志、进程归属和 Vite 二进制不依赖 POSIX 路径字面量 | `linactl`全量测试及现有 Windows smoke 编排 |
| Linux | GitHub Actions 使用`apps/lina-web`的 Node、lockfile、工作目录和 Vite fixture；没有把 shell fixture 变成产品业务逻辑 | workflow YAML 审查与 make smoke fixture |
| macOS | 在 darwin/amd64 完成真实`env.check/dev/status/stop/build`；备用端口全部释放 | 本地 smoke 输出和 PID/端口复查 |
| Node | E2E 路径使用`path.resolve`，不手工拼接平台分隔符 | `validate-e2e.mjs` |
| Go | 安装、构建、复制、PID、日志和仓库根路径继续使用`filepath`与跨平台进程工具 | Go 测试、lint 和真实 build |

## 25 个硬编码文件复查

从 HEAD 基线运行：

```bash
git grep -l -E 'apps/lina-vben|web-antd|lina-vben' HEAD \
  -- Makefile make.cmd hack apps/lina-core .github/workflows
```

结果正好为 25 个文件。当前工作区对同一生产与测试范围复查后，只剩：

- `hack/tools/linactl/README.md`
- `hack/tools/linactl/README.zh-CN.md`

这两个文件由阶段十四`RW-402`明确负责，不是运行时、测试 fixture 或 CI 路径。5 个默认前端相关 workflow 和被删除的 OpenSpec workflow 已逐一处理；`reusable-test-verification-suite.yml`及 main/nightly/release 三个调用方不再含 OpenSpec completion input 或 job。

## E2E 质量审查

- 旧`.ant-*`、`.vxe-*`和 Vben DOM fallback 已从共享 POM、支持代码和直接列表断言移除。
- 表头、菜单、弹窗、Toast、表格和加载状态改为 ARIA role、Semi 容器、业务 test id 或可观察业务文案。
- 没有删除现有 TC 文件，没有移动 scope，没有把可见性、宽度、路由、storage 或消息断言降级为“元素存在”。
- `ant-design:*`仅作为菜单图标字段测试数据保留，不是 Ant Design React DOM 或依赖。
- `ann.vben@gmail.com`仅为已有种子业务数据，不是技术栈或路径引用。

## 变更文件

- 工具链：根`Makefile`和`hack/tools/linactl`的构建、开发服务、前端安装、portcheck、wasm 根识别、i18n 与测试。
- E2E：`validate-e2e.mjs`、共享 UI/插件生命周期支持、POM、Stoplight、session、locale JSON 和 Semi 直接定位器。
- React：`apps/lina-web/package.json`的`i18n:check`入口及语言名称资源化。
- CI：5 个前端相关 reusable workflow、test verification suite 及三个调用方。
- 删除：`.github/workflows/reusable-openspec-changes-complete.yml`。
- 阶段十二前置：`config_path.go`和对应 fixture 已由硬编码复查提前切换，验证记录归入阶段十二。
- 未经授权的 Git 操作：无。

## 审查结论

- 严重问题：0。
- 警告：1；E2E 独立 TypeScript 全量检查有 5 个既有类型问题，必须在阶段十三全量 E2E 前处理。
- 剩余风险：远端 GitHub Actions 未实际运行；本地已完成 workflow 语法、等价命令和真实服务 smoke。
- 阶段验收：默认开发、构建、测试和 CI 入口全部指向`apps/lina-web`。
- 验收结果：`Passed`。
