# React 工作台阶段十三执行记录

## 结论

阶段十三全部门禁已通过：Vue/Vben 工作台已删除，React 19 + Semi Design 工作台成为唯一默认入口；前端、Go、105 个宿主 E2E、官方插件 E2E、两类构建、最终二进制、视觉和父仓插件跟踪门禁均为 0 个有效失败。本文面向维护者，记录`RW-370`至`RW-399`的可复验证据；不包含提交、推送、PR、发布，也不提前实施 TapCanvas 画布。

## 阶段信息

| 字段 | 值 |
| --- | --- |
| 阶段 | 十三：硬切换、删除和全量验证 |
| Tasklist 版本 | `v1.2` |
| 任务范围 | `RW-370`至`RW-399` |
| 状态 | `Passed` |
| 执行日期 | `2026-07-15` |
| 完成时间 | `2026-07-15 14:34 CST` |
| 执行分支 | `feat/react-workbench-replacement` |
| 宿主基线 | `7d149838e77fe3d2b1bdda5ebb9d46679f79fd23` |
| 插件基线 | 父仓普通目录基线`1b90535404d1563a045efe3888dd9db6d1bf5e29` |

## 范围与边界

- 目标：删除旧工作台，完成全量自动化、最终构建、最终运行和人工视觉验收。
- 修改范围：`apps/lina-web`、`apps/lina-plugins`、切换所需`apps/lina-core`、`hack`、CI、治理规则与证据文档。
- 禁止范围：不修改 TapCanvas 画布业务，不接入模型网关，不提交、推送、创建 PR、打标签或发布。
- 运行环境：Node.js`22.22.0`、pnpm`10.30.3`、OrbStack、PostgreSQL`127.0.0.1:55432/linapro`。

## 任务状态

| 任务 | 状态 | 证据 |
| --- | --- | --- |
| `RW-370` | `Passed` | 阶段十、十一、十二执行记录均为`Passed` |
| `RW-371` | `Passed` | `apps/lina-vben`不存在 |
| `RW-372` | `Passed` | 无 Vue/React 产品运行时选择变量或分支；`LINA_WEB_BASE_PATH`只控制 React basePath |
| `RW-373` | `Passed` | `Makefile`、`hack`、CI 和`lina-core`生产路径对`apps/lina-vben`、`web-antd`扫描为 0 |
| `RW-374` | `Passed` | `apps/lina-web`和`apps/lina-plugins`的`.vue`文件为 0 |
| `RW-375` | `Passed` | 两目录无 Vue、Vue Router、Vben 或 Ant Design Vue 运行时导入 |
| `RW-376` | `Passed` | 宿主无`antd`或`@ant-design/icons`导入 |
| `RW-377` | `Passed` | pnpm 依赖图不含宿主 Ant Design React |
| `RW-378` | `Passed` | React 与 ReactDOM 均为`19.2.7`，没有第二个主版本 |
| `RW-379` | `Passed` | React 工作台 typecheck 退出码`0` |
| `RW-380` | `Passed` | Vitest`62/62`文件、`215/215`测试通过 |
| `RW-381` | `Passed` | React lint 和独立 build 均退出码`0` |
| `RW-382` | `Passed` | E2E validator 验证`257`个文件和`17`个 scope |
| `RW-383` | `Passed` | focused scope 已覆盖 auth、dashboard、about、iam、settings、scheduler、extension 和 i18n |
| `RW-384` | `Passed` | 全量宿主 E2E 通过，`.last-run.json`为`passed`且`failedTests=[]` |
| `RW-385` | `Passed` | 官方插件 E2E 为`309 passed`、`7 skipped`、`0 failed`；跳过项仅属于 demo-control 专用启动模式 |
| `RW-386` | `Passed` | host-only 最终构建成功，产物`temp/output/lina` |
| `RW-387` | `Passed` | 11 个官方插件完整构建成功，动态 WASM 已重建 |
| `RW-388` | `Passed` | packed HTML 使用`#root`、React vendor 和`/admin/assets/index-DBPd5ZQD.js` |
| `RW-389` | `Passed` | OrbStack 最终二进制：`/admin/`、主 chunk、favicon 均 200，登录`code=0`，源码插件 ping 为 200/`code=0`；动态插件安装态生命周期 1/1 覆盖 API、WASM、菜单和`/x-assets` |
| `RW-390` | `Passed` | 当前最终构建捕获 4/4 张截图并人工读取；0 浏览器错误、0 空白接受图 |
| `RW-391` | `Passed` | 对 1,502 个已改路径和 291 个新增路径执行等价全面审查；0 critical、0 warning |
| `RW-392` | `Passed` | 13 个旧 Lina 单测逐项映射到 React 等价或更强测试 |
| `RW-393` | `Passed` | `hack/tests/e2e`仍为完整 105 个`TC*.ts`，全量执行通过 |
| `RW-394` | `Passed` | 动态插件既有`TC001`至`TC005`仍存在；源码插件编号连续保留，官方插件 E2E 全量通过 |
| `RW-395` | `Passed` | packed assets 含 favicon、logo、默认头像、Stoplight HTML/CSS/JS；无 Vben 品牌文件 |
| `RW-396` | `Passed` | `linactl test.scripts`、`make i18n.check`和`make lint`均通过 |
| `RW-397` | `Passed` | 父仓索引直接跟踪`apps/lina-plugins`的 999 个交付路径；未跟踪文件、`.gitmodules`、嵌套`.git`和 gitlink 均为 0 |
| `RW-398` | `Passed` | HTML 首屏 preload 不含插件页面、TipTap、ECharts 或 TapCanvas；TipTap、ECharts 与插件页均为独立 lazy chunk |
| `RW-399` | `Passed` | 本文保存命令、退出码、包图、截图、失败修复和风险说明 |

## 命令与结果

| 序号 | 命令或检查 | 退出码 | 结果 |
| --- | --- | --- | --- |
| 1 | `pnpm --dir apps/lina-web typecheck` | `0` | TypeScript 严格检查通过 |
| 2 | `pnpm --dir apps/lina-web lint` | `0` | React ESLint 通过 |
| 3 | `pnpm --dir apps/lina-web test:unit` | `0` | `62/62`文件、`215/215`测试通过 |
| 4 | `pnpm --dir apps/lina-web build` | `0` | React 生产构建通过 |
| 5 | `pnpm --dir hack/tests test:validate` | `0` | `257`个文件、`17`个 scope 通过 |
| 6 | `pnpm --dir hack/tests test:host` | `0` | 105 个宿主用例文件全量通过 |
| 7 | 官方插件 E2E 收口脚本 | `0` | `309 passed`、`7 skipped`、`0 failed` |
| 8 | `go run ./hack/tools/linactl test.scripts` | `0` | linactl 脚本门禁通过 |
| 9 | `make i18n.check` | `0` | 0 violation，14 条非阻断 warning |
| 10 | `HOME=/private/tmp/lina-tapcanvas-home GOCACHE=/private/tmp/lina-tapcanvas-go-cache GOLANGCI_LINT_CACHE=/private/tmp/lina-tapcanvas-golangci-cache XDG_CACHE_HOME=/private/tmp/lina-tapcanvas-xdg-cache make lint` | `0` | 14 个 Go 模块与 guest-sensitive 检查全部通过 |
| 11 | `go run ./hack/tools/linactl build plugins=0` | `0` | host-only Linux/amd64 最终二进制构建通过 |
| 12 | `go run ./hack/tools/linactl build plugins=1` | `0` | plugin-full Linux/amd64 最终二进制与动态 WASM 构建通过 |
| 13 | OrbStack 启动`temp/output/lina`并读取`temp/final-smoke-config.yaml` | `0` | 服务监听`:19120`，11 个 registry 预热成功 |
| 14 | `curl`检查`/admin/`、主 chunk、favicon 和`/api/v1/auth/login` | `0` | 200、200、200、`code=0` |
| 15 | `curl /x/linapro-demo-source/api/v1/plugins/linapro-demo-source/ping` | `0` | 200、`code=0`、`pong` |
| 16 | Playwright CLI，1366×768，最终二进制 | `0` | 4 张当前截图、0 console error、0 page error |
| 17 | `find hack/tests/e2e -type f -name 'TC*.ts'` | `0` | 恰好 105 个宿主 E2E 文件 |
| 18 | `find apps/lina-web apps/lina-plugins -name '*.vue'` | `0` | 无输出 |
| 19 | pnpm 依赖图与宿主/插件导入扫描 | `0` | React 仅`19.2.7`，Vue/Vben/Ant Design 导入为 0 |
| 20 | `git diff --check` | `0` | 无空白错误或冲突标记 |

## 失败修复

- Go lint 首次受 macOS 用户缓存沙箱限制；把`HOME`、`GOCACHE`、`GOLANGCI_LINT_CACHE`和`XDG_CACHE_HOME`隔离到`/private/tmp`后暴露真实的 1 个`U1000`问题。删除 Vue 校验流程遗留的未使用`validateFilePaths`后，14 个模块全量 lint 通过。
- 最终 packed HTML 曾引用根路径`/assets/*`并导致 404；`linactl build`现默认注入`LINA_WEB_BASE_PATH=/admin`，仍允许显式覆盖。重建后`/admin/`及主资源均为 200。
- 当前视觉审查脚本的前两次失败分别来自测试定位器和截图路径类型；两项均为临时审查脚本问题。修正后重新完整捕获 4/4，不接受空白仪表盘截图。
- 错误探测的`/api/auth/login`和`/auth/login`返回`Not Found`；按前端契约改为`/api/v1/auth/login`后返回`code=0`。这不是产品路由失败。
- 当前直接请求动态`/x-assets`返回 404，因为生命周期测试已卸载并清理动态插件；安装启用状态的 1/1 生命周期测试已验证该资源为 200。该清理后 404 符合资产治理契约。

## 截图与视觉审查

截图目录：`temp/20260715/phase-13-final-visual-audit/accepted/`。

| 步骤 | 截图 | 健康度 | 审查结论 |
| --- | --- | --- | --- |
| 1 | `01-auth-login.png` | `Passed` | 左侧品牌区与右侧登录卡清晰，无裁切、遮挡或旧 Vben 品牌 |
| 2 | `02-dashboard.png` | `Passed` | 菜单、标签、指标卡和图表稳定加载；首次空白捕获已拒绝并重拍 |
| 3 | `03-user-management-english-1366.png` | `Passed` | 1366px 英文用户页按上下区块布局，部门树与筛选区无横向碰撞 |
| 4 | `04-user-batch-edit-dialog.png` | `Passed` | 弹窗层级、字段、按钮和背景表格状态清楚，无溢出或残留状态文案 |

截图只能证明当前视口的可见结果，不能单独证明完整 WCAG 合规；键盘、语义和状态行为由单元测试与 E2E 补充。

## 包图与静态资产

- 首屏：`index-DBPd5ZQD.js`、React vendor、Semi vendor、i18n vendor、query vendor 和首屏 CSS。
- 延迟加载：`echarts-vendor-DsrFdMP3.js`、`tiptap-vendor-BXrADoB6.js`、`ai-core-*`、`notice-management-*`、`user-page-*`及其他功能页。
- packed 静态资源：`favicon.ico`、`logo.png/webp`、`goframe-logo.png/webp`、`avatar.webp`、`stoplight/apidocs.html`、`styles.min.css`和`web-components.min.js`。
- TapCanvas 工作区尚未进入本阶段代码或首屏产物，符合后续独立 Tasklist 边界。

## 等价全面审查

GSD 的`gsd-code-review`入口要求`.planning/ROADMAP.md`阶段目录，本仓库没有该执行体系，因此没有创建 GSD artifact 或提交。等价审查直接覆盖当前工作区，结论如下：

- 严重问题：0。
- 警告：0。
- 已核对边界：插件 UI 无宿主私有导入；动态 iframe 无`allow-same-origin`；`postMessage("*")`只用于 opaque-origin sandbox，并同时校验`event.source`、nonce、插件 ID、generation 和请求 ID；响应过滤 Token、Cookie 与敏感 header。
- HTML 预览的`dangerouslySetInnerHTML`前置使用 allowlist sanitizer，并有脚本、事件属性和`javascript:`链接测试。
- 代码质量：typecheck、ESLint、golangci-lint、staticcheck、单测、E2E 和`git diff --check`共同通过。

## 影响评估

| 规则域 | 结论 | 证据或说明 |
| --- | --- | --- |
| 架构 | 有影响 | 默认工作台硬切换为唯一 React 宿主；未增加双栈开关 |
| 插件 | 有影响 | 9 个源码插件使用 React 注册；动态插件改为 iframe/new-window 隔离契约 |
| 前端 UI | 有影响 | 完整使用 Semi Design、Semi Icons、React locale 与主题 |
| API | 无语义变化 | 宿主 API 路径、包络、权限标签和插件 API 前缀保持不变 |
| 后端与 DI | 无新增影响 | `lina-core`不解析 React 或 TSX；保留稳定插件服务接缝 |
| 数据库 | 无新增影响 | 本阶段未新增或修改宿主 SQL、DAO、表或索引 |
| 数据权限 | 无新增影响 | React 页面继续消费后端权限、tenant 与数据范围投影 |
| 缓存一致性 | 已验证 | Query、运行时 i18n、插件 generation、语言和租户失效路径通过测试 |
| i18n | 有影响且通过 | 宿主与插件`en-US`、`zh-CN`以及 Semi locale 一致；0 violation |
| 开发工具 | 有影响且通过 | linactl、Makefile、CI、E2E 和资源嵌入统一使用`apps/lina-web` |
| 测试 | 有影响且通过 | React 单测、105 个宿主 E2E、官方插件 E2E 和最终 smoke 全部通过 |
| 文档 | 有影响 | 阶段十四同步最终命令、插件契约、影响评估和交付边界 |

## 剩余风险

- `make i18n.check`保留 14 条非阻断 warning；均已记录，没有 violation。
- 最终二进制视觉审查只覆盖 1366×768 的 4 个关键状态；阶段十另有 37/37 页面与交互终态截图作为广度证据。
- `RW-279`仍要求正式父仓版本历史；父仓索引跟踪门禁`RW-397`已经关闭，但没有 commit 授权，不能把索引状态表述为已保存的 Git 历史。该授权边界不影响阶段十三通过，但影响整个 Tasklist 的完全关闭。

## 阶段验收

- Tasklist 阶段验收：Vue/Vben 工作台已删除，React/Semi 工作台成为唯一默认入口，所有自动化和构建门禁通过。
- 验收结果：`Passed`。
- Git 操作：已执行限定到`apps/lina-plugins`的`git add`以关闭父仓跟踪门禁；未执行 commit、push、PR、tag 或发布。
