import { beforeEach, describe, expect, it } from "vitest";

import { createSessionStore, sessionStorageKey } from "#/auth/session-store";

describe("session store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("moves through authentication, tenant selection, authenticated and refresh states", () => {
    const store = createSessionStore({ storage: localStorage });

    expect(store.getState().status).toBe("anonymous");
    store.getState().beginAuthentication();
    expect(store.getState().status).toBe("authenticating");
    store.getState().requireTenantSelection("pre-token");
    expect(store.getState()).toMatchObject({
      pendingPreToken: "pre-token",
      status: "selecting-tenant",
    });
    store.getState().commitTokens({ accessToken: "access", refreshToken: "refresh" });
    store.getState().completeAuthentication();
    expect(store.getState().status).toBe("authenticated");
    store.getState().beginRefresh();
    expect(store.getState().status).toBe("refreshing");
    store.getState().completeAuthentication();
    expect(store.getState().status).toBe("authenticated");
  });

  it("persists only tokens and impersonation recovery, never authorization facts", () => {
    const store = createSessionStore({ storage: localStorage });
    store.getState().requireTenantSelection("short-lived-pre-token");
    store.getState().commitTokens({ accessToken: "access", refreshToken: "refresh" });
    store.getState().setImpersonationRecovery({
      accessToken: "platform-access",
      refreshToken: "platform-refresh",
    });

    const persisted = JSON.parse(localStorage.getItem(sessionStorageKey) || "{}") as Record<
      string,
      unknown
    >;
    expect(Object.keys(persisted).sort()).toEqual([
      "accessToken",
      "impersonationRecovery",
      "refreshToken",
    ]);
    expect(JSON.stringify(persisted)).not.toMatch(/menu|permission|plugin|preToken|status|user/i);

    const restored = createSessionStore({ storage: localStorage });
    expect(restored.getState()).toMatchObject({
      accessToken: "access",
      impersonationRecovery: {
        accessToken: "platform-access",
        refreshToken: "platform-refresh",
      },
      pendingPreToken: null,
      refreshToken: "refresh",
      status: "authenticating",
    });
  });

  it("fails closed when storage is malformed and removes persistence on logout", () => {
    localStorage.setItem(sessionStorageKey, "not-json");
    const store = createSessionStore({ storage: localStorage });
    expect(store.getState().status).toBe("anonymous");

    store.getState().commitTokens({ accessToken: "access", refreshToken: "refresh" });
    store.getState().clearSession();
    expect(localStorage.getItem(sessionStorageKey)).toBeNull();
  });
});
