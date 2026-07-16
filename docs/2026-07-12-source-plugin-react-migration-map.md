# 官方源码插件 React 逐文件迁移映射

## 文档定位

本文冻结阶段八迁移的逐文件输入与目标，确保 9 个官方源码 UI 插件的 28 个 Vue 页面或插槽，以及关联的 client/data helper，都有明确 React 落点。本文只建立映射，不表示对应迁移已经完成；实际完成状态仍以`docs/2026-07-12-react-workbench-replacement-tasklist.md`和阶段八执行记录为准。

## Vue 页面与插槽映射

| 插件 | 现有 Vue 文件 | React 目标文件 | Task |
| --- | --- | --- | --- |
| `linapro-ai-core` | `frontend/pages/provider-management.vue` | `frontend/pages/provider-management.tsx` | `RW-201` |
| `linapro-ai-core` | `frontend/pages/provider-drawer.vue` | `frontend/pages/provider-side-sheet.tsx` | `RW-202` |
| `linapro-ai-core` | `frontend/pages/endpoint-drawer.vue` | `frontend/pages/endpoint-side-sheet.tsx` | `RW-203` |
| `linapro-ai-core` | `frontend/pages/model-management.vue` | `frontend/pages/model-management.tsx` | `RW-204` |
| `linapro-ai-core` | `frontend/pages/model-drawer.vue` | `frontend/pages/model-side-sheet.tsx` | `RW-205` |
| `linapro-ai-core` | `frontend/pages/tier-management.vue` | `frontend/pages/tier-management.tsx` | `RW-206` |
| `linapro-ai-core` | `frontend/pages/tier-drawer.vue` | `frontend/pages/tier-side-sheet.tsx` | `RW-207` |
| `linapro-ai-core` | `frontend/pages/invocation-logs.vue` | `frontend/pages/invocation-logs.tsx` | `RW-208` |
| `linapro-ai-core` | `frontend/pages/invocation-detail-drawer.vue` | `frontend/pages/invocation-detail-side-sheet.tsx` | `RW-209` |
| `linapro-content-notice` | `frontend/pages/notice-management.vue` | `frontend/pages/notice-management.tsx` | `RW-221` |
| `linapro-content-notice` | `frontend/pages/notice-modal.vue` | `frontend/pages/notice-modal.tsx` | `RW-222` |
| `linapro-content-notice` | `frontend/pages/notice-preview-modal.vue` | `frontend/pages/notice-preview-modal.tsx` | `RW-223` |
| `linapro-demo-source` | `frontend/pages/sidebar-entry.vue` | `frontend/pages/sidebar-entry.tsx` | `RW-231` |
| `linapro-demo-source` | `frontend/pages/components/demo-record-modal.vue` | `frontend/pages/components/demo-record-modal.tsx` | `RW-232` |
| `linapro-monitor-loginlog` | `frontend/pages/loginlog-management.vue` | `frontend/pages/loginlog-management.tsx` | `RW-241` |
| `linapro-monitor-loginlog` | `frontend/pages/loginlog-detail-modal.vue` | `frontend/pages/loginlog-detail-modal.tsx` | `RW-241` |
| `linapro-monitor-online` | `frontend/pages/online-user.vue` | `frontend/pages/online-user.tsx` | `RW-243` |
| `linapro-monitor-operlog` | `frontend/pages/operlog-management.vue` | `frontend/pages/operlog-management.tsx` | `RW-245` |
| `linapro-monitor-operlog` | `frontend/pages/operlog-detail-drawer.vue` | `frontend/pages/operlog-detail-side-sheet.tsx` | `RW-245` |
| `linapro-monitor-server` | `frontend/pages/server-monitor.vue` | `frontend/pages/server-monitor.tsx` | `RW-247` |
| `linapro-org-core` | `frontend/pages/dept-management.vue` | `frontend/pages/dept-management.tsx` | `RW-251` |
| `linapro-org-core` | `frontend/pages/dept-drawer.vue` | `frontend/pages/dept-side-sheet.tsx` | `RW-251` |
| `linapro-org-core` | `frontend/pages/post-management.vue` | `frontend/pages/post-management.tsx` | `RW-252` |
| `linapro-org-core` | `frontend/pages/post-drawer.vue` | `frontend/pages/post-side-sheet.tsx` | `RW-252` |
| `linapro-tenant-core` | `frontend/pages/tenant-management.vue` | `frontend/pages/tenant-management.tsx` | `RW-261` |
| `linapro-tenant-core` | `frontend/pages/components/tenant-modal.vue` | `frontend/pages/components/tenant-modal.tsx` | `RW-261` |
| `linapro-tenant-core` | `frontend/pages/tenant-plugin-management.vue` | `frontend/pages/tenant-plugin-management.tsx` | `RW-262` |
| `linapro-tenant-core` | `frontend/slots/layout/header/actions/tenant-switcher.vue` | `frontend/slots/layout/header/actions/tenant-switcher.tsx` | `RW-263` |

## Client 与 data helper 映射

| 插件 | 现有 helper | React 迁移落点 | 约束 |
| --- | --- | --- | --- |
| `linapro-ai-core` | `frontend/pages/ai-client.ts`、`frontend/pages/ai-data.ts` | 保持文件名或拆入对应 React feature | 使用`useLinaPluginHost().api.plugin()`；删除 Vue/Vben/Ant 类型 |
| `linapro-content-notice` | `frontend/pages/notice-client.ts`、`frontend/pages/data.ts` | 保持文件名或拆入 notice feature | 只依赖`@linapro/plugin-ui`和自身相对模块 |
| `linapro-demo-source` | `frontend/pages/demo-record-client.ts` | 保持文件名或拆入 demo feature | 通过稳定宿主 API 投影请求插件后端 |
| `linapro-monitor-loginlog` | `frontend/pages/loginlog-client.ts`、`frontend/pages/data.ts` | 保持文件名或拆入 loginlog feature | 删除 Vben schema、Vue`h()`和宿主 store |
| `linapro-monitor-online` | `frontend/pages/online-client.ts`、`frontend/pages/data.ts` | 保持文件名或拆入 online feature | 删除 Vben schema和宿主时间工具引用 |
| `linapro-monitor-operlog` | `frontend/pages/operlog-client.ts`、`frontend/pages/data.ts` | 保持文件名或拆入 operlog feature | 下载和字典能力通过公开契约或插件局部实现 |
| `linapro-monitor-server` | `frontend/pages/server-client.ts` | 保持文件名或拆入 server feature | 通过稳定宿主 API 投影请求插件后端 |
| `linapro-org-core` | `frontend/pages/dept-client.ts`、`frontend/pages/dept-data.ts`、`frontend/pages/post-client.ts`、`frontend/pages/post-data.ts` | 保持文件名或按 dept/post feature 拆分 | 删除 Vben schema、Vue`h()`、宿主组件和 store 引用 |
| `linapro-tenant-core` | `frontend/pages/tenant-client.ts`、`frontend/pages/tenant-plugin-client.ts` | 保持文件名或按 tenant feature 拆分 | 租户请求继续由 LinaPro 权威 API 处理，不读取 Token |

## 完成门禁

- 每个映射行必须存在 React 目标文件，且原 Vue 文件删除后才可完成对应阶段八任务。
- `frontend/plugin-ui.ts`必须成为每个源码插件唯一 UI 清单入口；页面和插槽只通过清单`load()`懒加载。
- 从清单可达的全部 TypeScript/React 模块必须通过`apps/lina-web/build/plugin-ui-registry.ts`静态导入边界扫描。
- client/data helper 不得因删除 Vue 页面而遗漏；复用时也必须移除`#/*`、`@vben/*`、Vue、Ant Design Vue、宿主 store 和内部 DTO 依赖。
- 阶段八结束时，`find apps/lina-plugins -type f -name '*.vue'`必须无输出。
