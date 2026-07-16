import type { ApiClient } from "#/api/client";
import type { ImportResult } from "#/api/system/config";

interface GovernedRecord { canEdit: boolean; canOverride: boolean; createdAt: number | null; id: number; isBuiltin: number; isFallback: boolean; overrideMode: "createTenantOverride" | "none"; remark: string; sourceTenantId: number; updatedAt: number | null }
export interface DictType extends GovernedRecord { allowTenantOverride: boolean; name: string; status: number; type: string }
export interface DictData extends GovernedRecord { cssClass: string; dictType: string; label: string; sort: number; status: number; tagStyle: string; value: string }
export interface DictTypeListParams { ids?: number[]; name?: string; pageNum?: number; pageSize?: number; type?: string }
export interface DictDataListParams { dictType?: string; ids?: number[]; label?: string; pageNum?: number; pageSize?: number }

interface CombinedImportResult {
  dataFail: number;
  dataSuccess: number;
  failList: ImportResult["failList"];
  typeFail: number;
  typeSuccess: number;
}

async function importFile(client: ApiClient, path: string, file: File, updateSupport: boolean): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (updateSupport) formData.append("updateSupport", "1");
  const response = await client.uploadMultipart(path, formData);
  const payload = await response.json() as { data?: CombinedImportResult | ImportResult } | CombinedImportResult | ImportResult;
  const result = ("data" in payload && payload.data ? payload.data : payload) as CombinedImportResult | ImportResult;
  if ("success" in result) return result;
  return {
    fail: result.typeFail + result.dataFail,
    failList: result.failList,
    success: result.typeSuccess + result.dataSuccess,
  };
}
export function createSystemDictApi(client: ApiClient) { return {
  createData: (input: Partial<DictData>) => client.post<void>("dict/data", input), createType: (input: Partial<DictType>) => client.post<void>("dict/type", input),
  deleteData: (id: number) => client.delete<void>(`dict/data/${id}`), deleteType: (id: number) => client.delete<void>(`dict/type/${id}`),
  exportData: (params: DictDataListParams) => client.downloadBlob("dict/data/export", { query: { ...params } }), exportTypes: (params: DictTypeListParams) => client.downloadBlob("dict/export", { query: { ...params } }),
  getData: (id: number) => client.get<DictData>(`dict/data/${id}`), getType: (id: number) => client.get<DictType>(`dict/type/${id}`), async getDataByType(type: string) { return (await client.get<{ list: DictData[] }>(`dict/data/type/${encodeURIComponent(type)}`)).list; },
  importCombined: (file: File, update: boolean) => importFile(client, "dict/import", file, update), importData: (file: File, update: boolean) => importFile(client, "dict/data/import", file, update),
  listData: (params: DictDataListParams) => client.get<{ list: DictData[]; total: number }>("dict/data", { query: { ...params } }), listTypes: (params: DictTypeListParams) => client.get<{ list: DictType[]; total: number }>("dict/type", { query: { ...params } }),
  templateCombined: () => client.downloadBlob("dict/import-template"), templateData: () => client.downloadBlob("dict/data/import-template"),
  updateData: (id: number, input: Partial<DictData>) => client.put<void>(`dict/data/${id}`, input), updateType: (id: number, input: Partial<DictType>) => client.put<void>(`dict/type/${id}`, input),
}; }
