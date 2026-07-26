import type { MenuRouteItem } from "#/api/menu";
import type { WorkbenchRoute } from "#/router/contracts";

export function normalizeComponentKey(value: string): string {
  return value.trim().replace(/^#\/views\//, "").replace(/\.(vue|tsx?)$/i, "").replace(/^\/+|\/+$/g, "");
}

function routePath(parentPath: string, path: string): string {
  const input = path.trim();
  if (input.startsWith("/")) {
    return input.replace(/\/{2,}/g, "/");
  }
  return `${parentPath.replace(/\/+$/, "")}/${input}`.replace(/\/{2,}/g, "/") || "/";
}

function routeTitleKey(title: string, explicitKey?: string): string | undefined {
  if (explicitKey?.trim()) return explicitKey.trim();
  const normalized = title.trim();
  return /^(?:menu|page|pages|plugin)\./.test(normalized) ? normalized : undefined;
}

function routePluginId(item: MenuRouteItem): string | undefined {
  if (item.meta.pluginId?.trim()) return item.meta.pluginId.trim();
  const sources = [
    item.meta.iframeSrc,
    item.meta.link,
    ...Object.values(item.meta.query ?? {}),
  ];
  for (const source of sources) {
    const pluginId = source?.match(/\/x-assets\/([^/]+)\/[^/]+\//)?.[1];
    if (pluginId) return pluginId;
  }
  return undefined;
}

export function projectMenuTree(items: readonly MenuRouteItem[], parentPath = ""): WorkbenchRoute[] {
  return items.map((item) => {
    const path = routePath(parentPath, item.path);
    return {
      children: projectMenuTree(item.children ?? [], path),
      componentKey: normalizeComponentKey(item.component),
      externalHref: item.meta.openInNewWindow && item.meta.link ? item.meta.link : undefined,
      hidden: item.meta.hideInMenu === true,
      hideInBreadcrumb: item.meta.hideInBreadcrumb === true,
      hideInTab: item.meta.hideInTab === true,
      icon: item.meta.icon,
      id: item.id,
      iframeSrc: item.meta.iframeSrc,
      keepAlive: item.meta.keepAlive === true,
      name: item.name,
      path,
      permission: item.meta.ignoreAccess ? undefined : item.meta.authority,
      pluginId: routePluginId(item),
      query: item.meta.query ?? {},
      redirect: item.redirect,
      title: item.meta.title,
      titleKey: routeTitleKey(item.meta.title, item.meta.i18nKey),
    } satisfies WorkbenchRoute;
  });
}

export function flattenRoutes(routes: readonly WorkbenchRoute[]): WorkbenchRoute[] {
  return routes.flatMap((route) => [route, ...flattenRoutes(route.children)]);
}

function normalizeRoutePath(path: string): string {
  const pathname = path.trim().split(/[?#]/, 1)[0] ?? "";
  if (!pathname) return "/";
  const absolutePath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return absolutePath.replace(/\/{2,}/g, "/").replace(/\/+$/, "") || "/";
}

function isLandingPage(route: WorkbenchRoute): boolean {
  return route.children.length === 0
    && !route.externalHref
    && Boolean(route.componentKey || route.iframeSrc);
}

function resolveRedirectTarget(
  routes: readonly WorkbenchRoute[],
  route: WorkbenchRoute,
): WorkbenchRoute | undefined {
  let candidate: WorkbenchRoute | undefined = route;
  const visited = new Set<number>();
  while (candidate?.redirect) {
    if (visited.has(candidate.id)) return undefined;
    visited.add(candidate.id);
    candidate = findWorkbenchRoute(routes, normalizeRoutePath(candidate.redirect));
  }
  return candidate && isLandingPage(candidate) ? candidate : undefined;
}

function firstVisibleLandingPage(
  roots: readonly WorkbenchRoute[],
  allRoutes: readonly WorkbenchRoute[],
): WorkbenchRoute | undefined {
  for (const route of roots) {
    if (route.hidden || route.externalHref) continue;
    const redirected = resolveRedirectTarget(allRoutes, route);
    if (redirected && !redirected.hidden && !redirected.externalHref) return redirected;
    const child = firstVisibleLandingPage(route.children, allRoutes);
    if (child) return child;
    if (isLandingPage(route)) return route;
  }
  return undefined;
}

export function resolveWorkbenchLandingPath(
  homePath: string | undefined,
  routes: readonly WorkbenchRoute[],
): string | undefined {
  const normalizedHomePath = normalizeRoutePath(homePath ?? "/");
  if (normalizedHomePath !== "/") {
    const homeRoute = findWorkbenchRoute(routes, normalizedHomePath);
    const resolvedHome = homeRoute && resolveRedirectTarget(routes, homeRoute);
    if (resolvedHome) return resolvedHome.path;
  }

  const visibleLanding = firstVisibleLandingPage(routes, routes);
  if (visibleLanding) return visibleLanding.path;

  return flattenRoutes(routes).find(
    (route) => route.componentKey === "profile/index" && isLandingPage(route),
  )?.path;
}

export function findWorkbenchRoute(routes: readonly WorkbenchRoute[], path: string): WorkbenchRoute | undefined {
  const normalizedPath = path.replace(/\/+$/, "") || "/";
  for (const route of flattenRoutes(routes)) {
    if (route.path === normalizedPath) return route;
    if (!route.path.includes(":")) continue;
    const pattern = route.path
      .split("/")
      .map((segment) => segment.startsWith(":") ? "[^/]+" : segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("/");
    if (new RegExp(`^${pattern}/?$`).test(normalizedPath)) return { ...route, path: normalizedPath };
  }
  return undefined;
}
