import { render, screen } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";

import { ApiClient } from "#/api/client";
import { Providers } from "#/app/providers";
import { WorkbenchRuntimeProvider } from "#/app/workbench-runtime-provider";
import { AuthContextProvider } from "#/auth/auth-context-provider";
import RolePage from "#/features/iam/role/role-page";
import type { PublicFrontendConfig } from "#/runtime/public-config";

it("renders the React role table with capability-normalized data scope", async () => {
  const fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ code: 0, data: { list: [{ createdAt: 1, dataScope: 3, id: 2, key: "viewer", name: "Viewer", remark: "", sort: 1, status: 1, updatedAt: 1 }], total: 1 } }), { headers: { "content-type": "application/json" } }));
  const context = { capabilities: { organizationEnabled: false, tenantEnabled: false }, menus: [], plugins: [], user: { avatar: "", email: "", homePath: "/", menus: [], permissions: ["*"], realName: "Admin", roles: [], userId: 1, username: "admin" } };
  render(<Providers queryClient={new QueryClient()}><MemoryRouter><WorkbenchRuntimeProvider value={{ apiClient: new ApiClient({ fetch }), config: {} as PublicFrontendConfig }}><AuthContextProvider value={context}><RolePage /></AuthContextProvider></WorkbenchRuntimeProvider></MemoryRouter></Providers>);
  expect(await screen.findByTestId("role-page")).toBeVisible(); expect(await screen.findByText("Viewer")).toBeVisible(); expect(screen.getByText("Self only")).toBeVisible();
  expect(screen.getByRole("button", { name: "More actions" })).toBeVisible();
});
