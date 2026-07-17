import type { ApiClient } from "#/api/client";

export interface FileInfo { createdAt: number | null; createdBy: number; createdByName?: string; id: number; name: string; original: string; scene: string; size: number; suffix: string; updatedAt: number | null; url: string }
export interface FileDetail extends FileInfo { sceneLabel: string }
export interface FileOption { label: string; value: string }
export interface FileListParams { beginTime?: string; endTime?: string; name?: string; orderBy?: string; orderDirection?: string; original?: string; pageNum?: number; pageSize?: number; scene?: string; suffix?: string }
export interface UploadAccess { formFields?: Record<string, string>; headers?: Record<string, string>; method?: string; mode: "form_post" | "presigned_url" | "proxy" | "temporary_credentials"; url?: string }
export interface UploadPlan { channel: "direct" | "proxy"; encoding: "multipart" | "single" }
export interface MultipartPlan { maxConcurrency: number; maxParts?: number; minPartSize: number; partSize: number }
export interface MultipartPart { etag: string; partNumber: number }
export interface DirectUploadInit { access?: UploadAccess; file?: FileInfo; instantReuse: boolean; multipart?: MultipartPlan; strategy?: UploadPlan; uploadSessionId?: string }
export interface DirectDownload { access?: UploadAccess; proxyUrl?: string }
export function createSystemFileApi(client: ApiClient) { return {
  delete: (ids: number[]) => client.delete<void>(`file/${ids.join(",")}`), detail: (id: number) => client.get<FileDetail>(`file/detail/${id}`), download: (id: number) => client.downloadBlob(`file/download/${id}`), downloadUrl: (url: string) => client.downloadBlob(url),
  directDownload: (id: number) => client.get<DirectDownload>(`file/${id}/direct-download`),
  directUploadAbort: (uploadSessionId: string) => client.post<void>("file/direct-upload/abort", { uploadSessionId }),
  directUploadComplete: (uploadSessionId: string, etag?: string, parts?: MultipartPart[]) => client.post<FileInfo>("file/direct-upload/complete", { etag, parts, uploadSessionId }),
  directUploadInit: (file: File, scene: string) => client.post<DirectUploadInit>("file/direct-upload/init", { contentType: file.type, fileName: file.name, scene, size: file.size }),
  directUploadPartUrl: (uploadSessionId: string, partNumber: number, size: number) => client.post<{ access: UploadAccess }>("file/direct-upload/part-url", { partNumber, size, uploadSessionId }),
  async list(params: FileListParams) { return client.get<{ list: FileInfo[]; total: number }>("file", { query: { ...params } }); },
  async scenes() { const result = await client.get<{ list: FileOption[] }>("file/scenes"); return result.list; }, async suffixes() { const result = await client.get<{ list: FileOption[] }>("file/suffixes"); return result.list; },
  async upload(file: File, scene: string) { const data = new FormData(); data.append("file", file); data.append("scene", scene); return client.uploadMultipart("file/upload", data); },
  chunkedUploadAbort: (uploadSessionId: string) => client.post<void>("file/upload/chunked/abort", { uploadSessionId }),
  chunkedUploadComplete: (uploadSessionId: string, parts: MultipartPart[]) => client.post<FileInfo>("file/upload/chunked/complete", { parts, uploadSessionId }),
  chunkedUploadInit: (file: File, scene: string) => client.post<{ multipart?: MultipartPlan; uploadSessionId: string }>("file/upload/chunked/init", { contentType: file.type, fileName: file.name, scene, size: file.size }),
  async chunkedUploadPart(file: Blob, uploadSessionId: string, partNumber: number) { const data = new FormData(); data.append("file", file); data.append("uploadSessionId", uploadSessionId); data.append("partNumber", String(partNumber)); const response = await client.uploadMultipart("file/upload/chunked/part", data); const payload = await response.json() as { data?: { etag?: string } }; return payload.data?.etag ?? ""; },
}; }
