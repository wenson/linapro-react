import type { ApiClient } from "#/api/client";

export type ConfigValueType = "text" | "textarea" | "number" | "boolean" | "select" | "radio" | "multi_select" | "richtext";
export interface ConfigValueOption { label: string; value: string }
export interface SysConfig { canEdit: boolean; canOverride: boolean; createdAt: number | null; id: number; isBuiltin: number; isFallback: boolean; key: string; name: string; options: ConfigValueOption[]; overrideMode: "createTenantOverride" | "none"; remark: string; sourceTenantId: number; updatedAt: number | null; value: string; valueType: ConfigValueType }
export interface ConfigListParams { beginTime?: string; endTime?: string; ids?: number[]; key?: string; name?: string; pageNum?: number; pageSize?: number }
export interface ImportResult { fail: number; failList: Array<{ reason: string; row: number }>; success: number }

async function importFile(client: ApiClient, file: File, updateSupport: boolean): Promise<ImportResult> {
  const formData = new FormData(); formData.append("file", file); if (updateSupport) formData.append("updateSupport", "1");
  const response = await client.uploadMultipart("config/import", formData); const payload = await response.json() as { data?: ImportResult } | ImportResult;
  return "data" in payload && payload.data ? payload.data : payload as ImportResult;
}
export function createSystemConfigApi(client: ApiClient) { return {
  create: (input: Partial<SysConfig>) => client.post<void>("config", input), delete: (id: number) => client.delete<void>(`config/${id}`),
  export: (params: ConfigListParams) => client.downloadBlob("config/export", { query: { ...params } }), get: (id: number) => client.get<SysConfig>(`config/${id}`),
  getImportTemplate: () => client.downloadBlob("config/import-template"), import: (file: File, updateSupport: boolean) => importFile(client, file, updateSupport),
  list: (params: ConfigListParams) => client.get<{ list: SysConfig[]; total: number }>("config", { query: { ...params } }), update: (id: number, input: Partial<SysConfig>) => client.put<void>(`config/${id}`, input),
}; }
