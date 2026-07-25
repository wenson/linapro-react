import { render, screen } from "@testing-library/react";
import { createInstance } from "i18next";
import type { PropsWithChildren } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import type { MenuRouteItem } from "#/api/menu";
import { AuthContextProvider } from "#/auth/auth-context-provider";
import { Providers } from "#/app/providers";
import enMessages from "#/locales/en-US/app.json";
import { PageSurface } from "#/layout/page-surface";
import { ComingSoonPage } from "#/features/fallback/status-pages";
import { tabStore } from "#/layout/tab-store";
import { findWorkbenchRoute, projectMenuTree } from "#/router/project-menu";
import { hostSupplementalRoutes } from "#/router/host-routes";
import { RouteView } from "#/router/route-view";
import type { AuthenticatedContext } from "#/auth/auth-context";

const i18n = createInstance();

beforeAll(async () => {
  await i18n.init({
    fallbackLng: "en-US",
    lng: "en-US",
    resources: { "en-US": { translation: enMessages } },
  });
});

function menu(overrides: Partial<MenuRouteItem> = {}): MenuRouteItem {
  return {
    component: "#/views/system/user/index.vue",
    id: 1,
    meta: {
      order: 1,
      title: "Users",
    },
    name: "SystemUser",
    parentId: 0,
    path: "/system/user",
    ...overrides,
  };
}

const authContext: AuthenticatedContext = {
  capabilities: { organizationEnabled: true, tenantEnabled: true },
  menus: [],
  plugins: [],
  user: {
    avatar: "",
    email: "admin@example.com",
    homePath: "/system/user",
    menus: [],
    permissions: [],
    realName: "Admin",
    roles: [],
    userId: 1,
    username: "admin",
  },
};

function TestProviders({ children, context = authContext }: PropsWithChildren<{ context?: AuthenticatedContext }>) {
  return (
    <Providers i18n={i18n}>
      <AuthContextProvider value={context}>{children}</AuthContextProvider>
    </Providers>
  );
}

describe("menu projection", () => {
  it("keeps the hidden developer-center about page reachable with its access boundary", () => {
    expect(findWorkbenchRoute(hostSupplementalRoutes, "/about")).toMatchObject({
      componentKey: "about/index",
      hidden: true,
      path: "/about",
      permission: "system:developer:view",
      titleKey: "page.about.project.title",
    });
  });

  it("keeps the authenticated message center reachable without a sidebar menu", () => {
    expect(findWorkbenchRoute(hostSupplementalRoutes, "/system/message")).toMatchObject({
      componentKey: "system/message/index",
      hidden: true,
      path: "/system/message",
    });
  });

  it("matches host-owned hidden parameter routes using the concrete tab path", () => {
    expect(findWorkbenchRoute(hostSupplementalRoutes, "/system/role-auth/user/42")).toMatchObject({
      componentKey: "system/role-auth/index",
      hidden: true,
      path: "/system/role-auth/user/42",
    });
  });

  it("normalizes known components, nested paths and visibility metadata", () => {
    const [route] = projectMenuTree([
      menu({
        children: [menu({ id: 2, path: "profile" })],
        meta: {
          authority: "system:user:list",
          hideInBreadcrumb: true,
          hideInMenu: true,
          hideInTab: true,
          i18nKey: "menu.system:user:list.title",
          keepAlive: true,
          order: 1,
          query: { source: "menu" },
          title: "Users",
        },
      }),
    ]);

    expect(route).toMatchObject({
      componentKey: "system/user/index",
      hidden: true,
      hideInBreadcrumb: true,
      hideInTab: true,
      keepAlive: true,
      permission: "system:user:list",
      query: { source: "menu" },
      titleKey: "menu.system:user:list.title",
    });
    expect(route?.children[0]?.path).toBe("/system/user/profile");
  });

  it("recognizes Lina's existing translation key in meta.title", () => {
    const [route] = projectMenuTree([
      menu({ meta: { order: 1, title: "page.routes.system.pluginManagement" } }),
    ]);

    expect(route).toMatchObject({
      title: "page.routes.system.pluginManagement",
      titleKey: "page.routes.system.pluginManagement",
    });
  });

  it("projects iframe and new-window metadata without interpreting query as code", () => {
    const routes = projectMenuTree([
      menu({ meta: { iframeSrc: "/x-assets/demo/index.html", order: 1, title: "Frame" } }),
      menu({
        id: 2,
        meta: { link: "https://example.com/docs", openInNewWindow: true, order: 2, title: "Docs" },
      }),
    ]);
    expect(routes[0]?.iframeSrc).toBe("/x-assets/demo/index.html");
    expect(routes[1]?.externalHref).toBe("https://example.com/docs");
  });

  it("recovers legacy dynamic plugin identity from its governed asset path", () => {
    const [route] = projectMenuTree([
      menu({
        meta: {
          iframeSrc: "/x-assets/plugin-demo/v1.2.0/index.html",
          order: 1,
          title: "Plugin demo",
        },
      }),
    ]);

    expect(route?.pluginId).toBe("plugin-demo");
  });
});

describe("route rendering", () => {
  it("denies the hidden about route when the developer-center permission is absent", () => {
    const route = findWorkbenchRoute(hostSupplementalRoutes, "/about");
    render(
      <RouteView registry={{ "about/index": { component: () => <p>About content</p>, surface: "page" } }} route={route} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText("Access denied")).toBeVisible();
    expect(screen.queryByText("About content")).not.toBeInTheDocument();
  });

  it("renders the translated coming-soon fallback", () => {
    render(<ComingSoonPage />, { wrapper: TestProviders });
    expect(screen.getByText("Coming soon")).toBeVisible();
  });

  it("renders a diagnostic page for unknown component keys", () => {
    const [route] = projectMenuTree([menu({ component: "../../escape" })]);
    render(<RouteView registry={{}} route={route} />, { wrapper: TestProviders });
    expect(screen.getByText("Page is not registered")).toBeVisible();
    expect(screen.getByText("../../escape")).toBeVisible();
  });

  it("fails closed with a translated 403 when permission is absent", () => {
    const [route] = projectMenuTree([menu({ meta: { authority: "system:user:list", order: 1, title: "Users" } })]);
    const registry = {
      "system/user/index": { component: () => <p>Protected content</p>, surface: "page" as const },
    };
    render(<RouteView registry={registry} route={route} />, { wrapper: TestProviders });
    expect(screen.getByText("Access denied")).toBeVisible();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders iframe routes with a sandbox that excludes same-origin", () => {
    const [route] = projectMenuTree([
      menu({ meta: { iframeSrc: "/x-assets/demo/index.html", order: 1, title: "Demo frame" } }),
    ]);
    render(<RouteView registry={{}} route={route} />, { wrapper: TestProviders });
    const frame = screen.getByTitle("Demo frame");
    expect(frame).toHaveAttribute("sandbox", "allow-forms allow-popups allow-scripts");
    expect(frame.getAttribute("sandbox")).not.toContain("allow-same-origin");
  });

  it("opens external routes with opener isolation", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const [route] = projectMenuTree([
      menu({ meta: { link: "https://example.com/docs", openInNewWindow: true, order: 1, title: "Docs" } }),
    ]);
    render(<RouteView registry={{}} route={route} />, { wrapper: TestProviders });
    expect(open).toHaveBeenCalledWith("https://example.com/docs", "_blank", "noopener,noreferrer");
    open.mockRestore();
  });

  it("rejects script URLs and path escapes for framed or external routes", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const [external] = projectMenuTree([
      menu({ meta: { link: "javascript:alert(1)", openInNewWindow: true, order: 1, title: "Unsafe" } }),
    ]);
    const [frame] = projectMenuTree([
      menu({ meta: { iframeSrc: "/x-assets/demo/../secret.html", order: 1, title: "Unsafe frame" } }),
    ]);
    const { rerender } = render(<RouteView registry={{}} route={external} />, { wrapper: TestProviders });
    expect(open).not.toHaveBeenCalled();
    expect(screen.getByText("Page is not registered")).toBeVisible();
    rerender(<RouteView registry={{}} route={frame} />);
    expect(screen.queryByTitle("Unsafe frame")).not.toBeInTheDocument();
    open.mockRestore();
  });

  it("keeps page and workspace surfaces structurally distinct", () => {
    const { rerender } = render(<PageSurface surface="page">Page</PageSurface>);
    expect(screen.getByText("Page")).toHaveClass("page-surface-page");
    rerender(<PageSurface surface="workspace">Canvas</PageSurface>);
    expect(screen.getByText("Canvas")).toHaveClass("page-surface-workspace");
  });

  it("stores only tab metadata and clears it without retaining page DOM", () => {
    tabStore.getState().clear();
    tabStore.getState().open({ path: "/system/user", query: "?page=1", title: "Users" });
    tabStore.getState().open({ path: "/extension/removed", query: "", title: "Removed plugin" });
    tabStore.getState().retain(new Set(["/system/user"]));
    expect(tabStore.getState().tabs).toEqual([
      { path: "/system/user", query: "?page=1", title: "Users" },
    ]);
    expect(JSON.stringify(tabStore.getState().tabs)).not.toMatch(/element|component|children/i);
    tabStore.getState().clear();
    expect(tabStore.getState().tabs).toEqual([]);
  });
});
