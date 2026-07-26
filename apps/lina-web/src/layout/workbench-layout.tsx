import Breadcrumb from "@douyinfe/semi-ui/lib/es/breadcrumb";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Layout from "@douyinfe/semi-ui/lib/es/layout";
import SideSheet from "@douyinfe/semi-ui/lib/es/sideSheet";
import Select from "@douyinfe/semi-ui/lib/es/select";
import Tabs from "@douyinfe/semi-ui/lib/es/tabs";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useStore } from "zustand";

import { AuthRuntime } from "#/auth/auth-runtime";
import { applyThemePreference } from "#/app/theme";
import { NoAccessiblePage } from "#/features/fallback/status-pages";
import { WorkbenchNavigation } from "#/layout/navigation";
import { TabStrip } from "#/layout/tab-strip";
import { tabStore } from "#/layout/tab-store";
import { WorkbenchHeader } from "#/layout/workbench-header";
import { findWorkbenchRoute, flattenRoutes } from "#/router/project-menu";
import { RouteView } from "#/router/route-view";
import type { HostPageRegistry, WorkbenchRoute } from "#/router/contracts";
import { safeNavigationTarget } from "#/router/url-safety";
import { useRuntimeI18n } from "#/runtime/i18n-context";

export function WorkbenchLayout({ appName, contentNotice, defaultAvatarUrl, headerActionsAfter, headerActionsBefore, logoUrl, registry, rootLandingPath, routes, runtime, userDropdownAfter }: {
  appName: string;
  contentNotice?: ReactNode;
  defaultAvatarUrl: string;
  headerActionsAfter?: ReactNode;
  headerActionsBefore?: ReactNode;
  registry: HostPageRegistry;
  rootLandingPath?: string | null;
  logoUrl: string;
  routes: readonly WorkbenchRoute[];
  runtime: AuthRuntime;
  userDropdownAfter?: ReactNode;
}) {
  const { i18n, t } = useTranslation();
  const runtimeI18n = useRuntimeI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const currentTenantId = useStore(runtime.getTenantStore(), (state) => state.currentTenant?.id);
  const impersonating = useStore(runtime.getTenantStore(), (state) => state.impersonation.active);
  const switchingTenant = useStore(runtime.getTenantStore(), (state) => state.switching);
  const tenants = useStore(runtime.getTenantStore(), (state) => state.tenants);
  const openTab = useStore(tabStore, (state) => state.open);
  const relabelTabs = useStore(tabStore, (state) => state.relabel);
  const retainTabs = useStore(tabStore, (state) => state.retain);
  const tabs = useStore(tabStore, (state) => state.tabs);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const route = useMemo(() => findWorkbenchRoute(routes, location.pathname), [location.pathname, routes]);
  const isRootPath = location.pathname.replace(/\/+$/, "") === "";
  const routeTrail = useMemo(() => findRouteTrail(routes, location.pathname), [location.pathname, routes]);
  const routePaths = useMemo(
    () => new Set(flattenRoutes(routes).map((item) => item.path)),
    [routes],
  );
  const renderedRoutes = useMemo(() => {
    const entries = tabs
      .map((tab) => findWorkbenchRoute(routes, tab.path))
      .filter((candidate): candidate is WorkbenchRoute => Boolean(candidate?.keepAlive));
    if (route && !entries.some((candidate) => candidate.path === route.path)) {
      entries.push(route);
    }
    return entries;
  }, [route, routes, tabs]);

  useEffect(() => {
    retainTabs(routePaths);
  }, [retainTabs, routePaths]);

  useEffect(() => {
    if (isRootPath && rootLandingPath) {
      void navigate(rootLandingPath, { replace: true });
    }
  }, [isRootPath, navigate, rootLandingPath]);

  useEffect(() => {
    if (route && !route.hideInTab && !route.externalHref) {
      openTab({
        generation: route.generation,
        path: route.path,
        query: location.search,
        title: route.titleKey ? t(route.titleKey, { defaultValue: route.title }) : route.title,
        titleKey: route.titleKey,
      });
    }
  }, [location.search, openTab, route, t]);

  useEffect(() => {
    const localizedTitles = new Map<string, string>();
    for (const tab of tabStore.getState().tabs) {
      const tabRoute = findWorkbenchRoute(routes, tab.path);
      if (tabRoute) {
        localizedTitles.set(
          tab.path,
          tabRoute.titleKey
            ? t(tabRoute.titleKey, { defaultValue: tabRoute.title })
            : tabRoute.title,
        );
      }
    }
    relabelTabs(localizedTitles);
  }, [i18n.resolvedLanguage, relabelTabs, routes, t]);

  function go(path: string) {
    const target = flattenRoutes(routes).find((item) => item.path === path);
    if (target?.externalHref) {
      const href = safeNavigationTarget(target.externalHref);
      if (href) {
        window.open(href, "_blank", "noopener,noreferrer");
      }
    } else {
      void navigate(path);
    }
    setMobileOpen(false);
  }

  function changeTenant(tenantId: number) {
    const target = tenants.find((tenant) => tenant.id === tenantId);
    if (!target || target.id === currentTenantId) return;
    if (currentTenantId) void runtime.switchTenant(target.id);
    else void runtime.impersonate(target);
  }

  return (
    <Layout className="workbench-layout" hasSider>
      <Layout.Sider className="workbench-sider">
        <div className="workbench-brand">
          <span className="workbench-brand-mark">
            <img alt={appName} height="32" src={logoUrl} width="32" />
          </span>
          <Typography.Text strong>{appName}</Typography.Text>
        </div>
        <WorkbenchNavigation activePath={location.pathname} onNavigate={go} routes={routes} />
      </Layout.Sider>
      <Layout>
        <Layout.Header className="workbench-layout-header">
          <WorkbenchHeader
            currentTenantId={currentTenantId}
            defaultAvatarUrl={defaultAvatarUrl}
            onLogout={() => void runtime.logout()}
            onOpenNavigation={() => setMobileOpen(true)}
            onOpenPreferences={() => setPreferencesOpen(true)}
            onOpenProfile={() => {
              const profilePath = flattenRoutes(routes).find(
                (item) => item.componentKey === "profile/index",
              )?.path;
              void navigate(profilePath || "/profile");
            }}
            onTenantChange={changeTenant}
            pluginActionsAfter={headerActionsAfter}
            pluginActionsBefore={headerActionsBefore}
            tenantSwitchDisabled={impersonating || switchingTenant}
            tenants={tenants}
            userDropdownAfter={userDropdownAfter}
          />
        </Layout.Header>
        <TabStrip activePath={location.pathname} onNavigate={go} />
        {contentNotice}
        {routeTrail.length > 0 ? (
          <Breadcrumb aria-label="breadcrumb" className="workbench-breadcrumb">
            {routeTrail
              .filter((item) => !item.hideInBreadcrumb)
              .map((item) => (
                <Breadcrumb.Item key={item.id}>
                  {item.titleKey ? t(item.titleKey, { defaultValue: item.title }) : item.title}
                </Breadcrumb.Item>
              ))}
          </Breadcrumb>
        ) : null}
        <Layout.Content className="workbench-content">
          {route ? null : isRootPath && rootLandingPath !== undefined ? (
            rootLandingPath ? (
              <p aria-live="polite" role="status">{t("workbench.loadingPage")}</p>
            ) : (
              <NoAccessiblePage />
            )
          ) : (
            <RouteView registry={registry} />
          )}
          {renderedRoutes.map((renderedRoute) => (
            <div
              data-route-cache-path={renderedRoute.path}
              hidden={renderedRoute.path !== route?.path}
              key={`${renderedRoute.path}:${renderedRoute.generation ?? 0}:${currentTenantId ?? "platform"}`}
            >
              <RouteView registry={registry} route={renderedRoute} />
            </div>
          ))}
        </Layout.Content>
        <Layout.Footer className="workbench-footer">
          <footer>Copyright © {new Date().getFullYear()} {appName}</footer>
        </Layout.Footer>
      </Layout>
      <SideSheet
        aria-label={t("workbench.navigation.mobile")}
        onCancel={() => setMobileOpen(false)}
        title={t("workbench.navigation.title")}
        visible={mobileOpen}
        width="min(320px, 100vw)"
      >
        <WorkbenchNavigation activePath={location.pathname} onNavigate={go} routes={routes} />
      </SideSheet>
      <SideSheet
        onCancel={() => setPreferencesOpen(false)}
        title={(
          <div className="preferences-drawer-heading">
            <Typography.Title data-testid="preferences-drawer-title" heading={4}>
              {t("workbench.preferences.title")}
            </Typography.Title>
            <Typography.Text data-testid="preferences-drawer-subtitle" type="tertiary">
              {t("workbench.preferences.subtitle")}
            </Typography.Text>
          </div>
        )}
        visible={preferencesOpen}
        width="min(420px, 100vw)"
      >
        <Tabs>
          <Tabs.TabPane itemKey="theme" tab={t("workbench.preferences.theme")}>
            <Typography.Paragraph>{t("workbench.preferences.themeDescription")}</Typography.Paragraph>
            <Button onClick={() => applyThemePreference("light")}>{t("workbench.preferences.light")}</Button>
            <Button onClick={() => applyThemePreference("dark")}>{t("workbench.preferences.dark")}</Button>
          </Tabs.TabPane>
          <Tabs.TabPane itemKey="layout" tab={t("workbench.preferences.layout")}>
            <Typography.Paragraph>{t("workbench.preferences.layoutDescription")}</Typography.Paragraph>
          </Tabs.TabPane>
          <Tabs.TabPane itemKey="shortcuts" tab={t("workbench.preferences.shortcuts")}>
            <Typography.Paragraph>{t("workbench.preferences.shortcutsDescription")}</Typography.Paragraph>
          </Tabs.TabPane>
          <Tabs.TabPane itemKey="general" tab={t("workbench.preferences.general")}>
            <Typography.Paragraph>{t("workbench.preferences.language")}</Typography.Paragraph>
            <Select
              onChange={(value) => void runtimeI18n?.changeLanguage(value === "zh-CN" ? "zh-CN" : "en-US")}
              optionList={[
                { label: t("workbench.preferences.english"), value: "en-US" },
                { label: t("workbench.preferences.simplifiedChinese"), value: "zh-CN" },
              ]}
              value={i18n.resolvedLanguage === "zh-CN" ? "zh-CN" : "en-US"}
            />
          </Tabs.TabPane>
        </Tabs>
      </SideSheet>
    </Layout>
  );
}

function findRouteTrail(
  routes: readonly WorkbenchRoute[],
  path: string,
  parents: readonly WorkbenchRoute[] = [],
): WorkbenchRoute[] {
  for (const candidate of routes) {
    const trail = [...parents, candidate];
    if (findWorkbenchRoute([candidate], path)?.path === path.replace(/\/+$/, "") || path === candidate.path) {
      const direct = findWorkbenchRoute([candidate], path);
      if (direct && direct.id === candidate.id) return trail;
    }
    const nested = findRouteTrail(candidate.children, path, trail);
    if (nested.length > 0) return nested;
  }
  return [];
}
