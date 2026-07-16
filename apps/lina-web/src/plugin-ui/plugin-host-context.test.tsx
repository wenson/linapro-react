import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";

import { ApiClient } from "#/api/client";
import {
  createPluginHostApi,
  createReadonlyPermissionSet,
  useLinaPluginHost,
  type PluginHostContextValue,
} from "#/plugin-ui/plugin-host-context";
import { LinaPluginHostProvider } from "#/plugin-ui/plugin-host-provider";

describe("plugin host context", () => {
  it("publishes only the stable host projection", () => {
    const value: PluginHostContextValue = {
      api: { plugin: vi.fn(), pluginBlob: vi.fn(), request: vi.fn(), requestBlob: vi.fn() },
      locale: "en-US",
      permissions: new Set(["records.read"]),
      t: (key) => key,
      tenant: { code: "demo", id: 2, name: "Demo" },
      user: { id: 1, name: "Lina" },
    };
    const wrapper = ({ children }: PropsWithChildren) => (
      <LinaPluginHostProvider value={value}>{children}</LinaPluginHostProvider>
    );
    const { result } = renderHook(useLinaPluginHost, { wrapper });
    expect(Object.keys(result.current).sort()).toEqual([
      "api",
      "locale",
      "permissions",
      "t",
      "tenant",
      "user",
    ]);
    expect(result.current).not.toHaveProperty("token");
    expect(result.current).not.toHaveProperty("queryClient");
    expect(result.current).not.toHaveProperty("store");
  });

  it("exposes permissions without a mutable Set surface", () => {
    const permissions = createReadonlyPermissionSet(["records.read"]);
    expect(permissions.has("records.read")).toBe(true);
    expect(permissions).not.toHaveProperty("add");
    expect(permissions).not.toHaveProperty("delete");
    expect(permissions).not.toHaveProperty("clear");
  });

  it("routes plugin requests through the governed plugin API path", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ code: 0, data: { ok: true } }), {
      headers: { "content-type": "application/json" },
      status: 200,
    }));
    const api = createPluginHostApi(new ApiClient({ fetch }));
    await expect(api.plugin("acme-records-source", "records/1")).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(
      "/x/acme-records-source/api/v1/records/1",
      expect.objectContaining({ credentials: "same-origin" }),
    );
    const blob = await api.pluginBlob("acme-records-source", "records/1/attachment");
    await expect(blob.text()).resolves.toContain('"ok":true');
    expect(fetch).toHaveBeenLastCalledWith(
      "/x/acme-records-source/api/v1/records/1/attachment",
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });
});
