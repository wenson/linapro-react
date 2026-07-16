# LinaPro React Workbench Replacement Implementation Plan

> **执行顺序说明：** 已冻结的`docs/2026-07-12-react-workbench-replacement-tasklist.md` `v1.2`是本项目唯一权威执行清单。本文形成于冻结前，只提供历史实现细节；依赖清单、动态插件隔离、工具链文件范围和任务顺序不得从本文单独执行，若有差异必须以 Tasklist 为准。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace`apps/lina-vben`with a single React workbench at`apps/lina-web`, preserve LinaPro host behavior, introduce a React-only source-plugin UI contract, isolate dynamic plugin UI, and remove Vue/Vben from the production toolchain.

**Architecture:** Build the new workbench beside the old source tree while the old workbench remains the default development entry. Migrate runtime foundations and host pages in testable waves, then switch`Makefile`,`linactl`,CI,embedded assets,and E2E in one cutover task. Source plugins load React pages through explicit lazy manifests; dynamic plugins use only iframe or new-window isolation.

**Tech Stack:** Node.js 22.22.0, pnpm 10.30.3, TypeScript 5.9.3, React 19.2.7, Vite 7.3.1, React Router 7.18.1, TanStack Query 5.101.2, Zustand 5.0.14, Semi Design 2.101.0, i18next 26.3.6, Vitest 4.0.18, Playwright, GoFrame v2.

## Global Constraints

- The detailed design is`docs/2026-07-11-react-workbench-replacement-design.md`; the total architecture is`docs/2026-07-11-tapcanvas-react-platform-migration-design.md`.
- Do not modify`apps/lina-core`,`apps/lina-vben`,or`hack`until the repository owner creates the root`.contributing`authorization file required by`AGENTS.md`.
- `lina-tapcanvas`does not use OpenSpec. Do not create,update,validate,or gate delivery on OpenSpec artifacts;use the frozen Tasklist,stage evidence,and code review.
- The workbench, built-in pages, and official embedded source-plugin pages use React only. Do not add Vue/React compatibility, micro-frontends, Module Federation, or a runtime framework switch.
- Keep`apps/lina-vben`as the default dev/build entry until Task 13. Do not run two workbenches in one product process.
- Keep LinaPro authentication, user, menu, tenant, RBAC, data-permission, and business HTTP semantics unchanged except for deleting dynamic-plugin`embedded-mount`support.
- Host pages use`@douyinfe/semi-ui@2.101.0`and`@douyinfe/semi-icons@2.101.0`. Source plugins may use another React component library but must resolve the host React singleton.
- The host package must not depend on`antd`,`@ant-design/icons`,or a Semi/Ant compatibility wrapper.
- Support only`en-US`and`zh-CN`; English is source content.
- Developer tooling must run on Windows, Linux, and macOS. Put persistent filesystem/process logic in Go, not shell scripts.
- Preserve existing stable`data-testid`attributes and E2E case numbers unless the behavior itself is intentionally removed.
- Do not modify generated Go DAO/DO/entity files. Use the`goframe-v2`skill for Go implementation tasks.
- Do not commit or push unless the user explicitly authorizes Git operations. Each task includes a suggested commit checkpoint for later use.
- `apps/lina-plugins`is an ordinary product-owned directory tracked by the parent repository. The current inventory contains 28 Vue pages or slots across nine source plugins;Task 13 must migrate all of them before cutover. Do not reintroduce a gitlink,nested`.git`,or separate plugin fork.

## Target File Map

The implementation creates these responsibility boundaries before page migration:

| Path | Responsibility |
| --- | --- |
| `apps/lina-web/src/app/bootstrap.ts` | Ordered public-config, i18n, store, router, and React startup |
| `apps/lina-web/src/api/client.ts` | Envelope parsing, headers, refresh single-flight, retry, upload/download |
| `apps/lina-web/src/auth/session-store.ts` | Token and minimal session state only |
| `apps/lina-web/src/tenant/tenant-store.ts` | Tenant selection, switching, impersonation, persistence |
| `apps/lina-web/src/runtime/public-config.ts` | Public frontend configuration normalization and base path |
| `apps/lina-web/src/runtime/i18n.ts` | Base messages, runtime ETag cache, Semi Design/dayjs locale |
| `apps/lina-web/src/router/project-menu.tsx` | Backend menu DTO to React route/menu projection |
| `apps/lina-web/src/router/host-pages.tsx` | Explicit host component-key registry |
| `apps/lina-web/src/layout/workbench-layout.tsx` | Navigation, header, tabs, content surface, plugin slots |
| `apps/lina-web/src/plugin-ui/contract.ts` | Stable React source-plugin UI contract |
| `apps/lina-web/build/plugin-ui-registry.ts` | Vite virtual-module generation and manifest validation |
| `apps/lina-web/src/plugin-ui/registry.ts` | Runtime page, slot, capability, and plugin-state projection |
| `apps/lina-web/src/plugin-ui/hosted-page.tsx` | Dynamic-plugin iframe/new-window rendering only |
| `apps/lina-web/src/features/*` | Feature-owned pages, API projections, forms, and tests |

### Task 1: Satisfy Governance Gates and Record the React Contract

**Files:**

- Modify: `.agents/rules/frontend-ui.md`
- Modify: `.agents/rules/plugin.md`
- Modify: `AGENTS.md`
- Modify: `.agents/rules/openspec.md`
- Modify: `.agents/rules/documentation.md`
- Modify: `.agents/rules/architecture.md`
- Modify: `.agents/rules/database.md`
- Modify: `.agents/rules/data-permission.md`
- Modify: `.agents/rules/testing.md`
- Modify: `CONTRIBUTING.md`
- Modify: `CONTRIBUTING.zh-CN.md`
- Modify: `docs/2026-07-11-react-workbench-replacement-design.md`

**Interfaces:**

- Consumes: Root`AGENTS.md`and the approved total architecture.
- Produces: A repository rule that source-plugin embedded UI is React-only and dynamic plugin UI is iframe/new-window only.

- [ ] **Step 1: Verify the contribution gate before code work**

Run:

```bash
test -f .contributing
```

Expected: exit code`0`. If it fails, stop implementation after documentation review; do not create the authorization file on behalf of the repository owner.

- [ ] **Step 2: Replace Vben-specific frontend rules with React workbench rules**

Record these exact requirements in`.agents/rules/frontend-ui.md`:

```markdown
- The host workbench, built-in pages, and source-plugin embedded pages MUST use React and TypeScript.
- Host page routes live under `apps/lina-web/src/features/`; API projections live under `apps/lina-web/src/api/` or their owning feature.
- Host CRUD pages use Semi Design directly; do not recreate Vben schema adapters or a generic UI compatibility layer.
- Source plugins contribute React pages and slots through `frontend/plugin-ui.ts`.
- Dynamic plugin pages use iframe or new-window isolation and MUST NOT inject a frontend runtime into the host bundle.
- User-visible behavior changes require Vitest coverage and corresponding Playwright E2E coverage.
```

Delete requirements that mandate`useVbenVxeGrid`,`useVbenForm`,`useVbenModal`,`useVbenDrawer`,Vue paths,Ant Design Vue,or`ruoyi-plus-vben5`.

In`.agents/rules/plugin.md`,record that source-plugin workbench pages and slots are React`.tsx`modules referenced by`frontend/plugin-ui.ts`;dynamic plugin public pages remain framework-independent only because they run in an iframe or a new tab.

- [ ] **Step 3: Remove OpenSpec from the product execution chain**

Update product governance so`lina-tapcanvas`uses design documents,the frozen
Tasklist,stage evidence,and code review. Remove mandatory OpenSpec proposal,
validation,archive,and PR requirements from active agent and contributor entry
points. Keep source-plugin React and dynamic-plugin iframe/new-window requirements
in`.agents/rules/plugin.md`and the React workbench design. Inherited upstream
`openspec/`content is not a requirement,task,validation source,or delivery gate.

- [ ] **Step 4: Validate governance text**

Run:

```bash
rg -n "useVben|VbenVxe|ant-design-vue|嵌入式挂载|可使用任何前端框架" .agents/rules/frontend-ui.md .agents/rules/plugin.md
rg -n "OpenSpec|openspec" AGENTS.md CONTRIBUTING.md CONTRIBUTING.zh-CN.md .agents/rules
```

Expected: no active requirement permits Vben APIs or arbitrary framework mounting,
and no product governance entry requires OpenSpec execution. Any retained mention
must explicitly describe inactive upstream residue rather than a product gate.

- [ ] **Step 5: Record the governance checkpoint**

Suggested commit after explicit authorization:

```bash
git add AGENTS.md .agents/rules CONTRIBUTING.md CONTRIBUTING.zh-CN.md docs/2026-07-11-react-workbench-replacement-design.md
git commit -m "docs: define React workbench UI contract"
```

### Task 2: Scaffold the Single-Package React Workbench

**Files:**

- Create: `apps/lina-web/.node-version`
- Create: `apps/lina-web/index.html`
- Create: `apps/lina-web/package.json`
- Create: `apps/lina-web/pnpm-lock.yaml`
- Create: `apps/lina-web/tsconfig.json`
- Create: `apps/lina-web/vite.config.ts`
- Create: `apps/lina-web/src/vite-env.d.ts`
- Create: `apps/lina-web/src/main.tsx`
- Create: `apps/lina-web/src/app/providers.tsx`
- Create: `apps/lina-web/src/app/error-boundary.tsx`
- Create: `apps/lina-web/src/styles/tokens.css`
- Create: `apps/lina-web/src/styles/global.css`
- Create: `apps/lina-web/src/test/setup.ts`
- Create: `apps/lina-web/src/app/providers.test.tsx`

**Interfaces:**

- Consumes: Node.js 22.22.0 and pnpm 10.30.3.
- Produces: `pnpm dev`,`pnpm build`,`pnpm typecheck`,`pnpm test:unit`,and a React provider tree.

- [ ] **Step 1: Write the provider smoke test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProviders } from './providers';

describe('AppProviders', () => {
  it('renders children inside the application provider tree', () => {
    render(<AppProviders locale="en-US"><div>provider-ready</div></AppProviders>);
    expect(screen.getByText('provider-ready')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test before scaffolding**

Run:

```bash
pnpm --dir apps/lina-web test:unit -- src/app/providers.test.tsx
```

Expected: failure because`apps/lina-web/package.json`does not exist.

- [ ] **Step 3: Create the package manifest and TypeScript configuration**

Use this script surface in`apps/lina-web/package.json`:

```json
{
  "name": "@linapro/web",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "build": "vite build --mode production",
    "dev": "vite --mode development",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "i18n:check": "node ./scripts/check-i18n-keys.mjs"
  },
  "engines": {
    "node": ">=22.22.0",
    "pnpm": ">=10.30.3"
  },
  "packageManager": "pnpm@10.30.3"
}
```

Add the exact runtime versions from the frozen Tasklist to`dependencies`,including`@douyinfe/semi-ui@2.101.0`and`@douyinfe/semi-icons@2.101.0`;do not add`antd`. Use`@vitejs/plugin-react@5.2.0`and the exact type, test, lint, chart, editor, cropper, and date dependencies listed in Tasklist phase two.

- [ ] **Step 4: Implement the provider tree**

```tsx
import { LocaleProvider } from '@douyinfe/semi-ui';
import en_US from '@douyinfe/semi-ui/lib/es/locale/source/en_US';
import zh_CN from '@douyinfe/semi-ui/lib/es/locale/source/zh_CN';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import '@douyinfe/semi-ui/dist/css/semi.min.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 30_000 },
    mutations: { retry: false },
  },
});

const semiLocales = { 'en-US': en_US, 'zh-CN': zh_CN } as const;

type AppProvidersProps = PropsWithChildren<{
  locale: keyof typeof semiLocales;
}>;

export function AppProviders({ children, locale }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider locale={semiLocales[locale]}>{children}</LocaleProvider>
    </QueryClientProvider>
  );
}
```

Export the shared`queryClient`for atomic session and tenant invalidation.

Import`tokens.css`after the Semi Design base stylesheet and override only documented`--semi-*`CSS variables. Theme switching sets or removes`theme-mode="dark"`on`document.body`;do not add a second theme provider or copy Semi component styles.

- [ ] **Step 5: Add Vite, Vitest, proxy, and path configuration**

Configure`vite.config.ts`with React SWC, alias`#`to`src`,Vitest`jsdom`,and proxies for`/api`,`/x`,and`/x-assets`to`http://127.0.0.1:9120`. Keep the frontend port at`5666`and reject a different proxy target at review.

- [ ] **Step 6: Install and run the scaffold gates**

Run:

```bash
pnpm --dir apps/lina-web install
pnpm --dir apps/lina-web typecheck
pnpm --dir apps/lina-web test:unit -- src/app/providers.test.tsx
pnpm --dir apps/lina-web build
```

Expected: lockfile created; typecheck and test pass;`apps/lina-web/dist/index.html`exists.

- [ ] **Step 7: Record the scaffold checkpoint**

Suggested commit after explicit authorization:

```bash
git add apps/lina-web
git commit -m "feat(web): scaffold React workbench"
```

### Task 3: Implement Public Configuration, i18n, and API Client

**Files:**

- Create: `apps/lina-web/src/api/contracts.ts`
- Create: `apps/lina-web/src/api/client.ts`
- Create: `apps/lina-web/src/api/client.test.ts`
- Create: `apps/lina-web/src/runtime/public-config.ts`
- Create: `apps/lina-web/src/runtime/public-config.test.ts`
- Create: `apps/lina-web/src/runtime/i18n.ts`
- Create: `apps/lina-web/src/runtime/i18n.test.ts`
- Create: `apps/lina-web/src/locales/en-US/common.json`
- Create: `apps/lina-web/src/locales/en-US/auth.json`
- Create: `apps/lina-web/src/locales/en-US/pages.json`
- Create: `apps/lina-web/src/locales/zh-CN/common.json`
- Create: `apps/lina-web/src/locales/zh-CN/auth.json`
- Create: `apps/lina-web/src/locales/zh-CN/pages.json`
- Create: `apps/lina-web/src/app/bootstrap.ts`
- Modify: `apps/lina-web/src/main.tsx`

**Interfaces:**

- Consumes: `SessionSnapshotProvider`and`TenantHeaderProvider`callbacks injected into`ApiClient`.
- Produces: `api.request<T>()`,`api.download()`,`loadPublicFrontendConfig()`,`initializeI18n()`,and`bootstrapApp()`.

- [ ] **Step 1: Write failing API client tests**

Cover these exact cases with mocked`fetch`:

```ts
it('adds authorization, locale, and tenant headers', async () => {
  await client.request('/user/info');
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/v1/user/info',
    expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer access-1',
        'Accept-Language': 'zh-CN',
        'X-Tenant-Code': 'tenant-a',
      }),
    }),
  );
});

it('shares one refresh request across concurrent 401 responses', async () => {
  await Promise.all([client.request('/user/info'), client.request('/menus/all')]);
  expect(refreshSession).toHaveBeenCalledTimes(1);
});
```

Also assert refresh retries each request once and refresh failure calls`expireSession()`once.

- [ ] **Step 2: Run the API tests and verify failure**

Run:

```bash
pnpm --dir apps/lina-web test:unit -- src/api/client.test.ts
```

Expected: failure because`ApiClient`is missing.

- [ ] **Step 3: Implement the envelope and refresh client**

Define the stable constructor:

```ts
export interface ApiClientOptions {
  baseUrl: string;
  fetchImpl: typeof fetch;
  getAccessToken(): string | null;
  getLocale(): string;
  getTenantCode(): string | null;
  refreshSession(): Promise<string>;
  expireSession(): Promise<void>;
}

export class ApiClient {
  private refreshPromise: Promise<string> | null = null;
  constructor(private readonly options: ApiClientOptions) {}
  request<T>(path: string, init?: RequestInit): Promise<T>;
  download(path: string, init?: RequestInit): Promise<Blob>;
}
```

Use a private`requestOnce(path,init,retryAfterRefresh)`method. Never retry a request more than once after`401`.

- [ ] **Step 4: Write and implement public-config normalization tests**

Test that`/`remains`/`,valid`/admin`becomes router basename`/admin`,and`/api`,`/x`,`/x-assets`,URLs,query/hash,and wildcard values fall back to`/admin`.

Expose:

```ts
export interface PublicFrontendConfig {
  app: { logo: string; logoDark: string; name: string };
  auth: { loginSubtitle: string; panelLayout: 'panel-left' | 'panel-center' | 'panel-right'; pageDesc: string; pageTitle: string };
  ui: { layout: string; themeMode: string; watermarkContent: string; watermarkEnabled: boolean };
  workspace: { basePath: string };
}

export async function loadPublicFrontendConfig(fetchImpl = fetch): Promise<PublicFrontendConfig>;
export function workspaceBasename(config: PublicFrontendConfig): string;
```

- [ ] **Step 5: Write and implement runtime i18n cache tests**

Preserve the cache contract:

```ts
const runtimeCachePrefix = 'linapro:i18n:runtime:';
const runtimeCacheTtlMs = 7 * 24 * 60 * 60 * 1000;
const runtimeRequestMaxAttempts = 2;
```

Tests must prove fresh cache renders immediately,`If-None-Match`is sent,`304`keeps cached messages,network failure falls back to cache,and switching locale updates`document.documentElement.lang`.

- [ ] **Step 6: Implement ordered bootstrap**

```ts
export async function bootstrapApp() {
  const publicConfig = await loadPublicFrontendConfig();
  const i18n = await initializeI18n(publicConfig);
  const router = createWorkbenchRouter({
    basename: workspaceBasename(publicConfig),
    publicConfig,
  });
  return { i18n, publicConfig, router };
}
```

`main.tsx`must await this function before`createRoot().render()`and render a plain fatal bootstrap error if initialization cannot recover.

- [ ] **Step 7: Run foundation gates**

Run:

```bash
pnpm --dir apps/lina-web test:unit -- src/api/client.test.ts src/runtime/public-config.test.ts src/runtime/i18n.test.ts
pnpm --dir apps/lina-web typecheck
```

Expected: all pass.

- [ ] **Step 8: Record the foundation checkpoint**

Suggested commit after explicit authorization:

```bash
git add apps/lina-web/src/api apps/lina-web/src/runtime apps/lina-web/src/locales apps/lina-web/src/app apps/lina-web/src/main.tsx
git commit -m "feat(web): add React runtime foundation"
```

### Task 4: Implement LinaPro Session and Tenant State Machines

**Files:**

- Create: `apps/lina-web/src/api/auth.ts`
- Create: `apps/lina-web/src/api/menu.ts`
- Create: `apps/lina-web/src/api/user.ts`
- Create: `apps/lina-web/src/api/tenant.ts`
- Create: `apps/lina-web/src/auth/session-store.ts`
- Create: `apps/lina-web/src/auth/session-store.test.ts`
- Create: `apps/lina-web/src/auth/login-page.tsx`
- Create: `apps/lina-web/src/auth/login-page.test.tsx`
- Create: `apps/lina-web/src/auth/auth-gate.tsx`
- Create: `apps/lina-web/src/tenant/tenant-store.ts`
- Create: `apps/lina-web/src/tenant/tenant-store.test.ts`
- Create: `apps/lina-web/src/tenant/tenant-switcher.tsx`
- Create: `apps/lina-web/src/tenant/tenant-permissions.ts`
- Modify: `apps/lina-web/src/app/providers.tsx`
- Modify: `apps/lina-web/src/api/client.ts`

**Interfaces:**

- Consumes: Existing`POST /auth/login`,`POST /auth/refresh`,`POST /auth/logout`,`GET /user/info`,tenant endpoints,and`ApiClient`.
- Produces: `useSessionStore`,`useTenantStore`,`AuthGate`,and callbacks used by`ApiClient`.

- [ ] **Step 1: Write the login state-machine tests**

Assert these transitions:

```ts
expect(await actions.login(credentials)).toEqual({ kind: 'tenant-selection', tenants });
expect(store.getState().pendingPreToken).toBe('pre-1');

await actions.selectTenant(tenantId);
expect(store.getState().status).toBe('authenticated');
expect(store.getState().accessToken).toBe('access-2');
```

Also test direct token login, failed login returning to anonymous, logout clearing both stores, and invalid persisted JSON falling back to anonymous.

- [ ] **Step 2: Run the session tests and verify failure**

Run:

```bash
pnpm --dir apps/lina-web test:unit -- src/auth/session-store.test.ts src/tenant/tenant-store.test.ts
```

Expected: missing stores.

- [ ] **Step 3: Implement the minimal stores**

Keep this session shape:

```ts
export interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  pendingPreToken: string | null;
  user: CurrentUser | null;
  status: 'anonymous' | 'authenticating' | 'authenticated';
}
```

Keep this tenant shape:

```ts
export interface TenantState {
  enabled: boolean;
  currentTenant: LoginTenant | null;
  tenants: LoginTenant[];
  impersonation: { active: boolean; actingUserId?: number; tenant?: PlatformTenant };
  switching: boolean;
}
```

Persist tokens under`linapro:web:session:v1`and tenant projection under`linapro:web:tenant:v1`. Never persist permissions or menus.

- [ ] **Step 4: Implement login and tenant-selection UI**

The page renders username/password first. When login returns`tenant-selection`,replace the form body with a tenant selector and confirm button using existing test IDs`login-tenant-selector`,`login-tenant-form`,`login-tenant-confirm`,and`login-tenant-transition`.

- [ ] **Step 5: Implement atomic tenant switching**

The switch action must:

```ts
await queryClient.cancelQueries();
const tokens = await authSwitchTenant(tenantId);
sessionActions.setTokens(tokens);
tenantActions.setCurrentTenant(targetTenant);
queryClient.clear();
await router.navigate(resolveDefaultPath(), { replace: true });
```

Do not issue new tenant-sensitive queries until the token and`X-Tenant-Code`projection are both updated.

- [ ] **Step 6: Run session and tenant gates**

Run:

```bash
pnpm --dir apps/lina-web test:unit -- src/auth src/tenant
pnpm --dir apps/lina-web typecheck
```

Expected: all pass.

- [ ] **Step 7: Record the session checkpoint**

Suggested commit after explicit authorization:

```bash
git add apps/lina-web/src/api apps/lina-web/src/auth apps/lina-web/src/tenant apps/lina-web/src/app/providers.tsx
git commit -m "feat(web): add LinaPro session and tenant flows"
```

### Task 5: Implement Dynamic Menu Projection and the Clean Workbench Shell

**Files:**

- Create: `apps/lina-web/src/router/contracts.ts`
- Create: `apps/lina-web/src/router/host-pages.tsx`
- Create: `apps/lina-web/src/router/project-menu.tsx`
- Create: `apps/lina-web/src/router/project-menu.test.tsx`
- Create: `apps/lina-web/src/router/router.tsx`
- Create: `apps/lina-web/src/router/access-gate.tsx`
- Create: `apps/lina-web/src/layout/workbench-layout.tsx`
- Create: `apps/lina-web/src/layout/navigation.tsx`
- Create: `apps/lina-web/src/layout/workbench-header.tsx`
- Create: `apps/lina-web/src/layout/tab-strip.tsx`
- Create: `apps/lina-web/src/layout/page-surface.tsx`
- Create: `apps/lina-web/src/layout/icon-map.tsx`
- Create: `apps/lina-web/src/layout/can.tsx`
- Create: `apps/lina-web/src/layout/workbench-layout.test.tsx`
- Create: `apps/lina-web/src/features/fallback/not-found-page.tsx`
- Create: `apps/lina-web/src/features/fallback/forbidden-page.tsx`
- Create: `apps/lina-web/src/features/fallback/error-page.tsx`

**Interfaces:**

- Consumes: `MenuRouteItem[]`,current permissions,tenant context,and host/plugin page registries.
- Produces: `projectMenuTree()`,`createWorkbenchRouter()`,`<Can>`,and two page surfaces.

- [ ] **Step 1: Write menu projection tests**

```tsx
it('maps an existing backend component key to a lazy host page', () => {
  const [route] = projectMenuTree([menu({ component: 'system/user/index' })], registry);
  expect(route.componentKey).toBe('system/user/index');
  expect(route.element).toBeDefined();
});

it('renders diagnostics for an unknown component key without dynamic importing it', () => {
  const [route] = projectMenuTree([menu({ component: '../../escape' })], registry);
  render(route.element);
  expect(screen.getByText(/page is not registered/i)).toBeInTheDocument();
});
```

Also test nested paths, hidden routes, i18n title keys, iframe metadata, new-window links, tenant access, and disabled plugin routes.

- [ ] **Step 2: Run menu tests and verify failure**

Run:

```bash
pnpm --dir apps/lina-web test:unit -- src/router/project-menu.test.tsx
```

Expected: missing projection.

- [ ] **Step 3: Implement the explicit registry and projection**

The registry must be an object literal of known component keys:

```tsx
export const hostPages: HostPageRegistry = {
  'dashboard/analytics/index': page(() => import('#/features/dashboard/analytics-page')),
  'dashboard/workspace/index': page(() => import('#/features/dashboard/workspace-page')),
  'system/user/index': page(() => import('#/features/iam/user/user-page')),
  'system/role/index': page(() => import('#/features/iam/role/role-page')),
  'system/menu/index': page(() => import('#/features/iam/menu/menu-page')),
  'system/plugin/index': page(() => import('#/features/plugins/plugin-page')),
  'system/plugin/dynamic-page': page(() => import('#/plugin-ui/hosted-page')),
};
```

Add remaining component keys in the page-wave tasks. Do not use path-derived arbitrary imports.

Implement the menu icon adapter with Semi Icons only:

```tsx
import {
  IconCalendar,
  IconFile,
  IconGridStroked,
  IconHistogram,
  IconMenu,
  IconSetting,
  IconUser,
} from '@douyinfe/semi-icons';

type MenuIconComponent = typeof IconGridStroked;

const menuIcons: Record<string, MenuIconComponent> = {
  'ant-design:user-outlined': IconUser,
  'carbon:workspace': IconGridStroked,
  'lucide:area-chart': IconHistogram,
  'lucide:calendar': IconCalendar,
  'lucide:file': IconFile,
  'lucide:menu': IconMenu,
  'lucide:settings': IconSetting,
};

export function resolveMenuIcon(name: string): MenuIconComponent {
  return menuIcons[name] ?? IconGridStroked;
}
```

The map may retain backend Iconify-formatted keys as input data,but rendered icon components must come from`@douyinfe/semi-icons`.

- [ ] **Step 4: Implement shell layout and permission component**

`<Can permission="system:user:create">`returns`null`when permission is absent. The shell uses Semi Design`Layout`,`Navigation`,`SideSheet`,`Dropdown`,and`Tabs`to render navigation,header,tabs,content outlet,and published plugin slots. The`workspace`surface has zero padding and`overflow: hidden`;the`page`surface has 24 px padding and owns vertical scroll.

- [ ] **Step 5: Verify shell behavior**

Run:

```bash
pnpm --dir apps/lina-web test:unit -- src/router src/layout
pnpm --dir apps/lina-web typecheck
```

Expected: all pass.

- [ ] **Step 6: Record the shell checkpoint**

Suggested commit after explicit authorization:

```bash
git add apps/lina-web/src/router apps/lina-web/src/layout apps/lina-web/src/features/fallback
git commit -m "feat(web): add React workbench shell and routing"
```

### Task 6: Add the Frontend-Owned React Source-Plugin UI Contract

**Files:**

- Create: `apps/lina-web/src/plugin-ui/contract.ts`
- Create: `apps/lina-web/src/plugin-ui/contract.test.ts`
- Create: `apps/lina-web/src/plugin-ui/registry.ts`
- Create: `apps/lina-web/src/plugin-ui/registry.test.ts`
- Create: `apps/lina-web/src/plugin-ui/slot-outlet.tsx`
- Create: `apps/lina-web/src/plugin-ui/plugin-host-context.tsx`
- Create: `apps/lina-web/src/plugin-ui/generation-refresh.ts`
- Create: `apps/lina-web/src/plugin-ui/generation-refresh.test.ts`
- Create: `apps/lina-web/src/plugin-ui/virtual-plugin-ui.d.ts`
- Create: `apps/lina-web/build/plugin-ui-registry.ts`
- Modify: `apps/lina-web/vite.config.ts`

**Interfaces:**

- Consumes: `apps/lina-plugins/*/frontend/plugin-ui.ts`,plugin dynamic state,and runtime i18n.
- Produces: `definePluginUI()`,`useLinaPluginHost()`,`PluginHostContextValue`,`virtual:linapro-plugin-ui`,and a frontend-owned React page/slot registry. It produces no`lina-core`dependency or React-aware backend scanner.

- [ ] **Step 1: Write the TypeScript contract tests**

```ts
it('rejects duplicate slot item keys', () => {
  expect(() => definePluginUI({
    pages: {},
    slots: {
      'layout.header.actions.after': [
        slot('duplicate'),
        slot('duplicate'),
      ],
    },
  })).toThrow(/duplicate slot item key/i);
});

it('rejects unknown published slots', () => {
  expect(() => definePluginUI({ pages: {}, slots: { unknown: [slot('x')] } as never }))
    .toThrow(/unknown plugin slot/i);
});

it('rejects duplicate normalized page routes', () => {
  expect(() => definePluginUI({
    pages: {
      '/ai/providers': page('./pages/providers'),
      'ai/providers/': page('./pages/providers-duplicate'),
    },
    slots: {},
  })).toThrow(/duplicate plugin page route/i);
});
```

- [ ] **Step 2: Implement the stable TypeScript contract**

Use the exact types from the design and publish these slot keys:

```ts
export const pluginSlotKeys = [
  'auth.login.after',
  'crud.table.after',
  'crud.toolbar.after',
  'dashboard.workspace.before',
  'dashboard.workspace.after',
  'layout.header.actions.before',
  'layout.header.actions.after',
  'layout.user-dropdown.after',
] as const;
```

`PluginHostContextValue`must expose locale,user projection,tenant projection,readonly permissions,request methods,and`t()`. It must not expose tokens,Zustand,QueryClient,or Semi Design internals.

Page map keys are normalized menu routes such as`/ai/providers`. Source-plugin manifests continue to use`system/plugin/dynamic-page`as the generic host component;the frontend resolves the concrete React page by normalized route and enabled plugin ID.

- [ ] **Step 3: Implement the Vite virtual registry**

Generate a module equivalent to:

```ts
import plugin0 from '/absolute/apps/lina-plugins/acme-demo/frontend/plugin-ui.ts';
export const sourcePluginUI = [
  { pluginId: 'acme-demo', definition: plugin0 },
];
```

Normalize paths with Node`path`APIs,sort plugin IDs,and reject symlink/path escape. Do not scan page modules eagerly.

- [ ] **Step 4: Write the frontend discovery ownership test**

```ts
it('generates lazy imports only from frontend plugin manifests', async () => {
  const source = await generatePluginUIVirtualModule(fixtureRoot);
  expect(source).toContain("frontend/plugin-ui.ts");
  expect(source).not.toContain("frontend/pages/index.tsx");
  expect(source).not.toContain("apps/lina-core");
});
```

- [ ] **Step 5: Run the frontend test and verify failure**

Run:

```bash
pnpm --dir apps/lina-web test:unit -- src/plugin-ui
```

Expected: failure until the Vite registry generator and route normalization are implemented.

- [ ] **Step 6: Implement frontend-only discovery**

The Vite plugin discovers exactly one optional`frontend/plugin-ui.ts`per direct plugin directory. It imports only the manifest eagerly;all page and slot components remain behind declared`load()`functions. Do not modify`apps/lina-core`,do not call its resource scanner,and do not teach it about`.tsx`.

- [ ] **Step 7: Run plugin contract gates**

Run:

```bash
pnpm --dir apps/lina-web test:unit -- src/plugin-ui
pnpm --dir apps/lina-web typecheck
```

Expected: all pass.

- [ ] **Step 8: Record DI and impact review**

Record that no Go file,backend runtime dependency,API,data-permission path,or backend cache was changed. Runtime i18n is consumed through the existing HTTP contract;plugin UI discovery is entirely a Vite build concern.

- [ ] **Step 9: Record the plugin contract checkpoint**

Suggested commit after explicit authorization:

```bash
git add apps/lina-web/src/plugin-ui apps/lina-web/build apps/lina-web/vite.config.ts
git commit -m "feat(plugin-ui): add React source plugin contract"
```

### Task 7: Migrate Core, Dashboard, About, and Profile Pages

**Files:**

- Create: `apps/lina-web/src/api/about.ts`
- Create: `apps/lina-web/src/features/dashboard/analytics-page.tsx`
- Create: `apps/lina-web/src/features/dashboard/workspace-page.tsx`
- Create: `apps/lina-web/src/features/dashboard/dashboard.test.tsx`
- Create: `apps/lina-web/src/features/about/api-docs-page.tsx`
- Create: `apps/lina-web/src/features/about/system-info-page.tsx`
- Create: `apps/lina-web/src/features/about/about-page.tsx`
- Create: `apps/lina-web/src/features/about/about.test.tsx`
- Create: `apps/lina-web/src/features/profile/profile-page.tsx`
- Create: `apps/lina-web/src/features/profile/base-settings.tsx`
- Create: `apps/lina-web/src/features/profile/password-settings.tsx`
- Create: `apps/lina-web/src/features/profile/security-settings.tsx`
- Create: `apps/lina-web/src/features/profile/notification-settings.tsx`
- Create: `apps/lina-web/src/features/profile/profile.test.tsx`
- Modify: `apps/lina-web/src/router/host-pages.tsx`
- Modify: `apps/lina-web/src/locales/en-US/pages.json`
- Modify: `apps/lina-web/src/locales/zh-CN/pages.json`
- Modify: `hack/tests/pages/LoginPage.ts`
- Modify: `hack/tests/pages/MainLayout.ts`
- Modify: `hack/tests/pages/DashboardPage.ts`
- Modify: `hack/tests/pages/ProfilePage.ts`
- Modify: `hack/tests/pages/LayoutAuditPage.ts`

**Interfaces:**

- Consumes: Existing about/profile APIs,public config,workbench shell,and plugin slots.
- Produces: Wave A route parity and the reusable page title/empty/error patterns used by later waves.

- [ ] **Step 1: Add component tests for core user journeys**

Tests must prove login success navigates to the service-provided home path,Dashboard renders both workspace plugin slots,API Docs iframe updates its`lang`query parameter,and profile password validation blocks a mismatched confirmation.

- [ ] **Step 2: Run component tests and verify failure**

Run:

```bash
pnpm --dir apps/lina-web test:unit -- src/features/dashboard src/features/about src/features/profile
```

Expected: missing page implementations.

- [ ] **Step 3: Implement page modules and register exact component keys**

Register at least:

```ts
'dashboard/analytics/index'
'dashboard/workspace/index'
'about/api-docs/index'
'about/system-info/index'
'profile/index'
```

API Docs must remain an iframe and use the current workspace asset resolver. Dashboard and profile server data use TanStack Query; local form edits stay inside the owning component.

- [ ] **Step 4: Run Wave A unit and E2E gates**

Run:

```bash
pnpm --dir apps/lina-web test:unit -- src/features/dashboard src/features/about src/features/profile
pnpm --dir apps/lina-web typecheck
pnpm --dir hack/tests test:host:module -- auth
pnpm --dir hack/tests test:host:module -- dashboard
pnpm --dir hack/tests test:host:module -- about
```

Expected: all relevant cases pass against a manually started`apps/lina-web`dev server. Capture and inspect required screenshots under`temp/<YYYYMMDD>/`.

- [ ] **Step 5: Record the Wave A checkpoint**

Suggested commit after explicit authorization:

```bash
git add apps/lina-web/src/features apps/lina-web/src/api/about.ts apps/lina-web/src/router/host-pages.tsx apps/lina-web/src/locales hack/tests/pages
git commit -m "feat(web): migrate core workbench pages to React"
```

### Task 8: Migrate IAM Pages

**Files:**

- Create: `apps/lina-web/src/api/system/user.ts`
- Create: `apps/lina-web/src/api/system/role.ts`
- Create: `apps/lina-web/src/api/system/menu.ts`
- Create: `apps/lina-web/src/features/iam/user/user-page.tsx`
- Create: `apps/lina-web/src/features/iam/user/user-drawer.tsx`
- Create: `apps/lina-web/src/features/iam/user/user-import-dialog.tsx`
- Create: `apps/lina-web/src/features/iam/user/user-reset-password-dialog.tsx`
- Create: `apps/lina-web/src/features/iam/user/user-batch-edit-dialog.tsx`
- Create: `apps/lina-web/src/features/iam/user/tenant-options.ts`
- Create: `apps/lina-web/src/features/iam/user/tenant-options.test.ts`
- Create: `apps/lina-web/src/features/iam/user/user-page.test.tsx`
- Create: `apps/lina-web/src/features/iam/role/role-page.tsx`
- Create: `apps/lina-web/src/features/iam/role/role-drawer.tsx`
- Create: `apps/lina-web/src/features/iam/role/role-auth-page.tsx`
- Create: `apps/lina-web/src/features/iam/role/data-scope.ts`
- Create: `apps/lina-web/src/features/iam/role/data-scope.test.ts`
- Create: `apps/lina-web/src/features/iam/menu/menu-page.tsx`
- Create: `apps/lina-web/src/features/iam/menu/menu-drawer.tsx`
- Create: `apps/lina-web/src/features/iam/menu/menu-page.test.tsx`
- Modify: `apps/lina-web/src/router/host-pages.tsx`
- Modify: `apps/lina-web/src/locales/en-US/pages.json`
- Modify: `apps/lina-web/src/locales/zh-CN/pages.json`
- Modify: `hack/tests/pages/UserPage.ts`
- Modify: `hack/tests/pages/RolePage.ts`
- Modify: `hack/tests/pages/RoleAuthUserPage.ts`
- Modify: `hack/tests/pages/MenuPage.ts`

**Interfaces:**

- Consumes: Existing IAM REST APIs,current permission set,tenant context,and organization/tenant plugin capabilities.
- Produces: Wave B parity for user,role,role-member authorization,and menu management.

- [ ] **Step 1: Port pure projection tests before pages**

Test that tenant fields are absent when tenant management is disabled,organization fields are absent when organization capability is disabled,tenant data scope normalizes to all-scope when tenant support is absent,and tenant candidate APIs are not called without list permission.

- [ ] **Step 2: Run pure tests and verify failure**

Run:

```bash
pnpm --dir apps/lina-web test:unit -- src/features/iam/user/tenant-options.test.ts src/features/iam/role/data-scope.test.ts
```

Expected: missing functions.

- [ ] **Step 3: Implement API projections and pages**

Use Semi Design`Table`,`Form`,`SideSheet`,`Modal`,`Upload`,`Tree`,and`Dropdown`directly. Preserve one HTTP request for batch delete and role batch delete. Perform permission and target-visibility errors through the shared`ApiError`path; do not infer data permission in the browser.

- [ ] **Step 4: Register exact IAM component keys**

```ts
'system/user/index'
'system/role/index'
'system/role-auth/index'
'system/menu/index'
```

- [ ] **Step 5: Run Wave B gates**

Run:

```bash
pnpm --dir apps/lina-web test:unit -- src/features/iam
pnpm --dir apps/lina-web typecheck
pnpm --dir hack/tests test:host:module -- iam:user
pnpm --dir hack/tests test:host:module -- iam:role
pnpm --dir hack/tests test:host:module -- iam:menu
```

Expected: CRUD,search,sort,import,export,reset-password,batch actions,role authorization,and menu authorization pass. Required screenshots show translated labels and no hidden disabled-module fields.

- [ ] **Step 6: Record data-permission review**

Record that this task does not change backend query filters or write authorization. E2E proves UI does not expose unavailable actions,while existing backend tests remain the authority for tenant/data visibility.

- [ ] **Step 7: Record the Wave B checkpoint**

Suggested commit after explicit authorization:

```bash
git add apps/lina-web/src/api/system apps/lina-web/src/features/iam apps/lina-web/src/router/host-pages.tsx apps/lina-web/src/locales hack/tests/pages
git commit -m "feat(web): migrate IAM pages to React"
```

### Task 9: Migrate Settings and Message Pages

**Files:**

- Create: `apps/lina-web/src/api/system/config.ts`
- Create: `apps/lina-web/src/api/system/dict.ts`
- Create: `apps/lina-web/src/api/system/file.ts`
- Create: `apps/lina-web/src/api/system/message.ts`
- Create: `apps/lina-web/src/features/settings/config/config-page.tsx`
- Create: `apps/lina-web/src/features/settings/config/config-drawer.tsx`
- Create: `apps/lina-web/src/features/settings/config/config-import-dialog.tsx`
- Create: `apps/lina-web/src/features/settings/config/config-page.test.tsx`
- Create: `apps/lina-web/src/features/settings/dict/dict-page.tsx`
- Create: `apps/lina-web/src/features/settings/dict/dict-type-page.tsx`
- Create: `apps/lina-web/src/features/settings/dict/dict-data-drawer.tsx`
- Create: `apps/lina-web/src/features/settings/dict/dict-import-dialog.tsx`
- Create: `apps/lina-web/src/features/settings/dict/dict-page.test.tsx`
- Create: `apps/lina-web/src/features/settings/file/file-page.tsx`
- Create: `apps/lina-web/src/features/settings/file/file-upload-dialog.tsx`
- Create: `apps/lina-web/src/features/settings/file/file-detail-dialog.tsx`
- Create: `apps/lina-web/src/features/settings/file/file-page.test.tsx`
- Create: `apps/lina-web/src/features/settings/message/message-page.tsx`
- Create: `apps/lina-web/src/features/settings/message/notice-preview-dialog.tsx`
- Modify: `apps/lina-web/src/router/host-pages.tsx`
- Modify: `apps/lina-web/src/locales/en-US/pages.json`
- Modify: `apps/lina-web/src/locales/zh-CN/pages.json`
- Modify: `hack/tests/pages/ConfigPage.ts`
- Modify: `hack/tests/pages/DictPage.ts`
- Modify: `hack/tests/pages/FilePage.ts`

**Interfaces:**

- Consumes: Existing config,dict,file,message APIs and shared upload/download support.
- Produces: Wave C parity with runtime configuration refresh and dictionary invalidation.

- [ ] **Step 1: Add behavior-first component tests**

Tests must prove config import uses multipart upload,export uses translated headers,dict type deletion refreshes both type and data queries,file upload invalidates the list once,and a failed download displays the localized API error.

- [ ] **Step 2: Implement API files and pages**

Use query keys scoped by tenant and filters. After public frontend config mutation,call`loadPublicFrontendConfig()`and update the runtime config provider without reloading the browser. After dictionary mutation,invalidate only dictionary query families;do not clear all Query cache.

- [ ] **Step 3: Register settings component keys**

Register existing keys for`system/config/index`,`system/dict/index`,`system/file/index`,and`system/message/index`.

- [ ] **Step 4: Run Wave C gates**

Run:

```bash
pnpm --dir apps/lina-web test:unit -- src/features/settings
pnpm --dir apps/lina-web typecheck
pnpm --dir hack/tests test:host:module -- settings:config
pnpm --dir hack/tests test:host:module -- settings:dict
pnpm --dir hack/tests test:host:module -- settings:file
```

Expected: all pass with required screenshot review.

- [ ] **Step 5: Record the Wave C checkpoint**

Suggested commit after explicit authorization:

```bash
git add apps/lina-web/src/api/system apps/lina-web/src/features/settings apps/lina-web/src/router/host-pages.tsx apps/lina-web/src/locales hack/tests/pages
git commit -m "feat(web): migrate settings pages to React"
```

### Task 10: Migrate Scheduler Pages

**Files:**

- Create: `apps/lina-web/src/api/system/job-group.ts`
- Create: `apps/lina-web/src/api/system/job.ts`
- Create: `apps/lina-web/src/api/system/job-handler.ts`
- Create: `apps/lina-web/src/api/system/job-log.ts`
- Create: `apps/lina-web/src/features/scheduler/job-group/job-group-page.tsx`
- Create: `apps/lina-web/src/features/scheduler/job-group/job-group-drawer.tsx`
- Create: `apps/lina-web/src/features/scheduler/job/job-page.tsx`
- Create: `apps/lina-web/src/features/scheduler/job/job-drawer.tsx`
- Create: `apps/lina-web/src/features/scheduler/job/handler-fields.tsx`
- Create: `apps/lina-web/src/features/scheduler/job/shell-fields.tsx`
- Create: `apps/lina-web/src/features/scheduler/job/job-page.test.tsx`
- Create: `apps/lina-web/src/features/scheduler/job-log/job-log-page.tsx`
- Create: `apps/lina-web/src/features/scheduler/job-log/job-log-detail.tsx`
- Create: `apps/lina-web/src/features/scheduler/job-log/job-log-page.test.tsx`
- Modify: `apps/lina-web/src/router/host-pages.tsx`
- Modify: `apps/lina-web/src/locales/en-US/pages.json`
- Modify: `apps/lina-web/src/locales/zh-CN/pages.json`
- Modify: `hack/tests/pages/JobGroupPage.ts`
- Modify: `hack/tests/pages/JobPage.ts`
- Modify: `hack/tests/pages/JobLogPage.ts`

**Interfaces:**

- Consumes: Existing scheduler APIs,public cron settings,and current permission/data-permission results.
- Produces: Wave D parity for groups,jobs,handlers,shell jobs,manual trigger,cancel,and logs.

- [ ] **Step 1: Add scheduler behavior tests**

Test handler/shell fields are mutually exclusive,shell controls are fully hidden when public config disables shell execution,manual trigger requires confirmation,cancel updates the current row,and timestamp rendering uses the user locale while API values remain Unix milliseconds.

- [ ] **Step 2: Implement pages without a schema framework**

Keep conditional fields in local React components. Use one form model per drawer and factory functions for translated options. Do not build a general form renderer.

- [ ] **Step 3: Register scheduler keys and run gates**

Run:

```bash
pnpm --dir apps/lina-web test:unit -- src/features/scheduler
pnpm --dir apps/lina-web typecheck
pnpm --dir hack/tests test:host:module -- scheduler:job
```

Expected: existing scheduler E2E cases pass,including timezone,data permission,shell restrictions,trigger,and cancel.

- [ ] **Step 4: Record the Wave D checkpoint**

Suggested commit after explicit authorization:

```bash
git add apps/lina-web/src/api/system apps/lina-web/src/features/scheduler apps/lina-web/src/router/host-pages.tsx apps/lina-web/src/locales hack/tests/pages
git commit -m "feat(web): migrate scheduler pages to React"
```

### Task 11: Migrate Plugin Management and Remove Dynamic Embedded Mount

**Files:**

- Create: `apps/lina-web/src/api/system/plugin.ts`
- Create: `apps/lina-web/src/features/plugins/plugin-page.tsx`
- Create: `apps/lina-web/src/features/plugins/plugin-detail-dialog.tsx`
- Create: `apps/lina-web/src/features/plugins/plugin-upload-dialog.tsx`
- Create: `apps/lina-web/src/features/plugins/plugin-host-service-dialog.tsx`
- Create: `apps/lina-web/src/features/plugins/plugin-uninstall-dialog.tsx`
- Create: `apps/lina-web/src/features/plugins/plugin-upgrade-dialog.tsx`
- Create: `apps/lina-web/src/features/plugins/lifecycle-precondition-dialog.tsx`
- Create: `apps/lina-web/src/features/plugins/plugin-page.test.tsx`
- Create: `apps/lina-web/src/plugin-ui/hosted-page.tsx`
- Create: `apps/lina-web/src/plugin-ui/hosted-page.test.tsx`
- Modify: `apps/lina-core/pkg/plugin/pluginhost/pluginhost.go`
- Modify: `apps/lina-core/api/menu/v1/menu_all.go`
- Modify: `apps/lina-core/internal/controller/menu/menu_v1_all.go`
- Modify: `apps/lina-core/internal/controller/menu/menu_v1_all_test.go`
- Modify: `apps/lina-core/internal/service/plugin/internal/frontend/frontend_contract.go`
- Modify: `apps/lina-core/internal/service/plugin/internal/frontend/frontend_contract_test.go`
- Modify: `apps/lina-core/internal/service/plugin/internal/integration/integration_menu_test.go`
- Modify: `apps/lina-core/internal/service/plugin/plugin_runtime_test.go`
- Modify: `apps/lina-core/manifest/i18n/zh-CN/apidoc/core-api-menu.json`
- Modify: `hack/tests/pages/PluginPage.ts`
- Modify: `hack/tests/e2e/extension/plugin/TC003-plugin-hot-upgrade.ts`

**Interfaces:**

- Consumes: Plugin summary/detail/governance APIs,React plugin registry,and hosted asset URLs.
- Produces: Wave E plugin-management parity and the React hosted-page renderer. The
  backend hosted-page contract and dynamic-plugin migration are executed only in
  frozen Tasklist items`RW-280`through`RW-299`,after the source-plugin migration
  is complete.

- [ ] **Step 1: Write plugin list and hosted-page tests**

```tsx
it('loads only the summary endpoint on first render', async () => {
  render(<PluginPage />);
  await screen.findByRole('table');
  expect(api.list).toHaveBeenCalledTimes(1);
  expect(api.detail).not.toHaveBeenCalled();
});

it('rejects embedded mount query without importing a script', () => {
  render(<HostedPage route={route({ query: { pluginAccessMode: 'embedded-mount' } })} />);
  expect(screen.getByText(/unsupported plugin page mode/i)).toBeInTheDocument();
  expect(document.querySelector('iframe')).toBeNull();
});
```

Also test builtin rows are absent,dialogs lazy-load,permission actions are hidden,iframe accepts only validated hosted asset URLs,and the iframe sandbox contains`allow-scripts`but not`allow-same-origin`.

- [ ] **Step 2: Implement plugin management parity**

First render calls only`GET /plugins`summary. Detail,install authorization,uninstall,and upgrade dialogs fetch their own governance payload when opened. Use`React.lazy()`for all heavy dialogs.

- [ ] **Step 3: Write the failing Go rejection test**

```go
func TestValidateHostedMenuBindingsRejectsEmbeddedMount(t *testing.T) {
    err := validateHostedMenuBinding(menuWithQuery(map[string]string{
        pluginhost.DynamicAccessModeQueryKey: "embedded-mount",
    }))
    if err == nil || !strings.Contains(err.Error(), "embedded-mount") {
        t.Fatalf("expected embedded-mount rejection, got %v", err)
    }
}
```

- [ ] **Step 4: Remove the backend embedded-mount contract**

Retain`DynamicAccessModeQueryKey`as the stable query key. Delete
`DynamicEmbeddedSourceQueryKey`and`DynamicAccessModeEmbeddedMount`only while adding
the`iframe`and`new-window`mode constants plus the`pluginAssetUrl`query key. Replace
the embedded-mount controller projection with governed iframe/new-window metadata,
reject legacy`embedded-mount`and`embeddedSrc`input,and update`MenuRouteMeta.Query`
documentation plus the Chinese apidoc translation. Do not execute this backend
change in the old Task 11 order: follow frozen Tasklist items`RW-280`through
`RW-299`,including the sandboxed iframe,restricted`postMessage`bridge,and full
dynamic-plugin parity gates.

- [ ] **Step 5: Run plugin backend and frontend gates**

Run:

```bash
pnpm --dir apps/lina-web test:unit -- src/features/plugins src/plugin-ui/hosted-page.test.tsx
cd apps/lina-core && go test ./internal/service/plugin/internal/frontend ./internal/service/plugin/internal/integration ./internal/controller/menu ./internal/service/plugin -count=1
cd apps/lina-core && go test ./internal/cmd -count=1
```

Expected: all pass. The Go DI review records no new runtime service; only validation and projection are simplified.

- [ ] **Step 6: Run plugin E2E gates**

Run:

```bash
pnpm --dir hack/tests test:host:module -- extension:plugin
```

Expected: source plugin state,permissions,builtin visibility,dependency governance,iframe generation refresh,and menu refresh pass. Remove or rewrite only assertions that specifically required ESM embedded mount.

- [ ] **Step 7: Record the Wave E checkpoint**

Suggested commit after explicit authorization:

```bash
git add apps/lina-web/src/api/system/plugin.ts apps/lina-web/src/features/plugins apps/lina-web/src/plugin-ui apps/lina-core/pkg/plugin/pluginhost apps/lina-core/api/menu apps/lina-core/internal/controller/menu apps/lina-core/internal/service/plugin apps/lina-core/manifest/i18n/zh-CN/apidoc/core-api-menu.json .agents/rules/plugin.md hack/tests
git commit -m "feat(plugin-ui): isolate dynamic plugin pages"
```

### Task 12: Switch Development, Build, i18n, and CI Tooling

**Files:**

- Modify: `Makefile`
- Modify: `hack/tools/linactl/command_build.go`
- Modify: `hack/tools/linactl/command_dev.go`
- Modify: `hack/tools/linactl/internal/devservice/devservice.go`
- Modify: `hack/tools/linactl/internal/frontend/frontend.go`
- Modify: `hack/tools/linactl/internal/portcheck/portcheck.go`
- Modify: `hack/tools/linactl/internal/runtimei18n/runtimei18n_frontend_keys.go`
- Modify: `hack/tools/linactl/internal/runtimei18n/runtimei18n_scan.go`
- Modify: `hack/tools/linactl/internal/runtimei18n/runtimei18n_test.go`
- Modify: `hack/tools/linactl/internal/toolutil/toolutil.go`
- Modify: `hack/tools/linactl/main_test.go`
- Modify: `hack/tools/linactl/README.md`
- Modify: `hack/tools/linactl/README.zh-CN.md`
- Modify: `hack/tests/scripts/validate-e2e.mjs`
- Modify: `apps/lina-core/internal/service/config/config_path.go`
- Modify: `apps/lina-core/internal/service/config/config_path_test.go`
- Modify: `.github/workflows/reusable-frontend-unit-tests.yml`
- Modify: `.github/workflows/reusable-e2e-tests.yml`
- Modify: `.github/workflows/reusable-host-only-build-smoke.yml`
- Modify: `.github/workflows/reusable-image-publish.yml`
- Modify: `.github/workflows/reusable-make-command-smoke.yml`
- Delete: `.github/workflows/reusable-openspec-changes-complete.yml`
- Modify: `.github/workflows/reusable-test-verification-suite.yml`

**Interfaces:**

- Consumes: A passing`apps/lina-web`build and complete host-page registry.
- Produces: All default developer and CI entry points target`apps/lina-web`; built assets still embed into`lina-core`.

- [ ] **Step 1: Update tests before paths**

Change linactl tests to expect:

```text
apps/lina-web
apps/lina-web/dist
temp/pids/lina-web.pid
temp/lina-web.log
Lina Web
```

Change runtime i18n tests to create`.tsx`fixtures and locale JSON under`apps/lina-web/src/locales`.

- [ ] **Step 2: Run tool tests and verify failure**

Run:

```bash
cd hack/tools/linactl && go test ./... -count=1
```

Expected: failures still point to`apps/lina-vben`.

- [ ] **Step 3: Switch cross-platform tool paths**

Update`toolutil.ViteCommand()`to resolve`apps/lina-web/node_modules/vite/bin/vite.js`. Update dev service workdir,PID,log,display name,frontend dependency install,portcheck Vite config path,build dir matching,and copy source`apps/lina-web/dist`.

Update`isRepositoryRoot()`to require`apps/lina-web/package.json`after cutover. Update its test fixture accordingly.

- [ ] **Step 4: Switch i18n scanners**

Host globs become:

```go
"apps/lina-web/src/**/*.ts",
"apps/lina-web/src/**/*.tsx",
```

Source-plugin globs include`frontend/**/*.ts`and`frontend/**/*.tsx`;remove Vue-specific parser paths. Preserve runtime manifest merge and static-key coverage behavior.

- [ ] **Step 5: Switch Makefile and workflows**

Set`FRONTEND_DIR := apps/lina-web`,`FRONTEND_PID := temp/pids/lina-web.pid`,and`FRONTEND_LOG := temp/lina-web.log`. Change all workflow Node version,cache dependency,working directory,and smoke fixture paths to`apps/lina-web`.

Delete`.github/workflows/reusable-openspec-changes-complete.yml`instead of
migrating its Node path. Remove the`include-openspec-completion`input and
`openspec-changes-complete`job from
`.github/workflows/reusable-test-verification-suite.yml`;the product CI must not
retain an inactive or optional OpenSpec gate.

- [ ] **Step 6: Run tooling gates**

Run:

```bash
cd hack/tools/linactl && go test ./... -count=1
go run ./hack/tools/linactl env.check
go run ./hack/tools/linactl i18n.check
go run ./hack/tools/linactl build --dir apps/lina-web
```

Expected: frontend path and i18n checks pass,and`apps/lina-web/dist/index.html`is generated. The full host build in the next step verifies copying into`apps/lina-core/internal/packed/public/index.html`.

- [ ] **Step 7: Run host build smoke**

Run:

```bash
go run ./hack/tools/linactl build --plugins=0
```

Expected: React frontend builds,assets embed,and the host binary builds for the configured local target.

- [ ] **Step 8: Record cross-platform review**

Record that all path manipulation uses`filepath`,all process lifecycle behavior remains in Go,and no new shell dependency was introduced. CI must exercise Linux;local smoke records the current platform;Windows path behavior remains covered by Go unit tests using platform-neutral fixtures.

- [ ] **Step 9: Record the tooling checkpoint**

Suggested commit after explicit authorization:

```bash
git add Makefile hack apps/lina-core/internal/service/config .github/workflows
git commit -m "build: switch LinaPro tooling to React workbench"
```

### Task 13: Run Full E2E Parity, Migrate Official Plugin UI, and Delete Vben

**Files:**

- Modify: `hack/tests/playwright.config.ts`
- Modify: `hack/tests/global-setup.ts`
- Modify: `hack/tests/config/execution-manifest.json`
- Modify: `hack/tests/pages/*.ts`
- Modify: `hack/tests/e2e/**/*.ts`only where React changes stable locators or removes embedded mount.
- Delete: `apps/lina-vben/`
- Create: `apps/lina-plugins/linapro-ai-core/frontend/plugin-ui.ts`
- Create: `apps/lina-plugins/linapro-content-notice/frontend/plugin-ui.ts`
- Create: `apps/lina-plugins/linapro-demo-source/frontend/plugin-ui.ts`
- Create: `apps/lina-plugins/linapro-monitor-loginlog/frontend/plugin-ui.ts`
- Create: `apps/lina-plugins/linapro-monitor-online/frontend/plugin-ui.ts`
- Create: `apps/lina-plugins/linapro-monitor-operlog/frontend/plugin-ui.ts`
- Create: `apps/lina-plugins/linapro-monitor-server/frontend/plugin-ui.ts`
- Create: `apps/lina-plugins/linapro-org-core/frontend/plugin-ui.ts`
- Create: `apps/lina-plugins/linapro-tenant-core/frontend/plugin-ui.ts`
- Replace: the 28 existing official source-plugin`frontend/**/*.vue`files with feature-equivalent`.tsx`files.
- Modify: `apps/lina-plugins/linapro-demo-dynamic/plugin.yaml`
- Rewrite and verify: `apps/lina-plugins/linapro-demo-dynamic/frontend/pages/standalone.html`
- Delete only after parity and security gates: `apps/lina-plugins/linapro-demo-dynamic/frontend/pages/mount.js`

**Interfaces:**

- Consumes: All page waves,tooling switch,and the product-owned ordinary plugin workspace.
- Produces: One React production path with no Vue/Vben or embedded-mount fallback.

- [ ] **Step 1: Verify the fixed official-plugin migration inventory**

Run:

```bash
test "$(find apps/lina-plugins -type f -name '*.vue' | wc -l | tr -d ' ')" = "28"
find apps/lina-plugins -type f -name '*.vue' | sort
```

Expected: exactly 28 Vue files across`linapro-ai-core`,`linapro-content-notice`,`linapro-demo-source`,`linapro-monitor-loginlog`,`linapro-monitor-online`,`linapro-monitor-operlog`,`linapro-monitor-server`,`linapro-org-core`,and`linapro-tenant-core`. Use`docs/2026-07-12-react-workbench-replacement-tasklist.md`as the per-plugin execution checklist. A target release containing any official`.vue`file cannot proceed to deletion of`apps/lina-vben`.

- [ ] **Step 2: Run focused E2E suites against the React dev server**

Run:

```bash
pnpm --dir hack/tests test:host:module -- auth
pnpm --dir hack/tests test:host:module -- dashboard
pnpm --dir hack/tests test:host:module -- iam:user
pnpm --dir hack/tests test:host:module -- iam:role
pnpm --dir hack/tests test:host:module -- iam:menu
pnpm --dir hack/tests test:host:module -- settings:config
pnpm --dir hack/tests test:host:module -- settings:dict
pnpm --dir hack/tests test:host:module -- settings:file
pnpm --dir hack/tests test:host:module -- scheduler:job
pnpm --dir hack/tests test:host:module -- extension:plugin
```

Expected: all pass independently. Fix React behavior or POM locators;do not weaken business-result assertions.

- [ ] **Step 3: Run i18n and screenshot quality review**

Run the i18n E2E module in both languages and inspect screenshots for untranslated keys,overlap,truncation,loading feedback,error toasts,and data rendering:

```bash
pnpm --dir hack/tests test:host:module -- i18n
```

Expected: no raw i18n keys and no layout regression.

Before deleting`mount.js`,complete frozen Tasklist items`RW-280`through`RW-299`.
The rewritten`standalone.html`must retain the old entry's protected CRUD,
attachment,manifest/host-service,permission,error,and bilingual behavior through
the sandboxed host bridge. Run all five existing dynamic-plugin E2E cases and the
bridge security tests;the original display-only standalone page is not an
acceptable replacement.

- [ ] **Step 4: Delete the old workbench**

Delete`apps/lina-vben`only after frozen Tasklist stages eight through ten and all
unit/build gates pass. Delete dynamic-plugin`mount.js`only after the separate
`RW-280`through`RW-299`parity and security gates pass. Do not copy any Vben package
into`apps/lina-web`.

- [ ] **Step 5: Run no-compatibility scans**

Run:

```bash
rg -n "apps/lina-vben|lina-vben|web-antd" Makefile hack .github apps/lina-core apps/lina-web
rg -n "from ['\"]vue|from ['\"]vue-router|@vben/|ant-design-vue|from ['\"]antd|@ant-design/icons" apps/lina-web apps/lina-plugins
find apps/lina-web apps/lina-plugins -type f -name '*.vue' -print
rg -n "embedded-mount|embeddedSrc|DynamicAccessModeEmbeddedMount" apps/lina-core apps/lina-web --glob '!**/*_test.go' --glob '!**/*.test.ts' --glob '!**/*.test.tsx'
rg -n "embedded-mount|embeddedSrc|DynamicAccessModeEmbeddedMount" .agents docs --glob '!**/archive/**'
pnpm --dir apps/lina-web list antd @ant-design/icons --depth Infinity
```

Expected: the source and path scans return no production references,the governance scan returns only explicit rejection or migration requirements,and the package query reports neither`antd`nor`@ant-design/icons`. Rejection tests and allowed historical references must be listed in the execution record.

- [ ] **Step 6: Run the full frontend and E2E suites**

Run:

```bash
pnpm --dir apps/lina-web typecheck
pnpm --dir apps/lina-web test:unit
pnpm --dir apps/lina-web build
pnpm --dir hack/tests test:validate
pnpm --dir hack/tests test:host
```

Expected: all pass.

- [ ] **Step 7: Record the hard-cut checkpoint**

Suggested commit after explicit authorization:

```bash
git add -A apps/lina-vben apps/lina-web apps/lina-plugins hack/tests
git commit -m "refactor(web): remove Vue workbench"
```

### Task 14: Final Repository Verification and Documentation Handoff

**Files:**

- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `CONTRIBUTING.md`
- Modify: `CONTRIBUTING.zh-CN.md`
- Modify: `docs/2026-07-11-react-workbench-replacement-design.md`
- Modify: `docs/2026-07-11-tapcanvas-react-platform-migration-design.md`
- Modify: `docs/superpowers/plans/2026-07-11-react-workbench-replacement.md`

**Interfaces:**

- Consumes: Completed hard cut and verification evidence.
- Produces: Accurate developer documentation,task evidence,and a stable base for the TapCanvas studio plugin migration.

- [ ] **Step 1: Update bilingual developer documentation**

Document`apps/lina-web`,Node/pnpm versions,`pnpm`commands,React source-plugin manifest,iframe-only dynamic UI,dev ports,PID/log names,and build embedding. Keep English and Chinese README pairs factually identical.

- [ ] **Step 2: Run all Go gates affected by the replacement**

Run:

```bash
cd apps/lina-core && go test ./internal/service/config ./internal/service/plugin/... ./internal/controller/menu ./internal/cmd -count=1
cd hack/tools/linactl && go test ./... -count=1
make lint
```

Expected: all tests and lint pass.

- [ ] **Step 3: Run final build and startup smoke**

Run:

```bash
go run ./hack/tools/linactl build --plugins=0
go run ./hack/tools/linactl dev --plugins=0
go run ./hack/tools/linactl status
go run ./hack/tools/linactl stop
```

Expected:`Lina Core`and`Lina Web`become ready, status shows`lina-web`PID/log paths,and stop releases ports 9120/5666.

- [ ] **Step 4: Run document and repository scans**

Run:

```bash
test -f README.md && test -f README.zh-CN.md
test -f CONTRIBUTING.md && test -f CONTRIBUTING.zh-CN.md
test -f docs/2026-07-11-react-workbench-replacement-design.md
test -f docs/superpowers/plans/2026-07-11-react-workbench-replacement.md
rg -n "TO""DO|TB""D|implement ""later|fill in ""details" docs/2026-07-11-react-workbench-replacement-design.md docs/superpowers/plans/2026-07-11-react-workbench-replacement.md
```

Expected: required files exist and the placeholder scan returns no matches.

- [ ] **Step 5: Complete the implementation evidence record**

Record exact commands,exit codes,focused E2E suites,screenshot directories,cross-platform assessment,DI assessment,i18n assessment,data-permission assessment,cache invalidation assessment,and any unrelated pre-existing failures. Mark plan checkboxes complete only after the corresponding command passes.

- [ ] **Step 6: Perform final review**

Run the repository-required review workflow. Confirm the React workbench remains generic,TapCanvas logic is absent from`apps/lina-web`,source plugins use the published contract,dynamic plugins are isolated,and no page change polluted`lina-core`business semantics.

- [ ] **Step 7: Record the documentation checkpoint**

Suggested commit after explicit authorization:

```bash
git add README.md README.zh-CN.md CONTRIBUTING.md CONTRIBUTING.zh-CN.md docs
git commit -m "docs: complete React workbench migration guide"
```

## Completion Criteria

The plan is complete only when all of the following are true:

- `apps/lina-web`is the only host workbench and`apps/lina-vben`does not exist.
- Host pages and official source-plugin embedded pages contain no Vue runtime or`.vue`source.
- The host dependency graph and production source contain Semi Design only and no Ant Design React package or compatibility wrapper.
- Dynamic plugin UI uses iframe or new-window only;backend validation rejects embedded mount.
- Authentication,refresh,tenant switching,impersonation,menus,button permissions,and module capability hiding pass automated tests.
- All existing host management workflows have React implementations and meaningful E2E assertions.
- Runtime i18n supports`en-US`and`zh-CN`,including menu,tab,breadcrumb,plugin,and API Docs refresh.
-`linactl`,`Makefile`,CI,i18n scanning,embedded assets,PID/log naming,and repository-root detection use`apps/lina-web`.
- Frontend unit tests,typecheck,build,Go package tests,lint,host-only build,and host E2E pass in the final worktree.
- The TapCanvas studio migration can depend on`PluginUIDefinition`,`PluginHostContextValue`,the`workspace`surface,and a single React runtime without importing host internals.
