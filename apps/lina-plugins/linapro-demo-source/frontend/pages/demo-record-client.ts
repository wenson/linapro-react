import type { PluginHostApi } from "@linapro/plugin-ui";

const pluginId = "linapro-demo-source";
const root = "plugins/linapro-demo-source";

export interface DemoRecordItem {
  id: number;
  title: string;
  content: string;
  attachmentName: string;
  hasAttachment: number;
  createdAt: number | null;
  updatedAt: number | null;
}

export type DemoRecordDetail = DemoRecordItem;
export interface DemoRecordListParams { keyword?: string; pageNum?: number; pageSize?: number }
export interface DemoSummary { message: string }
export interface DemoRecordSaveInput { content: string; removeAttachment?: boolean; title: string }

function query(path: string, params?: object) {
  const output = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) if (value !== undefined && value !== null && value !== "") output.set(key, String(value));
  return output.size ? `${path}?${output.toString()}` : path;
}

function form(values: DemoRecordSaveInput, file?: File | null) {
  const output = new FormData(); output.append("title", values.title); output.append("content", values.content || "");
  if (values.removeAttachment) output.append("removeAttachment", "1");
  if (file) output.append("file", file, file.name);
  return output;
}

export interface DemoRecordApi {
  create(values: DemoRecordSaveInput, file?: File | null): Promise<{ id: number }>;
  delete(id: number): Promise<void>;
  download(id: number): Promise<Blob>;
  get(id: number): Promise<DemoRecordDetail>;
  list(params?: DemoRecordListParams): Promise<{ items: DemoRecordItem[]; total: number }>;
  summary(): Promise<DemoSummary>;
  update(id: number, values: DemoRecordSaveInput, file?: File | null): Promise<{ id: number }>;
}

export function createDemoRecordApi(host: PluginHostApi): DemoRecordApi {
  const plugin = <T,>(path: string, init?: RequestInit) => host.plugin<T>(pluginId, path, init);
  return {
    create: (values, file) => plugin(`${root}/records`, { body: form(values, file), method: "POST" }),
    delete: (id) => plugin(`${root}/records/${id}`, { method: "DELETE" }),
    download: (id) => host.pluginBlob(pluginId, `${root}/records/${id}/attachment`),
    get: (id) => plugin(`${root}/records/${id}`),
    list: async (params) => { const result = await plugin<{ list: DemoRecordItem[]; total: number }>(query(`${root}/records`, params)); return { items: result.list, total: result.total }; },
    summary: () => plugin(`${root}/summary`),
    update: (id, values, file) => plugin(`${root}/records/${id}`, { body: form(values, file), method: "PUT" }),
  };
}
