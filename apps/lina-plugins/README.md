# LinaPro Plugins

`apps/lina-plugins/` is the first-party plugin workspace for LinaPro.

LinaPro positions `apps/lina-core` as the stable full-stack framework host. The host keeps universal framework capabilities, governance, and plugin extension surfaces, while business modules, operational pages, demo capabilities, and optional domain features live here as plugins. This keeps the host reusable and avoids binding core contracts to a specific management workspace page.

The workspace currently contains source plugins compiled into the host, plus one dynamic `WASM` plugin example for runtime delivery.

## Plugin Inventory

| Plugin | Type | Scope | Install mode | Capability |
|--------|------|-------|--------------|------------|
| `linapro-tenant-core` | `source` | `platform_only` | `global` | Tenant entities, member relationships, tenant resolution, and tenant lifecycle governance |
| `linapro-org-core` | `source` | `tenant_aware` | `global` | Department management and post management |
| `linapro-content-notice` | `source` | `tenant_aware` | `tenant_scoped` | Notice announcement management |
| `linapro-monitor-online` | `source` | `tenant_aware` | `tenant_scoped` | Online user query and forced logout governance |
| `linapro-monitor-server` | `source` | `platform_only` | `global` | Server monitor collection, cleanup, and query |
| `linapro-monitor-operlog` | `source` | `tenant_aware` | `tenant_scoped` | Operation log persistence and governance pages |
| `linapro-monitor-loginlog` | `source` | `tenant_aware` | `tenant_scoped` | Login log persistence and governance pages |
| `linapro-ops-demo-guard` | `source` | `tenant_aware` | `global` | Demo-environment read-only protection and global write-operation interception |
| `linapro-demo-source` | `source` | `tenant_aware` | `tenant_scoped` | Source plugin example for menu pages, public routes, and protected routes |
| `linapro-demo-dynamic` | `dynamic` | `tenant_aware` | `tenant_scoped` | Dynamic `WASM` plugin example for embedded menu pages, plugin-owned `SQL` table `CRUD`, and standalone static pages |

`linactl` wires source plugins automatically during plugin-full builds by generating the ignored `temp/official-plugins` aggregate module and `temp/go.work.plugins` workspace from the plugin manifests and plugin-local Go modules. `linapro-demo-dynamic` is intentionally excluded from the source-plugin aggregate; it is the runtime plugin reference used by the `WASM` build and lifecycle flow.

## Workspace Files

| Path | Purpose |
|------|---------|
| `<plugin-id>/hack/config.yaml` | Plugin-local tool configuration, including code generation, custom build commands, and other plugin-owned tooling |
| `<plugin-id>/plugin.yaml` | Plugin manifest, metadata, distribution governance, menus, install mode, `i18n`, assets, dependencies, and host service declarations |
| `<plugin-id>/Makefile` | Plugin-local code generation wrapper that includes the shared root `hack/makefiles/plugin.codegen.mk` target fragment |
| `<plugin-id>/README.md` | English plugin-level guide |
| `<plugin-id>/README.zh-CN.md` | Chinese plugin-level guide |

## Product Repository Ownership

`lina-tapcanvas` tracks this workspace directly as ordinary files. Host, workbench, and plugin changes are versioned and rolled back together.

`https://github.com/linaproai/official-plugins.git` is an upstream reference and optional import source, not the product delivery repository. `apps/lina-plugins` must not contain a nested `.git` directory or be converted back into a submodule.

## Plugin Directory Contract

Each plugin directory is owned by the plugin. Lifecycle resources, frontend pages, backend code, `SQL` assets, `i18n` resources, and tests should stay inside `apps/lina-plugins/<plugin-id>/`.

```text
apps/lina-plugins/<plugin-id>/
  backend/
    api/                  API DTOs, route contracts, and metadata
    internal/
      controller/         Plugin request handling and response projection
      service/            Plugin business orchestration and domain logic
      dao/                Plugin-local generated DAO objects when database access exists
      model/do/           Plugin-local generated DO objects when database access exists
      model/entity/       Plugin-local generated entity objects when database access exists
    plugin.go             Backend registration, route registration, lifecycle entry, or dynamic bridge entry
  frontend/
    plugin-ui.ts          Source-plugin React registration entry
    pages/                Plugin-owned React pages or dynamic public assets
  manifest/
    sql/                  Install SQL assets
    sql/mock-data/        Optional mock or demo SQL assets
    sql/uninstall/        Optional uninstall SQL assets
    i18n/<locale>/        Plugin i18n resources
  hack/
    config.yaml           Plugin-local tool configuration, including code generation and custom build commands
    tests/                Optional plugin-owned E2E tests, page objects, and helpers
  go.mod                  Plugin-local Go module
  Makefile                Plugin-local code generation wrapper
  plugin.yaml             Plugin manifest
  plugin_embed.go         Embedded asset registration entry
  README.md               English guide
  README.zh-CN.md         Chinese guide
```

Plugin root `Makefile` files are thin wrappers around the repository-level
`hack/makefiles/plugin.codegen.mk` fragment. The shared fragment derives the
target backend from the including plugin directory, so plugin `Makefile` files
must not hard-code `apps/lina-plugins/<plugin-id>/backend`. Run `make ctrl` or
`make dao` inside a plugin directory to use that plugin's root
`hack/config.yaml`. From the repository root, run
`make ctrl dir=apps/lina-plugins/<plugin-id>/backend` or
`make dao dir=apps/lina-plugins/<plugin-id>/backend` when you need to target a
plugin backend explicitly. Direct `linactl ctrl` and `linactl dao` calls also
only accept `dir=<backend-dir>` as the target selector.

Plugins that need their own build step must declare it in the plugin root
`hack/config.yaml` under `build.commands`. The root `make build` command scans
direct plugin directories under `apps/lina-plugins` that contain `plugin.yaml`
and runs configured commands before the host backend is compiled. Passing
`dir=apps/lina-plugins/<plugin-id>` builds only that plugin. Missing
`build.commands` is valid and means the plugin has no custom build step.

```yaml
build:
  commands:
    - pnpm --dir "$(PLUGIN_ROOT)/frontend" run build
```

`$(PLUGIN_ROOT)` expands to the plugin directory and `$(REPO_ROOT)` expands to
the repository root. Build commands run from the plugin root.

`backend/internal/service/` is the only valid location for plugin business services. Do not create `backend/service/`. Dynamic plugins keep the same `backend/api/`, `backend/plugin.go`, `backend/internal/controller/`, and `backend/internal/service/` shape; their bridge files only adapt `WASM` and `pluginbridge` protocols. Guest business capability clients must come from `lina-core/pkg/plugin/pluginbridge`, not from the `pluginbridge` root package.

## Distribution Governance

`plugin.yaml` may declare `distribution` to describe how the host governs the plugin lifecycle.

| Value | Meaning | Lifecycle |
|-------|---------|-----------|
| `managed` | Ordinary managed plugin. This is the default when `distribution` is omitted. | Visible in plugin management and can be installed, enabled, disabled, upgraded, uninstalled, or auto-enabled through `plugin.autoEnable`. |
| `builtin` | Project built-in source plugin compiled with the host. | Installed, enabled, and safely upgraded during host startup. Ordinary plugin-management write actions are rejected. |

`distribution: builtin` is only valid for `type: source` plugins that are registered by the source-plugin registry with the same plugin ID. Dynamic plugins must not declare `distribution: builtin`.

## Source Plugins

Source plugins are compiled with `apps/lina-core` through explicit registration. They are suitable for first-party framework capabilities that should be delivered with the host build but still remain outside the host core domain.

Source plugin development rules:

1. Create or update `apps/lina-plugins/<plugin-id>/`.
2. Keep plugin metadata, menus, page mounts, lifecycle resources, `SQL` assets, and `i18n` assets in `plugin.yaml` and `manifest/`.
3. Keep backend implementation under `backend/`, with business logic in `backend/internal/service/`.
4. Register source-plugin React pages and slots in `frontend/plugin-ui.ts`; keep their implementation under `frontend/pages/` and related plugin-relative modules.
5. Keep the plugin's own `go.mod` and `backend/plugin.go` complete; `linactl` discovers and aggregates source-plugin backend packages automatically during plugin-full builds.

### Source-plugin React UI

`apps/lina-web` is the only owner of source-plugin UI discovery. Every source plugin exports one `frontend/plugin-ui.ts` definition through the stable `@linapro/plugin-ui` import surface:

```tsx
import { definePluginUI } from "@linapro/plugin-ui";

export default definePluginUI({
  pages: {
    "/extension/acme-demo": {
      capabilities: ["acme:record:list"],
      load: () => import("./pages/record-page"),
      surface: "page",
    },
  },
  slots: {},
});
```

Page and slot modules are lazy by contract. Plugin frontend code may import `@linapro/plugin-ui`, the optional published rich-text editor entry, React, Semi Design, and plugin-relative modules. It must not import host-private `apps/lina-web/src` paths. Use `@douyinfe/semi-ui` and `@douyinfe/semi-icons` directly; do not add Ant Design React or forwarding-only UI wrappers.

`useLinaPluginHost()` projects the host API client, `en-US` or `zh-CN` locale, translated messages, the current user, the current tenant, and a read-only permission set. Pages must hide disabled or unauthorized actions from these host projections. Tenant switches, impersonation changes, permission changes, plugin generation changes, disablement, and uninstall remain host-owned invalidation events; plugins must not persist their own authority state or token.

## Dynamic Plugins

Dynamic plugins are delivered as runtime-managed `WASM` artifacts. Use `linapro-demo-dynamic/` as the reference for upload, install, enable, disable, uninstall, `hostServices`, public static assets, and plugin-owned data access through governed host services.

Build all dynamic plugins, or one plugin with `p=<plugin-id>`, from the
repository root:

```bash
make wasm
make wasm p=linapro-demo-dynamic
```

Dynamic plugins must declare `type: dynamic` in `plugin.yaml`, keep `main.go` and `go.mod` as the guest build entry, use `hostServices` to describe runtime capabilities and resource boundaries, and import runtime, storage, data, cache, users, notifications, plugins, and related business host-service clients from `lina-core/pkg/plugin/pluginbridge`. Plugin-local configuration is consumed through `Plugins().Config()` and authorized as `plugins.config.get`; notification sends use `Notifications().Send()` and `notifications.messages.send`; scheduled jobs are managed by the `jobs` domain instead of a separate dynamic `cron` host service.

### Dynamic Hosted UI

Dynamic frontend assets are declared through `public_assets` and opened only as a sandbox iframe or a new window. A menu keeps its normal internal route and uses `component: system/plugin/dynamic-page` with `pluginAccessMode: iframe|new-window` and a current-plugin, current-version `pluginAssetUrl` under `/x-assets/<plugin-id>/<version>/...`.

The iframe sandbox omits `allow-same-origin`, and neither iframe nor new-window content receives a LinaPro token. An iframe that needs protected current-plugin APIs uses the versioned host `postMessage` bridge. The host validates the window, nonce, plugin ID, generation, request ID, path, payload size, concurrency, timeout, and cancellation before calling `/x/<plugin-id>/api/v1/<relative-path>` with host-owned auth, locale, and tenant headers. External URLs, cross-plugin assets, JavaScript module mounts, and direct token projection are rejected. `new-window` is reserved for standalone pages that do not need the parent-window protected API bridge.

## Host and Plugin Boundary

The host owns stable framework surfaces and top-level catalogs such as `dashboard`, `platform`, `org`, `content`, `monitor`, `setting`, `scheduler`, `extension`, and `developer`. Plugins choose their own mount points through `plugin.yaml` `parent_key`; the host only resolves declared parents during sync and rejects missing parents to avoid orphaned menu trees.

Plugin-owned tables, menus, pages, hooks, scheduled jobs, public assets, and lifecycle resources stay in the plugin directory. Host code should depend on stable plugin service seams and published packages rather than hard-coding plugin-specific page structures or menu composition details.

## Routes and Public Assets

Source plugin `HTTP` routes are registered by plugin backend code. Do not declare public routes, portal routes, workspace `API` routes, or route groups in `plugin.yaml`.

Use `registrar.Routes().APIPrefix()` for source plugin APIs. The returned prefix is `/x/{plugin-id}`. Segments after that prefix are plugin-defined route content, such as `/api/v1`, `/api/v2`, or `/interface/m1`.

`plugin.yaml` `menus` is the source of truth for management workspace navigation and permissions. Registering an `HTTP` route does not create menus, permission nodes, `OpenAPI` entries, or workspace route metadata.

Plugins may declare public static assets through `plugin.yaml` `public_assets`. The host serves declared assets from `/x-assets/{plugin-id}/{version}/...` and treats each declaration as the plugin author's publication boundary.

## Testing

Plugin-owned Playwright coverage belongs under:

```text
apps/lina-plugins/<plugin-id>/hack/tests/e2e/
apps/lina-plugins/<plugin-id>/hack/tests/pages/
apps/lina-plugins/<plugin-id>/hack/tests/support/
```

Run a single plugin test scope through the host test runner:

```bash
pnpm -C hack/tests test:module -- plugin:<plugin-id>
```

Use plugin-local `api_contract_test.go` and Go package tests for backend contract checks where applicable.

## Version Upgrades

When an installed source plugin bumps `plugin.yaml` `version`, discovery does not silently replace the effective host version.

- The current effective version remains pinned in `sys_plugin.version` and `release_id`.
- The higher discovered source version is stored as a prepared `sys_plugin_release`.
- The host must process the source plugin through the supported plugin workspace update flow before startup is allowed to continue.
- If the update is skipped, startup fails fast and reports the plugins that still require attention.

## References

- `apps/lina-plugins/linapro-demo-source/README.md`
- `apps/lina-plugins/linapro-demo-dynamic/README.md`
