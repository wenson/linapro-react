# 工作台账户菜单布局反馈执行记录

## 阶段信息

| 字段 | 值 |
| --- | --- |
| 阶段 | 反馈：工作台账户菜单布局 |
| Tasklist 版本 | 不适用：局部`direct-fix`，不改变冻结 Tasklist |
| 任务范围 | `FB-2` |
| 状态 | Passed |
| 开始时间 | `2026-07-25 14:10 Asia/Shanghai` |
| 完成时间 | `2026-07-25 14:22 Asia/Shanghai` |
| 执行分支 | `main` |
| 宿主基线 | `89c640fdce72721517dc41c7b73de83814df6347` |

## 反馈分诊与根因

- 处理路径：`direct-fix`。反馈只优化既有工作台账户菜单的视觉层级，不改变认证语义、路由、API、权限、数据模型或插件槽位，不需要升级冻结 Tasklist。
- 根因：`.workbench-user-profile`未定义纵向布局，`Typography.Text`默认按行内元素连续排布，导致姓名、用户名和邮箱在浮层中拼接。
- 处理范围：`apps/lina-web`账户菜单结构与局部样式、既有认证`TC005`的布局回归覆盖，以及本执行记录。
- 验证方式：组件测试验证身份字段的可访问渲染；认证 E2E 验证姓名、用户名与邮箱的纵向位置、现有中文菜单文案并保存截图；通过浏览器人工审查浮层。

## 任务状态

| 任务 | 状态 | 证据 |
| --- | --- | --- |
| `FB-2`账户菜单身份摘要布局 | Passed | 身份字段分行、工作台组件测试、`TC005`、截图审查和类型检查均通过。 |

## 命令与结果

| 序号 | 命令 | 退出码 | 结果 |
| --- | --- | --- | --- |
| 1 | `PATH="/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm --dir apps/lina-web typecheck` | `0` | 宿主与插件 UI TypeScript 检查通过。 |
| 2 | `PATH="/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm --dir apps/lina-web exec vitest run src/layout/workbench-layout.test.tsx` | `0` | 3 个工作台组件测试通过，覆盖姓名、`@用户名`和邮箱的渲染。 |
| 3 | `PATH="/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH" E2E_BASE_URL=http://127.0.0.1:5666 E2E_BROWSER_CHANNEL=chrome pnpm --dir hack/tests exec playwright test e2e/auth/TC005-user-dropdown.ts --reporter=list --timeout=60000` | `0` | 3 个账户菜单 E2E 用例通过。 |
| 4 | `agent-browser --session linapro-fb2 screenshot temp/20260725/141900-workbench-user-menu.png` | `0` | 登录后的工作台账户菜单截图已生成并完成人工视觉审查。 |
| 5 | `pnpm --dir apps/lina-web lint` | `1` | 既有`auth-gate.tsx`、`config-page.tsx`和`managed-upload.tsx`共 4 条 lint 错误；本次文件未出现 lint 诊断。 |
| 6 | `PATH="/Users/oz/.nvm/versions/node/v22.22.0/bin:$PATH" pnpm --dir hack/tests test:validate` | `1` | 既有`e2e/dashboard`存在两个`TC006`，导致模块本地编号重复；`auth/TC005`不受影响。 |
| 7 | `git diff --check` | `0` | 当前差异无空白符错误。 |

## 截图与人工审查

- 截图目录：`temp/20260725/`。
- 截图：`temp/20260725/141900-workbench-user-menu.png`、`temp/20260725/141919-workbench-user-menu.png`。
- 视觉审查：通过。账户浮层显示姓名、`@用户名`和操作区的明确纵向层级；当前用户未配置邮箱时不会保留空白行；宽度、边界、中文菜单文案均正常，未见截断、重叠或原始`i18n` key。
- E2E 质量审查：触发并通过。用户可观察的账户菜单布局由既有`TC005`覆盖；断言用户身份字段、`@`前缀、纵向位置、中文菜单文案和头像可见性，且独立运行通过。组件测试以带邮箱的认证上下文验证第三行内容。

## 影响评估

| 规则域 | 结论 | 证据或说明 |
| --- | --- | --- |
| 架构 | 无影响 | 未改变模块边界、公开注册表或运行时依赖。 |
| 插件 | 无影响 | 未修改插件目录、插件槽位或插件资源。 |
| 前端 UI | 有影响 | 优化宿主工作台账户菜单的身份摘要布局。 |
| API | 无影响 | 不涉及请求、响应、路由、权限标签或调用频次。 |
| 后端与 DI | 无影响 | 不涉及 Go、认证服务或依赖注入。 |
| 数据库 | 无影响 | 不涉及 SQL、DAO、索引或数据。 |
| 数据权限 | 无影响 | 不改变身份信息的读取范围或账户操作权限。 |
| 缓存一致性 | 无影响 | 无状态、缓存或失效路径变化。 |
| i18n | 无资源影响 | 复用既有菜单翻译；用户名和邮箱来自用户数据，新增的`@`仅为视觉前缀。 |
| 开发工具 | 无影响 | 未修改脚本、CI 或跨平台执行入口。 |
| 测试 | 有影响 | 更新既有认证`TC005`以覆盖布局和截图验证。 |
| 文档 | 有影响 | 新增本执行记录；不涉及目录级说明文档或中英文镜像。 |

## 变更文件

- 新增：本执行记录。
- 修改：`apps/lina-web/src/layout/workbench-header.tsx`、`apps/lina-web/src/layout/workbench-layout.test.tsx`、`apps/lina-web/src/styles/global.css`、`hack/tests/e2e/auth/TC005-user-dropdown.ts`和`hack/tests/pages/MainLayout.ts`。
- 删除：无。
- 未经授权的 Git 操作：无；未执行 commit、push、PR、merge、tag 或发布。

## 审查结论

- 审查范围：`git status --short`中的全部 staged、unstaged 和未跟踪文件；本阶段实现范围为`FB-2`的 5 个代码和测试文件及本执行记录。已有`auth-gate`、`vite.config`、`TC001`、`TC011`和登录页执行记录差异不属于本次范围，未改写。
- 已读取规则：`AGENTS.md`、`.agents/rules/workflow.md`、`.agents/rules/frontend-ui.md`、`.agents/rules/testing.md`、`.agents/rules/i18n.md`、`.agents/rules/documentation.md`、`.agents/instructions/markdown-format.instructions.md`和`lina-e2e`技能。
- 严重问题：`0`。实现只使用现有 Semi`Dropdown`与产品 token，未覆盖 Semi 内部选择器；`TC005`在 Vite 开发服务下独立通过。
- 警告：全量 lint 被 3 个既有文件的 4 条规则错误阻断；全量 E2E 清单校验被`e2e/dashboard`重复`TC006`阻断。两者均不属于本次改动。
- 剩余风险：未配置邮箱的当前账户已通过空状态断言；带邮箱的第三行内容由工作台组件测试覆盖。全量 lint 和 E2E 清单治理仍需在独立反馈中处理。

## 阶段验收

- Tasklist 阶段验收：不适用；局部`direct-fix`不改变冻结 Tasklist。
- 验收结果：Passed。局部反馈的实现、类型检查、独立 E2E、截图审查和变更审查均有当前工作区证据。
