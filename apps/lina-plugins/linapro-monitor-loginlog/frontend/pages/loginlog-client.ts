import type { PluginHostApi } from "@linapro/plugin-ui";

const pluginId = "linapro-monitor-loginlog";

export interface DictOption {
  cssClass?: string;
  label: string;
  tagStyle?: string;
  value: string;
}

export interface LoginLog {
  browser: string;
  id: number;
  ip: string;
  loginTime: number | null;
  msg: string;
  os: string;
  status: number;
  userName: string;
}

export interface LoginLogListParams {
  beginTime?: string;
  endTime?: string;
  ip?: string;
  orderBy?: string;
  orderDirection?: string;
  pageNum?: number;
  pageSize?: number;
  status?: number | string;
  userName?: string;
}

function path(name: string, params?: object): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  }
  return query.size ? `${name}?${query.toString()}` : name;
}

export function createLoginLogApi(host: PluginHostApi) {
  const plugin = <T,>(name: string, init?: RequestInit) => host.plugin<T>(pluginId, name, init);
  return {
    clean: (params?: { beginTime?: string; endTime?: string }) => plugin<{ deleted: number }>(path("loginlog/clean", params), { method: "DELETE" }),
    delete: (ids: number[]) => plugin<{ deleted: number }>(`loginlog/${ids.join(",")}`, { method: "DELETE" }),
    detail: (id: number) => plugin<LoginLog>(`loginlog/${id}`),
    dict: async (type: string) => (await host.request<{ list: DictOption[] }>(`dict/data/type/${encodeURIComponent(type)}`)).list,
    export: (params?: LoginLogListParams) => host.pluginBlob(pluginId, path("loginlog/export", params)),
    list: (params?: LoginLogListParams) => plugin<{ items: LoginLog[]; total: number }>(path("loginlog", params)),
  };
}
