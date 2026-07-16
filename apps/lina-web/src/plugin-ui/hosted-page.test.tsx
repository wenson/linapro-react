import { QueryClient } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { createInstance } from "i18next";
import type { PropsWithChildren } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { ApiClient } from "#/api/client";
import { Providers } from "#/app/providers";
import { WorkbenchRuntimeProvider } from "#/app/workbench-runtime-provider";
import type { AuthenticatedContext } from "#/auth/auth-context";
import { AuthContextProvider } from "#/auth/auth-context-provider";
import enMessages from "#/locales/en-US/app.json";
import { HostedPage } from "#/plugin-ui/hosted-page";
import { normalizeHostedAsset } from "#/plugin-ui/hosted-page-contract";
import type { WorkbenchRoute } from "#/router/contracts";
import { defaultPublicFrontendConfig } from "#/runtime/public-config";
import { createTenantStore } from "#/tenant/tenant-store";

const pluginId = "linapro-demo-dynamic";
const version = "v0.1.0";
const i18n = createInstance();

beforeAll(async () => {
  await i18n.init({
    fallbackLng: "en-US",
    lng: "en-US",
    resources: {
      "en-US": {
        translation: {
          ...enMessages,
          plugin: { [pluginId]: { page: { title: "Dynamic demo" } } },
        },
      },
    },
  });
});

function route(overrides: Partial<WorkbenchRoute> = {}): WorkbenchRoute {
  return {
    children: [],
    componentKey: "system/plugin/dynamic-page",
    hidden: false,
    hideInBreadcrumb: false,
    hideInTab: false,
    id: 1,
    keepAlive: false,
    name: "DynamicDemo",
    path: "/extension/linapro-demo-dynamic",
    pluginId,
    query: {
      pluginAccessMode: "iframe",
      pluginAssetUrl: `/x-assets/${pluginId}/${version}/standalone.html`,
    },
    title: "Dynamic Plugin Demo",
    ...overrides,
  };
}

function auth(generation = 4, permissions = [`${pluginId}:view`]): AuthenticatedContext {
  return {
    capabilities: { organizationEnabled: true, tenantEnabled: true },
    menus: [],
    plugins: [{ enabled: 1, generation, id: pluginId, installed: 1, statusKey: "normal", version }],
    user: {
      avatar: "",
      email: "admin@example.com",
      homePath: "/",
      menus: [],
      permissions,
      realName: "Admin",
      roles: [],
      userId: 1,
      username: "admin",
    },
  };
}

function Wrapper({ children, context = auth(), tenantStore = createTenantStore({ storage: null }) }: PropsWithChildren<{
  context?: AuthenticatedContext;
  tenantStore?: ReturnType<typeof createTenantStore>;
}>) {
  return (
    <Providers i18n={i18n} queryClient={new QueryClient()}>
      <WorkbenchRuntimeProvider value={{ apiClient: new ApiClient(), config: defaultPublicFrontendConfig, tenantStore }}>
        <AuthContextProvider value={context}>{children}</AuthContextProvider>
      </WorkbenchRuntimeProvider>
    </Providers>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("hosted asset governance", () => {
  it("accepts only current-plugin, current-version HTML assets", () => {
    expect(normalizeHostedAsset(route(), version)).toMatchObject({ pluginId, version });
    for (const source of [
      "https://example.com/index.html",
      "//example.com/index.html",
      `/x-assets/${pluginId}/${version}/../secret.html`,
      `/x-assets/${pluginId}/${version}/%2e%2e/secret.html`,
      `/x-assets/another/${version}/index.html`,
      `/x-assets/${pluginId}/${version}/mount.js`,
      `/x-assets/${pluginId}/${version}/index.html?token=secret`,
    ]) {
      expect(() => normalizeHostedAsset(route({ query: {
        pluginAccessMode: "iframe",
        pluginAssetUrl: source,
      } }), version), source).toThrow();
    }
    expect(() => normalizeHostedAsset(route(), "v9.9.9")).toThrow(/stale/i);
  });
});

describe("HostedPage", () => {
  it("renders an opaque-origin sandbox and puts only session identifiers in the fragment", () => {
    render(<HostedPage route={route()} />, { wrapper: Wrapper });
    const frame = screen.getByTitle("Dynamic Plugin Demo");
    expect(frame).toHaveAttribute("sandbox", "allow-downloads allow-forms allow-modals allow-popups allow-scripts");
    expect(frame.getAttribute("sandbox")).not.toContain("allow-same-origin");
    const source = frame.getAttribute("src") || "";
    expect(source).toContain(`/x-assets/${pluginId}/${version}/standalone.html#`);
    expect(source).toContain(`pluginId=${pluginId}`);
    expect(source).toContain("generation=4");
    expect(source).not.toMatch(/token|authorization|tenant/i);
  });

  it("invalidates the iframe session when generation, permissions or tenant changes", () => {
    const tenantStore = createTenantStore({ storage: null });
    tenantStore.getState().setContext({ currentTenant: { code: "alpha", id: 1, name: "Alpha" }, enabled: true });
    const tree = (context: AuthenticatedContext) => (
      <Wrapper context={context} tenantStore={tenantStore}>
        <HostedPage route={route()} />
      </Wrapper>
    );
    const view = render(tree(auth()));
    const first = screen.getByTitle("Dynamic Plugin Demo").getAttribute("src");

    view.rerender(tree(auth(5, [`${pluginId}:view`, `${pluginId}:record:list`])));
    const second = screen.getByTitle("Dynamic Plugin Demo").getAttribute("src");
    expect(second).not.toBe(first);
    expect(second).toContain("generation=5");

    act(() => {
      tenantStore.getState().setContext({ currentTenant: { code: "beta", id: 2, name: "Beta" } });
    });
    const third = screen.getByTitle("Dynamic Plugin Demo").getAttribute("src");
    expect(third).not.toBe(second);
  });

  it("fails closed when the plugin is disabled and opens governed new-window assets with opener isolation", () => {
    const disabled = auth();
    disabled.plugins[0] = { ...disabled.plugins[0]!, enabled: 0 };
    const view = render(<HostedPage route={route()} />, {
      wrapper: ({ children }) => <Wrapper context={disabled}>{children}</Wrapper>,
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/not installed, enabled, or ready/i);

    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    view.rerender(
      <Wrapper context={auth()}>
        <HostedPage route={route({ query: {
          pluginAccessMode: "new-window",
          pluginAssetUrl: `/x-assets/${pluginId}/${version}/standalone.html`,
        } })} />
      </Wrapper>,
    );
    expect(open).toHaveBeenCalledWith(
      `/x-assets/${pluginId}/${version}/standalone.html`,
      "_blank",
      "noopener,noreferrer",
    );
  });
});
