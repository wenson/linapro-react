# React 工作台阶段三执行记录

## 阶段信息

| 字段 | 值 |
| --- | --- |
| 阶段 | 阶段三：运行时基础设施 |
| Tasklist 版本 | `v1.2` |
| 任务范围 | `RW-050`至`RW-079` |
| 状态 | `Passed` |
| 开始时间 | `2026-07-12 14:47 CST` |
| 完成时间 | `2026-07-12 15:06 CST` |
| 执行分支 | `feat/react-workbench-replacement` |
| 宿主基线 | `7d149838e77fe3d2b1bdda5ebb9d46679f79fd23` |
| 插件基线 | `1b90535404d1563a045efe3888dd9db6d1bf5e29` |

## 范围与边界

- 目标：在不接入业务页面的情况下完成 API Client、公共配置、运行时双语、缓存边界和启动编排。
- 修改范围：`apps/lina-web/src/`、阶段三执行记录、冻结 Tasklist 和执行性 Review。
- 禁止范围：不修改`apps/lina-core`、`apps/lina-vben`、`apps/lina-plugins`、`hack`、`.github/workflows`或根构建入口。
- 前置门禁：阶段二已通过；现有 LinaPro HTTP API 和 DTO 是权威契约，不新增后端接口。
- 缓存边界：运行时消息权威源是宿主聚合接口，本地缓存最多保留 7 天；Query cache 只按会话、租户和插件 generation 精确取消与移除。

## 任务状态

| 任务 | 状态 | 证据 |
| --- | --- | --- |
| `RW-050`至`RW-058` | `Passed` | Fetch API Client、显式会话适配器、包络错误、单飞刷新、原始上传下载、插件路径和 12 个测试 |
| `RW-059`至`RW-063` | `Passed` | 公共配置完整投影、默认值、basePath/资产规则和 14 个测试 |
| `RW-064`至`RW-073` | `Passed` | 双语基础包、Semi/dayjs 映射、ETag、7 天缓存、两次请求、切换副作用和 6 个测试 |
| `RW-074`至`RW-079` | `Passed` | 启动顺序、宿主默认语言回补、三类 Query cache 作用域、综合 41 个测试及构建门禁 |

## 命令与结果

| 序号 | 命令 | 退出码 | 结果 |
| --- | --- | --- | --- |
| 1 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH corepack pnpm@10.30.3 --dir apps/lina-web install --frozen-lockfile` | `0` | lockfile 无变化，独立安装入口通过 |
| 2 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH corepack pnpm@10.30.3 --dir apps/lina-web typecheck` | `0` | 严格 TypeScript 检查通过 |
| 3 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH corepack pnpm@10.30.3 --dir apps/lina-web test:unit` | `0` | 9 个测试文件、41 个测试通过 |
| 4 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH corepack pnpm@10.30.3 --dir apps/lina-web lint` | `0` | ESLint 无错误或警告 |
| 5 | `PATH=/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH corepack pnpm@10.30.3 --dir apps/lina-web build` | `0` | 分块构建通过，无 chunk 体积警告，目标 HTML 存在 |
| 6 | 静态扫描 API 包络字段、默认基址、三个请求头、刷新单飞、一次重放、上传下载和插件路径 | `0` | `RW-050`至`RW-058`契约全部命中 |
| 7 | 静态扫描公共配置六个组、保留根路径、两套语言包、ETag、7 天 TTL 和两次请求常量 | `0` | `RW-059`至`RW-071`契约全部命中 |
| 8 | 扫描生产代码模块顶层翻译调用和`/user/info`语言刷新调用 | `0` | 两类调用均为`0` |
| 9 | 检查禁止路径的 unstaged 与未跟踪变化 | `0` | `apps/lina-core`、旧工作台、插件、工具链和 CI 均无本阶段变化 |

## 失败项

- 当前失败：无。
- 已解决失败：修复测试 mock 签名、缺少`I18nextProvider`和 Fast Refresh 导出边界；修复显式`Accept-Language`被默认值覆盖、协议相对 basePath 被误接收、后台 ETag 消息未应用、宿主关闭 i18n 时公共配置语言未回补；通过 Vite vendor 分块消除`500 kB`JavaScript chunk 警告；修复测试中未使用参数 lint。
- 外部阻断：无。

## 截图与人工审查

- 截图目录：不适用，本阶段实现运行时基础设施，不新增最终业务页面。
- 视觉审查：通过 DOM 与翻译断言验证启动页和错误页，不新增独立视觉方案。
- E2E 质量审查：不触发；本阶段没有认证或业务端到端工作流，使用单元测试覆盖网络、缓存和语言副作用。

## 影响评估

| 规则域 | 结论 | 证据或说明 |
| --- | --- | --- |
| 架构 | 有影响 | 建立直接、显式的 API/配置/i18n/缓存/启动边界，没有多层 service 包装 |
| 插件 | 有有限影响 | 只提供同源插件 API 路径规范化，不扫描或修改插件代码，不暴露 Token |
| 前端 UI | 有影响 | 启动页和错误页改为渲染期翻译，Semi locale 随 i18n 实例更新 |
| API | 有前端适配影响 | 只消费现有 LinaPro API；HTTP 方法、路径和后端 DTO 未改变 |
| 后端与 DI | 无影响 | 未修改 Go 或后端依赖；前端 Client 通过构造参数显式接收会话、语言、翻译和 fetch |
| 数据库 | 无影响 | 未修改 SQL、DAO、表或索引 |
| 数据权限 | 无授权语义变化 | Client 仅透传当前租户头，后端仍是数据权限权威 |
| 缓存一致性 | 有影响 | 运行时消息权威源为宿主接口，本地最多陈旧 7 天，ETag 重验证，失败回退；Query cache 按会话、租户、插件 generation 精确清理 |
| i18n | 有影响 | 英文源内容、中文镜像、宿主 locale 开关、Semi/dayjs、公共配置和导航投影切换已实现并测试 |
| 开发工具 | 有应用内影响 | Vite 使用跨平台路径归一化拆分 vendor chunk；未修改根工具和 CI |
| 测试 | 有影响 | 阶段累计 9 个测试文件、41 个测试，覆盖成功、失败、并发、缓存和切换 |
| 文档 | 有影响 | 更新 Tasklist、执行性 Review 和阶段三执行记录 |

## 变更文件

- 新增：`src/api/contracts.ts`、`src/api/client.ts`、`src/runtime/public-config.ts`、`src/runtime/i18n.ts`、`src/runtime/cache.ts`、`src/runtime/query-client.ts`、`src/app/bootstrap.tsx`、`src/router/runtime-router.tsx`、双语基础包和对应测试。
- 修改：`src/main.tsx`、Provider、启动页、错误边界、主题、测试 setup、Vite 配置、冻结 Tasklist 和执行性 Review。
- 删除：无。
- 未经授权的 Git 操作：无；未执行 commit、push 或 PR。

## 审查结论

- 审查范围：`git status --short`、阶段三生产代码、41 个测试、Vite 构建输出、静态契约和禁止路径。
- 已读取规则：`AGENTS.md`、workflow、documentation、architecture、frontend-ui、api-contract、plugin、cache-consistency、testing、i18n、dev-tooling 和 Markdown instructions。
- 严重问题：`0`。
- 警告：`0`。
- 剩余风险：阶段四才把真实 session store、租户 store 和 QueryClient 清理动作接入 API Client；本阶段已通过适配器和并发测试证明契约，不声明认证工作流已完成。

## 阶段验收

- Tasklist 阶段验收：新工作台可以在不接业务页面的情况下正确加载配置、语言和 API Client。
- 验收结果：`Passed`。
- Tasklist 勾选：`RW-050`至`RW-079`已更新为完成；`GATE-010`继续保持未完成。
