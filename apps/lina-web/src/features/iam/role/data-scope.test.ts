import { describe, expect, it } from "vitest";

import { dataScopes, getDataScopeOptions, normalizeDataScope } from "#/features/iam/role/data-scope";

describe("role data scope projection", () => {
  it("removes tenant and department scopes with deterministic fallbacks", () => {
    const capabilities = { organizationEnabled: false, tenantEnabled: false };
    expect(getDataScopeOptions(capabilities).map((item) => item.value)).toEqual([dataScopes.all, dataScopes.self]);
    expect(normalizeDataScope(dataScopes.tenant, capabilities)).toBe(dataScopes.all);
    expect(normalizeDataScope(dataScopes.dept, capabilities)).toBe(dataScopes.self);
  });

  it("keeps every backend scope when both capabilities are enabled", () => {
    const capabilities = { organizationEnabled: true, tenantEnabled: true };
    expect(getDataScopeOptions(capabilities).map((item) => item.value)).toEqual([1, 2, 3, 4]);
  });
});
