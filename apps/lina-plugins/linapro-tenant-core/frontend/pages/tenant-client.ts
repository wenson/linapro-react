import type { PluginHostApi } from "@linapro/plugin-ui";

const pluginID = "linapro-tenant-core";

export type TenantStatus = "active" | "deleted" | "suspended";

export interface PlatformTenant {
  id: number;
  code: string;
  name: string;
  status: TenantStatus;
  remark?: string;
  createdAt?: number | null;
  updatedAt?: number | null;
}

export interface PlatformTenantListParams {
  pageNum?: number;
  pageSize?: number;
  code?: string;
  name?: string;
  status?: TenantStatus | "";
}

export interface PlatformTenantPayload {
  code: string;
  name: string;
  remark?: string;
}

export interface PlatformTenantUpdatePayload {
  name: string;
  remark?: string;
}

export interface TenantManagementApi {
  changeStatus(id: number, status: TenantStatus): Promise<PlatformTenant>;
  create(payload: PlatformTenantPayload): Promise<PlatformTenant>;
  delete(id: number): Promise<void>;
  list(params?: PlatformTenantListParams): Promise<{ items: PlatformTenant[]; total: number }>;
  update(id: number, payload: PlatformTenantUpdatePayload): Promise<PlatformTenant>;
}

function query(params: PlatformTenantListParams = {}): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

function json(method: string, body: unknown): RequestInit {
  return { body: JSON.stringify(body), headers: { "content-type": "application/json" }, method };
}

export function createTenantManagementApi(api: PluginHostApi): TenantManagementApi {
  return {
    changeStatus: (id, status) => api.plugin(pluginID, `platform/tenants/${id}/status`, json("PUT", { status })),
    create: (payload) => api.plugin(pluginID, "platform/tenants", json("POST", payload)),
    delete: (id) => api.plugin(pluginID, `platform/tenants/${id}`, { method: "DELETE" }),
    async list(params) {
      const response = await api.plugin<{ list: PlatformTenant[]; total: number }>(pluginID, `platform/tenants${query(params)}`);
      return { items: response.list ?? [], total: response.total ?? 0 };
    },
    update: (id, payload) => api.plugin(pluginID, `platform/tenants/${id}`, json("PUT", payload)),
  };
}
