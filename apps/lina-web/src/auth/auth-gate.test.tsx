import { QueryClient } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { vi } from "vitest";

import type { AuthRuntimeApis } from "#/auth/auth-runtime";
import { AuthRuntime } from "#/auth/auth-runtime";
import { AuthGate } from "#/auth/auth-gate";
import { createSessionStore } from "#/auth/session-store";
import { Providers } from "#/app/providers";
import { createTenantStore } from "#/tenant/tenant-store";

function createHarness() {
  const apis: AuthRuntimeApis = {
    auth: { login: vi.fn(), logout: vi.fn(), refresh: vi.fn() },
    menu: { getAllMenus: vi.fn(async () => []) },
    plugins: { getRuntimeStates: vi.fn(async () => []) },
    tenant: {
      endImpersonation: vi.fn(),
      impersonate: vi.fn(),
      listLoginTenants: vi.fn(),
      selectTenant: vi.fn(),
      switchTenant: vi.fn(),
    },
    user: {
      getCurrentUser: vi.fn(async () => ({
        avatar: "",
        email: "admin@example.com",
        homePath: "/private",
        menus: [],
        permissions: [],
        realName: "Administrator",
        roles: [],
        userId: 1,
        username: "admin",
      })),
    },
  };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const sessionStore = createSessionStore({ storage: null });
  const tenantStore = createTenantStore({ storage: null });
  const runtime = new AuthRuntime({ apis, queryClient, sessionStore, tenantStore });
  return { queryClient, runtime, sessionStore, tenantStore };
}

function renderRoutes(runtime: AuthRuntime, queryClient: QueryClient, initialPath: string) {
  const props = {
    appName: "LinaPro",
    logoUrl: "/logo.webp",
    runtime,
  };
  const router = createMemoryRouter(
    [
      {
        element: <AuthGate {...props} loginOnly />,
        path: "/auth/login",
      },
      {
        element: (
          <AuthGate {...props}>
            <div>Private workspace</div>
          </AuthGate>
        ),
        path: "/private",
      },
    ],
    { initialEntries: [initialPath] },
  );
  render(
    <Providers queryClient={queryClient}>
      <RouterProvider router={router} />
    </Providers>,
  );
  return router;
}

describe("AuthGate", () => {
  it("redirects an anonymous protected route to the LinaPro login page", async () => {
    const { queryClient, runtime } = createHarness();
    const router = renderRoutes(runtime, queryClient, "/private?tab=security");

    expect(await screen.findByTestId("login-form")).toBeVisible();
    expect(router.state.location.pathname).toBe("/auth/login");
    expect(router.state.location.search).toContain("redirect=");
  });

  it("renders protected content only after server-owned context is loaded", async () => {
    const { queryClient, runtime, sessionStore } = createHarness();
    sessionStore.getState().commitTokens({ accessToken: "access", refreshToken: "refresh" });
    sessionStore.getState().completeAuthentication();
    renderRoutes(runtime, queryClient, "/private");

    expect(await screen.findByText("Private workspace")).toBeVisible();
  });

  it("uses the user's home path instead of the application root after root redirect login", async () => {
    const { queryClient, runtime, sessionStore } = createHarness();
    sessionStore.getState().commitTokens({ accessToken: "access", refreshToken: "refresh" });
    sessionStore.getState().completeAuthentication();
    const router = renderRoutes(runtime, queryClient, "/auth/login?redirect=%2F");

    expect(await screen.findByText("Private workspace")).toBeVisible();
    expect(router.state.location.pathname).toBe("/private");
  });

  it("keeps the stable tenant transition surface mounted during tenant selection", async () => {
    const { queryClient, runtime, sessionStore, tenantStore } = createHarness();
    renderRoutes(runtime, queryClient, "/auth/login");
    act(() => {
      tenantStore.getState().setContext({
        enabled: true,
        tenants: [{ code: "alpha", id: 1, name: "Alpha" }],
      });
      sessionStore.getState().requireTenantSelection("pre-token");
    });
    expect(await screen.findByTestId("login-tenant-selector")).toBeVisible();

    act(() => {
      tenantStore.getState().startSwitch();
      sessionStore.getState().beginAuthentication();
    });
    expect(await screen.findByTestId("login-tenant-transition")).toBeVisible();
  });
});
