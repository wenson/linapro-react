import { describe, expect, it, vi } from "vitest";

import { loadUserTenantOptions } from "#/features/iam/user/tenant-options";

describe("user tenant options", () => {
  it("uses only the current tenant outside platform context", async () => {
    const listLoginTenants = vi.fn(); const listPlatformTenants = vi.fn();
    await expect(loadUserTenantOptions({ currentTenant: { code: "a", id: 7, name: "Alpha" }, isPlatform: false, listLoginTenants, listPlatformTenants, permissions: ["*"], tenants: [] })).resolves.toEqual([{ label: "Alpha", value: 7 }]);
    expect(listLoginTenants).not.toHaveBeenCalled(); expect(listPlatformTenants).not.toHaveBeenCalled();
  });

  it("does not call restricted APIs without their permissions", async () => {
    const listLoginTenants = vi.fn(); const listPlatformTenants = vi.fn();
    await expect(loadUserTenantOptions({ isPlatform: true, listLoginTenants, listPlatformTenants, permissions: ["system:user:query"], tenants: [], userId: 1 })).resolves.toEqual([]);
    expect(listLoginTenants).not.toHaveBeenCalled(); expect(listPlatformTenants).not.toHaveBeenCalled();
  });

  it("prefers permitted login tenants and wildcard platform fallback", async () => {
    const listLoginTenants = vi.fn().mockResolvedValue([{ id: 9, name: "Nine", status: "active" }]);
    const listPlatformTenants = vi.fn().mockResolvedValue([{ id: 10, name: "Ten", status: "active" }]);
    await expect(loadUserTenantOptions({ isPlatform: true, listLoginTenants, listPlatformTenants, permissions: ["system:tenant:auth:login-tenants"], tenants: [], userId: 1 })).resolves.toEqual([{ label: "Nine", value: 9 }]);
    expect(listPlatformTenants).not.toHaveBeenCalled();
    await expect(loadUserTenantOptions({ isPlatform: true, listLoginTenants: vi.fn().mockResolvedValue([]), listPlatformTenants, permissions: ["*"], tenants: [] })).resolves.toEqual([{ label: "Ten", value: 10 }]);
  });
});
