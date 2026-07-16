import { createContext, useContext } from "react";

import type { ApiClient } from "#/api/client";
import { pluginApiPath } from "#/api/client";

export type PluginHostLocale = "en-US" | "zh-CN";

export interface PluginHostUserProjection {
  id: number;
  name: string;
}

export interface PluginHostTenantProjection {
  code: string;
  id: number;
  impersonated?: boolean;
  name: string;
}

export interface PluginHostApi {
  plugin<T>(pluginId: string, path: string, init?: RequestInit): Promise<T>;
  pluginBlob(pluginId: string, path: string, init?: RequestInit): Promise<Blob>;
  request<T>(path: string, init?: RequestInit): Promise<T>;
  requestBlob(path: string, init?: RequestInit): Promise<Blob>;
}

export interface PluginHostContextValue {
  api: PluginHostApi;
  locale: PluginHostLocale;
  permissions: ReadonlySet<string>;
  t(key: string, options?: Record<string, unknown>): string;
  tenant: null | PluginHostTenantProjection;
  user: PluginHostUserProjection;
}

class ReadonlyPermissionSet implements ReadonlySet<string> {
  readonly #values: Set<string>;

  constructor(values: Iterable<string>) {
    this.#values = new Set(values);
  }

  get size(): number {
    return this.#values.size;
  }

  entries(): SetIterator<[string, string]> {
    return this.#values.entries();
  }

  forEach(callbackfn: (value: string, value2: string, set: ReadonlySet<string>) => void, thisArg?: unknown): void {
    for (const value of this.#values) {
      callbackfn.call(thisArg, value, value, this);
    }
  }

  has(value: string): boolean {
    return this.#values.has(value);
  }

  keys(): SetIterator<string> {
    return this.#values.keys();
  }

  values(): SetIterator<string> {
    return this.#values.values();
  }

  [Symbol.iterator](): SetIterator<string> {
    return this.#values[Symbol.iterator]();
  }
}

export function createReadonlyPermissionSet(values: Iterable<string>): ReadonlySet<string> {
  return Object.freeze(new ReadonlyPermissionSet(values));
}

export const PluginHostContext = createContext<PluginHostContextValue | null>(null);

function requestOptions(init: RequestInit | undefined) {
  return {
    body: init?.body,
    cache: init?.cache,
    headers: init?.headers,
    method: init?.method,
    signal: init?.signal ?? undefined,
  };
}

export function createPluginHostApi(client: ApiClient): PluginHostApi {
  return Object.freeze({
    plugin: <T,>(pluginId: string, path: string, init?: RequestInit) =>
      client.request<T>(pluginApiPath(pluginId, path), requestOptions(init)),
    pluginBlob: (pluginId: string, path: string, init?: RequestInit) =>
      client.downloadBlob(pluginApiPath(pluginId, path), requestOptions(init)),
    request: <T,>(path: string, init?: RequestInit) =>
      client.request<T>(path, requestOptions(init)),
    requestBlob: (path: string, init?: RequestInit) =>
      client.downloadBlob(path, requestOptions(init)),
  });
}

export function useLinaPluginHost(): PluginHostContextValue {
  const context = useContext(PluginHostContext);
  if (!context) {
    throw new Error("useLinaPluginHost must be used within LinaPluginHostProvider");
  }
  return context;
}
