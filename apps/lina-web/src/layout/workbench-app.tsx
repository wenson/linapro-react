import Banner from "@douyinfe/semi-ui/lib/es/banner";
import Button from "@douyinfe/semi-ui/lib/es/button";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useStore } from "zustand";
import { sourcePluginUI } from "virtual:linapro-plugin-ui";

import type { ApiClient } from "#/api/client";
import { createPluginRuntimeApi } from "#/api/plugins";
import { WorkbenchRuntimeProvider } from "#/app/workbench-runtime-provider";
import { createReadonlyPermissionSet } from "#/plugin-ui/plugin-host-context";
import type { PublicFrontendConfig } from "#/runtime/public-config";
import { resolveWorkspaceAssetUrl } from "#/runtime/public-config";
import { useAuthContext, useAuthContextRefresh } from "#/auth/auth-context";
import { AuthRuntime } from "#/auth/auth-runtime";
import { WorkbenchLayout } from "#/layout/workbench-layout";
import { LinaPluginHostProvider } from "#/plugin-ui/plugin-host-provider";
import { createPluginHostApi } from "#/plugin-ui/plugin-host-context";
import {
  attachPluginPagesToRoutes,
  createPluginUIRegistry,
  projectPluginPageRegistry,
} from "#/plugin-ui/registry";
import { PluginSlotOutlet } from "#/plugin-ui/slot-outlet";
import { installPluginTenantActions } from "#/plugin-ui/tenant-actions";
import { PluginUIRegistryProvider } from "#/plugin-ui/registry-provider";
import { planPluginGenerationRefresh } from "#/plugin-ui/generation-refresh";
import { managementCapabilityKeys } from "#/plugins/capabilities";
import { MessageIndicator } from "#/features/settings/message/message-indicator";
import { hostPages } from "#/router/host-pages";
import { hostSupplementalRoutes } from "#/router/host-routes";
import {
  findWorkbenchRoute,
  flattenRoutes,
  projectMenuTree,
  resolveWorkbenchLandingPath,
} from "#/router/project-menu";

interface PendingPluginRefresh {
  generation: number;
  pluginId: string;
  version: string;
}

export function WorkbenchApp({ apiClient, config, runtime }: {
  apiClient: ApiClient;
  config: PublicFrontendConfig;
  runtime: AuthRuntime;
}) {
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const context = useAuthContext();
  const refreshAuthContext = useAuthContextRefresh();
  const tenant = useStore(runtime.getTenantStore(), (state) => state.currentTenant);
  const impersonated = useStore(runtime.getTenantStore(), (state) => state.impersonation.active);
  const api = useMemo(() => createPluginHostApi(apiClient), [apiClient]);
  const pluginRuntimeApi = useMemo(() => createPluginRuntimeApi(apiClient), [apiClient]);
  const pluginSyncInFlight = useRef<null | Promise<void>>(null);
  const [pendingPluginRefresh, setPendingPluginRefresh] = useState<PendingPluginRefresh>();
  const [refreshingPlugin, setRefreshingPlugin] = useState(false);
  const permissions = useMemo(
    () => createReadonlyPermissionSet(context?.user.permissions ?? []),
    [context?.user.permissions],
  );
  const availableCapabilities = useMemo(() => {
    const values = new Set<string>();
    if (context?.capabilities.organizationEnabled) {
      values.add(managementCapabilityKeys.organization);
    }
    if (context?.capabilities.tenantEnabled) {
      values.add(managementCapabilityKeys.tenant);
    }
    return values;
  }, [context?.capabilities.organizationEnabled, context?.capabilities.tenantEnabled]);
  const pluginRegistry = useMemo(
    () => createPluginUIRegistry(sourcePluginUI, context?.plugins ?? [], availableCapabilities),
    [availableCapabilities, context?.plugins],
  );
  const routes = useMemo(
    () => [
      ...attachPluginPagesToRoutes(projectMenuTree(context?.menus ?? []), pluginRegistry),
      ...hostSupplementalRoutes,
    ],
    [context?.menus, pluginRegistry],
  );
  const rootLandingPath = useMemo(
    () => resolveWorkbenchLandingPath(context?.user.homePath, routes) ?? null,
    [context?.user.homePath, routes],
  );
  const currentRoute = useMemo(
    () => findWorkbenchRoute(routes, location.pathname),
    [location.pathname, routes],
  );
  const pageRegistry = useMemo(
    () => ({ ...hostPages, ...projectPluginPageRegistry(pluginRegistry) }),
    [pluginRegistry],
  );
  const hostValue = useMemo(() => ({
    api,
    locale: i18n.resolvedLanguage === "zh-CN" ? "zh-CN" as const : "en-US" as const,
    permissions,
    t: (key: string, options?: Record<string, unknown>) => t(key, options),
    tenant: tenant ? { code: tenant.code, id: tenant.id, impersonated, name: tenant.name } : null,
    user: {
      id: context?.user.userId ?? 0,
      name: context?.user.realName || context?.user.username || "",
    },
  }), [api, context?.user.realName, context?.user.userId, context?.user.username, i18n.resolvedLanguage, impersonated, permissions, t, tenant]);

  const synchronizePluginRegistry = useCallback(() => {
    if (
      pluginSyncInFlight.current ||
      (document.visibilityState && document.visibilityState !== "visible")
    ) {
      return;
    }

    const currentPluginId = currentRoute?.pluginId;
    const previous = context?.plugins ?? [];
    const task = pluginRuntimeApi.getRuntimeStates().then(async (next) => {
      const plan = planPluginGenerationRefresh(previous, next, currentPluginId);
      if (!plan.shouldRebuildRoutes) return;

      const before = previous.find((item) => item.id === currentPluginId);
      const after = next.find((item) => item.id === currentPluginId);
      if (
        plan.shouldInterruptCurrentPage &&
        before?.installed === 1 &&
        before.enabled === 1 &&
        after?.installed === 1 &&
        after.enabled === 1
      ) {
        setPendingPluginRefresh({
          generation: after.generation,
          pluginId: after.id,
          version: after.version,
        });
        return;
      }

      await refreshAuthContext?.();
    }).catch(() => {
      // Focus synchronization is opportunistic; the current page remains usable.
    }).finally(() => {
      pluginSyncInFlight.current = null;
    });
    pluginSyncInFlight.current = task;
  }, [context?.plugins, currentRoute?.pluginId, pluginRuntimeApi, refreshAuthContext]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") synchronizePluginRegistry();
    }
    window.addEventListener("focus", synchronizePluginRegistry);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", synchronizePluginRegistry);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [synchronizePluginRegistry]);

  async function applyPendingPluginRefresh() {
    if (!pendingPluginRefresh || !refreshAuthContext || refreshingPlugin) return;
    setRefreshingPlugin(true);
    try {
      const refreshed = await refreshAuthContext();
      const refreshedRoutes = projectMenuTree(refreshed.menus);
      const candidates = flattenRoutes(refreshedRoutes);
      const target = candidates.find((route) => route.id === currentRoute?.id)
        ?? candidates.find((route) => route.pluginId === pendingPluginRefresh.pluginId);
      if (target && target.path !== location.pathname) {
        await navigate(target.path, { replace: true });
      }
      setPendingPluginRefresh(undefined);
    } finally {
      setRefreshingPlugin(false);
    }
  }

  const pluginRefreshNotice = pendingPluginRefresh ? (
    <div className="plugin-generation-refresh-notice" data-testid="plugin-generation-refresh-notice" role="alert">
      <Banner
        description={(
          <div className="plugin-generation-refresh-notice-content">
            <span>
              {t("page.plugin.dynamicPage.refreshNoticeDescription")} ({pendingPluginRefresh.version})
            </span>
            <Button
              loading={refreshingPlugin}
              onClick={() => void applyPendingPluginRefresh()}
              size="small"
              theme="solid"
              type="primary"
            >
              {t("page.plugin.dynamicPage.refreshNoticeAction")}
            </Button>
          </div>
        )}
        title={t("page.plugin.dynamicPage.refreshNoticeTitle")}
        type="warning"
      />
    </div>
  ) : undefined;

  useEffect(() => installPluginTenantActions({
    exitImpersonation: async () => { await runtime.exitImpersonation(); },
    impersonate: async (target, reason) => { await runtime.impersonate(target, reason); },
    switchTenant: async (tenantId) => { await runtime.switchTenant(tenantId); },
  }), [runtime]);

  return (
    <WorkbenchRuntimeProvider value={{ apiClient, config, tenantStore: runtime.getTenantStore() }}>
      <LinaPluginHostProvider value={hostValue}>
        <PluginUIRegistryProvider registry={pluginRegistry}>
          <WorkbenchLayout
            appName={config.app.name}
            contentNotice={pluginRefreshNotice}
            defaultAvatarUrl={resolveWorkspaceAssetUrl(
              config.user.defaultAvatar,
              config.workspace.basePath,
            )}
            headerActionsBefore={<PluginSlotOutlet items={pluginRegistry.slots["layout.header.actions.before"]} />}
            headerActionsAfter={<>
              <span className="workbench-header-message-action"><MessageIndicator apiClient={apiClient} /></span>
              <span className="workbench-header-extra-action"><PluginSlotOutlet items={pluginRegistry.slots["layout.header.actions.after"]} /></span>
            </>}
            registry={pageRegistry}
            logoUrl={resolveWorkspaceAssetUrl(config.app.logo, config.workspace.basePath)}
            routes={routes}
            rootLandingPath={rootLandingPath}
            runtime={runtime}
            userDropdownAfter={<PluginSlotOutlet items={pluginRegistry.slots["layout.user-dropdown.after"]} />}
          />
        </PluginUIRegistryProvider>
      </LinaPluginHostProvider>
    </WorkbenchRuntimeProvider>
  );
}
