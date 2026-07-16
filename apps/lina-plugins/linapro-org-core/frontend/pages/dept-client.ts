import type { PluginHostApi } from "@linapro/plugin-ui";

const pluginId = "linapro-org-core";

export interface DictOption {
  cssClass?: string;
  label: string;
  tagStyle?: string;
  value: string;
}

export interface Dept {
  ancestors: string;
  code: string;
  createdAt: number | null;
  email: string;
  id: number;
  leader: number;
  name: string;
  orderNum: number;
  parentId: number;
  phone: string;
  remark: string;
  status: number;
}

export interface DeptTree {
  children?: DeptTree[];
  id: number;
  label: string;
  userCount?: number;
}

export interface DeptUser {
  id: string;
  nickname: string;
  username: string;
}

export interface DeptListParams {
  name?: string;
  status?: number;
}

function query(path: string, params?: object): string {
  const output = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== "") output.set(key, String(value));
  }
  return output.size ? `${path}?${output.toString()}` : path;
}

function json(method: string, body: unknown): RequestInit {
  return { body: JSON.stringify(body), headers: { "Content-Type": "application/json" }, method };
}

export function createDeptApi(host: PluginHostApi) {
  const plugin = <T,>(path: string, init?: RequestInit) => host.plugin<T>(pluginId, path, init);
  return {
    add: (data: Partial<Dept>) => plugin<{ id: number }>("dept", json("POST", data)),
    delete: (id: number) => plugin<void>(`dept/${id}`, { method: "DELETE" }),
    dict: async (type: string) => (await host.request<{ list: DictOption[] }>(`dict/data/type/${encodeURIComponent(type)}`)).list,
    exclude: async (id: number) => (await plugin<{ list: Dept[] }>(`dept/exclude/${id}`)).list,
    info: (id: number) => plugin<Dept>(`dept/${id}`),
    list: async (params?: DeptListParams) => (await plugin<{ list: Dept[] }>(query("dept", params))).list,
    tree: async () => (await plugin<{ list: DeptTree[] }>("dept/tree")).list,
    update: (id: number, data: Partial<Dept>) => plugin<void>(`dept/${id}`, json("PUT", data)),
    users: async (id: number, params?: { keyword?: string; limit?: number }) => (await plugin<{ list: DeptUser[] }>(query(`dept/${id}/users`, params))).list,
  };
}

export type DeptApi = ReturnType<typeof createDeptApi>;
