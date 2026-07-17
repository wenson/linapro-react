import { QueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { ApiClient } from "#/api/client";
import { Providers } from "#/app/providers";
import { WorkbenchRuntimeProvider } from "#/app/workbench-runtime-provider";
import { AuthContextProvider } from "#/auth/auth-context-provider";
import ConfigPage from "#/features/settings/config/config-page";
import { defaultPublicFrontendConfig } from "#/runtime/public-config";

const context = {
  capabilities: { organizationEnabled: true, tenantEnabled: true },
  menus: [],
  plugins: [],
  user: {
    avatar: "",
    email: "",
    homePath: "/",
    menus: [],
    permissions: ["*"],
    realName: "Admin",
    roles: [],
    userId: 1,
    username: "admin",
  },
};

function ok(data: unknown) {
  return new Response(JSON.stringify({ code: 0, data }), {
    headers: { "content-type": "application/json" },
  });
}

it("renders a typed boolean configuration editor from server metadata", async () => {
  const fetch = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/config/9")) {
      return ok({
        canEdit: true,
        canOverride: false,
        id: 9,
        isBuiltin: 0,
        isFallback: false,
        key: "sys.feature.enabled",
        name: "Feature enabled",
        options: [],
        overrideMode: "none",
        remark: "",
        sourceTenantId: 0,
        value: "true",
        valueType: "boolean",
      });
    }
    return ok({
      list: [{
        canEdit: true,
        canOverride: false,
        id: 9,
        isBuiltin: 0,
        isFallback: false,
        key: "sys.feature.enabled",
        name: "Feature enabled",
        options: [],
        overrideMode: "none",
        sourceTenantId: 0,
        value: "true",
        valueType: "boolean",
      }],
      total: 1,
    });
  });
  const user = userEvent.setup();
  render(
    <Providers queryClient={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <WorkbenchRuntimeProvider value={{ apiClient: new ApiClient({ fetch }), config: defaultPublicFrontendConfig }}>
        <AuthContextProvider value={context}><ConfigPage /></AuthContextProvider>
      </WorkbenchRuntimeProvider>
    </Providers>,
  );

  await user.click(await screen.findByTestId("config-edit-9"));

  expect(await screen.findByTestId("config-value-editor-boolean")).toBeVisible();
  expect(screen.getByLabelText("Parameter Value")).toBeVisible();
  expect(screen.getAllByText("Boolean")).toHaveLength(2);
});
