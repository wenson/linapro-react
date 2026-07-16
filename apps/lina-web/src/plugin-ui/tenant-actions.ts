export interface PluginTenantTarget {
  code: string;
  id: number;
  name: string;
  status?: string;
}

interface PluginTenantActionHandlers {
  exitImpersonation(): Promise<void>;
  impersonate(tenant: PluginTenantTarget, reason?: string): Promise<void>;
  switchTenant(tenantId: number): Promise<void>;
}

let activeHandlers: PluginTenantActionHandlers | null = null;

export function installPluginTenantActions(handlers: PluginTenantActionHandlers): () => void {
  activeHandlers = handlers;
  return () => {
    if (activeHandlers === handlers) activeHandlers = null;
  };
}

function handlers(): PluginTenantActionHandlers {
  if (!activeHandlers) throw new Error("Tenant actions are unavailable outside the authenticated LinaPro workbench");
  return activeHandlers;
}

export async function requestTenantSwitch(tenantId: number): Promise<void> {
  if (!Number.isSafeInteger(tenantId) || tenantId <= 0) throw new RangeError("A valid tenant ID is required");
  await handlers().switchTenant(tenantId);
}

export async function requestTenantImpersonation(tenant: PluginTenantTarget, reason?: string): Promise<void> {
  if (!Number.isSafeInteger(tenant.id) || tenant.id <= 0 || !tenant.code.trim() || !tenant.name.trim()) {
    throw new RangeError("A valid tenant projection is required");
  }
  await handlers().impersonate(Object.freeze({ ...tenant }), reason?.trim() || undefined);
}

export async function requestTenantImpersonationExit(): Promise<void> {
  await handlers().exitImpersonation();
}
