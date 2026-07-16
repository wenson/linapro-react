import type { ApiClient, ApiTokenPair } from "#/api/client";
import { pluginApiPath } from "#/api/client";
import type { LoginTenant } from "#/api/auth";

const tenantPluginId = "linapro-tenant-core";

interface LoginTenantListResponse {
  list?: LoginTenant[];
}

export interface TenantImpersonationResult {
  actingUserId: number;
  isImpersonated: boolean;
  tenantId: number;
  token: string;
}

export interface TenantApi {
  endImpersonation(tenantId: number): Promise<void>;
  impersonate(tenantId: number, reason?: string): Promise<TenantImpersonationResult>;
  listLoginTenants(userId: number): Promise<LoginTenant[]>;
  selectTenant(preToken: string, tenantId: number): Promise<ApiTokenPair>;
  switchTenant(tenantId: number): Promise<ApiTokenPair>;
}

export function createTenantApi(client: ApiClient): TenantApi {
  return {
    endImpersonation: (tenantId) =>
      client.post<void>(pluginApiPath(tenantPluginId, `platform/tenants/${tenantId}/end-impersonate`)),
    impersonate: (tenantId, reason) =>
      client.post<TenantImpersonationResult>(
        pluginApiPath(tenantPluginId, `platform/tenants/${tenantId}/impersonate`),
        reason?.trim() ? { reason: reason.trim() } : undefined,
      ),
    async listLoginTenants(userId) {
      const response = await client.get<LoginTenantListResponse>(
        pluginApiPath(tenantPluginId, "auth/login-tenants"),
        { query: { userId } },
      );
      return response.list ?? [];
    },
    selectTenant: (preToken, tenantId) =>
      client.post<ApiTokenPair>(pluginApiPath(tenantPluginId, "auth/select-tenant"), {
        preToken,
        tenantId,
      }),
    switchTenant: (tenantId) =>
      client.post<ApiTokenPair>(pluginApiPath(tenantPluginId, "auth/switch-tenant"), { tenantId }),
  };
}
