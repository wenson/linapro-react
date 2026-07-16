import type { ApiClient } from "#/api/client";

export interface HostServicePermissionResource {
  allowMethods?: string[];
  attributes?: Record<string, string>;
  headerAllowList?: string[];
  maxBodyBytes?: number;
  ref: string;
  timeoutMs?: number;
}

export interface HostServicePermissionTable {
  comment?: string;
  name: string;
}

export interface HostServicePermission {
  methods: string[];
  owner?: string;
  paths?: string[];
  resources?: HostServicePermissionResource[];
  service: string;
  tableItems?: HostServicePermissionTable[];
  tables?: string[];
  version?: string;
}

export interface DependencyBlocker {
  chain?: string[];
  code: string;
  currentVersion?: string;
  dependencyId?: string;
  detail?: string;
  pluginId?: string;
  requiredVersion?: string;
}

export interface DependencyCheck {
  blockers?: DependencyBlocker[];
  cycle?: string[];
  dependencies?: Array<{
    chain?: string[];
    currentVersion?: string;
    dependencyId: string;
    dependencyName?: string;
    discovered?: boolean;
    installed: boolean;
    ownerId?: string;
    requiredVersion?: string;
    status: string;
  }>;
  framework?: {
    currentVersion: string;
    requiredVersion: string;
    status: string;
  };
  reverseBlockers?: DependencyBlocker[];
  reverseDependents?: Array<{
    name?: string;
    pluginId: string;
    requiredVersion?: string;
    version?: string;
  }>;
  targetId?: string;
}

export interface PluginRouteReviewItem {
  access: string;
  description?: string;
  method: string;
  permission?: string;
  publicPath: string;
  summary?: string;
}

export interface PluginUpgradeFailure {
  detail?: string;
  errorCode?: string;
  messageKey?: string;
  phase?: string;
  releaseId?: number;
  releaseVersion?: string;
}

export interface PluginItem {
  abnormalReason?: string;
  authorizationRequired: number;
  authorizationStatus: string;
  authorizedHostServices?: HostServicePermission[];
  autoEnableForNewTenants?: boolean;
  autoEnableManaged: number;
  declaredRoutes?: PluginRouteReviewItem[];
  dependencyCheck?: DependencyCheck;
  description: string;
  discoveredVersion: string;
  distribution?: string;
  effectiveVersion: string;
  enabled: number;
  generation?: number;
  hasMockData: number;
  id: string;
  installMode?: string;
  installed: number;
  installedAt: number | null;
  lastUpgradeFailure?: PluginUpgradeFailure;
  name: string;
  requestedHostServices?: HostServicePermission[];
  runtimeState: string;
  scopeNature?: string;
  statusKey: string;
  supportsMultiTenant?: boolean;
  type: string;
  updatedAt: number | null;
  upgradeAvailable: boolean;
  version: string;
}

export interface AuthorizationPayload {
  authorization?: {
    services: Array<{
      methods?: string[];
      owner?: string;
      paths?: string[];
      resourceRefs?: string[];
      service: string;
      tables?: string[];
      version?: string;
    }>;
  };
  confirmed?: boolean;
  force?: boolean;
  installMockData?: boolean;
  installMode?: string;
}

export interface PluginManifestSnapshot {
  description?: string;
  id?: string;
  installSqlCount?: number;
  mockSqlCount?: number;
  name?: string;
  requestedHostServices?: HostServicePermission[];
  routeCount?: number;
  type?: string;
  uninstallSqlCount?: number;
  version?: string;
}

export interface UpgradePreview {
  dependencyCheck?: DependencyCheck;
  discoveredVersion: string;
  effectiveVersion: string;
  fromManifest?: PluginManifestSnapshot;
  hostServicesDiff: {
    authorizationChanged?: boolean;
    authorizationRequired: boolean;
  };
  pluginId: string;
  riskHints: string[];
  runtimeState: string;
  sqlSummary: {
    installSqlCount?: number;
    mockSqlCount?: number;
    runtimeSqlAssetCount?: number;
    uninstallSqlCount?: number;
  };
  toManifest?: PluginManifestSnapshot;
}

export function authorizationPayload(
  plugin: PluginItem,
  options: { installMockData?: boolean; installMode?: string } = {},
): AuthorizationPayload | undefined {
  const services = (plugin.requestedHostServices ?? []).map((service) => ({
    methods: service.methods,
    owner: service.owner,
    paths: service.paths,
    resourceRefs: service.resources?.map((item) => item.ref),
    service: service.service,
    tables: service.tableItems?.map((item) => item.name) ?? service.tables,
    version: service.version,
  }));
  if (!services.length && !options.installMockData && !options.installMode) {
    return undefined;
  }
  return {
    ...(services.length ? { authorization: { services } } : {}),
    ...options,
  };
}

export function createSystemPluginApi(client: ApiClient) {
  return {
    dependency: (id: string) => client.get<DependencyCheck>(`plugins/${id}/dependencies`),
    detail: (id: string) => client.get<PluginItem>(`plugins/${id}`),
    disable: (id: string) => client.put<void>(`plugins/${id}/disable`),
    dynamic: async () => (
      await client.get<{
        list: Array<{
          enabled: number;
          generation: number;
          id: string;
          installed: number;
          runtimeState?: string;
          statusKey: string;
          version: string;
        }>;
      }>("plugins/dynamic")
    ).list,
    enable: (id: string, payload?: AuthorizationPayload) => client.put<void>(`plugins/${id}/enable`, payload),
    install: (id: string, payload?: AuthorizationPayload) => client.post<void>(`plugins/${id}/install`, payload),
    async list(query: Record<string, boolean | number | string | undefined>) {
      const result = await client.get<{ list: PluginItem[]; total: number }>("plugins", { query });
      const list = result.list.filter((item) => item.distribution !== "builtin");
      return {
        list,
        total: Math.max(0, result.total - (result.list.length - list.length)),
      };
    },
    policy: (id: string, autoEnableForNewTenants: boolean) => client.put<void>(
      `plugins/${id}/tenant-provisioning-policy`,
      { autoEnableForNewTenants },
    ),
    sync: () => client.post<{ total: number }>("plugins/sync"),
    uninstall: (id: string, options: { force?: boolean; purgeStorageData?: boolean }) => client.delete<void>(
      `plugins/${id}`,
      {
        query: {
          force: options.force,
          purgeStorageData: options.purgeStorageData === undefined
            ? undefined
            : options.purgeStorageData ? 1 : 0,
        },
      },
    ),
    upgrade: (id: string, payload?: AuthorizationPayload) => client.post<void>(
      `plugins/${id}/upgrade`,
      { ...payload, confirmed: true },
    ),
    upgradePreview: (id: string) => client.get<UpgradePreview>(`plugins/${id}/upgrade/preview`),
    async upload(file: File, overwriteSupport: boolean) {
      const data = new FormData();
      data.append("file", file, file.name);
      if (overwriteSupport) {
        data.append("overwriteSupport", "1");
      }
      return await client.uploadMultipart("plugins/dynamic/package", data);
    },
  };
}
