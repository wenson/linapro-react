# TapCanvas Studio 阶段二执行记录

## 结论

阶段二已通过。TapCanvas React 画布现在由 LinaPro React 19 宿主编译、按路由懒加载并在专用 workspace 内运行。独立应用壳、独立 React root、独立 Vite 和独立 lockfile 均未进入目标插件；Go 业务 API、底座剔除和数据接入仍留在后续阶段。

本文供后续迁移执行者和代码审查者使用。默认读者了解 LinaPro source plugin、Vite 和 React。本文只记录 `TS-040` 至 `TS-061`，不把复制输入中的旧业务能力声明为目标能力。

## 阶段信息

| 字段 | 值 |
| --- | --- |
| 阶段 | 阶段二：React 画布源码复制和构建接入 |
| Tasklist 版本 | `v1.0` |
| 任务范围 | `TS-040` 至 `TS-061` |
| 状态 | `Passed` |
| 执行日期 | `2026-07-15` |
| 执行分支 | `feat/react-workbench-replacement` |
| 来源基线 | `680b0243cd8bb7e5a8926d49eadd942dbc0151f4` |
| 提交授权 | 未授权 |

## 验收摘要

| 任务 | 结果 | 证据 |
| --- | --- | --- |
| `TS-040` 至 `TS-042` | `Passed` | 来源 commit、305 个源码文件和 SHA-256 摘要已保存；复制边界已复核 |
| `TS-043` 至 `TS-046` | `Passed` | 依赖固定到宿主；无独立 React、lockfile、Vite 或应用 root |
| `TS-047` 至 `TS-052` | `Passed` | 局部 Mantine Provider、CSS 作用域、workspace shell 和重型 lazy chunk 已落地 |
| `TS-053` 至 `TS-057` | `Passed` | typecheck、lint、38 个迁移测试文件、102 个全量测试文件和生产构建通过 |
| `TS-058` 至 `TS-061` | `Passed` | React 19 单例、首屏 preload、portal、E2E 和亮暗主题视觉审查通过 |

## 复制与改造边界

### 来源快照

| 项目 | 结果 |
| --- | --- |
| 只读来源 | `../TapCanvas/apps/web` |
| 来源 commit | `680b0243cd8bb7e5a8926d49eadd942dbc0151f4` |
| `src` 文件数 | `305` |
| `src` 聚合 SHA-256 | `af7eb92856d55f25b89d5e8f43540b18c4fc830d7b4d10843745e154b86d8f1f` |
| 来源工作区检查 | `git -C ../TapCanvas status --short -- apps/web` 无输出 |

机械复制以以上来源快照为基线。复制后的文件随即进入宿主改造，因此目标当前摘要不再要求与来源相同。当前目标 `frontend/tapcanvas` 有 351 个文件，聚合 SHA-256 为 `f46d6b9e50da74af356557228b57aacb383a2012ce2aa319448d13ea1be4c8e3`。

来源与当前目标的同路径对照结果：300 个文件保留，5 个独立应用壳文件移除，51 个 workspace、协议和迁移测试文件新增。移除项为：

- `App.tsx`
- `main.tsx`
- `styles.css`
- `light.css`
- `dark.css`

### 静态资产与测试

- 来源 `src/assets` 的 1 个真实 import 资产已保留，来源和目标摘要均为 `b193bcabe37c52bafe03dc72412d9c59d76c31b0bdc78cc0a2ba7f0816cd4a86`。
- 来源 `public` 有 `_headers`、`logo.png`、`robots.txt` 和 `weblogo.png` 共 4 个文件。当前入口无真实引用，因此未复制，也未覆盖 LinaPro public 资产。
- 来源 `_test` 共 48 个文件，其中 44 个为 unit。目标迁入 38 个 unit 文件；来源 Playwright 配置、独立应用 smoke 和 Vitest 启动文件不复制，由 LinaPro 宿主测试工具链接管。
- 6 个绑定旧 Hono/JWT、商业能力或已失效远程任务行为的 unit 被明确剔除：`chatCanvasPlan.test.ts`、`chatQuickActions.test.ts`、`publicChatStream.test.ts`、`rechargeModal.test.tsx`、`storyboardRunSelected.test.ts`、`taskErrorClassifier.test.ts`。
- 构建产物、缓存、日志、环境文件和密钥均未从来源复制。

## 依赖与运行边界

| 依赖 | 固定版本 |
| --- | --- |
| React / ReactDOM | `19.2.7` |
| Zustand | `5.0.14` |
| Mantine | `7.17.8` |
| React Flow | `12.10.2` |
| Tabler Icons | `3.41.1` |
| WebAV | `1.2.8` |
| Framer Motion | `12.38.0` |
| Three | `0.183.2` |
| Zod | `3.25.76` |
| React Hook Form / resolvers | `7.72.1` / `3.10.0` |

- 插件源码由 `apps/lina-web` 的 alias、dedupe、TypeScript、ESLint、Vitest 和 Vite 统一解析。
- `pnpm list` 中 React 和 ReactDOM 只出现 `19.2.7`。TapCanvas 自有 store import 解析到宿主 Zustand `5.0.14`；React Flow 的依赖树仍声明内部 Zustand `4.5.7`，但没有形成第二套 TapCanvas 应用 store。
- `TapCanvasWorkspace` 只在 `.tapcanvas-studio-root` 内挂载 Mantine Provider。CSS variables 使用该选择器，不修改 `html`、`body`、`:root`、`.semi-*` 或宿主 token。
- Modal、Drawer、Menu、Popover、Tooltip、Combobox、Notification 和直接 Portal 均定向到 `.tapcanvas-studio-portal-root`。聚焦测试验证 portal child 不留在调用方 DOM。
- workspace、Canvas、Agent、媒体面板和 Three 预览均为显式 lazy import。WebCut 运行时是按需 iframe 闭包；当前源码没有 `@webav/av-cliper` import，因此构建没有伪造空的 WebAV chunk。

## 命令与结果

所有 Node 命令均使用 `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH`。

| 命令 | 退出码 | 结果 |
| --- | ---: | --- |
| 来源 commit、文件数、摘要和对照扫描 | `0` | 来源 305；当前目标 351；来源范围无改动 |
| `pnpm --dir apps/lina-web typecheck` | `0` | 宿主、plugin UI 和 TapCanvas Studio 类型检查通过 |
| `pnpm --dir apps/lina-web lint` | `0` | 宿主 ESLint 通过 |
| `pnpm --dir apps/lina-web lint:tapcanvas` | `0` | `0 errors / 74 warnings` |
| 迁移目录 `vitest run` | `0` | `38/38` 文件、`135/135` 用例通过 |
| `pnpm --dir apps/lina-web test:unit` | `0` | `102/102` 文件、`354/354` 用例通过 |
| `LINA_WEB_BASE_PATH=/admin pnpm --dir apps/lina-web build` | `0` | `10658 modules transformed`，生产构建通过 |
| Studio Playwright CLI | `0` | `2/2` 用例通过，验证真实 React Flow、主题、portal 和无旧认证/API 请求 |
| React / ReactDOM 依赖树扫描 | `0` | 唯一版本为 `19.2.7` |
| 生产 `index.html` 首屏 preload 扫描 | `0` | forbidden preload 为 `0` |

全量 Vitest 使用仓库卷上的临时目录，避免 macOS 根卷临时空间不足：

```bash
TMPDIR=/Volumes/c/Workspace/TapCanvas_remix/lina-tapcanvas/temp/vitest-tmp \
pnpm --dir apps/lina-web test:unit
```

## Bundle 证据

- 首屏 `index.html` 只 preload 宿主 React、Semi、i18n、query 和通用 vendor。`TapCanvas`、Mantine、React Flow、Three、Agent、媒体和 WebAV 的命中数为 `0`。
- Studio 路由生成独立 `studio-workspace-*` 和 `TapCanvasWorkspace-*` chunk。
- Mantine、React Flow、Agent、媒体和 Three 分别生成 `tapcanvas-mantine-vendor-*`、`tapcanvas-flow-vendor-*`、`tapcanvas-agent-*`、`tapcanvas-media-*` 和 `tapcanvas-three-vendor-*`。
- WebAV 当前真实 import 数为 `0`，因此没有 WebAV chunk。依赖版本保留用于后续本地媒体运行时决策，当前 WebCut 继续走外部 iframe。

## 失败、修复与已知限制

- Zustand 5 selector 返回新对象曾触发 React Flow `Maximum update depth exceeded`。`Canvas.tsx` 改用 `useShallow` 后，真实画布和 E2E 稳定。
- jsdom 缺少 `window.matchMedia`。宿主测试 setup 增加标准 mock 后，迁移测试恢复。
- 视觉审查发现 `/admin/logo.webp` 开发路径、暗色 footer 白底和暗色标签低对比度问题。Vite base-path public asset middleware 与宿主 CSS 已修复。
- 最终审查发现 3 处直接 Portal 可能逃逸到 `document.body`，并发现两条亮色选择器被重复加前缀。两项均已修复，并重新通过 typecheck、lint、unit、build 和 E2E。
- Playwright 在默认 macOS 沙箱内首次启动被 Mach port 权限拒绝。使用用户已授权的 Playwright CLI 在沙箱外重跑后 `2/2` 通过；该失败未进入业务用例。
- macOS 根卷一度只剩约 152 MiB，并行 Vitest 触发 `ENOSPC`。设置上述 `TMPDIR` 后全量测试通过。这是本机环境风险，不是代码失败。
- `hack/tests test:validate` 的全量 i18n 扫描仍报告来源迁移输入中的 1039 条中文硬编码。阶段二不批量伪改复制输入；该债务在底座剔除和 i18n 阶段处理。Playwright 文件已通过 CLI 实际执行。
- Studio lint 保留 74 条来源 hook/unused-disable warning，错误数为 0。不得用批量 `any` 或机械改依赖数组伪造清零。
- `nodeInspector.productionMetadata.test.tsx` 有既存 React `act(...)` 提示，但 3 条断言均通过。

## 视觉证据

| 场景 | 结果 | 证据路径 |
| --- | --- | --- |
| workspace 首次加载 | `Passed` | `temp/20260715/20260715131221-tapcanvas-studio-first-load.png` |
| 亮色主题 | `Passed` | `temp/20260715/20260715131225-tapcanvas-studio-light.png` |
| 暗色主题 | `Passed` | `temp/20260715/20260715131225-tapcanvas-studio-dark.png` |

最终截图确认画布填满 workspace 可用区域，React Flow 控件可见，宿主导航和页脚未被 Mantine 污染，亮暗主题均无空白、重叠、截断或低对比度回归。

## 影响评估

| 规则域 | 结论 | 说明 |
| --- | --- | --- |
| 架构 | 有影响 | 来源独立应用改为宿主管理的 source plugin workspace |
| 插件 | 有影响 | Studio 插件新增完整前端迁移输入和构建闭包 |
| 前端 UI | 有影响 | 保留 Mantine 画布语言，但限定到插件根和专用 portal |
| API | 无目标变更 | 旧 API 仅作为待剥离迁移输入；本阶段不定义目标业务 API |
| Go 与 DI | 无影响 | 本阶段不修改 Go 运行期依赖 |
| 数据库与数据权限 | 无影响 | 本阶段不创建业务表或访问业务数据 |
| 缓存与集群 | 无影响 | 本阶段不创建缓存、任务、租约或恢复状态 |
| i18n | 有后续影响 | 宿主入口使用 LinaPro 双语资源；复制输入仍有存量硬编码 |
| 开发工具与跨平台 | 有影响 | 宿主 Vite、TypeScript、ESLint、Vitest 和 lockfile 接管插件闭包 |
| 测试 | 有影响 | 来源单测迁入宿主 Vitest，插件 E2E 覆盖主题、workspace 和隔离边界 |

## 审查与回退边界

最终代码审查已覆盖复制边界、React 单例、Zustand 解析、全局 CSS、portal、public asset middleware、动态 chunk、首屏 preload、测试和来源只读状态。未发现阻止阶段二验收的问题。

- 父仓已有阶段一和 React 工作台的大量未提交变更。本阶段不回退、不覆盖其他阶段成果。
- `../TapCanvas/apps/web` 保持只读。
- 未执行 `commit`、`push`、PR、tag、镜像发布或环境发布。
- 阶段回退点为阶段一 `Passed` 状态、来源 commit 和本记录中的来源摘要。

## 阶段验收

阶段验收结果为 `Passed`：复制后的画布源码由 LinaPro React 19 构建并按路由懒加载，尚未连接目标 Go 业务 API，但已不再拥有独立应用启动壳。下一阶段按 Tasklist 进入 `TS-062` 至 `TS-089`，剔除 TapCanvas 认证、Team、权限和商业底座能力。
