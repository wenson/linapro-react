import { ApiError } from "#/api/contracts";
import type { ApiEnvelope } from "#/api/contracts";

const DEFAULT_API_BASE_URL = "/api/v1";
const DEFAULT_LOCALE = "en-US";

export interface ApiTokenPair {
  accessToken: string;
  refreshToken?: string;
}

export interface ApiClientSession {
  beginRefresh?(): void;
  getAccessToken(): null | string;
  getRefreshToken(): null | string;
  getTenantCode(): null | string;
  setTokens(tokens: ApiTokenPair): void;
  clearSession(reason?: "expired"): void | Promise<void>;
}

export interface ApiClientOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
  getLocale?: () => string;
  session?: ApiClientSession;
  translate?: (key: string, params: Record<string, unknown>) => string;
}

export type ApiQueryValue = boolean | number | string | null | undefined;

export interface ApiRequestOptions {
  body?: unknown;
  cache?: RequestCache;
  headers?: HeadersInit;
  method?: string;
  query?: Record<string, ApiQueryValue | ApiQueryValue[]>;
  signal?: AbortSignal;
}

const emptySession: ApiClientSession = {
  clearSession: () => undefined,
  getAccessToken: () => null,
  getRefreshToken: () => null,
  getTenantCode: () => null,
  setTokens: () => undefined,
};

function normalizeApiBaseUrl(value: string | undefined): string {
  const normalized = value?.trim() || DEFAULT_API_BASE_URL;
  return normalized === "/" ? "" : normalized.replace(/\/+$/, "");
}

function appendQuery(url: string, query: ApiRequestOptions["query"]): string {
  if (!query) {
    return url;
  }

  const params = new URLSearchParams();
  for (const [key, input] of Object.entries(query)) {
    const values = Array.isArray(input) ? input : [input];
    for (const value of values) {
      if (value !== null && value !== undefined) {
        params.append(key, String(value));
      }
    }
  }

  const serialized = params.toString();
  if (!serialized) {
    return url;
  }
  return `${url}${url.includes("?") ? "&" : "?"}${serialized}`;
}

function joinRequestUrl(baseUrl: string, path: string): string {
  const normalizedPath = path.trim();
  if (/^[a-z][a-z\d+.-]*:/i.test(normalizedPath) || normalizedPath.startsWith("//")) {
    throw new TypeError("API paths must be same-origin paths");
  }
  if (normalizedPath.startsWith("/api/") || normalizedPath.startsWith("/x/")) {
    return normalizedPath;
  }
  return `${baseUrl}/${normalizedPath.replace(/^\/+/, "")}`;
}

function isEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return typeof value === "object" && value !== null && typeof Reflect.get(value, "code") === "number";
}

function interpolateMessageParams(
  message: string,
  params: Record<string, unknown>,
): string {
  return message.replace(/\{([A-Za-z][A-Za-z\d_.-]*)\}/g, (placeholder, key: string) =>
    Object.prototype.hasOwnProperty.call(params, key)
      ? String(params[key])
      : placeholder,
  );
}

async function readJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";
  if (response.status === 204 || !contentType.toLowerCase().includes("json")) {
    return undefined;
  }
  return await response.json();
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly getLocale: () => string;
  private readonly session: ApiClientSession;
  private readonly translate?: ApiClientOptions["translate"];
  private refreshPromise: null | Promise<string> = null;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = normalizeApiBaseUrl(options.baseUrl);
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.getLocale = options.getLocale ?? (() => document.documentElement.lang || DEFAULT_LOCALE);
    this.session = options.session ?? emptySession;
    this.translate = options.translate;
  }

  get<T>(path: string, options: Omit<ApiRequestOptions, "body" | "method"> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(path: string, body?: unknown, options: Omit<ApiRequestOptions, "body" | "method"> = {}): Promise<T> {
    return this.request<T>(path, { ...options, body, method: "POST" });
  }

  put<T>(path: string, body?: unknown, options: Omit<ApiRequestOptions, "body" | "method"> = {}): Promise<T> {
    return this.request<T>(path, { ...options, body, method: "PUT" });
  }

  delete<T>(path: string, options: Omit<ApiRequestOptions, "body" | "method"> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  async request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const response = await this.requestRaw(path, options);
    const payload = await readJson(response);
    if (!isEnvelope(payload)) {
      if (!response.ok) {
        throw this.createApiError(response, undefined);
      }
      return payload as T;
    }
    if (!response.ok || payload.code !== 0) {
      throw this.createApiError(response, payload);
    }
    return payload.data as T;
  }

  async requestRaw(path: string, options: ApiRequestOptions = {}): Promise<Response> {
    return await this.executeRaw(path, options, false);
  }

  async downloadBlob(path: string, options: Omit<ApiRequestOptions, "body"> = {}): Promise<Blob> {
    const response = await this.requestRaw(path, { ...options, method: options.method ?? "GET" });
    if (!response.ok) {
      throw this.createApiError(response, undefined);
    }
    return await response.blob();
  }

  async uploadMultipart(path: string, formData: FormData, options: Omit<ApiRequestOptions, "body"> = {}): Promise<Response> {
    const response = await this.requestRaw(path, { ...options, body: formData, method: options.method ?? "POST" });
    const payload = await readJson(response.clone());
    const envelope = isEnvelope(payload) ? payload : undefined;
    if (!response.ok || (envelope && envelope.code !== 0)) {
      throw this.createApiError(response, envelope);
    }
    return response;
  }

  private async executeRaw(path: string, options: ApiRequestOptions, replayed: boolean): Promise<Response> {
    const accessToken = this.session.getAccessToken()?.trim() || "";
    const headers = new Headers(options.headers);
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }
    if (!headers.has("Accept-Language")) {
      headers.set("Accept-Language", this.getLocale().trim() || DEFAULT_LOCALE);
    }
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
    const tenantCode = this.session.getTenantCode()?.trim();
    if (tenantCode) {
      headers.set("X-Tenant-Code", tenantCode);
    }

    let body: BodyInit | undefined;
    if (options.body instanceof FormData || options.body instanceof Blob || typeof options.body === "string") {
      body = options.body;
    } else if (options.body !== undefined) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.body);
    }

    const url = appendQuery(joinRequestUrl(this.baseUrl, path), options.query);
    const response = await this.fetchImpl(url, {
      body,
      cache: options.cache,
      credentials: "same-origin",
      headers,
      method: options.method ?? "GET",
      signal: options.signal,
    });

    if (response.status !== 401 || replayed) {
      return response;
    }

    if (!accessToken) {
      return response;
    }

    const currentAccessToken = this.session.getAccessToken()?.trim() || "";
    if (currentAccessToken === accessToken) {
      await this.refreshAccessToken();
    }
    return await this.executeRaw(path, options, true);
  }

  private async refreshAccessToken(): Promise<string> {
    if (!this.refreshPromise) {
      this.session.beginRefresh?.();
      this.refreshPromise = this.performRefresh().finally(() => {
        this.refreshPromise = null;
      });
    }
    return await this.refreshPromise;
  }

  private async performRefresh(): Promise<string> {
    const refreshToken = this.session.getRefreshToken()?.trim();
    if (!refreshToken) {
      await this.session.clearSession("expired");
      throw new ApiError(401, 401, "auth.sessionExpired", {}, "Session expired");
    }

    try {
      const headers = new Headers({
        Accept: "application/json",
        "Accept-Language": this.getLocale().trim() || DEFAULT_LOCALE,
        "Content-Type": "application/json",
      });
      const response = await this.fetchImpl(joinRequestUrl(this.baseUrl, "auth/refresh"), {
        body: JSON.stringify({ refreshToken }),
        credentials: "same-origin",
        headers,
        method: "POST",
      });
      const payload = await readJson(response);
      if (!isEnvelope(payload) || !response.ok || payload.code !== 0) {
        throw this.createApiError(response, isEnvelope(payload) ? payload : undefined);
      }

      const tokens = payload.data as Partial<ApiTokenPair> | undefined;
      const accessToken = tokens?.accessToken?.trim();
      if (!accessToken) {
        throw new ApiError(401, 401, "auth.sessionExpired", {}, "Session expired");
      }
      this.session.setTokens({ accessToken, refreshToken: tokens?.refreshToken || refreshToken });
      return accessToken;
    } catch (error) {
      await this.session.clearSession("expired");
      throw error;
    }
  }

  private createApiError(response: Response, envelope: ApiEnvelope<unknown> | undefined): ApiError {
    const messageKey = envelope?.messageKey?.trim() || "";
    const messageParams = envelope?.messageParams ?? {};
    const fallback =
      envelope?.error?.trim() || envelope?.message?.trim() || response.statusText.trim() || "Request failed";
    const localized = messageKey ? this.translate?.(messageKey, messageParams)?.trim() : "";
    const message = localized && localized !== messageKey
      ? interpolateMessageParams(localized, messageParams)
      : fallback;
    return new ApiError(response.status, envelope?.code ?? response.status, messageKey, messageParams, fallback, message);
  }
}

export function pluginApiPath(pluginId: string, pathName: string): string {
  const normalizedPluginId = pluginId.trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedPluginId)) {
    throw new TypeError("Plugin ID must use stable lowercase kebab-case");
  }

  const normalizedInput = pathName.trim().replaceAll("\\", "/");
  if (!normalizedInput || normalizedInput.startsWith("//") || /^[a-z][a-z\d+.-]*:/i.test(normalizedInput)) {
    throw new TypeError("Plugin API path must be a relative path");
  }
  if (normalizedInput.includes("#")) {
    throw new TypeError("Plugin API paths cannot include fragments");
  }

  const [rawPath = "", rawQuery] = normalizedInput.split("?", 2);
  const segments = rawPath
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean);
  if (!segments.length || segments.some((segment) => segment === "." || segment === "..")) {
    throw new TypeError("Plugin API path cannot be empty or escape its API root");
  }
  const encodedPath = segments.map((segment) => encodeURIComponent(decodeURIComponent(segment))).join("/");
  return `/x/${normalizedPluginId}/api/v1/${encodedPath}${rawQuery ? `?${rawQuery}` : ""}`;
}

export const apiClient = new ApiClient();
