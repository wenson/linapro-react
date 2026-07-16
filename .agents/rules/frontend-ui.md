# 前端与 UI 规则

## 适用范围

本规则约束`apps/lina-web`宿主工作台、内建页面、源码插件 React 页面和插槽，以及前端路由、组件、权限、菜单、交互、样式和图标。动态插件页面的隔离规则由`.agents/rules/plugin.md`维护。

## 技术栈与目录

- 宿主工作台、内建页面和官方源码插件嵌入页面必须使用 React 与 TypeScript，不得新增 Vue、Vben、Ant Design Vue 或 Vue/React 兼容层。
- 宿主工作台位于`apps/lina-web`，路径别名`#/*`只指向该应用的`src/*`。
- 宿主页面放在`src/features/<feature>/`，宿主 API 投影放在`src/api/`或所属 feature 内，路由注册放在`src/router/`。
- 页面只通过显式注册表装配，不得根据后端字符串执行任意动态 import。
- 源码插件 UI 必须通过`frontend/plugin-ui.ts`和`@linapro/plugin-ui`稳定导入面接入，不得引用宿主私有`#/*`路径。

## Semi Design 使用边界

- 宿主管理 UI 统一直接使用`@douyinfe/semi-ui`和`@douyinfe/semi-icons`，不得依赖`antd`、`@ant-design/icons`或 Semi/Ant 兼容层。
- 桌面和移动导航分别使用 Semi`Layout`、`Navigation`和`SideSheet`，不得引入第二套布局系统。
- 列表使用 Semi`Table`，表单使用 Semi`Form`，确认和编辑对话使用 Semi`Modal`，侧向详情或移动面板使用 Semi`SideSheet`。
- 上传使用 Semi`Upload`，下拉操作使用 Semi`Dropdown`，确认操作使用 Semi`Popconfirm`，反馈使用 Semi`Toast`或`Notification`。
- 图标只使用 Semi Icons。业务含义必须由图标、可读标签、tooltip 或无障碍名称共同表达，不得只依赖颜色。
- Semi 样式只在应用入口加载一次；主题通过`theme-mode="dark"`和产品 token 切换，不复制或覆盖 Semi 内部样式实现。

## 组件与状态边界

- 页面组件、业务组件、hooks 和适配器必须保持职责清晰，调用方应能通过名称、`props`、返回值和事件直接理解行为。
- 优先使用直接数据流和局部状态。服务端状态使用 TanStack Query，会话级跨页面状态才使用 Zustand，局部表单编辑不得进入全局 store。
- 禁止创建`LinaTable`、`LinaForm`、`LinaModal`、`LinaSideSheet`等只转发 Semi 参数的通用包装层。
- 只有存在至少两个真实复用点，且组件承载稳定业务语义、访问控制、错误处理或复杂度收敛时，才允许创建共享组件。
- 禁止为未来差异预建大而全 schema renderer、动态表单协议、兼容适配器或多层异步转发链。
- 前端 API 层负责包络解析、必要投影、命名转换和错误归一化，不得把后端 DTO 扩散到无关页面。

## 页面与工作流

- 表格筛选、分页、排序、批量操作和导出必须由所属页面维护清晰状态，不得依赖隐藏的全局事件。
- 导入流程必须包含上传区域、文件类型提示、模板下载、覆盖语义、进度和失败反馈。
- 重置密码流程必须展示目标用户、输入校验、确认校验和明确结果。
- 常用操作必须可发现；不可逆操作必须确认；加载、空状态、成功和失败必须提供可诊断反馈。
- 前端模块禁用或用户无权限时，相关菜单、字段、列、筛选和按钮必须完全隐藏，而不是仅禁用或置灰。
- 移动端必须保持核心查看和操作路径可用，不得把桌面表格简单横向压缩后作为完成结果。

## 样式与可访问性

- 使用产品 token 维护颜色、间距、圆角、阴影和层级，不在业务页面硬编码全局视觉常量。
- 页面样式不得覆盖`body`、`.semi-*`或其他全局选择器；源码插件样式必须限制在自身根节点。
- 表单控件必须具有关联标签，图标按钮必须具有可访问名称，键盘焦点必须可见，Modal 和 SideSheet 关闭后应恢复合理焦点。
- 错误不得只通过颜色表达；表格、表单、图表和空状态必须在浅色和深色主题下可读。

## i18n 和测试

- 修改用户可见文案、菜单、路由、按钮、表单、表格或提示信息时，必须读取`.agents/rules/i18n.md`。
- 翻译必须在渲染期求值，不得在模块顶层调用`t()`；语言切换后页面标题、菜单、标签、插件文案和 Semi locale 必须同步刷新。
- 涉及用户可观察行为变化时，必须读取`.agents/rules/testing.md`并新增或更新对应 E2E；组件逻辑使用 Testing Library 验证用户可观察结果，不断言 Semi 内部类名。
- 涉及 API 调用契约变化时，必须读取`.agents/rules/api-contract.md`。
