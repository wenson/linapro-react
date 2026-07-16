# React 工作台阶段九执行记录

阶段九已经完成。动态插件隔离契约、受限消息桥接、PostgreSQL Go 集成测试和 5 个真实浏览器 E2E 文件全部通过，旧`mount.js`及运行时插件资产动态导入已清除。

## 阶段信息

| 字段 | 值 |
| --- | --- |
| 阶段 | 阶段九：动态插件通用契约与隔离迁移 |
| Tasklist 版本 | `v1.2` |
| 任务范围 | `RW-280`至`RW-299` |
| 状态 | `Completed` |
| 开始时间 | `2026-07-13 09:46 CST` |
| 最近更新 | `2026-07-14 02:37 CST` |
| 执行分支 | `feat/react-workbench-replacement` |
| 宿主基线 | `7d149838e77fe3d2b1bdda5ebb9d46679f79fd23` |
| 插件基线 | 扁平化来源`1b90535404d1563a045efe3888dd9db6d1bf5e29` |

## 范围与边界

- 目标：把动态插件 UI 从宿主 DOM 注入迁移为`iframe`或`new-window`隔离，并通过受限、版本化的消息桥接保持当前插件受保护 API、CRUD 和附件能力。
- 修改范围：`apps/lina-core`的通用动态插件菜单与 hosted frontend 契约、`apps/lina-web`的`HostedPage`与桥接、`apps/lina-plugins/linapro-demo-dynamic`及对应测试和文档。
- 禁止范围：不改变 LinaPro 认证、用户、租户、RBAC、数据权限、数据库和通用 service 语义；不执行动态脚本 import；不向 iframe 投影 Token；不修改生成的 DAO、DO 或 Entity。
- 外部前置项：阶段八`RW-273`和`RW-279`仍独立验收，不影响本阶段动态插件门禁结论。

## 任务状态

| 任务 | 状态 | 证据 |
| --- | --- | --- |
| `RW-280`至`RW-284` | `Completed` | Go 常量、catalog、frontend contract、菜单投影、API 文档和动态 Demo 清单已迁移为`iframe/new-window + pluginAssetUrl` |
| `RW-285`至`RW-292` | `Completed` | React`HostedPage`、版本化桥接、路径治理、请求上限、最小上下文和会话失效机制已实现，11 个定向单测通过 |
| `RW-293` | `Completed` | `standalone.html + standalone.js`恢复分页、CRUD、附件、manifest 演示、错误反馈和双语运行时文案；受保护请求全部改走桥接 |
| `RW-294` | `Completed` | `DemoDynamicPage`改为 FrameLocator；`TC001`至`TC005`移除旧 ESM/VXE/Ant/Vben 语义，257 个 E2E 文件通过静态治理 |
| `RW-295` | `Completed` | 覆盖恶意 path、伪造 source/nonce、旧 generation、重复 ID、超时、取消、循环或过大消息、禁用状态、multipart 和 Blob |
| `RW-296` | `Completed` | 菜单 controller、frontend contract、plugin integration 和启动绑定所在插件根包测试通过；`make i18n.check`与 14 模块`make lint`通过 |
| `RW-297` | `Completed` | Node.js 22.22.0 下 React 类型检查、lint、62 文件/213 单测和生产构建通过；动态插件 5 个 E2E 文件共 19 个场景通过 |
| `RW-298` | `Completed` | `mount.js`不存在；生产代码只保留静态字面量代码分割，不存在基于插件资产 URL 的动态 import |
| `RW-299` | `Completed` | 本记录已完成 DI、缓存、数据权限、数据库、认证、租户和 iframe bridge 安全影响审查 |

## 实现结论

### Go 通用契约

- 保留`DynamicAccessModeQueryKey`，新增`DynamicAccessModeIframe`、`DynamicAccessModeNewWindow`和`DynamicPluginAssetURLQueryKey`。
- 动态菜单必须使用内部工作台路由、`system/plugin/dynamic-page`和当前插件当前版本的`public_assets` HTML。
- catalog、frontend contract 和 menu controller 显式拒绝`embedded-mount`、`embeddedSrc`、外部 URL、跨插件资源、非 HTML、未声明文件和版本不匹配。
- 菜单 metadata 投影`pluginId`，React 工作台使用它再次约束资产和消息归属。

### React HostedPage 与桥接

- iframe sandbox 为`allow-downloads allow-forms allow-modals allow-popups allow-scripts`，不包含`allow-same-origin`。
- iframe URL fragment只携带协议版本、nonce、插件 ID 和 generation，不携带 Token、租户或权限。
- 宿主同时校验`contentWindow`、nonce、插件 ID、generation 和 request ID。opaque origin 场景不依赖`event.origin`。
- guest 只能调用当前插件相对 API path。宿主`ApiClient`继续负责 Authorization、`Accept-Language`、`X-Tenant-Code`和 401 刷新。
- guest 只接收当前插件运行时文案和当前插件权限前缀。全局`*`投影为当前插件的`<plugin-id>:*`。
- 语言、租户、权限或 generation 变化会更换 nonce、重建 iframe 并销毁旧桥接。禁用、卸载或非正常运行状态会 fail closed。
- 单会话上限为 1024 个请求；并发上限 4；超时 30 秒；JSON 请求 256 KiB；单文件 8 MiB；消息 10 MiB；响应 16 MiB。

### 动态 Demo

- `standalone.html`成为唯一 HTML 入口，加载同目录`standalone.js`。
- 原`mount.js`的 2529 行交互能力迁入 standalone 页面；旧文件已删除。
- JSON CRUD、附件 Blob 下载和 manifest 演示都通过浏览器桥接调用当前插件 API。
- 新标签页模式不使用父窗口桥接；需要认证 CRUD 或附件的菜单必须使用 iframe。
- 页面不再通过`innerHTML`插入运行时翻译，避免插件运行时文案形成脚本注入面。

## 命令与结果

| 序号 | 命令 | 退出码 | 结果 |
| --- | --- | --- | --- |
| 1 | `GF_GCFG_FILE=manifest/config/config.template.yaml go test ./internal/controller/menu -run 'TestConvertToRouteItemsBuilds(Iframe\|NewWindow)RouteForHostedXAssets' -count=1` | `0` | 菜单投影定向测试通过 |
| 2 | `GF_GCFG_FILE=manifest/config/config.template.yaml go test ./internal/service/plugin/internal/catalog ./internal/service/plugin/internal/frontend -run 'TestValidateManifestMenusEnforcesDynamicHostedIsolation\|TestValidateHostedMenuBindings' -count=1` | `0` | catalog 和 frontend contract 定向测试通过 |
| 3 | `GF_GCFG_FILE=manifest/config/config.template.yaml go test ./internal/service/plugin -run '^$' -count=1` | `0` | 插件根包编译通过 |
| 4 | `GOWORK=off go test ./... -count=1`，目录`linapro-demo-dynamic` | `0` | 动态 Demo Go 包通过 |
| 5 | `make wasm p=linapro-demo-dynamic out=../../temp/output` | `0` | 生成 19 MiB WASM；包含`standalone.html`与`standalone.js`，不含`mount.js` |
| 6 | `pnpm --dir apps/lina-web typecheck` | `0` | TypeScript 与 plugin UI 类型检查通过；Node 20.19.5 低于声明的 22.22.0 |
| 7 | `pnpm --dir apps/lina-web lint` | `0` | ESLint 通过 |
| 8 | 定向 Vitest：HostedPage 与 bridge | `0` | 2 个文件、11 个测试通过 |
| 9 | `pnpm --dir apps/lina-web test:unit` | `0` | 59 个文件、190 个测试通过 |
| 10 | `pnpm --dir apps/lina-web build` | `0` | 3305 模块；最大 JS chunk 627.59 kB |
| 11 | `make i18n.check` | `0` | 运行时 i18n 扫描和覆盖检查通过 |
| 12 | `GOPROXY=https://goproxy.cn,direct GOSUMDB=off make lint` | `0` | 14 个 Go 模块的 golangci-lint 与 staticcheck 通过 |
| 13 | `node hack/tests/scripts/validate-e2e.mjs` | `0` | 17 个 scope、257 个 E2E 文件通过静态治理 |
| 14 | 旧契约、动态 import、Token 和资产文件扫描 | `0` | 只保留 Go 显式拒绝与文档说明；动态 import 和前端 Token 命中为 0 |
| 15 | `git diff --check` | `0` | 无空白错误 |
| 16 | `GF_GCFG_FILE=../../temp/phase10/config.yaml GOWORK=../../temp/go.work.plugins GOFLAGS=-tags=official_plugins LINAPRO_SOURCE_PLUGINS=1 go test ./internal/controller/menu ./internal/service/plugin/internal/frontend ./internal/service/plugin/internal/integration ./internal/service/plugin -count=1`，目录`apps/lina-core` | `0` | 菜单、frontend contract、plugin integration 与启动绑定所在根包全部通过；最慢包 61.919 秒 |
| 17 | `PATH=$HOME/.nvm/versions/node/v22.22.0/bin:$PATH pnpm --dir apps/lina-web typecheck` | `0` | 宿主及 plugin UI TypeScript 检查通过 |
| 18 | `PATH=$HOME/.nvm/versions/node/v22.22.0/bin:$PATH pnpm --dir apps/lina-web lint` | `0` | React ESLint 通过 |
| 19 | React 全量单测与 Go 门禁并行执行 | `1` | 4 个插件懒加载测试文件中的 6 项达到 10 秒超时；其余 207 项通过，未出现断言错误 |
| 20 | 定向重跑上述 4 个插件测试文件 | `0` | 4 个文件、19 个测试通过，确认首次失败为并行资源争用 |
| 21 | 单独运行`PATH=$HOME/.nvm/versions/node/v22.22.0/bin:$PATH pnpm --dir apps/lina-web test:unit` | `0` | 62 个文件、213 个测试全部通过 |
| 22 | `PATH=$HOME/.nvm/versions/node/v22.22.0/bin:$PATH pnpm --dir apps/lina-web build` | `0` | 3318 个模块完成生产构建，耗时 10.05 秒 |
| 23 | 动态插件`TC001`至`TC005`Playwright 目录回归，`--workers=1` | `0` | 5 个文件拆分的 19 个浏览器场景全部通过，耗时 13.7 分钟 |
| 24 | `make i18n.check` | `0` | 运行时文案、宿主与插件覆盖、React 前端 key 覆盖均通过 |
| 25 | `GOPROXY=https://goproxy.cn,direct GOSUMDB=off make lint` | `0` | 14 个 Go 模块的 golangci-lint 与 staticcheck 通过 |
| 26 | `mount.js`、旧 hosted 契约和非字面量`import()`扫描 | `0` | 无`mount.js`；旧契约仅保留后端显式拒绝逻辑；无插件资产 URL 动态导入 |

## 失败项与外部门禁

- 原 PostgreSQL 阻塞已解决：最终 Go 门禁使用`temp/phase10/config.yaml`连接`127.0.0.1:55432/linapro`并通过。
- 原真实浏览器阻塞已解决：`TC001`至`TC005`共 19 个场景在 React 工作台`5667`和后端`9120`上全部通过。
- 首次 React 全量单测与 Go 测试并行时，6 个插件懒加载测试达到 10 秒超时。4 个失败文件定向重跑为 19/19，通过；全量单独重跑为 213/213，通过。该失败归类为门禁并发资源争用，不是功能回归。
- `make lint`继续使用已验证的`goproxy.cn`镜像；14 个模块均通过。
- 本阶段最终门禁全部在项目声明的 Node.js 22.22.0 下执行。当前无未关闭的阶段九失败项。

## 影响评估

| 规则域 | 结论 | 证据或说明 |
| --- | --- | --- |
| 架构 | 有影响 | 新增宿主通用动态插件隔离承载与受治理桥接，不绑定具体业务插件 |
| 插件 | 有影响 | 动态 UI 只允许`iframe`和`new-window`；旧宿主 DOM 挂载被拒绝 |
| 前端 UI | 有影响 | 新增 React`HostedPage`；不引入新的 UI 底座或状态源 |
| API | 有影响 | 菜单新增`pluginId`投影，动态查询收敛为`pluginAccessMode + pluginAssetUrl` |
| 后端与 DI | 无新增影响 | 只修改现有 menu/catalog/frontend contract；不新增 service、provider、路由 owner 或启动装配 |
| 数据库 | 无影响 | 不修改 SQL、DAO、DO、Entity、索引或数据模型 |
| 数据权限 | 无放宽 | 桥接仍调用原插件 HTTP 路由，后端继续执行认证、权限、租户和数据权限校验 |
| 缓存一致性 | 无新增权威源 | generation 和认证上下文仍来自宿主；上下文变化只使浏览器会话失效 |
| 认证与租户 | 无语义变化 | Token 和租户 header 留在`ApiClient`；iframe 不能读取宿主存储或 Token |
| i18n | 有影响 | HostedPage 双语错误文案和动态 Demo 双语资源已同步 |
| 开发工具 | 无持久化影响 | 未修改 Makefile、linactl 或 CI；Go 工具安装发生在本机缓存 |
| 测试 | 有影响 | 新增 11 个安全/行为单测并迁移 5 个动态插件 E2E |
| 文档 | 有影响 | 同步菜单 apidoc、插件双语 README、Tasklist 和本记录 |

## 变更文件

- 新增：`apps/lina-web/src/plugin-ui/hosted-bridge.ts`、`hosted-page.tsx`、`hosted-page-contract.ts`及测试，动态 Demo`standalone.js`，本执行记录。
- 修改：Go pluginhost/catalog/frontend/menu 契约及测试，React 路由、菜单模型和双语资源，动态 Demo 清单、HTML、i18n、POM、`TC001`至`TC005`，插件双语 README 和菜单 apidoc。
- 删除：`apps/lina-plugins/linapro-demo-dynamic/frontend/pages/mount.js`。
- 未执行：commit、push、PR、merge、tag 或发布。

## 阶段验收

- 已成立：动态插件不再向宿主 DOM 或 bundle 注入运行时，不获得 LinaPro Token；受限消息桥接保留 JSON、multipart、Blob、取消和错误能力。
- 已成立：Node.js 22.22.0、PostgreSQL fixture、Go integration、React 全量门禁和动态插件 5 个真实浏览器 E2E 均通过。
- 验收结果：`Completed`。`RW-280`至`RW-299`全部完成，阶段九冻结。
