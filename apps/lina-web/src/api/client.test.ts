import { describe, expect, it, vi } from "vitest";

import { ApiClient, pluginApiPath } from "#/api/client";
import type { ApiClientSession, ApiTokenPair } from "#/api/client";
import { ApiError } from "#/api/contracts";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

function createSession() {
  let accessToken: null | string = "access-old";
  let refreshToken: null | string = "refresh-token";
  let tenantCode: null | string = "tenant-a";
  const clearSession = vi.fn(() => {
    accessToken = null;
    refreshToken = null;
    tenantCode = null;
  });
  const setTokens = vi.fn((tokens: ApiTokenPair) => {
    accessToken = tokens.accessToken;
    refreshToken = tokens.refreshToken || refreshToken;
  });
  const beginRefresh = vi.fn();
  const session: ApiClientSession = {
    beginRefresh,
    clearSession,
    getAccessToken: () => accessToken,
    getRefreshToken: () => refreshToken,
    getTenantCode: () => tenantCode,
    setTokens,
  };
  return { beginRefresh, clearSession, session, setTokens };
}

describe("ApiClient", () => {
  it("binds the browser fetch implementation to the global scope", async () => {
    const browserFetch = vi.fn(function (this: unknown) {
      if (this !== globalThis) {
        throw new TypeError("Illegal invocation");
      }
      return Promise.resolve(jsonResponse({ code: 0, data: { ok: true } }));
    }) as typeof fetch;
    vi.stubGlobal("fetch", browserFetch);

    try {
      const client = new ApiClient();

      await expect(client.get<{ ok: boolean }>("health")).resolves.toEqual({ ok: true });
      expect(browserFetch).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("adds authentication, locale and tenant headers", async () => {
    const { session } = createSession();
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse({ code: 0, data: { id: 7 } }));
    const client = new ApiClient({ fetch: fetchMock, getLocale: () => "zh-CN", session });

    await expect(client.get<{ id: number }>("users/current")).resolves.toEqual({ id: 7 });

    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/users/current");
    expect(headers.get("Authorization")).toBe("Bearer access-old");
    expect(headers.get("Accept-Language")).toBe("zh-CN");
    expect(headers.get("X-Tenant-Code")).toBe("tenant-a");
  });

  it("preserves an explicit language header for locale-specific refreshes", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse({ code: 0, data: {} }));
    const client = new ApiClient({ fetch: fetchMock, getLocale: () => "en-US" });

    await client.get("config/public/frontend", {
      headers: { "Accept-Language": "zh-CN" },
    });

    expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get("Accept-Language")).toBe("zh-CN");
  });

  it("projects localized business errors with an English fallback", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        code: 42001,
        error: "Provider is unavailable",
        messageKey: "errors.providerUnavailable",
        messageParams: { provider: "demo" },
      }),
    );
    const client = new ApiClient({
      fetch: fetchMock,
      translate: (key, params) => (key === "errors.providerUnavailable" ? `${params.provider}不可用` : key),
    });

    const error = await client.get("providers").catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: 42001,
      fallback: "Provider is unavailable",
      message: "demo不可用",
      messageKey: "errors.providerUnavailable",
    });
  });

  it("rejects multipart responses that carry a business error in an HTTP 200 envelope", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        code: 40001,
        message: "The uploaded file is too large",
        messageKey: "error.upload.file.too.large",
        messageParams: { maxSizeMB: 100 },
      }),
    );
    const client = new ApiClient({
      fetch: fetchMock,
      translate: (key) => key === "error.upload.file.too.large"
        ? "文件大小不能超过{maxSizeMB}MB"
        : key,
    });
    const formData = new FormData();
    formData.set("file", new Blob(["oversized"]), "plugin.wasm");

    const error = await client
      .uploadMultipart("plugins/dynamic/package", formData)
      .catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: 40001,
      message: "文件大小不能超过100MB",
      status: 200,
    });
  });

  it("uses one refresh request for concurrent 401 responses and replays each request once", async () => {
    const { beginRefresh, session, setTokens } = createSession();
    let refreshCalls = 0;
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      const headers = new Headers(init?.headers);
      if (url.endsWith("/auth/refresh")) {
        refreshCalls += 1;
        await Promise.resolve();
        return jsonResponse({
          code: 0,
          data: { accessToken: "access-new", refreshToken: "refresh-new" },
        });
      }
      if (headers.get("Authorization") === "Bearer access-old") {
        return jsonResponse({ code: 401, error: "Expired" }, 401);
      }
      return jsonResponse({ code: 0, data: { ok: true, url } });
    });
    const client = new ApiClient({ fetch: fetchMock, session });

    const results = await Promise.all([client.get("one"), client.get("two")]);

    expect(results).toEqual([
      { ok: true, url: "/api/v1/one" },
      { ok: true, url: "/api/v1/two" },
    ]);
    expect(refreshCalls).toBe(1);
    expect(beginRefresh).toHaveBeenCalledOnce();
    expect(setTokens).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("clears the session and does not replay when refresh fails", async () => {
    const { clearSession, session } = createSession();
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      if (String(input).endsWith("/auth/refresh")) {
        return jsonResponse({ code: 401, error: "Refresh rejected" }, 401);
      }
      return jsonResponse({ code: 401, error: "Expired" }, 401);
    });
    const client = new ApiClient({ fetch: fetchMock, session });

    await expect(client.get("protected")).rejects.toBeInstanceOf(ApiError);

    expect(clearSession).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns an anonymous 401 without attempting token refresh", async () => {
    const clearSession = vi.fn();
    const beginRefresh = vi.fn();
    const session: ApiClientSession = {
      beginRefresh,
      clearSession,
      getAccessToken: () => null,
      getRefreshToken: () => null,
      getTenantCode: () => null,
      setTokens: vi.fn(),
    };
    const fetchMock = vi.fn(async () =>
      jsonResponse({ code: 401, error: "Invalid username or password" }, 401),
    );
    const client = new ApiClient({ fetch: fetchMock, session });

    await expect(
      client.post("auth/login", { password: "wrong", username: "admin" }),
    ).rejects.toMatchObject({ fallback: "Invalid username or password" });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(beginRefresh).not.toHaveBeenCalled();
    expect(clearSession).not.toHaveBeenCalled();
  });

  it("returns Blob downloads and multipart responses without JSON envelope parsing", async () => {
    const { session } = createSession();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("report", { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = new ApiClient({ fetch: fetchMock, session });

    const blob = await client.downloadBlob("reports/export");
    const formData = new FormData();
    formData.set("file", new Blob(["content"]), "demo.txt");
    const uploadResponse = await client.uploadMultipart("files/upload", formData);

    expect(await blob.text()).toBe("report");
    expect(uploadResponse.status).toBe(204);
    const uploadInit = fetchMock.mock.calls[1]?.[1];
    expect(uploadInit?.body).toBe(formData);
    expect(new Headers(uploadInit?.headers).has("Content-Type")).toBe(false);
  });
});

describe("pluginApiPath", () => {
  it("normalizes one plugin-relative API path", () => {
    expect(pluginApiPath("linapro-demo-source", "/items/a b?limit=10")).toBe(
      "/x/linapro-demo-source/api/v1/items/a%20b?limit=10",
    );
  });

  it.each(["../items", "https://example.com/items", "items#secret", ""])(
    "rejects unsafe path %s",
    (path) => {
      expect(() => pluginApiPath("linapro-demo-source", path)).toThrow(TypeError);
    },
  );
  it("rejects unstable plugin IDs", () => {
    expect(() => pluginApiPath("Other/Plugin", "items")).toThrow(TypeError);
  });
});
