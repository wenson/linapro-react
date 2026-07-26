# 登录页辅助入口布局反馈执行记录

## 阶段信息

| 字段 | 值 |
| --- | --- |
| 阶段 | 反馈：登录页辅助入口布局 |
| Tasklist 版本 | 不适用：局部`direct-fix`，不改变冻结 Tasklist |
| 任务范围 | `FB-1` |
| 状态 | `Passed` |
| 开始时间 | `2026-07-25 13:50 Asia/Shanghai` |
| 执行分支 | `main` |
| 宿主基线 | `89c640fdce72721517dc41c7b73de83814df6347` |

## 反馈分诊与根因

- 处理路径：`direct-fix`。反馈仅调整登录页两个既有公开入口的视觉布局，不改变认证语义、路由、API、权限或数据模型，不具备 OpenSpec 或 Tasklist 升级价值。
- 根因：`.login-public-actions`未定义布局规则，两个锚点按默认行内流紧贴排列，且缺少与登录主按钮的垂直间距。
- 修复：在`apps/lina-web/src/styles/global.css`为辅助入口容器添加`flex`双端对齐和产品间距；链接默认不显示下划线，仅在悬停时显示。
- 验证方式：新增独立的`TC011`认证 E2E，断言中文实际翻译文本、双端边界对齐，并保存登录页截图。

## 任务状态

| 任务 | 状态 | 证据 |
| --- | --- | --- |
| `FB-1`登录页辅助入口双端对齐 | `Passed` | 样式实现、`TC011`和截图审查均通过。 |

## 命令与结果

| 序号 | 命令 | 退出码 | 结果 |
| --- | --- | --- | --- |
| 1 | `pnpm --dir apps/lina-web exec vitest run src/auth/login-page.test.tsx` | `0` | 3 个认证页面单测通过。 |
| 2 | `pnpm --dir apps/lina-web typecheck` | `0` | 宿主与插件 UI TypeScript 检查通过。 |
| 3 | `PATH="$HOME/.nvm/versions/node/v22.22.0/bin:$PATH" E2E_BROWSER_CHANNEL=chrome pnpm --dir hack/tests exec playwright test e2e/auth/TC011-login-public-actions-layout.ts --reporter=line` | `0` | 新增 E2E 通过。 |
| 4 | `pnpm --dir hack/tests test:validate` | `1` | 既有`e2e/dashboard`存在两个`TC006`，导致模块本地编号重复；与`auth/TC011`无关。 |
| 5 | `pnpm --dir apps/lina-web lint` | `1` | `HEAD`中已有`auth-gate.tsx`、`config-page.tsx`和`managed-upload.tsx` lint 问题；本次 CSS 和 E2E 未产生 lint 诊断。 |
| 6 | `git diff --check` | `0` | 当前差异无空白符错误。 |

## 截图与人工审查

- 截图目录：`temp/20260725/`。
- 截图：`temp/20260725/135837-login-public-actions.png`。
- 视觉审查：通过。辅助入口位于登录按钮下方，`忘记密码？`靠左、`创建账号`靠右；两者留有明确的可点击空间，未见截断、重叠或原始 i18n key。
- E2E 质量审查：触发。用户可观察的登录页布局变更由独立`TC011`覆盖；断言同时证明中文翻译和两端边界对齐。

## 影响评估

| 规则域 | 结论 | 证据或说明 |
| --- | --- | --- |
| 架构 | 无影响 | 未改变模块边界、公开注册表或运行时依赖。 |
| 插件 | 无影响 | 未修改插件目录、插件槽位或插件资源。 |
| 前端 UI | 有影响 | 仅调整宿主登录页辅助链接的布局与悬停呈现。 |
| API | 无影响 | 不涉及请求、响应、路由、权限标签或调用频次。 |
| 后端与 DI | 无影响 | 不涉及 Go、认证服务或依赖注入。 |
| 数据库 | 无影响 | 不涉及 SQL、DAO、索引或数据。 |
| 数据权限 | 无影响 | 两个既有公开入口的访问边界不变。 |
| 缓存一致性 | 无影响 | 无状态、缓存或失效路径变化。 |
| i18n | 无资源影响 | 未新增或修改文案和语言包；`TC011`断言现有中文翻译文本。 |
| 开发工具 | 无影响 | 未修改脚本、CI 或跨平台执行入口；E2E 使用现有 Node 22 环境。 |
| 测试 | 有影响 | 新增`auth/TC011`；全量静态 E2E 校验仍受既有`dashboard`重复编号阻断。 |
| 文档 | 有影响 | 新增本执行记录；不涉及目录级说明文档或中英文镜像。 |

## 变更文件

- 新增：`hack/tests/e2e/auth/TC011-login-public-actions-layout.ts`、本执行记录。
- 修改：`apps/lina-web/src/styles/global.css`。
- 删除：无。
- 未经授权的 Git 操作：无；未执行 commit、push、PR、merge、tag 或发布。

## 审查结论

- 审查范围：`git status --short`、未跟踪文件展开、`FB-1`和本执行记录。
- 已读取规则：`AGENTS.md`、`.agents/rules/workflow.md`、`.agents/rules/frontend-ui.md`、`.agents/rules/testing.md`、`.agents/rules/i18n.md`、`.agents/rules/documentation.md`和`.agents/instructions/markdown-format.instructions.md`。
- 严重问题：`0`。样式使用现有 token，不覆盖 Semi 内部选择器；`TC011`独立运行、编号连续、验证实际翻译和可见布局结果；执行记录不涉及目录级`README`镜像。
- 警告：既有全量 E2E 编号冲突和既有全量 lint 问题，均不在本次修改范围内。
- 验证证据：`login-page.test.tsx`、TypeScript 检查、独立`TC011`和`git diff --check`通过；全量`test:validate`和 lint 的失败原因及范围已记录。
- 剩余风险：全量门禁无法因上述既有问题完全通过；新增`TC011`已在本地服务和 Chrome 渠道下通过。

## 阶段验收

- Tasklist 阶段验收：不适用；局部`direct-fix`不改变冻结 Tasklist。
- 验收结果：`Passed`。`lina-review`反馈级审查未发现本次范围的阻塞问题。
