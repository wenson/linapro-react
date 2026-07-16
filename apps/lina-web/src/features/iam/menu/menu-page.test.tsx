import { render, screen } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";

import { ApiClient } from "#/api/client";
import { Providers } from "#/app/providers";
import { WorkbenchRuntimeProvider } from "#/app/workbench-runtime-provider";
import { AuthContextProvider } from "#/auth/auth-context-provider";
import MenuPage from "#/features/iam/menu/menu-page";
import type { PublicFrontendConfig } from "#/runtime/public-config";

it("renders the backend menu hierarchy as a Semi table", async () => {
  const menu = { children: [], component: "system/user/index", createdAt: 1, icon: "", id: 2, isCache: 0, isFrame: 0, name: "Users", parentId: 0, path: "/system/user", perms: "system:user:list", queryParam: "", remark: "", sort: 1, status: 1, type: "M", updatedAt: 1, visible: 1 };
  const fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ code: 0, data: { list: [menu] } }), { headers: { "content-type": "application/json" } }));
  const context = { capabilities: { organizationEnabled: true, tenantEnabled: true }, menus: [], plugins: [], user: { avatar: "", email: "", homePath: "/", menus: [], permissions: ["*"], realName: "Admin", roles: [], userId: 1, username: "admin" } };
  render(<Providers queryClient={new QueryClient()}><WorkbenchRuntimeProvider value={{ apiClient: new ApiClient({ fetch }), config: {} as PublicFrontendConfig }}><AuthContextProvider value={context}><MenuPage /></AuthContextProvider></WorkbenchRuntimeProvider></Providers>);
  expect(await screen.findByTestId("menu-page")).toBeVisible(); expect(await screen.findByText("Users")).toBeVisible(); expect(screen.getByText("system:user:list")).toBeVisible();
});
