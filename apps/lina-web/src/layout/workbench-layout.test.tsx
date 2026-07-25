import { QueryClient } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createInstance } from "i18next";
import { isValidElement, useState } from "react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { beforeAll, beforeEach, expect, it, vi } from "vitest";

import type { AuthRuntimeApis } from "#/auth/auth-runtime";
import { AuthRuntime } from "#/auth/auth-runtime";
import { AuthContextProvider } from "#/auth/auth-context-provider";
import { createSessionStore } from "#/auth/session-store";
import { Providers } from "#/app/providers";
import enMessages from "#/locales/en-US/app.json";
import { workbenchIcon } from "#/layout/icon-map";
import { tabStore } from "#/layout/tab-store";
import { WorkbenchLayout } from "#/layout/workbench-layout";
import { TabStrip } from "#/layout/tab-strip";
import { createTenantStore } from "#/tenant/tenant-store";

const i18n = createInstance();

beforeAll(async () => {
  await i18n.init({ lng: "en-US", resources: { "en-US": { translation: enMessages } } });
});

beforeEach(() => tabStore.getState().clear());

it("keeps tabs single-line semantic controls and restores focus after closing the active tab", async () => {
  const navigate = vi.fn();
  tabStore.getState().open({ path: "/first", query: "", title: "A deliberately long first tab title" });
  tabStore.getState().open({ path: "/second", query: "", title: "Second" });
  render(
    <Providers i18n={i18n}>
      <TabStrip activePath="/second" onNavigate={navigate} />
    </Providers>,
  );

  const active = screen.getByRole("button", { name: "Second" });
  expect(active).toHaveAttribute("aria-current", "page");
  expect(screen.getByTestId("workbench-tabs")).toHaveAccessibleName("Open pages");
  fireEvent.click(screen.getByRole("button", { name: "Close Second" }));
  expect(navigate).toHaveBeenCalledWith("/first");
  await new Promise((resolve) => window.requestAnimationFrame(resolve));
  expect(screen.getByRole("button", { name: "A deliberately long first tab title" })).toHaveFocus();
});

it("renders the desktop shell, mobile SideSheet trigger, header regions and metadata tabs", async () => {
  const apis = {
    auth: { login: vi.fn(), logout: vi.fn(), refresh: vi.fn() },
    menu: { getAllMenus: vi.fn() },
    plugins: { getRuntimeStates: vi.fn() },
    tenant: {
      endImpersonation: vi.fn(), impersonate: vi.fn(), listLoginTenants: vi.fn(),
      selectTenant: vi.fn(), switchTenant: vi.fn(),
    },
    user: { getCurrentUser: vi.fn() },
  } satisfies AuthRuntimeApis;
  const sessionStore = createSessionStore({ storage: null });
  const tenantStore = createTenantStore({ storage: null });
  tenantStore.getState().setContext({
    currentTenant: { code: "alpha", id: 1, name: "Alpha" },
    enabled: true,
    tenants: [
      { code: "alpha", id: 1, name: "Alpha" },
      { code: "beta", id: 2, name: "Beta" },
    ],
  });
  const runtime = new AuthRuntime({
    apis,
    queryClient: new QueryClient(),
    sessionStore,
    tenantStore,
  });
  const context = {
    capabilities: { organizationEnabled: true, tenantEnabled: true },
    menus: [], plugins: [],
    user: {
      avatar: "", email: "a@example.com", homePath: "/dashboard", menus: [],
      permissions: [], realName: "Admin", roles: [], userId: 1, username: "admin",
    },
  };
  const routes = [{
    children: [], componentKey: "dashboard", hidden: false, hideInBreadcrumb: false,
    hideInTab: false, id: 1, keepAlive: false, name: "Dashboard", path: "/dashboard",
    query: {}, title: "Dashboard",
  }];

  function TenantBoundDashboard() {
    const [count, setCount] = useState(0);
    return <div>
      <span>Tenant-bound count: {count}</span>
      <button onClick={() => setCount((value) => value + 1)} type="button">Increment tenant-bound state</button>
    </div>;
  }

  render(
    <Providers i18n={i18n}>
      <AuthContextProvider value={context}>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <WorkbenchLayout
            appName="LinaPro"
            defaultAvatarUrl="/avatar.webp"
            registry={{ dashboard: { component: TenantBoundDashboard, surface: "page" } }}
            logoUrl="/logo.webp"
            routes={routes}
            runtime={runtime}
          />
        </MemoryRouter>
      </AuthContextProvider>
    </Providers>,
  );

  expect(screen.getByText("Tenant-bound count: 0")).toBeVisible();
  expect(screen.getByTestId("layout-header-plugin-slots-before")).toBeInTheDocument();
  expect(screen.getByTestId("layout-header-plugin-slots")).toBeInTheDocument();
  expect(screen.getByLabelText("User menu")).toBeVisible();
  fireEvent.click(screen.getByLabelText("User menu"));
  expect(await screen.findByTestId("layout-user-dropdown-menu")).toBeInTheDocument();
  expect(screen.getByTestId("layout-user-dropdown-name")).toHaveTextContent("Admin");
  expect(screen.getByTestId("layout-user-dropdown-tag")).toHaveTextContent("@admin");
  expect(screen.getByTestId("layout-user-dropdown-description")).toHaveTextContent("a@example.com");
  expect(screen.getByRole("combobox", { name: "Switch tenant" })).toBeVisible();
  expect(screen.getAllByText("Dashboard")).toHaveLength(3);
  expect(screen.getByLabelText("breadcrumb")).toBeVisible();
  fireEvent.click(screen.getByLabelText("Open navigation"));
  expect(await screen.findByText("Navigation")).toBeVisible();

  fireEvent.click(screen.getByRole("button", { name: "Increment tenant-bound state" }));
  expect(screen.getByText("Tenant-bound count: 1")).toBeVisible();
  act(() => tenantStore.getState().setContext({ currentTenant: { code: "beta", id: 2, name: "Beta" } }));
  expect(screen.getByText("Tenant-bound count: 0")).toBeVisible();
});

it("falls back to IconGridStroked for unknown icon names", () => {
  expect(isValidElement(workbenchIcon("legacy:unknown"))).toBe(true);
});

it("preserves route component state when switching between keepAlive tabs", async () => {
  const apis = {
    auth: { login: vi.fn(), logout: vi.fn(), refresh: vi.fn() },
    menu: { getAllMenus: vi.fn() },
    plugins: { getRuntimeStates: vi.fn() },
    tenant: {
      endImpersonation: vi.fn(), impersonate: vi.fn(), listLoginTenants: vi.fn(),
      selectTenant: vi.fn(), switchTenant: vi.fn(),
    },
    user: { getCurrentUser: vi.fn() },
  } satisfies AuthRuntimeApis;
  const runtime = new AuthRuntime({
    apis,
    queryClient: new QueryClient(),
    sessionStore: createSessionStore({ storage: null }),
    tenantStore: createTenantStore({ storage: null }),
  });
  const context = {
    capabilities: { organizationEnabled: false, tenantEnabled: false },
    menus: [], plugins: [],
    user: {
      avatar: "", email: "a@example.com", homePath: "/first", menus: [],
      permissions: [], realName: "Admin", roles: [], userId: 1, username: "admin",
    },
  };
  const routes = [
    {
      children: [], componentKey: "first", hidden: false, hideInBreadcrumb: false,
      hideInTab: false, id: 1, keepAlive: true, name: "First", path: "/first",
      query: {}, title: "First",
    },
    {
      children: [], componentKey: "second", hidden: false, hideInBreadcrumb: false,
      hideInTab: false, id: 2, keepAlive: true, name: "Second", path: "/second",
      query: {}, title: "Second",
    },
  ];

  function FirstPage() {
    const navigate = useNavigate();
    const [count, setCount] = useState(0);
    return <div>
      <span>First count: {count}</span>
      <button onClick={() => setCount((value) => value + 1)} type="button">Increment first</button>
      <button onClick={() => void navigate("/second")} type="button">Open second</button>
    </div>;
  }

  function SecondPage() {
    const navigate = useNavigate();
    return <div>
      <span>Second content</span>
      <button onClick={() => void navigate("/first")} type="button">Open first</button>
    </div>;
  }

  render(
    <Providers i18n={i18n}>
      <AuthContextProvider value={context}>
        <MemoryRouter initialEntries={["/first"]}>
          <WorkbenchLayout
            appName="LinaPro"
            defaultAvatarUrl="/avatar.webp"
            registry={{
              first: { component: FirstPage, surface: "page" },
              second: { component: SecondPage, surface: "page" },
            }}
            logoUrl="/logo.webp"
            routes={routes}
            runtime={runtime}
          />
        </MemoryRouter>
      </AuthContextProvider>
    </Providers>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Increment first" }));
  expect(screen.getByText("First count: 1")).toBeVisible();

  fireEvent.click(screen.getByRole("button", { name: "Open second" }));
  expect(await screen.findByText("Second content")).toBeVisible();

  fireEvent.click(screen.getByRole("button", { name: "Open first" }));
  expect(await screen.findByText("First count: 1")).toBeVisible();
});
