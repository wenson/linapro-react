import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import type { ReactNode } from "react";
import { RouterProvider } from "react-router-dom";
import type { QueryClient } from "@tanstack/react-query";

import { ApiClient } from "#/api/client";
import { createAuthApi } from "#/api/auth";
import { createMenuApi } from "#/api/menu";
import { createPluginRuntimeApi } from "#/api/plugins";
import { createTenantApi } from "#/api/tenant";
import { createUserApi } from "#/api/user";
import { ErrorBoundary } from "#/app/error-boundary";
import { Providers } from "#/app/providers";
import { applyTheme, resolveEffectiveTheme } from "#/app/theme";
import { AuthRuntime } from "#/auth/auth-runtime";
import { createApiSessionAdapter } from "#/auth/session-adapter";
import { createSessionStore } from "#/auth/session-store";
import type { SessionStore } from "#/auth/session-store";
import { createRuntimeRouter } from "#/router/runtime-router";
import { readLocalePreference, RuntimeI18nService, runtimeI18n } from "#/runtime/i18n";
import type { SupportedLocale } from "#/runtime/i18n";
import { loadPublicFrontendConfig } from "#/runtime/public-config";
import type { PublicFrontendConfig } from "#/runtime/public-config";
import { queryClient as defaultQueryClient } from "#/runtime/query-client";
import { createTenantStore } from "#/tenant/tenant-store";
import type { TenantStore } from "#/tenant/tenant-store";
import { tabStore } from "#/layout/tab-store";

interface RenderRoot {
  render(children: ReactNode): void;
}

export interface BootstrapDependencies {
  apiClient?: ApiClient;
  authRuntime?: AuthRuntime;
  createRoot?: (container: Element | DocumentFragment) => RenderRoot;
  createRouter?: (
    config: PublicFrontendConfig,
    authRuntime: AuthRuntime,
    apiClient: ApiClient,
  ) => ReturnType<typeof createRuntimeRouter>;
  initializeI18n?: (
    client: ApiClient,
    locale: SupportedLocale,
  ) => Promise<RuntimeI18nService>;
  loadConfig?: (client: ApiClient, locale: SupportedLocale) => Promise<PublicFrontendConfig>;
  queryClient?: QueryClient;
  rootElement?: HTMLElement;
  sessionStore?: SessionStore;
  startupLoadingElement?: HTMLElement | null;
  tenantStore?: TenantStore;
  themeStorage?: null | Storage;
}

export interface BootstrapResult {
  apiClient: ApiClient;
  authRuntime: AuthRuntime;
  config: PublicFrontendConfig;
  i18n: RuntimeI18nService;
  root: RenderRoot;
  router: ReturnType<typeof createRuntimeRouter>;
}

function initialLocale(): SupportedLocale {
  const preference = readLocalePreference(window.localStorage);
  if (preference) {
    return preference;
  }
  const candidate = navigator.language || document.documentElement.lang;
  return candidate === "zh-CN" ? "zh-CN" : "en-US";
}

async function defaultInitializeI18n(
  client: ApiClient,
  locale: SupportedLocale,
): Promise<RuntimeI18nService> {
  const service = new RuntimeI18nService({ client, i18n: runtimeI18n });
  await service.initialize(locale);
  return service;
}

export async function bootstrapApp(dependencies: BootstrapDependencies = {}): Promise<BootstrapResult> {
  const locale = initialLocale();
  const activeQueryClient = dependencies.queryClient ?? defaultQueryClient;
  const activeSessionStore = dependencies.sessionStore ?? createSessionStore();
  const activeTenantStore = dependencies.tenantStore ?? createTenantStore();
  const sessionAdapter = createApiSessionAdapter({
    queryClient: activeQueryClient,
    sessionStore: activeSessionStore,
    tenantStore: activeTenantStore,
  });
  const client =
    dependencies.apiClient ??
    new ApiClient({
      getLocale: () => document.documentElement.lang || locale,
      session: sessionAdapter,
      translate: (key, params) => runtimeI18n.t(key, params),
    });
  const authRuntime =
    dependencies.authRuntime ??
    new AuthRuntime({
      apis: {
        auth: createAuthApi(client),
        menu: createMenuApi(client),
        plugins: createPluginRuntimeApi(client),
        tenant: createTenantApi(client),
        user: createUserApi(client),
      },
      queryClient: activeQueryClient,
      requestContext: sessionAdapter,
      sessionStore: activeSessionStore,
      tenantStore: activeTenantStore,
    });
  const loadConfig = dependencies.loadConfig ?? ((api, activeLocale) =>
    loadPublicFrontendConfig(api, { locale: activeLocale }));
  const initializeI18n = dependencies.initializeI18n ?? defaultInitializeI18n;
  const createRouter = dependencies.createRouter ?? createRuntimeRouter;
  const rootElement = dependencies.rootElement ?? document.getElementById("root");
  const startupLoadingElement = dependencies.startupLoadingElement === undefined
    ? document.getElementById("app-startup-loading")
    : dependencies.startupLoadingElement;
  const themeStorage = dependencies.themeStorage === undefined
    ? window.localStorage
    : dependencies.themeStorage;
  if (!rootElement) {
    throw new Error("React root element was not found");
  }

  let config = await loadConfig(client, locale);
  document.title = config.app.name;
  startupLoadingElement?.querySelector("[data-testid='app-startup-loading-title']")
    ?.replaceChildren(config.app.name);
  applyTheme(resolveEffectiveTheme(config.ui.themeMode, themeStorage));
  const i18n = await initializeI18n(client, locale);
  const resolvedLocale = i18n.getLocaleState().locale;
  if (resolvedLocale !== locale) {
    config = await loadConfig(client, resolvedLocale);
    document.title = config.app.name;
    startupLoadingElement?.querySelector("[data-testid='app-startup-loading-title']")
      ?.replaceChildren(config.app.name);
    applyTheme(resolveEffectiveTheme(config.ui.themeMode, themeStorage));
  }
  const router = createRouter(config, authRuntime, client);
  authRuntime.setTransitionEffects({
    clearTabs: async () => {
      tabStore.getState().clear();
      const queryKey = ["runtime", "navigation", "tabs"] as const;
      await activeQueryClient.cancelQueries({ queryKey });
      activeQueryClient.removeQueries({ queryKey });
    },
    refreshDictionaries: () =>
      activeQueryClient.invalidateQueries({ queryKey: ["runtime", "dictionary"] }),
    refreshMessages: () => i18n.refreshCurrentMessages(),
    resetDefaultRoute: async () => {
      await router.navigate("/", { replace: true });
    },
  });
  const rootFactory = dependencies.createRoot ?? ((container) => createRoot(container));
  const root = rootFactory(rootElement);
  root.render(
    <StrictMode>
      <Providers
        i18n={i18n.i18n}
        queryClient={activeQueryClient}
        runtimeI18nService={i18n}
      >
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
      </Providers>
    </StrictMode>,
  );
  startupLoadingElement?.remove();

  return { apiClient: client, authRuntime, config, i18n, root, router };
}
