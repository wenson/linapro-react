import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { ApiClient } from "#/api/client";
import { createApiSessionAdapter } from "#/auth/session-adapter";
import { createSessionStore } from "#/auth/session-store";
import { createTenantStore } from "#/tenant/tenant-store";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

describe("API session adapter", () => {
  it("reads the current token and tenant together for every request", async () => {
    const queryClient = new QueryClient();
    const sessionStore = createSessionStore({ storage: null });
    const tenantStore = createTenantStore({ storage: null });
    const adapter = createApiSessionAdapter({ queryClient, sessionStore, tenantStore });
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse({ code: 0, data: {} }));
    const client = new ApiClient({ fetch: fetchMock, session: adapter });

    adapter.commitContext(
      { accessToken: "beta-access", refreshToken: "refresh" },
      { code: "beta", id: 2, name: "Beta" },
    );
    sessionStore.getState().completeAuthentication();
    await client.get("user/info");

    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    expect(headers.get("Authorization")).toBe("Bearer beta-access");
    expect(headers.get("X-Tenant-Code")).toBe("beta");
  });

  it("publishes a new token and X-Tenant-Code snapshot before store subscribers can request", () => {
    const queryClient = new QueryClient();
    const sessionStore = createSessionStore({ storage: null });
    const tenantStore = createTenantStore({ storage: null });
    const adapter = createApiSessionAdapter({ queryClient, sessionStore, tenantStore });
    const observed: Array<[null | string, null | string]> = [];
    tenantStore.subscribe(() => {
      observed.push([adapter.getAccessToken(), adapter.getTenantCode()]);
    });

    adapter.commitContext(
      { accessToken: "beta-access", refreshToken: "beta-refresh" },
      { code: "beta", id: 2, name: "Beta" },
    );

    expect(observed).toEqual([["beta-access", "beta"]]);
  });

  it("moves to refreshing and clears all context when refresh fails", async () => {
    const queryClient = new QueryClient();
    const sessionStore = createSessionStore({ storage: null });
    const tenantStore = createTenantStore({ storage: null });
    sessionStore.getState().commitTokens({ accessToken: "expired", refreshToken: "rejected" });
    sessionStore.getState().completeAuthentication();
    tenantStore.getState().setContext({
      currentTenant: { code: "alpha", id: 1, name: "Alpha" },
      enabled: true,
    });
    queryClient.setQueryData(["private"], "stale");
    const observedStatuses: string[] = [];
    sessionStore.subscribe((state) => observedStatuses.push(state.status));
    const adapter = createApiSessionAdapter({ queryClient, sessionStore, tenantStore });
    const client = new ApiClient({
      fetch: vi.fn(async () => jsonResponse({ code: 401, error: "Rejected" }, 401)),
      session: adapter,
    });

    await expect(client.get("protected")).rejects.toThrow("Rejected");

    expect(observedStatuses).toContain("refreshing");
    expect(sessionStore.getState().status).toBe("anonymous");
    expect(sessionStore.getState().authNotice).toBe("session-expired");
    expect(tenantStore.getState().currentTenant).toBeNull();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
});
