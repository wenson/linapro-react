import type { LoginTenant } from "#/api/auth";

export const tenantAccessCodes = {
  listLoginTenants: "system:tenant:auth:login-tenants",
  listPlatformTenants: "system:tenant:list",
} as const;

export interface TenantOption { label: string; value: number }
export interface TenantOptionItem { id: number; name: string; status?: string }
export interface UserTenantOptionSource {
  currentTenant?: LoginTenant | null;
  isPlatform: boolean;
  listLoginTenants(userId: number): Promise<TenantOptionItem[]>;
  listPlatformTenants(): Promise<TenantOptionItem[]>;
  permissions?: readonly string[];
  tenants: LoginTenant[];
  userId?: number;
}

function allowed(permissions: readonly string[] | undefined, permission: string): boolean {
  return permissions?.includes("*") === true || permissions?.includes(permission) === true;
}

function active(items: readonly TenantOptionItem[]): TenantOptionItem[] {
  return items.filter((item) => item.id > 0 && item.status !== "deleted" && item.status !== "suspended");
}

function options(items: readonly TenantOptionItem[]): TenantOption[] {
  return items.map((item) => ({ label: item.name, value: item.id }));
}

export async function loadUserTenantOptions(source: UserTenantOptionSource): Promise<TenantOption[]> {
  if (!source.isPlatform) {
    return source.currentTenant && source.currentTenant.id > 0 ? options([source.currentTenant]) : [];
  }
  if (source.userId && allowed(source.permissions, tenantAccessCodes.listLoginTenants)) {
    const loginTenants = active(await source.listLoginTenants(source.userId));
    if (loginTenants.length > 0) return options(loginTenants);
  }
  const cached = active(source.tenants);
  if (cached.length > 0) return options(cached);
  if (!allowed(source.permissions, tenantAccessCodes.listPlatformTenants)) return [];
  return options(active(await source.listPlatformTenants()));
}
