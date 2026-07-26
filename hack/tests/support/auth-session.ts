import { readFile } from "node:fs/promises";

import {
  request as playwrightRequest,
  type APIRequestContext,
  type BrowserContext,
} from "@playwright/test";

import { config } from "../fixtures/config";

const sessionStorageKey = "linapro:web:session:v1";

type StorageState = Awaited<ReturnType<BrowserContext["storageState"]>>;

type PersistedSession = {
  accessToken?: unknown;
};

function normalizeAccessToken(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function accessTokensFromStorageState(state: StorageState): string[] {
  const tokens = new Set<string>();

  for (const origin of state.origins ?? []) {
    const session = origin.localStorage?.find(
      (item) => item.name === sessionStorageKey,
    );
    if (!session?.value) {
      continue;
    }

    try {
      const parsed = JSON.parse(session.value) as PersistedSession;
      const accessToken = normalizeAccessToken(parsed?.accessToken);
      if (accessToken) {
        tokens.add(accessToken);
      }
    } catch {
      // Broken or partial browser storage must not block the remaining cleanup.
    }
  }

  return [...tokens];
}

export async function accessTokensFromStorageStateFile(path: string) {
  try {
    const state = JSON.parse(await readFile(path, "utf8")) as StorageState;
    return accessTokensFromStorageState(state);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function logoutAccessToken(accessToken: string) {
  const normalized = normalizeAccessToken(accessToken);
  if (!normalized) {
    return false;
  }

  try {
    const response = await fetch(new URL("auth/logout", config.apiBaseURL), {
      headers: { Authorization: `Bearer ${normalized}` },
      method: "POST",
      signal: AbortSignal.timeout(5_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function logoutStorageStateFile(path: string) {
  const tokens = await accessTokensFromStorageStateFile(path);
  const results = await Promise.all(tokens.map(logoutAccessToken));
  return results.filter(Boolean).length;
}

export async function logoutBrowserContextSession(context: BrowserContext) {
  const state = await context.storageState().catch(() => null);
  if (!state) {
    return 0;
  }

  const results = await Promise.all(
    accessTokensFromStorageState(state).map(logoutAccessToken),
  );
  return results.filter(Boolean).length;
}

export function withLogoutOnDispose(
  api: APIRequestContext,
  accessToken: string,
): APIRequestContext {
  const originalDispose = api.dispose.bind(api);
  let disposed = false;

  return new Proxy(api, {
    get(target, property) {
      if (property === "dispose") {
        return async (...args: Parameters<APIRequestContext["dispose"]>) => {
          if (disposed) {
            return;
          }
          disposed = true;
          try {
            await target.post("auth/logout", { timeout: 5_000 }).catch(() => null);
          } finally {
            await originalDispose(...args);
          }
        };
      }

      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

export async function createLoggedInApiContext(
  username: string,
  password: string,
): Promise<APIRequestContext> {
  const loginApi = await playwrightRequest.newContext({ baseURL: config.apiBaseURL });
  try {
    const loginResponse = await loginApi.post("auth/login", {
      data: { clientType: "web", password, username },
    });
    if (!loginResponse.ok()) {
      throw new Error(`登录 API 失败，HTTP ${loginResponse.status()}`);
    }

    const payload = await loginResponse.json();
    const result = payload && typeof payload === "object" && "data" in payload
      ? payload.data
      : payload;
    const accessToken = normalizeAccessToken(result?.accessToken);
    if (!accessToken) {
      throw new Error("登录 API 未返回 accessToken");
    }

    const api = await playwrightRequest.newContext({
      baseURL: config.apiBaseURL,
      extraHTTPHeaders: { Authorization: `Bearer ${accessToken}` },
    });
    return withLogoutOnDispose(api, accessToken);
  } finally {
    await loginApi.dispose();
  }
}
