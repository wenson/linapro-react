# React 工作台阶段二执行记录

## 阶段信息

| 字段 | 值 |
| --- | --- |
| 阶段 | 阶段二：独立创建`apps/lina-web` |
| Tasklist 版本 | `v1.2` |
| 任务范围 | `RW-020`至`RW-049` |
| 状态 | `Passed` |
| 开始时间 | `2026-07-12 14:26 CST` |
| 完成时间 | `2026-07-12 14:42 CST` |
| 执行分支 | `feat/react-workbench-replacement` |
| 宿主基线 | `7d149838e77fe3d2b1bdda5ebb9d46679f79fd23` |
| 插件基线 | `1b90535404d1563a045efe3888dd9db6d1bf5e29` |

## 范围与边界

- 目标：创建可独立安装、类型检查、单元测试、lint 和构建的 React + Semi Design 最小工作台。
- 修改范围：`apps/lina-web/`、冻结 Tasklist 和本执行记录。
- 禁止范围：不修改`apps/lina-core`、`apps/lina-vben`、`apps/lina-plugins`、`hack`、`.github/workflows`或根构建入口。
- 前置门禁：阶段一已通过；Node.js`22.22.0`已安装在本机`nvm`目录；插件扁平化保持前一批工作区状态。
- UI 设计约束：使用专业、克制、无渐变的管理工作台视觉；颜色和间距由 token 管理；支持键盘焦点、响应式和深色模式。

## 任务状态

| 任务 | 状态 | 证据 |
| --- | --- | --- |
| `RW-020`至`RW-043` | `Passed` | `apps/lina-web/`工程、依赖、Provider、错误边界、主题、样式、静态资产与 5 个 DOM 测试 |
| `RW-044` | `Passed` | Node.js`22.22.0`与 pnpm`10.30.3`执行`typecheck`，退出码`0` |
| `RW-045` | `Passed` | 4 个测试文件、5 个测试全部通过，退出码`0` |
| `RW-046` | `Passed` | React 工作台 lint 无错误或警告，退出码`0` |
| `RW-047` | `Passed` | 根路径与`/console/`basePath 构建通过，目标 HTML 均存在 |
| `RW-048` | `Passed` | 39 个直接依赖版本一致，lockfile 只有 React`19`主版本 |
| `RW-049` | `Passed` | 禁止路径 unstaged 与未跟踪变化均为`0` |

## 命令与结果

| 序号 | 命令 | 退出码 | 结果 |
| --- | --- | --- | --- |
| 1 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH corepack pnpm@10.30.3 --dir apps/lina-web install --frozen-lockfile` | `0` | lockfile 已是最新，独立安装入口通过 |
| 2 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH corepack pnpm@10.30.3 --dir apps/lina-web typecheck` | `0` | TypeScript 严格类型检查通过 |
| 3 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH corepack pnpm@10.30.3 --dir apps/lina-web test:unit` | `0` | 4 个测试文件、5 个测试通过 |
| 4 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH corepack pnpm@10.30.3 --dir apps/lina-web lint` | `0` | ESLint 无错误或警告 |
| 5 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH corepack pnpm@10.30.3 --dir apps/lina-web build` | `0` | 根路径构建通过，`dist/index.html`和 Stoplight 入口存在 |
| 6 | `LINA_WEB_BASE_PATH=/console corepack pnpm@10.30.3 --dir apps/lina-web build` | `0` | 产物资产路径写为`/console/assets/`，Stoplight 入口保留 |
| 7 | 读取 39 个`node_modules/<package>/package.json`并对照直接依赖版本，统计`.pnpm/react@*`主版本 | `0` | 39 个版本一致，仅有`react@19.2.7` |
| 8 | 对照 9 个`public/`资产 SHA-256，检查`vben-logo.webp`和构建产物 | `0` | 9 个摘要一致，Vben 品牌不存在，目标产物存在 |
| 9 | `curl`检查`http://127.0.0.1:5666/`和`/stoplight/apidocs.html` | `0` | 两个入口均返回 HTTP`200`，根挂载点存在 |
| 10 | 检查`git diff`与未跟踪文件中的`apps/lina-core`、`apps/lina-vben`、`apps/lina-plugins`、`hack`和`.github/workflows` | `0` | 本阶段没有禁止路径变化 |

## 失败项

- 当前失败：无。
- 已解决失败：Semi CSS 文件受包导出表限制，已用 Vite 精确 alias 保留规范导入路径；jsdom 缺少 Canvas，已在测试 setup 提供最小 stub；Fast Refresh 要求组件离开入口文件，已拆分`StartupPage`；错误按钮读屏名称包含图标名称，已增加明确`aria-label`；根仓库 pnpm`11.12.0`会覆盖应用固定版本，验证命令已显式选择 pnpm`10.30.3`。
- 外部阻断：无。

## 截图与人工审查

- 截图目录：不适用；当前桌面环境没有可连接的浏览器实例，未生成截图。
- 视觉审查：以 DOM 角色、标题、图像替代文本、状态文本、深色`theme-mode`属性、响应式 CSS、HTTP smoke 和静态代码审查替代；未发现结构问题。
- E2E 质量审查：本阶段不接入业务路由或用户工作流，不新增 E2E；使用 Provider smoke test、构建产物检查和静态 UI 审查。

## 影响评估

| 规则域 | 结论 | 证据或说明 |
| --- | --- | --- |
| 架构 | 有影响 | 新增独立`apps/lina-web`单包应用，未接入根构建入口或旧宿主 |
| 插件 | 有有限影响 | Vite 预留`apps/lina-plugins`受控读取路径和 React 单例去重，本阶段未发现或装配插件 UI |
| 前端 UI | 有影响 | 建立 React + Semi、token、响应式、焦点、错误恢复和深色主题基础 |
| API | 无契约影响 | 仅配置`/api`、`/x`和`/x-assets`开发代理，不新增或修改 HTTP API |
| 后端与 DI | 无影响 | 未修改 Go、后端构造或启动装配 |
| 数据库 | 无影响 | 未修改 SQL、DAO、表或索引 |
| 数据权限 | 无影响 | 未接入业务数据和权限流程 |
| 缓存一致性 | 无影响 | QueryClient 仅设置默认策略，尚无业务缓存；权威源和失效边界在阶段三实现 |
| i18n | 有阶段性影响 | 已安装 i18n 依赖和 Semi 英文 locale；最小启动页仅为开发 smoke，运行时双语与渲染期翻译由阶段三实现 |
| 开发工具 | 有应用内影响 | 新增 Vite、Vitest、TypeScript 和 ESLint 配置；未修改根脚本或 CI，配置不含平台专用 shell 语法 |
| 测试 | 有影响 | 新增 Provider、启动页、错误边界和主题测试，共 5 个测试 |
| 文档 | 有影响 | 更新 Tasklist、执行性 Review 和阶段二执行记录 |

## 变更文件

- 新增：`apps/lina-web/`完整阶段二工程与`docs/2026-07-12-react-workbench-phase-02-execution-record.md`。
- 修改：冻结 Tasklist 和执行性 Review。
- 删除：无。
- 未经授权的 Git 操作：无；未执行 commit、push 或 PR。

## 审查结论

- 审查范围：`git status --short`、`apps/lina-web`全部非生成源文件、lockfile 直接依赖、静态资产摘要、构建产物和禁止路径。
- 已读取规则：`AGENTS.md`、`.agents/rules/workflow.md`、`.agents/rules/documentation.md`、`.agents/rules/architecture.md`、`.agents/rules/frontend-ui.md`、`.agents/rules/plugin.md`、`.agents/rules/testing.md`、`.agents/rules/i18n.md`和 Markdown instructions。
- 严重问题：`0`。
- 警告：`1`。Semi`2.101.0`内部使用 TipTap`3.x`，工作台富文本固定 TipTap`2.27.2`；pnpm 重算依赖时会报告内部 peer 警告。当前通过 Semi 公共组件子路径导入和 lint 禁止根导入隔离，两套版本的类型检查、测试与构建均已通过；后续升级 Semi 或 TipTap 时重新评估。
- 剩余风险：没有浏览器截图；阶段二仅证明最小启动页 DOM、HTTP 和构建结果，不替代后续业务页面 E2E 与视觉验收。

## 阶段验收

- Tasklist 阶段验收：`apps/lina-web`可以独立安装、测试和构建，只显示最小 React/Semi 启动页。
- 验收结果：`Passed`。
- Tasklist 勾选：`RW-020`至`RW-049`已更新为完成；`GATE-010`继续保持未完成。
