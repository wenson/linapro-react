import type { PluginHostApi } from "@linapro/plugin-ui";

const pluginID = "linapro-tenant-core";

export interface TenantPlugin {
  id: string;
  name: string;
  description: string;
  enabled: number;
  installMode?: "global" | "tenant_scoped" | string;
  scopeNature?: "platform_only" | "tenant_aware" | string;
  tenantEnabled?: number;
}

export interface TenantPluginManagementApi {
  disable(pluginId: string): Promise<void>;
  enable(pluginId: string): Promise<void>;
  list(): Promise<{ items: TenantPlugin[]; total: number }>;
}

export function createTenantPluginManagementApi(api: PluginHostApi): TenantPluginManagementApi {
  return {
    disable: (id) => api.plugin(pluginID, `tenant/plugins/${encodeURIComponent(id)}/disable`, { method: "POST" }),
    enable: (id) => api.plugin(pluginID, `tenant/plugins/${encodeURIComponent(id)}/enable`, { method: "POST" }),
    async list() {
      const response = await api.plugin<{ list: TenantPlugin[]; total: number }>(pluginID, "tenant/plugins");
      return { items: response.list ?? [], total: response.total ?? 0 };
    },
  };
}
