import { createInstance } from "i18next";
import { describe, expect, it, vi } from "vitest";

import type { ApiClient } from "#/api/client";
import {
  localePreferenceStorageKey,
  RuntimeI18nService,
  runtimeMessagesCacheTtl,
  semiLocaleFor,
} from "#/runtime/i18n";

function runtimeMessagesResponse(locale: string, messages: Record<string, unknown>, etag = '"etag-1"') {
  return new Response(JSON.stringify({ code: 0, data: { locale, messages } }), {
    headers: { "Content-Type": "application/json", ETag: etag },
    status: 200,
  });
}

function createClient(overrides: {
  get?: ReturnType<typeof vi.fn>;
  requestRaw?: ReturnType<typeof vi.fn>;
}) {
  return {
    get:
      overrides.get ??
      vi.fn().mockResolvedValue({
        enabled: true,
        items: [
          { isDefault: true, locale: "en-US", name: "English", nativeName: "English" },
          { locale: "zh-CN", name: "Chinese", nativeName: "简体中文" },
        ],
        locale: "en-US",
      }),
    requestRaw: overrides.requestRaw ?? vi.fn().mockResolvedValue(runtimeMessagesResponse("en-US", {})),
  } as unknown as ApiClient;
}

describe("RuntimeI18nService", () => {
  it("persists the active locale for the next workbench bootstrap", async () => {
    const service = new RuntimeI18nService({
      client: createClient({
        requestRaw: vi
          .fn()
          .mockResolvedValueOnce(runtimeMessagesResponse("en-US", {}))
          .mockResolvedValueOnce(runtimeMessagesResponse("zh-CN", {})),
      }),
      i18n: createInstance(),
      storage: localStorage,
    });

    await service.initialize("en-US");
    await service.changeLanguage("zh-CN");

    expect(JSON.parse(localStorage.getItem(localePreferenceStorageKey) || "{}")).toEqual({
      value: "zh-CN",
    });
  });

  it("uses the backend default locale and hides switching when i18n is disabled", async () => {
    const client = createClient({
      get: vi.fn().mockResolvedValue({
        enabled: false,
        items: [
          { locale: "en-US", name: "English" },
          { isDefault: true, locale: "zh-CN", nativeName: "简体中文" },
        ],
        locale: "zh-CN",
      }),
      requestRaw: vi.fn().mockResolvedValue(
        runtimeMessagesResponse("zh-CN", { app: { startup: { status: "运行时覆盖" } } }),
      ),
    });
    const i18n = createInstance();
    const service = new RuntimeI18nService({ client, i18n, storage: null });

    const state = await service.initialize("en-US");

    expect(state).toMatchObject({ enabled: false, locale: "zh-CN", switcherVisible: false });
    expect(document.documentElement.lang).toBe("zh-CN");
    expect(i18n.t("app.startup.status")).toBe("运行时覆盖");
    expect(semiLocaleFor("zh-CN")).not.toBe(semiLocaleFor("en-US"));
  });

  it("sends If-None-Match and reuses persisted messages on 304", async () => {
    const now = 2_000_000;
    localStorage.setItem(
      "linapro:i18n:runtime:en-US",
      JSON.stringify({ etag: '"cached"', messages: { cached: "value" }, savedAt: now - 10 }),
    );
    const requestRaw = vi.fn().mockResolvedValue(new Response(null, { status: 304 }));
    const service = new RuntimeI18nService({
      client: createClient({ requestRaw }),
      i18n: createInstance(),
      now: () => now,
      storage: localStorage,
    });

    const messages = await service.loadRuntimeMessages("en-US", { force: true });

    expect(messages).toEqual({ cached: "value" });
    const headers = new Headers(requestRaw.mock.calls[0]?.[1]?.headers);
    expect(headers.get("If-None-Match")).toBe('"cached"');
    expect(requestRaw).toHaveBeenCalledOnce();
  });

  it("applies a background ETag refresh after starting from a fresh cache", async () => {
    const now = 2_500_000;
    localStorage.setItem(
      "linapro:i18n:runtime:en-US",
      JSON.stringify({
        etag: '"cached"',
        messages: { app: { startup: { status: "Cached status" } } },
        savedAt: now - 10,
      }),
    );
    const requestRaw = vi.fn().mockResolvedValue(
      runtimeMessagesResponse(
        "en-US",
        { app: { startup: { status: "Refreshed status" } } },
        '"new"',
      ),
    );
    const i18n = createInstance();
    const service = new RuntimeI18nService({
      client: createClient({ requestRaw }),
      i18n,
      now: () => now,
      storage: localStorage,
    });

    await service.initialize("en-US");

    await vi.waitFor(() => {
      expect(i18n.t("app.startup.status")).toBe("Refreshed status");
    });
  });

  it("retries at most twice and falls back to an expired persistent bundle", async () => {
    const now = 3_000_000;
    localStorage.setItem(
      "linapro:i18n:runtime:en-US",
      JSON.stringify({
        etag: '"stale"',
        messages: { offline: "available" },
        savedAt: now - runtimeMessagesCacheTtl - 1,
      }),
    );
    const requestRaw = vi.fn().mockRejectedValue(new TypeError("offline"));
    const service = new RuntimeI18nService({
      client: createClient({ requestRaw }),
      i18n: createInstance(),
      now: () => now,
      storage: localStorage,
    });

    await expect(service.loadRuntimeMessages("en-US")).resolves.toEqual({ offline: "available" });
    expect(requestRaw).toHaveBeenCalledTimes(2);
  });

  it("accepts an empty runtime message bundle", async () => {
    const service = new RuntimeI18nService({
      client: createClient({
        requestRaw: vi.fn().mockResolvedValue(runtimeMessagesResponse("en-US", {})),
      }),
      i18n: createInstance(),
      storage: null,
    });

    await expect(service.loadRuntimeMessages("en-US", { force: true })).resolves.toEqual({});
  });

  it("refreshes locale-dependent projections without requesting user info", async () => {
    const get = vi.fn().mockResolvedValue({
      enabled: true,
      items: [
        { isDefault: true, locale: "en-US", name: "English" },
        { locale: "zh-CN", nativeName: "简体中文" },
      ],
      locale: "en-US",
    });
    const requestRaw = vi
      .fn()
      .mockResolvedValueOnce(runtimeMessagesResponse("en-US", {}))
      .mockResolvedValueOnce(runtimeMessagesResponse("zh-CN", {}));
    const service = new RuntimeI18nService({
      client: createClient({ get, requestRaw }),
      i18n: createInstance(),
      storage: null,
    });
    const effects = {
      refreshBreadcrumbs: vi.fn(),
      refreshMenu: vi.fn(),
      refreshPluginMessages: vi.fn(),
      refreshPublicConfig: vi.fn(),
      refreshTabs: vi.fn(),
      updateApiDocsLanguage: vi.fn(),
    };
    await service.initialize("en-US");

    await service.changeLanguage("zh-CN", effects);

    for (const effect of Object.values(effects)) {
      expect(effect).toHaveBeenCalledWith("zh-CN");
    }
    expect(document.documentElement.lang).toBe("zh-CN");
    expect(get.mock.calls.some(([path]) => path === "/user/info" || path === "user/info")).toBe(false);
  });
});
