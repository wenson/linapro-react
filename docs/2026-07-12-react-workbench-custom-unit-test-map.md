# Lina 定制单元测试 React 映射

## 结论

旧工作台 13 个 Lina 定制单元测试均有 React 等价测试或覆盖范围更强的替代测试。本文只记录测试迁移关系，不把删除旧测试当作完成证据。

| 旧测试 | React 等价或更强证据 | 覆盖结论 |
| --- | --- | --- |
| `adapter/form.test.ts` | `features/profile/profile.test.tsx`、`features/iam/*/*-page.test.tsx`、`features/settings/settings-pages.test.tsx` | 真实 Semi Form 提交、校验和页面表单替代 schema 适配器测试 |
| `api/request.test.ts` | `api/client.test.ts`、`api/system/iam-api.test.ts`、`api/system/settings-api.test.ts`、`api/system/job.test.ts`、`api/system/plugin.test.ts` | 覆盖包络、刷新、租户头、上传下载及业务路径 |
| `components/tree/src/helper.test.ts` | `shared/shared-components.test.tsx` | 覆盖展平、过滤、投影和后代保护 |
| `components/tree/src/permission-display.test.ts` | `layout/access-control.test.tsx`、`features/iam/role/role-page.test.tsx`、`features/iam/menu/menu-page.test.tsx` | 覆盖动作隐藏、权限树和菜单树展示 |
| `locales/index.test.ts` | `runtime/i18n.test.ts` | 覆盖语言初始化、切换、资源合并和回退 |
| `plugins/access-filter.test.ts` | `layout/access-control.test.tsx`、`router/project-menu.test.tsx` | 覆盖权限动作和路由 fail-closed |
| `plugins/management-capabilities.test.ts` | `plugins/capabilities.test.ts`、`features/iam/role/data-scope.test.ts`、`features/iam/user/user-page.test.tsx` | 覆盖 capability 投影及字段/数据范围降级 |
| `plugins/tabbar-cleanup.test.ts` | `plugin-ui/generation-refresh.test.ts`、`router/project-menu.test.tsx`、`layout/workbench-layout.test.tsx` | 覆盖 generation 清理、标签元数据和插件路由变化 |
| `router/access-refresh-route-match.test.ts` | `router/project-menu.test.tsx` | 覆盖菜单投影、动态隐藏路由和具体标签路径匹配 |
| `runtime/__tests__/runtime-i18n.test.ts` | `runtime/i18n.test.ts`、`runtime/cache.test.ts` | 覆盖运行时消息、缓存和语言刷新 |
| `runtime/public-frontend.test.ts` | `runtime/public-config.test.ts`、`app/bootstrap.test.tsx` | 覆盖公共配置解析、默认值和启动顺序 |
| `utils/dict.test.ts` | `features/settings/settings-pages.test.tsx`、`shared/shared-components.test.tsx` | 覆盖字典页面、标签样式和局部字典 Query 缓存 |
| `views/system/user/tenant-options.test.ts` | `features/iam/user/tenant-options.test.ts` | 逐项覆盖非平台、权限拒绝、登录租户和通配权限回退 |

## 验证边界

- 映射以当前 React 测试文件和全量 Vitest 结果为证据。
- 阶段十三已确认`hack/tests/e2e`仍有完整的 105 个`TC*.ts`宿主用例，并已执行全量宿主 E2E；未用本表替代浏览器验收。
- 当前 React 单元测试、105 个宿主 E2E 和最终二进制视觉审查共同构成迁移证据；详细命令与截图路径见阶段十三执行记录。
