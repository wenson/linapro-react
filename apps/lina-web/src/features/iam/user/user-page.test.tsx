import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { ApiClient } from "#/api/client";
import { Providers } from "#/app/providers";
import { WorkbenchRuntimeProvider } from "#/app/workbench-runtime-provider";
import type { AuthenticatedContext } from "#/auth/auth-context";
import { AuthContextProvider } from "#/auth/auth-context-provider";
import UserPage from "#/features/iam/user/user-page";
import type { PublicFrontendConfig } from "#/runtime/public-config";
import { createTenantStore } from "#/tenant/tenant-store";

const config = {} as PublicFrontendConfig;
function response(data: unknown) { return new Response(JSON.stringify({ code: 0, data }), { headers: { "content-type": "application/json" }, status: 200 }); }
function auth(capabilities: AuthenticatedContext["capabilities"], permissions = ["*"]): AuthenticatedContext { return { capabilities, menus: [], plugins: [], user: { avatar: "", email: "", homePath: "/", menus: [], permissions, realName: "Admin", roles: [], userId: 1, username: "admin" } }; }

describe("user capability projection", () => {
  it("does not render organization or tenant fields when capabilities are disabled", async () => {
    const fetch = vi.fn().mockImplementation(async () => response({ list: [], total: 0 }));
    render(<Providers queryClient={new QueryClient()}><WorkbenchRuntimeProvider value={{ apiClient: new ApiClient({ fetch }), config, tenantStore: createTenantStore({ storage: null }) }}><AuthContextProvider value={auth({ organizationEnabled: false, tenantEnabled: false })}><UserPage /></AuthContextProvider></WorkbenchRuntimeProvider></Providers>);
    expect(await screen.findByTestId("user-page")).toBeVisible();
    expect(screen.queryByText("Department")).not.toBeInTheDocument(); expect(screen.queryByText("Tenant memberships")).not.toBeInTheDocument();
    expect(fetch.mock.calls.some((call) => String(call[0]).includes("/user/dept-tree"))).toBe(false);
  });

  it("keeps the organization-owned department filter collapsed until the user opens it", async () => {
    const fetch = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/user/dept-tree")) return response({ list: [{ id: 8, label: "Engineering", userCount: 3 }] });
      return response({ list: [], total: 0 });
    });
    render(<Providers queryClient={new QueryClient()}><WorkbenchRuntimeProvider value={{ apiClient: new ApiClient({ fetch }), config, tenantStore: createTenantStore({ storage: null }) }}><AuthContextProvider value={auth({ organizationEnabled: true, tenantEnabled: false })}><UserPage /></AuthContextProvider></WorkbenchRuntimeProvider></Providers>);
    const toggle = await screen.findByTestId("user-department-filter-toggle");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("user-dept-tree")).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(await screen.findByTestId("user-dept-tree")).toBeVisible();
    expect(await screen.findByText("Engineering (3)")).toBeVisible();
    expect(fetch.mock.calls.some((call) => String(call[0]).includes("/user/dept-tree"))).toBe(true);
  });

  it("uses the Lina resetPwd permission to expose password reset for other users", async () => {
    const fetch = vi.fn().mockImplementation(async () => response({
      list: [{ createdAt: 1_720_000_000, id: 2, nickname: "Operator", roleNames: [], status: 1, username: "operator" }],
      total: 1,
    }));
    render(<Providers queryClient={new QueryClient()}><WorkbenchRuntimeProvider value={{ apiClient: new ApiClient({ fetch }), config, tenantStore: createTenantStore({ storage: null }) }}><AuthContextProvider value={auth({ organizationEnabled: false, tenantEnabled: false }, ["system:user:resetPwd"])}><UserPage /></AuthContextProvider></WorkbenchRuntimeProvider></Providers>);
    expect(await screen.findByRole("button", { name: "Reset password" }, { timeout: 5_000 })).toBeVisible();
  });
});
