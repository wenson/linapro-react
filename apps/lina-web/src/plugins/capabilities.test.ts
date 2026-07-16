import { describe, expect, it } from "vitest";

import type { PluginRuntimeState } from "#/api/plugins";
import {
  managementCapabilityKeys,
  projectManagementCapabilities,
} from "#/plugins/capabilities";

function plugin(id: string, enabled: number, runtimeState = "normal"): PluginRuntimeState {
  return {
    enabled,
    generation: 1,
    id,
    installed: 1,
    runtimeState,
    statusKey: `sys_plugin.status:${id}`,
    version: "v1.0.0",
  };
}

describe("management capability projection", () => {
  it("enables only capabilities backed by installed, enabled and normal providers", () => {
    const projection = projectManagementCapabilities(
      [plugin("linapro-org-core", 1), plugin("linapro-tenant-core", 0)],
      true,
    );

    expect(projection).toEqual({
      organizationEnabled: true,
      tenantEnabled: false,
    });
  });

  it("uses the tenant shell fallback only when no tenant provider is observed", () => {
    expect(projectManagementCapabilities([], true).tenantEnabled).toBe(true);
    expect(
      projectManagementCapabilities([plugin("linapro-tenant-core", 1, "failed")], true)
        .tenantEnabled,
    ).toBe(false);
  });

  it("publishes stable organization and tenant capability keys", () => {
    expect(managementCapabilityKeys).toEqual({
      organization: "organization.management",
      tenant: "tenant.management",
    });
  });
});
