import { createMemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { ApiClient } from "#/api/client";
import { bootstrapApp } from "#/app/bootstrap";
import type { RuntimeI18nService } from "#/runtime/i18n";
import { runtimeI18n } from "#/runtime/i18n";
import type { SupportedLocale } from "#/runtime/i18n";
import { defaultPublicFrontendConfig } from "#/runtime/public-config";

describe("bootstrapApp", () => {
  it("loads config, initializes i18n, creates the router and then mounts React", async () => {
    const order: string[] = [];
    const apiClient = {} as ApiClient;
    const rootElement = document.createElement("div");
    const startupLoadingElement = document.createElement("div");
    startupLoadingElement.innerHTML = '<span data-testid="app-startup-loading-title">LinaPro</span>';
    document.body.append(startupLoadingElement);
    const router = createMemoryRouter([{ element: <div>ready</div>, path: "/" }]);
    const root = { render: vi.fn(() => order.push("render")) };
    const loadConfig = vi.fn(async () => {
      order.push("config");
      return defaultPublicFrontendConfig;
    });
    const initializeI18n = vi.fn(async () => {
      order.push("i18n");
      return {
        getLocaleState: () => ({ locale: "en-US" }),
        i18n: runtimeI18n,
      } as RuntimeI18nService;
    });
    const createRouter = vi.fn(() => {
      order.push("router");
      return router;
    });
    const createRoot = vi.fn(() => {
      order.push("root");
      return root;
    });

    await bootstrapApp({
      apiClient,
      createRoot,
      createRouter,
      initializeI18n,
      loadConfig,
      rootElement,
      startupLoadingElement,
      themeStorage: null,
    });

    expect(order).toEqual(["config", "i18n", "router", "root", "render"]);
    expect(root.render).toHaveBeenCalledOnce();
    expect(startupLoadingElement.isConnected).toBe(false);
  });

  it("projects public branding into the document title before mounting", async () => {
    const originalTitle = document.title;
    const apiClient = {} as ApiClient;
    const rootElement = document.createElement("div");
    const startupLoadingElement = document.createElement("div");
    const loadingTitle = document.createElement("span");
    loadingTitle.dataset.testid = "app-startup-loading-title";
    startupLoadingElement.append(loadingTitle);
    document.body.append(startupLoadingElement);
    const router = createMemoryRouter([{ element: <div>ready</div>, path: "/" }]);
    const brandedConfig = {
      ...defaultPublicFrontendConfig,
      app: { ...defaultPublicFrontendConfig.app, name: "Lina React Workbench" },
    };

    try {
      await bootstrapApp({
        apiClient,
        createRoot: () => ({ render: vi.fn() }),
        createRouter: () => router,
        initializeI18n: async () => ({
          getLocaleState: () => ({ locale: "en-US" }),
          i18n: runtimeI18n,
        }) as RuntimeI18nService,
        loadConfig: async () => brandedConfig,
        rootElement,
        startupLoadingElement,
        themeStorage: null,
      });

      expect(document.title).toBe("Lina React Workbench");
      expect(loadingTitle).toHaveTextContent("Lina React Workbench");
    } finally {
      startupLoadingElement.remove();
      document.title = originalTitle;
    }
  });

  it("reloads localized public config when the host selects a different default locale", async () => {
    document.documentElement.lang = "en-US";
    const apiClient = {} as ApiClient;
    const rootElement = document.createElement("div");
    const router = createMemoryRouter([{ element: <div>ready</div>, path: "/" }]);
    const requestedLocales: SupportedLocale[] = [];
    const loadConfig = vi.fn(async (client: ApiClient, locale: SupportedLocale) => {
      expect(client).toBe(apiClient);
      requestedLocales.push(locale);
      return defaultPublicFrontendConfig;
    });
    const initializeI18n = vi.fn(async () =>
      ({
        getLocaleState: () => ({ locale: "zh-CN" }),
        i18n: runtimeI18n,
      }) as RuntimeI18nService,
    );

    await bootstrapApp({
      apiClient,
      createRoot: () => ({ render: vi.fn() }),
      createRouter: () => router,
      initializeI18n,
      loadConfig,
      rootElement,
      themeStorage: null,
    });

    expect(requestedLocales).toEqual(["en-US", "zh-CN"]);
  });
});
