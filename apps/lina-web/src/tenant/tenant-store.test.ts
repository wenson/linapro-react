import { beforeEach, describe, expect, it } from "vitest";

import { createTenantStore, tenantStorageKey } from "#/tenant/tenant-store";

describe("tenant store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists the active tenant context without persisting candidate authorization data", () => {
    const store = createTenantStore({ storage: localStorage });
    store.getState().setContext({
      currentTenant: { code: "alpha", id: 1, name: "Alpha" },
      enabled: true,
      tenants: [
        { code: "alpha", id: 1, name: "Alpha" },
        { code: "beta", id: 2, name: "Beta" },
      ],
    });

    const persisted = JSON.parse(localStorage.getItem(tenantStorageKey) || "{}") as Record<
      string,
      unknown
    >;
    expect(persisted).toMatchObject({
      currentTenant: { code: "alpha", id: 1, name: "Alpha" },
      enabled: true,
    });
    expect(persisted).not.toHaveProperty("tenants");

    const restored = createTenantStore({ storage: localStorage });
    expect(restored.getState().currentTenant?.code).toBe("alpha");
    expect(restored.getState().tenants).toEqual([]);
  });

  it("tracks switching and clears every tenant projection on reset", () => {
    const store = createTenantStore({ storage: localStorage });
    store.getState().setContext({
      currentTenant: { code: "alpha", id: 1, name: "Alpha" },
      enabled: true,
      impersonation: { active: true, tenant: { code: "alpha", id: 1, name: "Alpha" } },
    });
    store.getState().startSwitch();
    expect(store.getState().switching).toBe(true);
    store.getState().finishSwitch();
    store.getState().reset();

    expect(store.getState()).toMatchObject({
      currentTenant: null,
      enabled: false,
      impersonation: { active: false },
      switching: false,
      tenants: [],
    });
    expect(localStorage.getItem(tenantStorageKey)).toBeNull();
  });
});
