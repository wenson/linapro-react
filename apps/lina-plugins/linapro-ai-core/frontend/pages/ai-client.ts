import type { PluginHostApi } from "@linapro/plugin-ui";

const pluginId = "linapro-ai-core";

export const defaultCapabilityType = "text";
export const defaultCapabilityMethod = "generate";

export interface Provider {
  id: number;
  name: string;
  websiteUrl: string;
  remark: string;
  enabled: number;
  modelCount: number;
  enabledModelCount: number;
  endpointCount: number;
  enabledEndpointCount: number;
  models: ProviderModelSummary[];
  endpoints: ProviderEndpoint[];
  createdAt: number;
  updatedAt: number;
}

export interface ProviderEndpoint {
  id: number;
  providerId: number;
  protocol: string;
  baseUrl: string;
  secretRef: string;
  enabled: number;
  metadataJson: string;
  createdAt: number;
  updatedAt: number;
}

export type ProviderProtocol =
  | "anthropic"
  | "anthropic-compatible"
  | "openai"
  | "openai-compatible"
  | "voyage";

export interface ProviderEndpointSaveInput {
  id?: number;
  protocol: ProviderProtocol;
  baseUrl: string;
  secretRef?: string;
  enabled?: number;
  metadataJson?: string;
}

export interface ProviderSaveInput {
  name: string;
  websiteUrl?: string;
  remark?: string;
  enabled?: number;
  endpoints?: ProviderEndpointSaveInput[];
}

export interface ProviderModelSummary {
  id: number;
  modelName: string;
  protocol: string;
  enabled: number;
}

export interface ProviderListParams {
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
  enabled?: number;
}

export interface Model {
  id: number;
  providerId: number;
  providerName: string;
  endpointId: number;
  endpointBaseUrl: string;
  modelName: string;
  protocol: string;
  source: string;
  enabled: number;
  createdAt: number;
  updatedAt: number;
}

export interface TierBinding {
  providerId: number;
  providerName: string;
  modelId: number;
  modelName: string;
  protocol: string;
  enabled: number;
}

export interface Tier {
  id: number;
  capabilityType: string;
  capabilityMethod: string;
  code: string;
  displayName: string;
  description: string;
  defaultEffort: string;
  enabled: number;
  sortOrder: number;
  binding?: TierBinding;
  lastTestStatus: string;
  lastTestLatencyMs: number;
  lastTestErrorSummary: string;
  lastTestAt: number;
  updatedAt: number;
}

export interface TierTestResult {
  status: string;
  latencyMs: number;
  providerName: string;
  modelName: string;
  protocol: string;
  thinkingEffort: string;
  errorSummary: string;
  testedAt: number;
}

export interface Invocation {
  id: number;
  requestId: string;
  capabilityType: string;
  capabilityMethod: string;
  purpose: string;
  tierCode: string;
  sourcePluginId: string;
  tenantId: number;
  userId: number;
  providerId: number;
  modelId: number;
  providerName: string;
  modelName: string;
  protocol: string;
  thinkingEffort: string;
  status: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  assetSummaryJson: string;
  operationSummaryJson: string;
  metadataSummaryJson: string;
  errorCode: string;
  errorSummary: string;
  createdAt: number;
}

export interface ProviderOperation {
  id: number;
  operationRef: string;
  capabilityType: string;
  capabilityMethod: string;
  purpose: string;
  sourcePluginId: string;
  providerId: number;
  modelId: number;
  providerName: string;
  modelName: string;
  protocol: string;
  status: string;
  nextPollAfterMs: number;
  expiresAt: number;
  assetSummaryJson: string;
  errorCode: string;
  errorSummary: string;
  createdAt: number;
  updatedAt: number;
}

export interface InvocationListParams {
  pageNum?: number;
  pageSize?: number;
  capabilityType?: string;
  capabilityMethod?: string;
  purpose?: string;
  tierCode?: string;
  status?: string;
  providerId?: number;
  modelId?: number;
  sourcePluginId?: string;
  startedAt?: number;
  endedAt?: number;
}

export interface InvocationCleanParams {
  startedAt?: number;
  endedAt?: number;
}

export interface ModelListParams {
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
  providerId?: number;
  enabled?: number;
}

export type ModelCreateInput = Partial<Model> & {
  endpointId: number;
  protocol: string;
};

function withQuery(path: string, params?: object): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }
  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
}

function jsonInit(method: string, body?: unknown, signal?: AbortSignal): RequestInit {
  return {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    method,
    signal,
  };
}

export interface AiCoreApi {
  invocationClean(params?: InvocationCleanParams): Promise<{ deleted: number }>;
  invocationList(params?: InvocationListParams): Promise<{ items: Invocation[]; total: number }>;
  modelAdd(providerId: number, data: ModelCreateInput): Promise<{ id: number }>;
  modelDelete(id: number): Promise<void>;
  modelList(params?: ModelListParams): Promise<{ items: Model[]; total: number }>;
  modelSync(providerId: number, protocol?: string): Promise<{ created: number; kept: number }>;
  modelUpdate(id: number, data: Partial<Model>): Promise<void>;
  providerAdd(data: ProviderSaveInput): Promise<{ id?: number }>;
  providerDelete(id: number): Promise<void>;
  providerEndpointAdd(providerId: number, data: ProviderEndpointSaveInput): Promise<void>;
  providerEndpointDelete(providerId: number, id: number): Promise<void>;
  providerEndpoints(providerId: number, params?: { enabled?: number; protocol?: string }): Promise<ProviderEndpoint[]>;
  providerEndpointUpdate(providerId: number, id: number, data: ProviderEndpointSaveInput): Promise<void>;
  providerInfo(id: number): Promise<Provider>;
  providerList(params?: ProviderListParams): Promise<{ items: Provider[]; total: number }>;
  providerModels(providerId: number, enabled?: number): Promise<Model[]>;
  providerOperationList(params?: InvocationListParams): Promise<{ items: ProviderOperation[]; total: number }>;
  providerUpdate(id: number, data: ProviderSaveInput): Promise<void>;
  tierList(capabilityType?: string, capabilityMethod?: string): Promise<Tier[]>;
  tierTest(code: string, data: Record<string, unknown>, signal?: AbortSignal): Promise<TierTestResult>;
  tierUpdate(code: string, data: Partial<Tier>): Promise<void>;
}

export function createAiCoreApi(hostApi: PluginHostApi): AiCoreApi {
  const request = <T,>(path: string, init?: RequestInit) => hostApi.plugin<T>(pluginId, path, init);
  return {
    invocationClean: (params) => request(withQuery("ai/invocations/clean", params), jsonInit("DELETE")),
    invocationList: async (params) => {
      const result = await request<{ list: Invocation[]; total: number }>(withQuery("ai/invocations", params));
      return { items: result.list, total: result.total };
    },
    modelAdd: (providerId, data) => request(`ai/providers/${providerId}/models`, jsonInit("POST", data)),
    modelDelete: (id) => request(`ai/models/${id}`, jsonInit("DELETE")),
    modelList: async (params) => {
      const result = await request<{ list: Model[]; total: number }>(withQuery("ai/models", params));
      return { items: result.list, total: result.total };
    },
    modelSync: (providerId, protocol) => request(`ai/providers/${providerId}/models/sync`, jsonInit("POST", protocol ? { protocol } : {})),
    modelUpdate: (id, data) => request(`ai/models/${id}`, jsonInit("PUT", data)),
    providerAdd: (data) => request("ai/providers", jsonInit("POST", data)),
    providerDelete: (id) => request(`ai/providers/${id}`, jsonInit("DELETE")),
    providerEndpointAdd: (providerId, data) => request(`ai/providers/${providerId}/endpoints`, jsonInit("POST", data)),
    providerEndpointDelete: (providerId, id) => request(`ai/providers/${providerId}/endpoints/${id}`, jsonInit("DELETE")),
    providerEndpoints: async (providerId, params) => {
      const result = await request<{ list: ProviderEndpoint[] }>(withQuery(`ai/providers/${providerId}/endpoints`, params));
      return result.list;
    },
    providerEndpointUpdate: (providerId, id, data) => request(`ai/providers/${providerId}/endpoints/${id}`, jsonInit("PUT", data)),
    providerInfo: (id) => request(`ai/providers/${id}`),
    providerList: async (params) => {
      const result = await request<{ list: Provider[]; total: number }>(withQuery("ai/providers", params));
      return { items: result.list, total: result.total };
    },
    providerModels: async (providerId, enabled) => {
      const result = await request<{ list: Model[]; total: number }>(withQuery(`ai/providers/${providerId}/models`, { enabled, pageNum: 1, pageSize: 100 }));
      return result.list;
    },
    providerOperationList: async (params) => {
      const result = await request<{ list: ProviderOperation[]; total: number }>(withQuery("ai/provider-operations", params));
      return { items: result.list, total: result.total };
    },
    providerUpdate: (id, data) => request(`ai/providers/${id}`, jsonInit("PUT", data)),
    tierList: async (capabilityType = defaultCapabilityType, capabilityMethod = defaultCapabilityMethod) => {
      const result = await request<{ list: Tier[] }>(withQuery("ai/tiers", { capabilityMethod, capabilityType }));
      return result.list;
    },
    tierTest: (code, data, signal) => request(`ai/tiers/${encodeURIComponent(code)}/test`, jsonInit("POST", {
      capabilityMethod: data.capabilityMethod || defaultCapabilityMethod,
      capabilityType: data.capabilityType || defaultCapabilityType,
      ...data,
    }, signal)),
    tierUpdate: (code, data) => request(`ai/tiers/${encodeURIComponent(code)}`, jsonInit("PUT", {
      capabilityMethod: data.capabilityMethod || defaultCapabilityMethod,
      capabilityType: data.capabilityType || defaultCapabilityType,
      ...data,
    })),
  };
}
