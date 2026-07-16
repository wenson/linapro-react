# TapCanvas Studio 阶段一执行记录

## 结论

阶段一已通过。`TS-020`至`TS-039`均具备当前工作区实现与验证证据：只读迁移基线已冻结，`linapro-tapcanvas-studio`空插件可随宿主构建和启动，干净数据库按`linapro-ai-core`、`linapro-tapcanvas-studio`顺序自动安装启用，两个 React入口已通过 Playwright和截图审查。审查未发现阻塞问题或未关闭警告。

本文面向后续阶段执行者。阶段一不迁移画布源码，不实现业务 API、业务表、Worker、Hono兼容层或`new-api`。

## 阶段信息

| 字段 | 值 |
| --- | --- |
| 阶段 | 阶段一：迁移基线和插件骨架 |
| Tasklist版本 | `v1.0` |
| 任务范围 | `TS-020`至`TS-039` |
| 状态 | `Passed` |
| 执行日期 | `2026-07-15` |
| 执行分支 | `feat/react-workbench-replacement` |
| 当前提交 | `7d149838`，仅作工作区起点记录 |
| 来源基线 | `680b0243cd8bb7e5a8926d49eadd942dbc0151f4` |
| 提交授权 | 未授权 |

## 任务状态

| 任务 | 状态 | 证据 |
| --- | --- | --- |
| `TS-020` | `Passed` | 迁移基线记录 Web文件数、行数、最大文件、锁定依赖和`215/215`历史测试结果 |
| `TS-021` | `Passed` | 迁移基线逐项记录`30`个 Hono模块的路由、调用方、表、任务、配置和测试 |
| `TS-022` | `Passed` | Hono处置矩阵逐项映射至 LinaPro、Studio、AI Core、后续商业插件或删除 |
| `TS-023` | `Passed` | 迁移基线记录认证、Team、商业、源码 alias、Flow双写、本地状态和模型目录耦合 |
| `TS-024` | `Passed` | 来源没有大画布 fixture或可运行服务；真实已测上限记录为`0`个性能样本，不伪造延迟 |
| `TS-025`至`TS-033` | `Passed` | 插件骨架、双语 README、清单、硬依赖、菜单、嵌入入口、React入口、资源目录和执行记录齐全；插件根无本地`AGENTS.md` |
| `TS-039` | `Passed` | AI Core改为 builtin，删除重复`plugin.autoEnable`；干净库安装时间证明 AI Core先于 Studio |
| `TS-034` | `Passed` | manifest、i18n、React registry、Go编译、15模块 lint和 builtin装配 smoke通过 |
| `TS-035` | `Passed` | builtin默认列表隐藏和管理动作拒绝定向测试通过 |
| `TS-036` | `Passed` | 缺失依赖、版本不满足和副作用前阻断`3/3`定向测试通过 |
| `TS-037` | `Passed` | route cache key包含 Tenant ID和插件 generation；Tenant切换重挂载测试通过 |
| `TS-038` | `Passed` | 本文已记录架构、插件、i18n、数据权限、缓存、数据库、跨平台和测试影响 |

## 变更范围

| 域 | 路径 | 结果 |
| --- | --- | --- |
| 文档 | `docs/2026-07-15-tapcanvas-studio-migration-baseline.md` | 冻结只读来源、Hono矩阵、前端耦合和真实性能基线 |
| 插件 | `apps/lina-plugins/linapro-tapcanvas-studio/` | 新增 builtin源码插件骨架、双语资源、React入口和插件自有 E2E |
| 插件 | `apps/lina-plugins/linapro-ai-core/plugin.yaml` | `distribution`从`managed`改为`builtin` |
| 宿主前端 | `apps/lina-web/tsconfig.plugin-ui.json` | 纳入 Studio插件 UI类型检查 |
| 宿主前端 | `apps/lina-web/src/layout/workbench-layout.tsx` | route cache key加入 Tenant ID和插件 generation |
| 宿主前端 | `apps/lina-web/src/layout/workbench-layout.test.tsx` | 验证 Tenant切换清空旧页面局部状态 |
| 宿主测试 | `apps/lina-core/internal/service/plugin/internal/lifecycle/lifecycle_builtin_test.go` | 验证 builtin依赖优先排序 |
| 部署配置 | `hack/deploy/config.yaml` | 删除 AI Core重复`plugin.autoEnable`项 |
| Tasklist | `docs/2026-07-15-tapcanvas-studio-migration-tasklist.md` | 仅更新阶段一任务完成状态，不改变冻结语义 |

`../TapCanvas`始终保持只读。本阶段未执行`commit`、`push`、PR、tag、镜像发布或环境发布。

## 命令与结果

| 命令 | 退出码 | 结果 |
| --- | ---: | --- |
| 来源 Web、Hono、调用方和依赖静态扫描 | `0` | Web与`30`个 Hono模块基线落盘 |
| Studio Go定向编译 | `0` | `2`个包通过 |
| 布局与 Studio registry定向 Vitest | `0` | `5/5`通过 |
| React工作台与插件 UI typecheck、ESLint | `0` | 均通过 |
| `make plugins.check` | `0` | 扫描`463`个文件、`12`份清单，`0`个 finding |
| `make i18n.check` | `0` | `0`个违规；前端 key覆盖通过；保留`14`条仓库既有警告 |
| `GF_GCFG_FILE=temp/phase10/config.yaml go test ...` builtin定向套件 | `0` | catalog与 plugin包通过，覆盖`8`个目标用例 |
| `go test ./apps/lina-core/internal/service/plugin/internal/lifecycle -run TestOrderBuiltinManifestsPlacesDependenciesFirst -count=1` | `0` | AI Core依赖优先排序通过 |
| `go run ./hack/tools/linactl build plugins=1` | `0` | React前端、`12`份插件清单、WASM和`linux/amd64`宿主构建通过 |
| `GF_GCFG_FILE=temp/studio-phase1/config.yaml go run ./hack/tools/linactl db.init confirm=init rebuild=true` | `0` | 隔离数据库加载`001`至`012`核心 SQL |
| `GOWORK=temp/go.work.plugins GOFLAGS=-tags=official_plugins LINAPRO_SOURCE_PLUGINS=1 GF_GCFG_FILE=temp/studio-phase1/config.yaml go run main.go` | `0` | 宿主启动，builtin bootstrap完成并监听`:9130` |
| 隔离数据库只读查询`sys_plugin` | `0` | AI Core与 Studio均为 builtin、installed、enabled；AI Core先安装 |
| `pnpm --dir hack/tests test:validate` | `0` | `258`个 E2E文件、`17`个 scope通过治理校验 |
| `pnpm --dir hack/tests exec tsc --noEmit -p tsconfig.json` | `0` | 插件 E2E与 POM类型检查通过 |
| Playwright执行 Studio`TC001` | `0` | Chromium `1/1`通过，耗时`7.6s` |
| 缺失与版本不兼容依赖定向 Go测试 | `0` | plugin与 dependency包通过，`3/3`目标用例通过 |
| `HOME=/private/tmp/lina-tapcanvas-home GOLANGCI_LINT_CACHE=/private/tmp/lina-tapcanvas-golangci-lint-cache make lint plugins=1` | `0` | `15/15`模块通过，Studio为`0 issues` |
| `git diff --check` | `0` | 无空白错误 |

完整命令使用绝对`GF_GCFG_FILE`、`GOCACHE=/private/tmp/lina-tapcanvas-go-build`和本机 Node.js`22.22.0`。表中为便于阅读缩短路径，未省略实际执行时的隔离数据库、插件 workspace或端口边界。

## 失败与修复

| 失败 | 根因 | 修复与复验 |
| --- | --- | --- |
| Go定向测试首次无法写`/Volumes/c/go-build-cache` | 沙箱不允许写默认 Go缓存 | 改用`GOCACHE=/private/tmp/lina-tapcanvas-go-build`后进入测试 |
| 沙箱内无法连接`127.0.0.1:55432` | OrbStack本地端口不在默认网络权限内 | 使用已授权本地数据库访问范围，builtin与依赖测试通过 |
| `temp/output/lina`本机启动返回`exec format error` | 交付构建目标是`linux/amd64`，当前主机是 macOS | 不改变交付目标；改用本机`go run`完成启动验证 |
| 首次从仓库根运行`go run main.go`找不到入口 | `main.go`位于`apps/lina-core` | 切换到宿主目录后运行 |
| 首次空库启动缺少`sys_plugin`和`sys_job` | LinaPro核心 schema尚未初始化 | 只对隔离数据库执行`db.init rebuild=true`，随后启动成功 |
| Playwright首次报告`No tests found` | CLI过滤器使用了不出现在绝对文件路径中的`../../`前缀 | 改用仓库内路径，`TC001`为`1/1 passed` |
| lint前两次在分析后无法关闭缓存 | `golangci-lint`与`staticcheck`默认写用户缓存目录 | 同时设置`GOLANGCI_LINT_CACHE`和隔离`HOME`，完整`15/15`模块通过 |

上述失败均为环境或命令路径问题。修复后没有代码断言、E2E、构建或 lint失败。

## 数据与协议门禁

- SQL幂等、软删除、自增 ID、Seed、Mock和索引：阶段一不创建业务表或占位 SQL，仅保留后续目录。核心 SQL只用于隔离数据库启动验证。
- DAO、DO、Entity和 Controller：阶段一没有 API或业务表，不生成上述文件。
- Tenant、数据权限和不可见资源：骨架只读取`useLinaPluginHost()`投影，不访问业务数据；Tenant切换会重新挂载页面并丢弃旧 Tenant局部状态。
- API、`FlowMutation`、生成任务、Agent token和 tool call：阶段一不实现这些协议。
- 缓存、集群、事件、租约和恢复：阶段一不创建业务缓存、后台任务或集群状态。
- AI依赖：Studio仅声明并编译依赖 AI Core的公开`backend/cap/aicap/spi`契约，不访问 AI Core内部实现。

## 测试与视觉证据

| 门禁 | 结果 | 证据 |
| --- | --- | --- |
| Go编译与单元测试 | `Passed` | Studio`2`包；builtin`8`个目标用例；排序`1`个；依赖失败`3`个 |
| React单元测试 | `Passed` | 布局与 Studio registry合计`5/5` |
| E2E治理与类型检查 | `Passed` | `258`个文件治理校验；E2E TypeScript通过 |
| Playwright | `Passed` | Studio`TC001`为`1/1`，覆盖项目入口、workspace、中文资源、原始 key和 React/Semi边界 |
| 构建与 lint | `Passed` | 完整构建通过；Go lint`15/15`模块通过 |
| 视觉审查 | `Passed` | 两张截图无重叠、截断、错误提示、原始 i18n key或遗留 Ant/Vue痕迹 |

截图路径：

- `temp/20260715/20260715095213-tapcanvas-project-entry.png`
- `temp/20260715/20260715095214-tapcanvas-studio-workspace.png`

本阶段触发 E2E质量审查，因为新增了两个用户可观察路由。成功路径、宿主上下文和翻译输出已覆盖；阶段一没有表单、业务 API或可执行写操作，因此不存在需要本阶段覆盖的 CRUD异常路径。AI依赖异常由后端定向测试覆盖。

## 影响评估

| 规则域 | 结论 | 说明 |
| --- | --- | --- |
| 架构 | 有影响 | 新增 builtin业务插件；宿主只提供通用 builtin依赖排序，不包含 Studio专属分支 |
| 插件 | 有影响 | 新增 source、builtin、tenant-aware、global插件；AI Core为硬依赖 owner |
| 前端 UI | 有影响 | 新增两个显式懒加载 React页面；复用 React 19单例和 Semi，不创建独立 root |
| API | 无影响 | 阶段一不新增或修改 HTTP API、DTO或路由契约 |
| Go与 DI | 有影响 | 仅静态插件注册与公开 AI owner常量校验，不创建运行期 service依赖图 |
| 数据库 | 无影响 | 插件不创建表、迁移或模型；隔离库仅加载既有 LinaPro核心 schema |
| 数据权限 | 无影响 | 页面只读宿主投影，不查询或写入业务数据 |
| 缓存与集群 | 无影响 | 不创建缓存、事件、订阅或集群状态 |
| i18n | 有影响 | 插件启用`en-US`和`zh-CN`，运行时、菜单和 apidoc资源齐全 |
| 开发工具与跨平台 | 有影响 | 复用标准插件`Makefile`、`hack/config.yaml`和 linactl；Linux交付构建与 macOS本机启动分别验证 |
| 测试 | 有影响 | 新增 builtin排序单测、Tenant重装配验证和插件自有 Playwright资产 |

## 审查结论

审查从完整`git status --short`展开，并覆盖 staged、unstaged、untracked、生成器影响和本阶段允许路径。工作区仍包含 React工作台替换阶段的既有大量变更，本阶段没有回退、覆盖或重新归属这些用户变更。

- 严重问题：`0`。
- 未关闭警告：`0`。
- API：无变更。
- DI：无新增运行期依赖图；源码插件静态注册符合受控装配边界。
- 数据库与数据权限：无插件业务数据访问。
- 缓存：无影响。
- i18n：双语资源、key覆盖和截图通过。
- 跨平台：统一入口通过；交付二进制为 Linux，本机验证使用源码启动。
- E2E：质量审查已触发并通过。

唯一保留风险是来源仓没有大画布性能样本。该事实已经按`TS-024`如实冻结，阶段二接入宿主后必须使用确定性 fixture实测加载、拖动、框选和 mutation保存；它不阻塞空插件阶段验收。

## Git与回退边界

- 父仓跟踪状态：插件是`lina-tapcanvas`普通目录，不包含嵌套`.git`或 gitlink。
- `commit`、`push`、PR、tag、镜像和环境发布：均未执行。
- 阶段回退候选：Studio插件目录、AI Core builtin清单、宿主 route cache key、部署配置和本阶段文档；回退前必须区分工作区既有 React迁移变更。

## 阶段验收

- Tasklist阶段验收：`Passed`。空的 TapCanvas builtin插件可以随宿主编译、启动和路由，并保持 LinaPro通用宿主边界。
- 已完成范围：`TS-020`至`TS-039`。
- 下一步：从阶段二`TS-040`开始机械复制只读来源的 React画布源码，并在复制后立即执行内容摘要复核与宿主依赖接入。
