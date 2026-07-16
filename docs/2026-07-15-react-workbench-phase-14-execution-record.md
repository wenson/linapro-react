# React 工作台阶段十四执行记录

## 结论

阶段十四文档和交付记录已通过：中英文入口、React/Semi 开发规范、源码插件注册、动态插件隔离、验证证据、影响评估和待提交边界均已同步。本文面向维护者和后续实现者；只描述已验证事实，不代表已创建 Git 历史、PR 或发布版本。

## 阶段信息

| 字段 | 值 |
| --- | --- |
| 阶段 | 十四：文档和交付记录 |
| Tasklist 版本 | `v1.2` |
| 任务范围 | `RW-400`至`RW-416` |
| 状态 | `Passed` |
| 执行日期 | `2026-07-15` |
| 执行分支 | `feat/react-workbench-replacement` |
| 宿主基线 | `7d149838e77fe3d2b1bdda5ebb9d46679f79fd23` |
| 提交授权 | 未授权；插件交付已进入父仓索引，但未创建 commit |

## 任务状态

| 任务 | 状态 | 证据 |
| --- | --- | --- |
| `RW-400` | `Passed` | 根 README 双语镜像使用 React 19、Semi Design 2、Vite 7 和`apps/lina-web` |
| `RW-401` | `Passed` | CONTRIBUTING 双语镜像更新目录、命令、React 规范、插件 UI 和 i18n 路径 |
| `RW-402` | `Passed` | linactl README 双语镜像的定向构建示例改为`apps/lina-web` |
| `RW-403` | `Passed` | 插件总 README 与 demo-source 双语 README 记录 React UI 开发方式 |
| `RW-404` | `Passed` | 插件总 README 提供`frontend/plugin-ui.ts`最小`definePluginUI()`示例 |
| `RW-405` | `Passed` | 插件总 README 和`lina-core/pkg/plugin`README 记录 iframe/new-window、`pluginAssetUrl`和受限桥接 |
| `RW-406` | `Passed` | CONTRIBUTING 记录 Semi UI、Semi Icons、`en-US`/`zh-CN` locale 和`theme-mode="dark"` |
| `RW-407` | `Passed` | 插件总 README 记录权限、模块禁用、租户切换、generation 和 Token 边界 |
| `RW-408` | `Passed` | 阶段十三记录保存构建、测试、E2E、smoke 和截图结果 |
| `RW-409` | `Passed` | 阶段十三记录覆盖 i18n、数据权限、缓存、DI 和跨平台开发工具影响 |
| `RW-410` | `Passed` | 阶段十三与执行性审查明确数据库、SQL、认证模型和核心业务语义未改变 |
| `RW-411` | `Passed` | README、CONTRIBUTING、linactl、插件总说明和 demo-source 的中英文事实逐对核对 |
| `RW-412` | `Passed` | 文档空白、围栏、反引号、旧路径、关键链接和文件存在性检查通过 |
| `RW-413` | `Passed` | 用户未授权 Git 交付操作；决定不提交、不推送、不创建 PR |
| `RW-414` | `Passed` | 执行性审查追加最终范围、规则域、验证、无影响判断和剩余风险 |
| `RW-415` | `Passed` | 实施未改变`v1.2`任务语义、顺序、依赖或验收标准，无需升级版本 |
| `RW-416` | `Passed` | 下文记录父仓同批待提交范围和基线回退点；未伪造 commit |

## 文档交付

| 文档 | 面向对象 | 最终内容 |
| --- | --- | --- |
| `README.md`、`README.zh-CN.md` | 使用者 | React/Semi/Vite 技术栈、唯一工作台和产品单仓插件架构 |
| `CONTRIBUTING.md`、`CONTRIBUTING.zh-CN.md` | 贡献者 | 目录、命令、React 19、Semi、API Client、i18n、源码与动态插件规则 |
| `hack/tools/linactl/README.md`及中文镜像 | 工具维护者 | `apps/lina-web`定向构建路径 |
| `apps/lina-plugins/README.md`及中文镜像 | 插件开发者 | 单仓归属、React 注册示例、稳定导入面、宿主投影和动态托管 UI |
| `linapro-demo-source/README.md`及中文镜像 | 样例使用者 | `sidebar-entry.tsx`、`plugin-ui.ts`、React/Semi 与宿主 context |
| `apps/lina-core/pkg/plugin/README.md`及中文镜像 | 后端与动态插件开发者 | iframe/new-window、asset 治理和受限`postMessage`安全边界 |
| 阶段十三记录 | 审查者 | 最终门禁、失败修复、包图、截图与影响评估 |
| 执行性审查 | owner | 最终范围、规则域、无影响判断、剩余风险与交付授权边界 |

## 待提交范围与回退点

用户未授权提交，因此这里只定义一个原子提交候选，不创建 commit：

| 原子范围 | 路径 | 回退依据 |
| --- | --- | --- |
| 治理与 CI | `.agents/`、`.github/`、`AGENTS.md`、`Makefile` | 宿主基线`7d149838e77fe3d2b1bdda5ebb9d46679f79fd23` |
| 核心宿主 | `apps/lina-core` | 同一宿主基线；仅回退工作台切换和通用 hosted 契约相关差异 |
| React 工作台 | `apps/lina-web` | 整目录是本次新增交付，原基线不存在 |
| 产品插件 | `apps/lina-plugins` | 转换前插件内容基线`1b90535404d1563a045efe3888dd9db6d1bf5e29`；迁移后与宿主同批回退 |
| 工具与测试 | `hack/` | 宿主基线；必须与工作台路径和 E2E 同批回退 |
| 文档 | `README*`、`CONTRIBUTING*`、`docs/` | 与实现同批回退，避免旧栈说明重新成为入口 |

禁止只回退`apps/lina-web`或只恢复`apps/lina-vben`。宿主打包、CI、E2E、插件 UI 与文档已经形成单一 React 契约，拆分回退会恢复不一致状态。

## 影响评估

| 规则域 | 结论 | 说明 |
| --- | --- | --- |
| 架构 | 已记录 | React 发现属于`apps/lina-web`；核心只拥有通用后端与 hosted page 契约 |
| 插件 | 已记录 | 源码插件稳定导入面与动态插件隔离边界均有双语说明 |
| 前端 UI | 已记录 | React 19、Semi Design 2、Semi Icons、locale 与主题为唯一宿主规范 |
| API | 无新增影响 | 文档未改变 HTTP 路径、包络、权限标签或错误码 |
| 后端与 DI | 无新增影响 | 文档未创建或改写 service owner、provider 或注入链 |
| 数据库 | 无新增影响 | 文档阶段未修改 SQL、DAO、表、索引或种子数据 |
| 数据权限 | 无新增影响 | 继续以宿主权限和租户投影、后端权威校验为准 |
| 缓存一致性 | 已记录 | i18n、Query、租户和 generation 失效范围见阶段十三记录 |
| i18n | 有文档影响 | 所有双语镜像同步；运行时资源未因本阶段新增变化 |
| 开发工具 | 已记录 | macOS、OrbStack Linux/amd64、linactl、Makefile 和 CI 边界明确 |
| 测试 | 已记录 | 结果取自已执行门禁，不用文档检查替代运行测试 |

## 审查与验证

- 中英文镜像均包含相同路径、技术栈、命令和安全边界。
- 入口文档不再出现`apps/lina-vben`、`web-antd`、Vue 3、Vben、Ant Design Vue、`.vue`样例或插件 submodule 安装说明。
- Markdown 无尾随空格、未闭合代码围栏或奇数反引号。
- 文档引用的`apps/lina-web/package.json`、`frontend/plugin-ui.ts`、插件 README、阶段十三记录和执行性审查均存在。
- `git diff --check`通过。

## 剩余风险

- `RW-397`已经完成：父仓索引直接跟踪`apps/lina-plugins`的 999 个交付路径，未跟踪文件、`.gitmodules`、嵌套`.git`和 gitlink 均为 0。`RW-279`仍需要正式父仓版本历史；当前没有 commit 授权，不能把索引状态表述为已提交历史。
- 产品仓库没有实际`origin`，只配置了只读`upstream`且 push URL 已禁用。后续 Git 交付必须先由用户指定目标仓库与授权。
- 外部官网和演示站截图可能仍展示上游旧版本；本阶段只更新仓库文档事实，不发布官网。

## 后续独立 Tasklist 边界

2026-07-15，`linapro-tapcanvas-studio`详细设计、`v1.0`迁移 Tasklist、统一执行记录模板和执行性审查已经落盘，执行边界`TS-001`至`TS-015`已经完成。2026-07-16，产品 owner要求 React工作台清单不再保存后续工作的占位任务或完成状态；TapCanvas Studio及其后续领域只由独立 Tasklist承载，并在实施前按实际范围继续细化。

## 阶段验收

- Tasklist 阶段验收：中英文说明、插件开发契约、验证证据、影响评估和单仓交付记录完整一致，冻结 Tasklist 的执行结果可追溯。
- 验收结果：`Passed`。
- Git 操作：已执行限定到`apps/lina-plugins`的`git add`；未执行 commit、push、PR、tag 或发布。
