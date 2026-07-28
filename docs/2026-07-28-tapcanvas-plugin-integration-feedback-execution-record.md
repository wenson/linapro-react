# TapCanvas 插件构建集成反馈执行记录

## 阶段信息

| 字段 | 值 |
| --- | --- |
| 阶段 | 反馈：TapCanvas 插件构建集成 |
| Tasklist 版本 | 不适用：局部`direct-fix`，不改变冻结 Tasklist |
| 任务范围 | `FB-1` |
| 状态 | Passed |
| 开始时间 | `2026-07-28 12:42 CST` |
| 完成时间 | `2026-07-28 12:53 CST` |
| 执行分支 | `main` |
| 宿主基线 | `3321774757773d301bfddba972ea4fb2f756d635` |

## 反馈分诊与根因

- 处理路径：`direct-fix`。本次修复源码插件内部模块解析和源码插件扫描边界，不改变用户功能语义、API、数据模型、权限或运行时插件契约；项目不使用 OpenSpec 作为产品执行门禁。
- 根因一：TapCanvas 私有协议模块通过`@tapcanvas/*`裸模块名导入，要求宿主`Vite`与插件 UI TypeScript 配置硬编码业务插件路径，破坏插件内部闭环；正式合并时这些宿主别名未进入`main`，导致插件构建无法解析模块。
- 根因二：`apps/lina-plugins/package.json`安装源码插件前端依赖后会生成`apps/lina-plugins/node_modules/`，现有源码插件扫描器会把该依赖目录按插件 ID 校验并拒绝。
- 处理范围：将 TapCanvas 私有协议改为插件内部相对导入；源码插件扫描器通用地忽略`node_modules`并补充回归测试；不恢复业务专属宿主别名。
- 验证方式：先复现类型检查与扫描失败，再运行插件 UI 类型检查、扫描器单元测试、相关插件单元测试、生产构建、静态边界检查和`git diff --check`。

## 任务状态

| 任务 | 状态 | 证据 |
| --- | --- | --- |
| `FB-1`插件私有协议解析与依赖目录扫描 | Passed | 实现、相关自动化验证、生产构建与`lina-review`审查通过。 |

## 命令与结果

| 序号 | 命令 | 退出码 | 结果 |
| --- | --- | --- | --- |
| 1 | `pnpm --dir apps/lina-web typecheck` | `0` | 修复前 TypeScript 检查通过，证明 ambient 声明会遮蔽运行时别名缺失。 |
| 2 | `pnpm --dir apps/lina-web build` | `1` | 修复前复现失败：`Invalid source plugin directory ID: node_modules`。 |
| 3 | `pnpm --dir apps/lina-web typecheck` | `0` | 修复后宿主与源码插件 UI TypeScript 检查通过。 |
| 4 | `pnpm --dir apps/lina-web exec vitest run build/plugin-ui-registry.test.ts` | `0` | 扫描器 6 个单元测试通过，包含顶层`node_modules`忽略场景。 |
| 5 | `pnpm --dir apps/lina-web build` | `0` | 生产构建通过，转换`10755`个模块并生成 TapCanvas 页面、画布和工作区 chunk。 |
| 6 | `pnpm --dir apps/lina-web lint` | `0` | 宿主 Web ESLint 无警告通过。 |
| 7 | `pnpm --dir apps/lina-web exec vitest run ../lina-plugins/linapro-tapcanvas-studio/frontend` | `1` | 插件完整前端测试中`42`个文件、`150`个用例通过；2 个既有组件测试文件因 Mantine CommonJS 传递依赖加载第二份 React 而有 6 个失败，与本次相对导入和扫描器修复无关。 |
| 8 | `pnpm --dir apps/lina-web exec vitest run build/plugin-ui-registry.test.ts ../lina-plugins/linapro-tapcanvas-studio/frontend/tapcanvas/_test/unit/imageViewControls.test.ts ../lina-plugins/linapro-tapcanvas-studio/frontend/tapcanvas/_test/unit/imagePromptSpec.test.ts ../lina-plugins/linapro-tapcanvas-studio/frontend/tapcanvas/_test/unit/imageView3dMath.test.ts ../lina-plugins/linapro-tapcanvas-studio/frontend/tapcanvas/_test/unit/nodeReferenceInputs.test.ts ../lina-plugins/linapro-tapcanvas-studio/frontend/tapcanvas/protocols/image-prompt-spec/index.test.ts` | `0` | 6 个相关测试文件、22 个用例全部通过。 |
| 9 | `rg -n '@tapcanvas/' apps/lina-plugins/linapro-tapcanvas-studio --glob '*.{ts,tsx,js,mjs,d.ts}'` | `1` | 无匹配，证明业务专属宿主别名依赖已清除；`rg`无匹配按预期返回`1`。 |
| 10 | `git diff --check` | `0` | 当前差异无空白符错误。 |

## 失败项

- 当前失败：插件完整前端测试仍有 6 个既有`React`双实例失败，位于`nodeInspector.productionMetadata.test.tsx`和`statusBanner.test.tsx`；相关协议、扫描器、类型检查、`lint`与生产构建均不受影响。
- 已解决失败：生产构建从顶层`node_modules`扫描失败恢复为通过；业务私有模块由宿主别名解析改为插件相对解析。
- 外部阻断：当前 Node 为`20.19.5`，项目声明要求`22.22.0`；所有本次强制门禁仍已执行并通过，命令仅输出 engine 警告。

## 截图与人工审查

- 截图目录：不适用；本次不改变用户可观察 UI。
- 视觉审查：不适用；修复范围为构建期模块解析和插件目录扫描。
- E2E 质量审查：不触发；不改变页面、路由、交互、接口联动或端到端工作流，使用类型检查、单元测试和生产构建验证。

## 影响评估

| 规则域 | 结论 | 证据或说明 |
| --- | --- | --- |
| 架构 | 有影响 | 将业务私有协议依赖收敛回源码插件内部；宿主只保留通用扫描规则。 |
| 插件 | 有影响 | 修复源码插件 UI 构建输入和插件目录发现边界。 |
| 前端 UI | 有构建影响 | 不改变页面行为，仅改变 TypeScript 与 Vite 的模块解析路径。 |
| API | 无影响 | 不修改 HTTP 路由、DTO、权限标签或调用频次。 |
| 后端与 DI | 无影响 | 不修改 Go 后端、服务装配或依赖注入。 |
| 数据库 | 无影响 | 不修改 SQL、DAO、索引或数据。 |
| 数据权限 | 无影响 | 不新增或修改数据读写路径。 |
| 缓存一致性 | 无影响 | 不涉及缓存、快照或失效机制。 |
| i18n | 无资源影响 | 不修改用户可见文案、插件清单、语言包或 API 文档源文本。 |
| 开发工具 | 有构建扫描影响 | 变更使用 Node 文件系统 API，保持 Windows、Linux 与 macOS 路径行为一致。 |
| 测试 | 有影响 | 更新源码插件扫描器测试，并运行类型检查、相关单测和生产构建。 |
| 文档 | 有影响 | 新增本反馈执行记录；不涉及目录级说明或中英文镜像。 |

## 变更文件

- 新增：本执行记录。
- 修改：`apps/lina-web/build/plugin-ui-registry.ts`、`apps/lina-web/build/plugin-ui-registry.test.ts`和 14 个 TapCanvas 前端导入文件。
- 删除：`frontend/tapcanvas/types/tapcanvas-image-prompt-spec.d.ts`和`frontend/tapcanvas/types/tapcanvas-image-view-controls.d.ts`两份业务别名 ambient 声明。
- 暂存清理：已删除被当前通用扫描修复和插件内部相对导入完全取代的`stash@{0}`，原对象为`3685e85f844b89a77b223635cb55efd1f23e201e`。
- 交付类`Git`操作：不执行`commit`、`push`、`PR`、`merge`、`tag`或发布。

## 审查结论

- 审查范围：审查当前工作区的 18 个跟踪文件差异和 1 个新增执行记录，包括 14 个插件内部导入修改、2 个 ambient 声明删除、扫描器实现及其测试。插件根目录不存在局部`AGENTS.md`，按项目顶层规则审查。
- 已读取规则：`AGENTS.md`、`.agents/rules/workflow.md`、`.agents/rules/architecture.md`、`.agents/rules/plugin.md`、`.agents/rules/frontend-ui.md`、`.agents/rules/testing.md`、`.agents/rules/dev-tooling.md`、`.agents/rules/i18n.md`、`.agents/rules/documentation.md`和`.agents/instructions/markdown-format.instructions.md`。
- 严重问题：无。
- 警告：1 项。插件完整前端测试中，`Mantine CommonJS`传递依赖从`apps/lina-plugins/node_modules/.pnpm/react@19.2.7`加载第二份`React`，使 2 个组件测试文件的 6 个用例出现`Invalid Hook Call`。该问题与本次导入路径和扫描器修复独立，应作为后续测试基础设施反馈处理。
- 剩余风险：插件完整前端测试中的 6 个既有 React 双实例失败需作为独立测试基础设施反馈处理；不影响本次已通过的生产构建和 22 个相关测试。

## 阶段验收

- Tasklist 阶段验收：不适用；局部`direct-fix`不改变冻结 Tasklist。
- 验收结果：通过。生产构建、类型检查、`lint`、扫描器回归测试和 22 个相关用例均通过；业务专属宿主别名已清除，本次反馈的构建阻断已解决。
