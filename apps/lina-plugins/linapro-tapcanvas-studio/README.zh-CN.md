# LinaPro TapCanvas Studio

`linapro-tapcanvas-studio`是 LinaPro受插件管理、支持多租户的源码插件，负责在 LinaPro内承载 TapCanvas项目入口和无限画布工作区；LinaPro启动时不会自动启用它。

## 能力边界

- LinaPro负责认证、用户、Tenant、RBAC、数据权限、数据库治理和 React宿主。
- `linapro-ai-core`负责供应商、模型、凭证和类型化 AI能力治理。
- 本插件负责 TapCanvas项目、章节、Flow、资产、素材、分镜、生成任务、业务 Memory和受治理的 Agents Bridge。
- 本插件不交付 Hono、Prisma、BullMQ、TapCanvas JWT、Team、billing、commerce或`new-api`运行路径。
- 来源仓`../../../../TapCanvas`只作为只读迁移输入。

## 当前阶段

阶段一只提供受插件管理的清单、源码插件嵌入注册、双语资源和两个懒加载 React页面入口；准备就绪后，请在插件管理中显式启用：

- `/tapcanvas/projects`使用普通页面 surface。
- `/tapcanvas/studio`使用 workspace surface。

业务 API、SQL、生成模型、Worker和 TapCanvas画布源码只能在冻结 Tasklist对应的后续阶段加入。

## 本地开发

从产品仓根目录运行统一插件检查和构建。插件复用宿主 React单例，并且只从`@linapro/plugin-ui`读取宿主上下文。
