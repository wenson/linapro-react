import { render, screen } from "@testing-library/react";
import { createInstance } from "i18next";
import { lazy } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, expect, it, vi } from "vitest";

import type { AuthenticatedContext } from "#/auth/auth-context";
import { AuthContextProvider } from "#/auth/auth-context-provider";
import { Providers } from "#/app/providers";
import { WorkbenchRuntimeProvider } from "#/app/workbench-runtime-provider";
import { ApiClient } from "#/api/client";
import AnalyticsPage from "#/features/dashboard/analytics-page";
import WorkspacePage from "#/features/dashboard/workspace-page";
import enMessages from "#/locales/en-US/app.json";
import { PluginUIRegistryProvider } from "#/plugin-ui/registry-provider";
import type { PluginUIRegistry, RegisteredPluginSlot } from "#/plugin-ui/registry";
import { defaultPublicFrontendConfig } from "#/runtime/public-config";

vi.mock("#/features/dashboard/echart", () => ({
  EChart: ({ ariaLabel }: { ariaLabel: string }) => <div aria-label={ariaLabel} role="img" />,
}));

const i18n = createInstance();
beforeAll(async () => {
  await i18n.init({ lng: "en-US", resources: { "en-US": { translation: enMessages } } });
});

const auth: AuthenticatedContext = {
  capabilities: { organizationEnabled: true, tenantEnabled: true },
  menus: [], plugins: [],
  user: {
    avatar: "", email: "admin@example.com", homePath: "/dashboard", menus: [],
    permissions: [], realName: "Admin", roles: [], userId: 1, username: "admin",
  },
};

function slot(key: string, text: string, order: number): RegisteredPluginSlot {
  const load = async () => ({ default: () => <span>{text}</span> });
  return {
    capabilities: [], component: lazy(load), generation: 1, key, load, order,
    pluginId: "acme-dashboard-source", slot: order === 1 ? "dashboard.workspace.before" : "dashboard.workspace.after",
  };
}

it("renders the equivalent analytics overview, tabs and chart cards", () => {
  render(<Providers i18n={i18n}><AnalyticsPage /></Providers>);
  expect(screen.getByText("Users")).toBeVisible();
  expect(screen.getByText("Downloads")).toBeVisible();
  expect(screen.getByRole("button", { name: "Traffic Trends" })).toHaveAttribute(
    "data-state",
    "active",
  );
  expect(screen.getByRole("button", { name: "Monthly Visits" })).toBeVisible();
  expect(screen.getByRole("img", { name: "Traffic Trends" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Visit Channels" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Traffic Sources" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Commercial Mix" })).toBeVisible();
});

it("renders workspace plugin slots before and after host content", async () => {
  const slots = {
    "auth.login.after": [], "crud.table.after": [], "crud.toolbar.after": [],
    "dashboard.workspace.before": [slot("before", "Before plugin", 1)],
    "dashboard.workspace.after": [slot("after", "After plugin", 2)],
    "layout.header.actions.before": [], "layout.header.actions.after": [], "layout.user-dropdown.after": [],
  } satisfies PluginUIRegistry["slots"];
  const registry: PluginUIRegistry = { pages: {}, slots };
  render(
    <Providers i18n={i18n}>
      <AuthContextProvider value={auth}>
        <WorkbenchRuntimeProvider value={{ apiClient: new ApiClient(), config: defaultPublicFrontendConfig }}>
          <PluginUIRegistryProvider registry={registry}>
            <MemoryRouter><WorkspacePage /></MemoryRouter>
          </PluginUIRegistryProvider>
        </WorkbenchRuntimeProvider>
      </AuthContextProvider>
    </Providers>,
  );
  const before = await screen.findByText("Before plugin");
  const welcome = screen.getByText("Welcome back, Admin");
  const after = await screen.findByText("After plugin");
  expect(before.compareDocumentPosition(welcome) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(welcome.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
