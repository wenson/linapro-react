import { describe, expect, it, vi } from "vitest";

import {
  installPluginTenantActions,
  requestTenantImpersonation,
  requestTenantImpersonationExit,
  requestTenantSwitch,
} from "#/plugin-ui/tenant-actions";

describe("source-plugin tenant action channel", () => {
  it("delegates only high-level tenant projections and releases the active host", async () => {
    const handlers = { exitImpersonation: vi.fn().mockResolvedValue(undefined), impersonate: vi.fn().mockResolvedValue(undefined), switchTenant: vi.fn().mockResolvedValue(undefined) };
    const dispose = installPluginTenantActions(handlers);
    await requestTenantSwitch(7);
    await requestTenantImpersonation({ code: "alpha", id: 7, name: "Alpha" }, " support ");
    await requestTenantImpersonationExit();
    expect(handlers.switchTenant).toHaveBeenCalledWith(7);
    expect(handlers.impersonate).toHaveBeenCalledWith({ code: "alpha", id: 7, name: "Alpha" }, "support");
    expect(handlers.exitImpersonation).toHaveBeenCalledOnce();
    dispose();
    await expect(requestTenantSwitch(7)).rejects.toThrow(/unavailable/i);
  });

  it("rejects invalid tenant projections before invoking the host", async () => {
    await expect(requestTenantSwitch(0)).rejects.toThrow(/valid tenant id/i);
    await expect(requestTenantImpersonation({ code: "", id: 1, name: "Alpha" })).rejects.toThrow(/valid tenant projection/i);
  });
});
