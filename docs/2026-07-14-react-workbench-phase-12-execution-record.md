# React 工作台阶段十二执行记录

## 阶段信息

| 字段 | 值 |
| --- | --- |
| 阶段 | 阶段十二：`lina-core`仓库路径与残余清理 |
| Tasklist 版本 | `v1.2` |
| 任务范围 | `RW-350`至`RW-359` |
| 状态 | `Passed` |
| 完成时间 | `2026-07-14 15:51 CST` |
| 执行分支 | `feat/react-workbench-replacement` |

## 任务证据

| 任务 | 状态 | 证据 |
| --- | --- | --- |
| `RW-350` | `Passed` | `config_path.go`仓库根识别已切换到`apps/lina-web/package.json` |
| `RW-351` | `Passed` | `config_path_test.go`最小仓库 fixture 已切换到`apps/lina-web` |
| `RW-352` | `Passed` | 生产代码不含`apps/lina-vben`或`web-antd`；`embeddedSrc`和`embedded-mount`只存在于显式拒绝分支，不是可用契约；生产目录没有`mount.js`资产 |
| `RW-353` | `Passed` | `pluginAccessMode`、`pluginAssetUrl`、`iframe`和`new-window`只描述 hosted HTML URL、插件归属和隔离模式 |
| `RW-354` | `Passed` | 不存在`DiscoverReactPaths`；`lina-core`不读取`.tsx`、React 页面或插件 frontend 源码 |
| `RW-355` | `Passed` | 本阶段生产修改仅为仓库根识别，没有修改认证、用户、租户、RBAC、数据权限、数据库或通用 service |
| `RW-356` | `Passed` | `go test ./internal/service/config ./internal/cmd -count=1`通过 |
| `RW-357` | `Passed` | iframe/new-window 菜单、catalog、frontend contract、integration 定向回归通过；插件根包编译通过 |
| `RW-358` | `Passed` | `make i18n.check`和`make lint`通过 |
| `RW-359` | `Passed` | 本文记录 DI、缓存、数据权限、数据库、认证和租户无新增影响 |

## 验证命令

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `go test ./internal/service/config ./internal/cmd -count=1` | `0` | config 与 cmd 回归通过 |
| `GF_GCFG_FILE=manifest/config/config.template.yaml go test ./internal/controller/menu -run 'TestConvertToRouteItemsBuilds(Iframe\|NewWindow)RouteForHostedXAssets' -count=1` | `0` | hosted 菜单投影通过 |
| `GF_GCFG_FILE=manifest/config/config.template.yaml go test ./internal/service/plugin/internal/catalog ./internal/service/plugin/internal/frontend -run 'TestValidateManifestMenusEnforcesDynamicHostedIsolation\|TestValidateHostedMenuBindings' -count=1` | `0` | catalog 与 frontend contract 通过 |
| 官方插件 build tag 下运行 menu、frontend、integration | `0` | menu、frontend、integration 通过 |
| `GF_GCFG_FILE=manifest/config/config.template.yaml go test ./internal/service/plugin -run '^$' -count=1` | `0` | 插件根包编译通过 |
| `make i18n.check` | `0` | i18n 门禁通过 |
| `make lint` | `0` | 14 个 Go 模块 lint/deadcode 通过 |
| `git diff --check` | `0` | 无空白错误 |

## 契约审查

- `pluginAccessMode`只接受`iframe`和`new-window`。
- `pluginAssetUrl`只接受当前插件、当前版本、已声明的 hosted HTML 资产。
- `embeddedSrc`、`embedded-mount`、JavaScript 入口、外部 URL 和跨插件资产仍被显式拒绝；这些字面量是负向安全门禁，不是兼容实现。
- `lina-core`只发布通用菜单与 hosted page 元数据，不发现、编译、导入或解释 React/Semi 前端源码。
- `manifest/config/metadata.yaml`中的 React/Semi 名称仅用于系统信息展示，不构成后端解析语义。

## 无新增影响

| 规则域 | 结论 |
| --- | --- |
| Go DI | 未新增 service、provider、controller 或启动绑定 |
| 缓存一致性 | 未修改缓存权威源、revision、失效或跨实例同步 |
| 数据权限 | 未修改查询、scope 或权限过滤 |
| 数据库 | 未修改 SQL、DAO、DO、Entity、索引或迁移 |
| 认证 | 未修改 Token、session、登录、刷新或退出语义 |
| 租户 | 未修改租户解析、切换、代入或 tenant capability |

## 失败记录

- 首次 config/cmd 测试因本地未放置运行时`config.yaml`失败；使用阶段十已验证的临时配置重跑通过，临时文件随后删除。
- 额外扩大执行的插件全包测试暴露一个与本阶段无关的`sys_locker.holder`长度测试失败；冻结要求的 hosted menu/contract/integration 定向包均已通过。该问题保留为阶段十三全量 Go 验证输入。

## 阶段结论

`lina-core`仓库根识别已完成 React 路径切换；通用 hosted page 契约保持框架无关，后端不感知 React、`.tsx`或 Semi Design。阶段验收为`Passed`。
