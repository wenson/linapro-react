import { describe, expect, it, vi } from "vitest";

import { createAuthApi } from "#/api/auth";
import type { ApiClient } from "#/api/client";
import { createMenuApi } from "#/api/menu";
import { createPluginRuntimeApi } from "#/api/plugins";
import { createTenantApi } from "#/api/tenant";
import { createUserApi } from "#/api/user";

function createClientMock() {
  const get = vi.fn();
  const post = vi.fn();
  return {
    client: { get, post } as unknown as ApiClient,
    get,
    post,
  };
}

describe("LinaPro platform API projections", () => {
  it("uses the existing authentication endpoints and web client type", async () => {
    const { client, post } = createClientMock();
    post.mockResolvedValue({ accessToken: "access", refreshToken: "refresh" });
    const api = createAuthApi(client);

    await api.login({ password: "secret", username: "admin" });
    await api.refresh({ refreshToken: "refresh" });
    await api.logout();

    expect(post).toHaveBeenNthCalledWith(1, "auth/login", {
      clientType: "web",
      password: "secret",
      username: "admin",
    });
    expect(post).toHaveBeenNthCalledWith(2, "auth/refresh", { refreshToken: "refresh" });
    expect(post).toHaveBeenNthCalledWith(3, "auth/logout");
  });

  it("projects the current user, menu and public plugin state responses", async () => {
    const { client, get } = createClientMock();
    get
      .mockResolvedValueOnce({ userId: 1 })
      .mockResolvedValueOnce({ list: [{ id: 2, path: "/system" }] })
      .mockResolvedValueOnce({ list: [{ enabled: 1, id: "linapro-org-core" }] });

    await createUserApi(client).getCurrentUser();
    await expect(createMenuApi(client).getAllMenus()).resolves.toEqual([
      { id: 2, path: "/system" },
    ]);
    await expect(createPluginRuntimeApi(client).getRuntimeStates()).resolves.toEqual([
      { enabled: 1, id: "linapro-org-core" },
    ]);

    expect(get).toHaveBeenNthCalledWith(1, "user/info");
    expect(get).toHaveBeenNthCalledWith(2, "menus/all");
    expect(get).toHaveBeenNthCalledWith(3, "plugins/dynamic");
  });

  it("uses the tenant plugin API for candidates, selection, switching and impersonation", async () => {
    const { client, get, post } = createClientMock();
    get.mockResolvedValue({ list: [{ code: "alpha", id: 7, name: "Alpha" }] });
    post.mockResolvedValue({ accessToken: "tenant-access" });
    const api = createTenantApi(client);

    await api.listLoginTenants(9);
    await api.selectTenant("pre-token", 7);
    await api.switchTenant(7);
    await api.impersonate(7, "Support request");
    await api.endImpersonation(7);

    expect(get).toHaveBeenCalledWith(
      "/x/linapro-tenant-core/api/v1/auth/login-tenants",
      { query: { userId: 9 } },
    );
    expect(post).toHaveBeenNthCalledWith(
      1,
      "/x/linapro-tenant-core/api/v1/auth/select-tenant",
      { preToken: "pre-token", tenantId: 7 },
    );
    expect(post).toHaveBeenNthCalledWith(
      2,
      "/x/linapro-tenant-core/api/v1/auth/switch-tenant",
      { tenantId: 7 },
    );
    expect(post).toHaveBeenNthCalledWith(
      3,
      "/x/linapro-tenant-core/api/v1/platform/tenants/7/impersonate",
      { reason: "Support request" },
    );
    expect(post).toHaveBeenNthCalledWith(
      4,
      "/x/linapro-tenant-core/api/v1/platform/tenants/7/end-impersonate",
    );
  });
});
