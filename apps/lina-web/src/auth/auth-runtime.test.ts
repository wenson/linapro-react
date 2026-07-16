import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LoginTenant } from "#/api/auth";
import type { MenuRouteItem } from "#/api/menu";
import type { PluginRuntimeState } from "#/api/plugins";
import type { CurrentUser } from "#/api/user";
import { AuthRuntime } from "#/auth/auth-runtime";
import type { AuthRuntimeApis } from "#/auth/auth-runtime";
import { createSessionStore } from "#/auth/session-store";
import { createTenantStore } from "#/tenant/tenant-store";

const alpha: LoginTenant = { code: "alpha", id: 101, name: "Alpha" };
const beta: LoginTenant = { code: "beta", id: 102, name: "Beta" };
const user: CurrentUser = {
  avatar: "",
  email: "admin@example.com",
  homePath: "/system/user",
  menus: [],
  permissions: ["system:user:list"],
  realName: "Administrator",
  roles: ["admin"],
  userId: 1,
  username: "admin",
};
const menus: MenuRouteItem[] = [];
const plugins: PluginRuntimeState[] = [
  {
    enabled: 1,
    generation: 1,
    id: "linapro-tenant-core",
    installed: 1,
    runtimeState: "normal",
    statusKey: "sys_plugin.status:linapro-tenant-core",
    version: "v1.0.0",
  },
];

interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
}

function deferred<T>(): Deferred<T> {
  let resolvePromise: ((value: T) => void) | undefined;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });
  return {
    promise,
    resolve(value) {
      resolvePromise?.(value);
    },
  };
}

function createApis(): AuthRuntimeApis {
  return {
    auth: {
      login: vi.fn(async () => ({ accessToken: "access", refreshToken: "refresh" })),
      logout: vi.fn(async () => undefined),
      refresh: vi.fn(async () => ({ accessToken: "access-new", refreshToken: "refresh-new" })),
    },
    menu: { getAllMenus: vi.fn(async () => menus) },
    plugins: { getRuntimeStates: vi.fn(async () => plugins) },
    tenant: {
      endImpersonation: vi.fn(async () => undefined),
      impersonate: vi.fn(async (tenantId) => ({
        actingUserId: 1,
        isImpersonated: true,
        tenantId,
        token: "impersonation-token",
      })),
      listLoginTenants: vi.fn(async () => [alpha, beta]),
      selectTenant: vi.fn(async () => ({
        accessToken: "tenant-access",
        refreshToken: "tenant-refresh",
      })),
      switchTenant: vi.fn(async () => ({
        accessToken: "switched-access",
        refreshToken: "switched-refresh",
      })),
    },
    user: { getCurrentUser: vi.fn(async () => user) },
  };
}

function createHarness(apis = createApis()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
  });
  const sessionStore = createSessionStore({ storage: localStorage });
  const tenantStore = createTenantStore({ storage: localStorage });
  const runtime = new AuthRuntime({ apis, queryClient, sessionStore, tenantStore });
  return { apis, queryClient, runtime, sessionStore, tenantStore };
}

describe("AuthRuntime", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads user, menus and public plugin state in parallel before authentication completes", async () => {
    const userDeferred = deferred<CurrentUser>();
    const menuDeferred = deferred<MenuRouteItem[]>();
    const pluginDeferred = deferred<PluginRuntimeState[]>();
    const apis = createApis();
    vi.mocked(apis.user.getCurrentUser).mockReturnValue(userDeferred.promise);
    vi.mocked(apis.menu.getAllMenus).mockReturnValue(menuDeferred.promise);
    vi.mocked(apis.plugins.getRuntimeStates).mockReturnValue(pluginDeferred.promise);
    const { runtime, sessionStore } = createHarness(apis);

    const loginPromise = runtime.login({ password: "secret", username: "admin" });
    await vi.waitFor(() => {
      expect(apis.user.getCurrentUser).toHaveBeenCalledOnce();
      expect(apis.menu.getAllMenus).toHaveBeenCalledOnce();
      expect(apis.plugins.getRuntimeStates).toHaveBeenCalledOnce();
    });
    expect(sessionStore.getState().status).toBe("authenticating");

    userDeferred.resolve(user);
    menuDeferred.resolve(menus);
    pluginDeferred.resolve(plugins);
    await expect(loginPromise).resolves.toMatchObject({ requiresTenantSelection: false });
    expect(sessionStore.getState()).toMatchObject({
      accessToken: "access",
      refreshToken: "refresh",
      status: "authenticated",
    });
  });

  it("keeps a preToken in memory and completes the explicit multi-tenant selection flow", async () => {
    const apis = createApis();
    vi.mocked(apis.auth.login).mockResolvedValue({
      preToken: "pre-token",
      tenants: [alpha, beta],
    });
    const { runtime, sessionStore, tenantStore } = createHarness(apis);

    await expect(runtime.login({ password: "secret", username: "tenant-user" })).resolves.toEqual({
      requiresTenantSelection: true,
      tenants: [alpha, beta],
    });
    expect(sessionStore.getState()).toMatchObject({
      accessToken: null,
      pendingPreToken: "pre-token",
      status: "selecting-tenant",
    });
    expect(tenantStore.getState().tenants).toEqual([alpha, beta]);

    await runtime.selectTenant(beta.id);
    expect(apis.tenant.selectTenant).toHaveBeenCalledWith("pre-token", beta.id);
    expect(sessionStore.getState()).toMatchObject({
      accessToken: "tenant-access",
      pendingPreToken: null,
      status: "authenticated",
    });
    expect(tenantStore.getState().currentTenant).toEqual(beta);
  });

  it("clears every local authorization projection when login context loading fails", async () => {
    const apis = createApis();
    vi.mocked(apis.user.getCurrentUser).mockRejectedValue(new Error("user unavailable"));
    const { queryClient, runtime, sessionStore, tenantStore } = createHarness(apis);
    queryClient.setQueryData(["unrelated"], "stale");

    await expect(runtime.login({ password: "bad", username: "admin" })).rejects.toThrow(
      "user unavailable",
    );
    expect(sessionStore.getState().status).toBe("anonymous");
    expect(tenantStore.getState().currentTenant).toBeNull();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it("rehydrates non-persisted tenant candidates while restoring a session", async () => {
    const apis = createApis();
    const tenantReader = {
      ...user,
      permissions: [...user.permissions, "system:tenant:auth:login-tenants"],
    };
    vi.mocked(apis.user.getCurrentUser).mockResolvedValue(tenantReader);
    const { runtime, sessionStore, tenantStore } = createHarness(apis);
    sessionStore.getState().commitTokens({ accessToken: "restored-access" });

    await expect(runtime.restoreSession()).resolves.toMatchObject({ user: tenantReader });

    expect(apis.tenant.listLoginTenants).toHaveBeenCalledWith(user.userId);
    expect(tenantStore.getState()).toMatchObject({
      enabled: true,
      tenants: [alpha, beta],
    });
  });

  it("does not request tenant candidates without permission while restoring a tenant session", async () => {
    const apis = createApis();
    const { runtime, sessionStore, tenantStore } = createHarness(apis);
    sessionStore.getState().commitTokens({ accessToken: "restored-access" });
    tenantStore.getState().setContext({ currentTenant: alpha, enabled: true });

    await expect(runtime.restoreSession()).resolves.toMatchObject({ user });

    expect(apis.tenant.listLoginTenants).not.toHaveBeenCalled();
    expect(tenantStore.getState()).toMatchObject({
      currentTenant: alpha,
      enabled: true,
      tenants: [alpha],
    });
  });

  it("cancels old tenant queries, commits the new token and tenant, then refreshes all context", async () => {
    const apis = createApis();
    const { queryClient, runtime, sessionStore, tenantStore } = createHarness(apis);
    sessionStore.getState().commitTokens({ accessToken: "old-access", refreshToken: "old-refresh" });
    sessionStore.getState().completeAuthentication();
    tenantStore.getState().setContext({
      currentTenant: alpha,
      enabled: true,
      tenants: [alpha, beta],
    });
    queryClient.setQueryData(["runtime", "auth-context", "alpha", "user"], user);
    const order: string[] = [];
    const originalCancel = queryClient.cancelQueries.bind(queryClient);
    vi.spyOn(queryClient, "cancelQueries").mockImplementation(async (filters) => {
      order.push("cancel");
      return await originalCancel(filters);
    });
    vi.mocked(apis.tenant.switchTenant).mockImplementation(async () => {
      order.push("switch-api");
      return { accessToken: "switched-access", refreshToken: "switched-refresh" };
    });
    const clearTabs = vi.fn();
    const refreshDictionaries = vi.fn();
    const refreshMessages = vi.fn();
    const resetDefaultRoute = vi.fn();
    runtime.setTransitionEffects({
      clearTabs,
      refreshDictionaries,
      refreshMessages,
      resetDefaultRoute,
    });
    vi.mocked(apis.user.getCurrentUser).mockImplementation(async () => {
      expect(sessionStore.getState().accessToken).toBe("switched-access");
      expect(tenantStore.getState().currentTenant).toEqual(beta);
      return user;
    });

    await runtime.switchTenant(beta.id);

    expect(order.slice(0, 2)).toEqual(["cancel", "switch-api"]);
    expect(sessionStore.getState()).toMatchObject({
      accessToken: "switched-access",
      refreshToken: "switched-refresh",
      status: "authenticated",
    });
    expect(tenantStore.getState().currentTenant).toEqual(beta);
    expect(queryClient.getQueryData(["runtime", "auth-context", "alpha", "user"])).toBeUndefined();
    expect(clearTabs).toHaveBeenCalledOnce();
    expect(refreshDictionaries).toHaveBeenCalledOnce();
    expect(refreshMessages).toHaveBeenCalledOnce();
    expect(resetDefaultRoute).toHaveBeenCalledWith("/system/user");
  });

  it("persists the original platform tokens during impersonation and restores them on exit", async () => {
    const apis = createApis();
    const { runtime, sessionStore, tenantStore } = createHarness(apis);
    sessionStore.getState().commitTokens({
      accessToken: "platform-access",
      refreshToken: "platform-refresh",
    });
    sessionStore.getState().completeAuthentication();
    tenantStore.getState().setContext({ enabled: true, tenants: [alpha] });

    await runtime.impersonate(alpha, "Support request");
    expect(apis.tenant.impersonate).toHaveBeenCalledWith(alpha.id, "Support request");
    expect(sessionStore.getState()).toMatchObject({
      accessToken: "impersonation-token",
      impersonationRecovery: {
        accessToken: "platform-access",
        refreshToken: "platform-refresh",
      },
      refreshToken: null,
    });
    expect(tenantStore.getState().impersonation).toMatchObject({ active: true, tenant: alpha });

    await runtime.exitImpersonation();
    expect(apis.tenant.endImpersonation).toHaveBeenCalledWith(alpha.id);
    expect(sessionStore.getState()).toMatchObject({
      accessToken: "platform-access",
      impersonationRecovery: null,
      refreshToken: "platform-refresh",
    });
    expect(tenantStore.getState()).toMatchObject({
      currentTenant: null,
      impersonation: { active: false },
    });
  });

  it("clears tokens, tenant context and query data even when server logout fails", async () => {
    const apis = createApis();
    vi.mocked(apis.auth.logout).mockRejectedValue(new Error("offline"));
    const { queryClient, runtime, sessionStore, tenantStore } = createHarness(apis);
    sessionStore.getState().commitTokens({ accessToken: "access", refreshToken: "refresh" });
    tenantStore.getState().setContext({ currentTenant: alpha, enabled: true });
    queryClient.setQueryData(["private"], "value");

    await expect(runtime.logout()).resolves.toBeUndefined();
    expect(sessionStore.getState().status).toBe("anonymous");
    expect(tenantStore.getState().currentTenant).toBeNull();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
});
