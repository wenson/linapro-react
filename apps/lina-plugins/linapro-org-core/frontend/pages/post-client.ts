import type { PluginHostApi } from "@linapro/plugin-ui";

import type { DictOption } from "./dept-client";

const pluginId = "linapro-org-core";

export interface Post {
  code: string;
  createdAt: number | null;
  deptId: number;
  id: number;
  name: string;
  remark: string;
  sort: number;
  status: number;
}

export interface PostListParams {
  code?: string;
  deptId?: number;
  name?: string;
  pageNum?: number;
  pageSize?: number;
  status?: number;
}

export interface PostOption { postId: number; postName: string }
export interface PostDeptTreeNode { children?: PostDeptTreeNode[]; id: number; label: string; postCount: number }

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

export function createPostApi(host: PluginHostApi) {
  const plugin = <T,>(path: string, init?: RequestInit) => host.plugin<T>(pluginId, path, init);
  return {
    add: (data: Partial<Post>) => plugin<{ id: number }>("post", json("POST", data)),
    delete: (ids: number[]) => plugin<void>(`post/${ids.join(",")}`, { method: "DELETE" }),
    deptTree: async () => (await plugin<{ list: PostDeptTreeNode[] }>("post/dept-tree")).list,
    dict: async (type: string) => (await host.request<{ list: DictOption[] }>(`dict/data/type/${encodeURIComponent(type)}`)).list,
    export: (params?: PostListParams) => host.pluginBlob(pluginId, query("post/export", params)),
    info: (id: number) => plugin<Post>(`post/${id}`),
    list: async (params?: PostListParams) => { const result = await plugin<{ list: Post[]; total: number }>(query("post", params)); return { items: result.list, total: result.total }; },
    options: async (deptId?: number) => (await plugin<{ list: PostOption[] }>(query("post/option-select", { deptId }))).list,
    update: (id: number, data: Partial<Post>) => plugin<void>(`post/${id}`, json("PUT", data)),
  };
}

export type PostApi = ReturnType<typeof createPostApi>;
