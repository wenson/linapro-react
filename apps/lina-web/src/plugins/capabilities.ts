import type { PluginRuntimeState } from "#/api/plugins";

export const managementCapabilityKeys = {
  organization: "organization.management",
  tenant: "tenant.management",
} as const;

export type ManagementCapability =
  (typeof managementCapabilityKeys)[keyof typeof managementCapabilityKeys];

export interface PluginCapabilityDeclaration {
  capabilities: readonly ManagementCapability[];
  pluginId: string;
}

export interface CapabilityProjection {
  organizationEnabled: boolean;
  tenantEnabled: boolean;
}

export const builtInManagementCapabilityDeclarations: readonly PluginCapabilityDeclaration[] = [
  {
    capabilities: [managementCapabilityKeys.organization],
    pluginId: "linapro-org-core",
  },
  {
    capabilities: [managementCapabilityKeys.tenant],
    pluginId: "linapro-tenant-core",
  },
];

function isEnabled(state: PluginRuntimeState | undefined): boolean {
  return (
    state?.installed === 1 &&
    state.enabled === 1 &&
    (!state.runtimeState || state.runtimeState === "normal")
  );
}

export function projectManagementCapabilities(
  pluginStates: readonly PluginRuntimeState[],
  tenantContextEnabled: boolean,
  declarations: readonly PluginCapabilityDeclaration[] = builtInManagementCapabilityDeclarations,
): CapabilityProjection {
  const stateByPlugin = new Map(pluginStates.map((state) => [state.id, state]));
  const enabledCapabilities = new Set<ManagementCapability>();
  const observedCapabilities = new Set<ManagementCapability>();

  for (const declaration of declarations) {
    const state = stateByPlugin.get(declaration.pluginId);
    if (state) {
      for (const capability of declaration.capabilities) {
        observedCapabilities.add(capability);
      }
    }
    if (!isEnabled(state)) {
      continue;
    }
    for (const capability of declaration.capabilities) {
      enabledCapabilities.add(capability);
    }
  }

  return {
    organizationEnabled: enabledCapabilities.has(managementCapabilityKeys.organization),
    tenantEnabled: observedCapabilities.has(managementCapabilityKeys.tenant)
      ? enabledCapabilities.has(managementCapabilityKeys.tenant)
      : tenantContextEnabled,
  };
}

export function hasManagementCapability(
  projection: CapabilityProjection,
  capability: ManagementCapability,
): boolean {
  return capability === managementCapabilityKeys.organization
    ? projection.organizationEnabled
    : projection.tenantEnabled;
}
