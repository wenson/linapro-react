# 多租户前端页面

该目录维护官方 `linapro-tenant-core` 源码插件自有前端页面。

- `tenant-management.tsx` 承载平台租户管理路由 `/platform/tenants`。
- `components/tenant-modal.tsx` 维护租户新增/编辑弹窗。
- `tenant-client.ts` 维护租户管理页面本地使用的租户 CRUD API 调用。

登录租户选择、顶部租户切换器、路由守卫与租户状态等宿主运行时集成能力位于 React 工作台 `apps/lina-web`，因为这些能力属于工作台运行时接缝，不是单个插件页面的局部 UI。
