import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { clearRuntimeCacheScope, scopedQueryKey } from "#/runtime/cache";

describe("runtime cache scopes", () => {
  it("clears only the selected tenant scope", async () => {
    const client = new QueryClient();
    const tenantA = { code: "tenant-a", type: "tenant" } as const;
    const tenantB = { code: "tenant-b", type: "tenant" } as const;
    const plugin = { generation: "g1", pluginId: "demo", type: "plugin" } as const;
    client.setQueryData(scopedQueryKey(tenantA, "users"), ["a"]);
    client.setQueryData(scopedQueryKey(tenantB, "users"), ["b"]);
    client.setQueryData(scopedQueryKey(plugin, "items"), ["plugin"]);

    await clearRuntimeCacheScope(client, tenantA);

    expect(client.getQueryData(scopedQueryKey(tenantA, "users"))).toBeUndefined();
    expect(client.getQueryData(scopedQueryKey(tenantB, "users"))).toEqual(["b"]);
    expect(client.getQueryData(scopedQueryKey(plugin, "items"))).toEqual(["plugin"]);
  });

  it("separates session and plugin generation scopes", async () => {
    const client = new QueryClient();
    const sessionA = { id: "session-a", type: "session" } as const;
    const sessionB = { id: "session-b", type: "session" } as const;
    const pluginG1 = { generation: "g1", pluginId: "demo", type: "plugin" } as const;
    const pluginG2 = { generation: "g2", pluginId: "demo", type: "plugin" } as const;
    client.setQueryData(scopedQueryKey(sessionA, "me"), "a");
    client.setQueryData(scopedQueryKey(sessionB, "me"), "b");
    client.setQueryData(scopedQueryKey(pluginG1, "items"), "g1");
    client.setQueryData(scopedQueryKey(pluginG2, "items"), "g2");

    await clearRuntimeCacheScope(client, pluginG1);
    await clearRuntimeCacheScope(client, sessionA);

    expect(client.getQueryData(scopedQueryKey(pluginG1, "items"))).toBeUndefined();
    expect(client.getQueryData(scopedQueryKey(pluginG2, "items"))).toBe("g2");
    expect(client.getQueryData(scopedQueryKey(sessionA, "me"))).toBeUndefined();
    expect(client.getQueryData(scopedQueryKey(sessionB, "me"))).toBe("b");
  });
});
