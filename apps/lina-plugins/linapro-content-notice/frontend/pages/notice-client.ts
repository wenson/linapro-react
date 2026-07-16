import type { PluginHostApi } from "@linapro/plugin-ui";

const pluginId = "linapro-content-notice";

export interface Notice {
  id: number;
  title: string;
  type: number;
  content: string;
  fileIds: string;
  status: number;
  remark: string;
  createdBy: number;
  createdByName: string;
  updatedBy: number;
  createdAt: number | null;
  updatedAt: number | null;
}

export interface NoticeListParams {
  pageNum?: number;
  pageSize?: number;
  title?: string;
  type?: number;
  createdBy?: string;
}

export interface DictOption {
  cssClass?: string;
  label: string;
  tagStyle?: string;
  value: string;
}

export interface UploadedFile {
  id: number;
  name: string;
  original: string;
  size: number;
  suffix: string;
  url: string;
}

function query(path: string, params?: object): string {
  const output = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== "") output.set(key, String(value));
  }
  return output.size ? `${path}?${output.toString()}` : path;
}

function json(method: string, body?: unknown): RequestInit {
  return { body: body === undefined ? undefined : JSON.stringify(body), headers: body === undefined ? undefined : { "Content-Type": "application/json" }, method };
}

export interface NoticeApi {
  add(data: Partial<Notice>): Promise<{ id?: number }>;
  delete(ids: number[]): Promise<void>;
  dict(type: string): Promise<DictOption[]>;
  info(id: number): Promise<Notice>;
  list(params?: NoticeListParams): Promise<{ items: Notice[]; total: number }>;
  update(id: number, data: Partial<Notice>): Promise<void>;
  upload(file: File, scene: "notice_attachment" | "notice_image"): Promise<UploadedFile>;
}

export function createNoticeApi(host: PluginHostApi): NoticeApi {
  const plugin = <T,>(path: string, init?: RequestInit) => host.plugin<T>(pluginId, path, init);
  return {
    add: (data) => plugin("notice", json("POST", data)),
    delete: (ids) => plugin(`notice/${ids.join(",")}`, { method: "DELETE" }),
    dict: async (type) => (await host.request<{ list: DictOption[] }>(`dict/data/type/${encodeURIComponent(type)}`)).list,
    info: (id) => plugin(`notice/${id}`),
    list: async (params) => {
      const result = await plugin<{ list: Notice[]; total: number }>(query("notice", params));
      return { items: result.list, total: result.total };
    },
    update: (id, data) => plugin(`notice/${id}`, json("PUT", data)),
    upload: (file, scene) => {
      const form = new FormData(); form.append("file", file); form.append("scene", scene);
      return host.request<UploadedFile>("file/upload", { body: form, method: "POST" });
    },
  };
}
