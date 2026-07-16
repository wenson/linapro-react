import type { ApiClient } from "#/api/client";

export interface FileInfo { createdAt: number | null; createdBy: number; createdByName?: string; id: number; name: string; original: string; scene: string; size: number; suffix: string; updatedAt: number | null; url: string }
export interface FileDetail extends FileInfo { sceneLabel: string }
export interface FileOption { label: string; value: string }
export interface FileListParams { beginTime?: string; endTime?: string; name?: string; orderBy?: string; orderDirection?: string; original?: string; pageNum?: number; pageSize?: number; scene?: string; suffix?: string }
export function createSystemFileApi(client: ApiClient) { return {
  delete: (ids: number[]) => client.delete<void>(`file/${ids.join(",")}`), detail: (id: number) => client.get<FileDetail>(`file/detail/${id}`), download: (id: number) => client.downloadBlob(`file/download/${id}`),
  async list(params: FileListParams) { return client.get<{ list: FileInfo[]; total: number }>("file", { query: { ...params } }); },
  async scenes() { const result = await client.get<{ list: FileOption[] }>("file/scenes"); return result.list; }, async suffixes() { const result = await client.get<{ list: FileOption[] }>("file/suffixes"); return result.list; },
  async upload(file: File, scene: string) { const data = new FormData(); data.append("file", file); data.append("scene", scene); return client.uploadMultipart("file/upload", data); },
}; }
