import type { ApiClient } from "#/api/client";

export interface PluginRuntimeState {
  enabled: number;
  generation: number;
  id: string;
  installed: number;
  runtimeState?: string;
  statusKey: string;
  version: string;
}

interface PluginRuntimeListResponse {
  list?: PluginRuntimeState[];
}

export interface PluginRuntimeApi {
  getRuntimeStates(): Promise<PluginRuntimeState[]>;
}

export function createPluginRuntimeApi(client: ApiClient): PluginRuntimeApi {
  return {
    async getRuntimeStates() {
      const response = await client.get<PluginRuntimeListResponse>("plugins/dynamic");
      return response.list ?? [];
    },
  };
}
