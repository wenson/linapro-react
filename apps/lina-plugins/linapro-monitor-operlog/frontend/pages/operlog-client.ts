import type { PluginHostApi } from "@linapro/plugin-ui";

const pluginId = "linapro-monitor-operlog";

export interface DictOption {
  cssClass?: string;
  label: string;
  tagStyle?: string;
  value: string;
}

export interface OperLog {
  costTime: number;
  errorMsg: string;
  id: number;
  jsonResult: string;
  method: string;
  operIp: string;
  operName: string;
  operParam: string;
  operSummary: string;
  operTime: number | null;
  operType: string;
  operUrl: string;
  requestMethod: string;
  status: number;
  title: string;
}

export interface OperLogListParams {
  beginTime?: string;
  endTime?: string;
  operName?: string;
  operType?: string;
  orderBy?: string;
  orderDirection?: string;
  pageNum?: number;
  pageSize?: number;
  status?: number;
  title?: string;
}

export interface OperLogExportParams extends OperLogListParams {
  ids?: number[];
}

function path(name: string, params?: object): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      if (item !== undefined && item !== null && item !== "") query.append(key, String(item));
    }
  }
  return query.size ? `${name}?${query.toString()}` : name;
}

export function createOperLogApi(host: PluginHostApi) {
  const plugin = <T,>(name: string, init?: RequestInit) => host.plugin<T>(pluginId, name, init);
  return {
    clean: (params?: { beginTime?: string; endTime?: string }) => plugin<{ deleted: number }>(path("operlog/clean", params), { method: "DELETE" }),
    delete: (ids: number[]) => plugin<{ deleted: number }>(`operlog/${ids.join(",")}`, { method: "DELETE" }),
    detail: (id: number) => plugin<OperLog>(`operlog/${id}`),
    dict: async (type: string) => (await host.request<{ list: DictOption[] }>(`dict/data/type/${encodeURIComponent(type)}`)).list,
    export: (params?: OperLogExportParams) => host.pluginBlob(pluginId, path("operlog/export", params)),
    list: (params?: OperLogListParams) => plugin<{ items: OperLog[]; total: number }>(path("operlog", params)),
  };
}
