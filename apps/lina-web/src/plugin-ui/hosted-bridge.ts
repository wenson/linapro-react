import type { ApiClient, ApiRequestOptions } from "#/api/client";
import { pluginApiPath } from "#/api/client";

export const HOSTED_BRIDGE_PROTOCOL = "linapro.plugin-bridge";
export const HOSTED_BRIDGE_VERSION = 1;
export const HOSTED_BRIDGE_LIMITS = Object.freeze({
  maxConcurrentRequests: 4,
  maxFileBytes: 8 * 1024 * 1024,
  maxJSONRequestBytes: 256 * 1024,
  maxMessageBytes: 10 * 1024 * 1024,
  maxRequestsPerSession: 1024,
  maxResponseBytes: 16 * 1024 * 1024,
  requestTimeoutMs: 30_000,
});

type BridgeBodyKind = "blob" | "empty" | "json" | "text";
type BridgeRequestKind = "blob" | "json" | "multipart";

interface BridgeEnvelope {
  generation: number;
  nonce: string;
  pluginId: string;
  protocol: typeof HOSTED_BRIDGE_PROTOCOL;
  type: string;
  version: typeof HOSTED_BRIDGE_VERSION;
}

interface BridgeFile {
  data: ArrayBuffer;
  field?: string;
  name: string;
  type?: string;
}

interface BridgeRequest {
  body?: unknown;
  fields?: Record<string, string>;
  files?: BridgeFile[];
  kind: BridgeRequestKind;
  method?: string;
  path: string;
}

interface BridgeRequestEnvelope extends BridgeEnvelope {
  request: BridgeRequest;
  requestId: string;
  type: "request";
}

interface BridgeCancelEnvelope extends BridgeEnvelope {
  requestId: string;
  type: "cancel";
}

export interface HostedBridgeContext {
  locale: string;
  messages: Readonly<Record<string, unknown>>;
  permissions: readonly string[];
}

export interface HostedPluginBridgeOptions {
  apiClient: ApiClient;
  context: HostedBridgeContext;
  contentWindow(): Window | null;
  generation: number;
  nonce: string;
  pluginId: string;
  window?: Window;
}

interface BridgeFailure {
  code: string;
  message: string;
}

interface ActiveRequest {
  controller: AbortController;
  timeout: ReturnType<typeof setTimeout>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function structuredMessageBytes(value: unknown): number {
  const buffers = new Set<ArrayBuffer>();
  let otherBufferBytes = 0;
  try {
    const json = JSON.stringify(value, (_key, item: unknown) => {
      if (item instanceof ArrayBuffer) {
        buffers.add(item);
        return { byteLength: item.byteLength };
      }
      if (ArrayBuffer.isView(item)) {
        const buffer = item.buffer;
        if (buffer instanceof ArrayBuffer) buffers.add(buffer);
        else otherBufferBytes += item.byteLength;
        return { byteLength: item.byteLength };
      }
      return item;
    });
    return utf8Bytes(json ?? "") + otherBufferBytes + [...buffers].reduce((total, item) => total + item.byteLength, 0);
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function requestIdIsValid(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/.test(value);
}

function normalizeMethod(value: unknown): string {
  const method = String(value || "GET").trim().toUpperCase();
  if (!["DELETE", "GET", "POST", "PUT"].includes(method)) {
    throw new TypeError("Bridge method is not allowed");
  }
  return method;
}

export function normalizeHostedBridgePath(pluginId: string, value: unknown): string {
  const input = typeof value === "string" ? value.trim().replaceAll("\\", "/") : "";
  if (
    !input ||
    input.startsWith("/") ||
    input.startsWith("//") ||
    /^[a-z][a-z\d+.-]*:/i.test(input) ||
    input.includes("#")
  ) {
    throw new TypeError("Bridge path must be relative to the current plugin API");
  }
  const [rawPath = ""] = input.split("?", 1);
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch {
    throw new TypeError("Bridge path encoding is invalid");
  }
  if (decodedPath.split("/").some((segment) => segment === "." || segment === "..")) {
    throw new TypeError("Bridge path cannot escape the current plugin API");
  }
  return pluginApiPath(pluginId, input);
}

function sanitizeString(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [redacted]")
    .replace(/([?&](?:access_?token|refresh_?token|token)=)[^&\s]+/gi, "$1[redacted]");
}

function sanitizePayload(value: unknown, depth = 0): unknown {
  if (depth > 12) return "[truncated]";
  if (typeof value === "string") return sanitizeString(value);
  if (Array.isArray(value)) return value.map((item) => sanitizePayload(item, depth + 1));
  if (!isRecord(value)) return value;
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (/authorization|access_?token|refresh_?token|password|secret/i.test(key)) {
      output[key] = "[redacted]";
    } else {
      output[key] = sanitizePayload(item, depth + 1);
    }
  }
  return output;
}

function publicResponseHeaders(headers: Headers): Record<string, string> {
  const output: Record<string, string> = {};
  for (const key of ["content-disposition", "content-length", "content-type"]) {
    const value = headers.get(key);
    if (value) output[key] = sanitizeString(value);
  }
  return output;
}

function failure(code: string, message: string): BridgeFailure {
  return { code, message };
}

export class HostedPluginBridge {
  private readonly active = new Map<string, ActiveRequest>();
  private readonly options: HostedPluginBridgeOptions;
  private readonly seen = new Set<string>();
  private readonly targetWindow: Window;
  private disposed = false;

  constructor(options: HostedPluginBridgeOptions) {
    this.options = options;
    this.targetWindow = options.window ?? window;
  }

  start(): () => void {
    this.targetWindow.addEventListener("message", this.receive);
    return () => this.dispose();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.targetWindow.removeEventListener("message", this.receive);
    for (const item of this.active.values()) {
      clearTimeout(item.timeout);
      item.controller.abort("bridge-disposed");
    }
    this.active.clear();
  }

  private readonly receive = (event: MessageEvent<unknown>): void => {
    if (this.disposed || event.source !== this.options.contentWindow()) return;
    if (structuredMessageBytes(event.data) > HOSTED_BRIDGE_LIMITS.maxMessageBytes) {
      this.postFailure(undefined, failure("MESSAGE_TOO_LARGE", "Bridge message exceeds the configured limit"));
      return;
    }
    if (!this.validEnvelope(event.data)) return;
    if (event.data.type === "hello") {
      this.post({
        context: this.options.context,
        generation: this.options.generation,
        nonce: this.options.nonce,
        pluginId: this.options.pluginId,
        protocol: HOSTED_BRIDGE_PROTOCOL,
        type: "ready",
        version: HOSTED_BRIDGE_VERSION,
      });
      return;
    }
    if (event.data.type === "cancel") {
      const message = event.data as unknown as BridgeCancelEnvelope;
      if (requestIdIsValid(message.requestId)) this.active.get(message.requestId)?.controller.abort("guest-cancelled");
      return;
    }
    if (event.data.type === "request") {
      void this.handleRequest(event.data as unknown as BridgeRequestEnvelope);
    }
  };

  private validEnvelope(value: unknown): value is BridgeEnvelope & Record<string, unknown> {
    if (!isRecord(value)) return false;
    return (
      value.protocol === HOSTED_BRIDGE_PROTOCOL &&
      value.version === HOSTED_BRIDGE_VERSION &&
      value.nonce === this.options.nonce &&
      value.pluginId === this.options.pluginId &&
      value.generation === this.options.generation
    );
  }

  private async handleRequest(message: BridgeRequestEnvelope): Promise<void> {
    if (!requestIdIsValid(message.requestId) || !isRecord(message.request)) {
      this.postFailure(message.requestId, failure("INVALID_REQUEST", "Bridge request is invalid"));
      return;
    }
    if (this.seen.has(message.requestId)) {
      this.postFailure(message.requestId, failure("DUPLICATE_REQUEST", "Bridge request ID was already used"));
      return;
    }
    if (this.seen.size >= HOSTED_BRIDGE_LIMITS.maxRequestsPerSession) {
      this.postFailure(message.requestId, failure("SESSION_LIMIT", "Bridge session request limit reached"));
      return;
    }
    this.seen.add(message.requestId);
    if (this.active.size >= HOSTED_BRIDGE_LIMITS.maxConcurrentRequests) {
      this.postFailure(message.requestId, failure("CONCURRENCY_LIMIT", "Bridge concurrency limit reached"));
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort("request-timeout"), HOSTED_BRIDGE_LIMITS.requestTimeoutMs);
    this.active.set(message.requestId, { controller, timeout });
    try {
      const response = await this.execute(message.request, controller.signal);
      await this.postResponse(message.requestId, response, message.request.kind);
    } catch (error) {
      const code = controller.signal.aborted ? "REQUEST_ABORTED" : "REQUEST_FAILED";
      this.postFailure(message.requestId, failure(code, error instanceof Error ? sanitizeString(error.message) : "Bridge request failed"));
    } finally {
      clearTimeout(timeout);
      this.active.delete(message.requestId);
    }
  }

  private async execute(request: BridgeRequest, signal: AbortSignal): Promise<Response> {
    const path = normalizeHostedBridgePath(this.options.pluginId, request.path);
    const method = normalizeMethod(request.method);
    const options: ApiRequestOptions = { method, signal };
    if (request.kind === "json") {
      if (structuredMessageBytes(request.body) > HOSTED_BRIDGE_LIMITS.maxJSONRequestBytes) {
        throw new RangeError("JSON request body exceeds the configured limit");
      }
      options.body = request.body;
    } else if (request.kind === "multipart") {
      const formData = new FormData();
      if (request.fields !== undefined && !isRecord(request.fields)) {
        throw new TypeError("Bridge multipart fields are invalid");
      }
      for (const [key, value] of Object.entries(request.fields ?? {})) {
        if (!/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(key) || typeof value !== "string") {
          throw new TypeError("Bridge multipart field is invalid");
        }
        formData.append(key, value);
      }
      if (request.files !== undefined && !Array.isArray(request.files)) {
        throw new TypeError("Bridge multipart files are invalid");
      }
      for (const file of request.files ?? []) {
        if (!isRecord(file)) {
          throw new TypeError("Bridge multipart file is invalid");
        }
        const field = typeof file.field === "string" && file.field ? file.field : "files";
        if (
          !(file.data instanceof ArrayBuffer) ||
          file.data.byteLength > HOSTED_BRIDGE_LIMITS.maxFileBytes ||
          typeof file.name !== "string" ||
          !file.name.trim() ||
          file.name.length > 255 ||
          !/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(field) ||
          (file.type !== undefined && typeof file.type !== "string")
        ) {
          throw new RangeError("Bridge file exceeds the configured limit");
        }
        formData.append(field, new File([file.data], file.name, { type: file.type || "application/octet-stream" }));
      }
      options.body = formData;
    } else if (request.kind !== "blob") {
      throw new TypeError("Bridge request kind is not supported");
    }
    return await this.options.apiClient.requestRaw(path, options);
  }

  private async postResponse(requestId: string, response: Response, requestedKind: BridgeRequestKind): Promise<void> {
    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (declaredLength > HOSTED_BRIDGE_LIMITS.maxResponseBytes) {
      throw new RangeError("Bridge response exceeds the configured limit");
    }
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > HOSTED_BRIDGE_LIMITS.maxResponseBytes) {
      throw new RangeError("Bridge response exceeds the configured limit");
    }
    const contentType = response.headers.get("content-type")?.toLowerCase() || "";
    let body: unknown;
    let bodyKind: BridgeBodyKind = "empty";
    const transfers: Transferable[] = [];
    if (bytes.byteLength > 0 && requestedKind === "blob") {
      body = bytes;
      bodyKind = "blob";
      transfers.push(bytes);
    } else if (bytes.byteLength > 0) {
      const text = new TextDecoder().decode(bytes);
      if (contentType.includes("json")) {
        try {
          body = sanitizePayload(JSON.parse(text));
          bodyKind = "json";
        } catch {
          body = sanitizeString(text);
          bodyKind = "text";
        }
      } else {
        body = sanitizeString(text);
        bodyKind = "text";
      }
    }
    this.post(
      {
        body,
        bodyKind,
        generation: this.options.generation,
        headers: publicResponseHeaders(response.headers),
        nonce: this.options.nonce,
        ok: response.ok,
        pluginId: this.options.pluginId,
        protocol: HOSTED_BRIDGE_PROTOCOL,
        requestId,
        status: response.status,
        type: "response",
        version: HOSTED_BRIDGE_VERSION,
      },
      transfers,
    );
  }

  private postFailure(requestId: string | undefined, error: BridgeFailure): void {
    this.post({
      error,
      generation: this.options.generation,
      nonce: this.options.nonce,
      ok: false,
      pluginId: this.options.pluginId,
      protocol: HOSTED_BRIDGE_PROTOCOL,
      requestId,
      type: "response",
      version: HOSTED_BRIDGE_VERSION,
    });
  }

  private post(message: Record<string, unknown>, transfers: Transferable[] = []): void {
    this.options.contentWindow()?.postMessage(message, "*", transfers);
  }
}
