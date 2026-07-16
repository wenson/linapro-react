import type { CapabilityProjection } from "#/plugins/capabilities";

export const dataScopes = { all: 1, tenant: 2, dept: 3, self: 4 } as const;

export interface DataScopeOption { labelKey: string; value: number }

export function getDataScopeOptions(capabilities: CapabilityProjection): DataScopeOption[] {
  const values: DataScopeOption[] = [
    { labelKey: "pages.iam.role.dataScope.all", value: dataScopes.all },
    { labelKey: "pages.iam.role.dataScope.tenant", value: dataScopes.tenant },
    { labelKey: "pages.iam.role.dataScope.dept", value: dataScopes.dept },
    { labelKey: "pages.iam.role.dataScope.self", value: dataScopes.self },
  ];
  return values.filter((item) =>
    (item.value !== dataScopes.tenant || capabilities.tenantEnabled) &&
    (item.value !== dataScopes.dept || capabilities.organizationEnabled));
}

export function getDefaultDataScope(capabilities: CapabilityProjection): number {
  return capabilities.tenantEnabled ? dataScopes.tenant : dataScopes.all;
}

export function normalizeDataScope(value: number | undefined, capabilities: CapabilityProjection): number {
  if (!capabilities.tenantEnabled && value === dataScopes.tenant) return dataScopes.all;
  if (!capabilities.organizationEnabled && value === dataScopes.dept) return dataScopes.self;
  const allowed = new Set(getDataScopeOptions(capabilities).map((item) => item.value));
  return value && allowed.has(value) ? value : getDefaultDataScope(capabilities);
}
