import type { ApiClient } from "#/api/client";

export interface SysUser {
  avatar: string;
  createdAt: number | null;
  deptId: number;
  deptName: string;
  email: string;
  id: number;
  loginDate: number | null;
  nickname: string;
  phone: string;
  postIds: number[];
  remark: string;
  roleIds: number[];
  roleNames: string[];
  sex: number;
  status: number;
  tenantId?: number;
  tenantIds?: number[];
  tenantName?: string;
  tenantNames?: string[];
  updatedAt: number | null;
  username: string;
}

export interface DeptTreeNode { children?: DeptTreeNode[]; id: number; label: string; userCount?: number }
export interface UserPostOption { postId: number; postName: string }
export interface UserListParams {
  beginTime?: string; deptId?: number; endTime?: string; nickname?: string;
  orderBy?: string; orderDirection?: string; pageNum?: number; pageSize?: number;
  phone?: string; status?: number; tenantId?: number; username?: string;
}
export interface UserListResult { list: SysUser[]; total: number }
export interface UserCreateInput {
  deptId?: number; email?: string; nickname?: string; password: string; phone?: string;
  postIds?: number[]; remark?: string; roleIds?: number[]; sex?: number; status?: number;
  tenantIds?: number[]; username: string;
}
export type UserUpdateInput = Partial<UserCreateInput> & { id: number };
export interface UserBatchUpdateInput {
  ids: number[]; roleIds?: number[]; status?: number; tenantIds?: number[];
  updateRoles?: boolean; updateStatus?: boolean; updateTenant?: boolean;
}
export interface UserImportResult {
  fail: number; failList: Array<{ reason: string; row: number }>; success: number;
}

export interface SystemUserApi {
  batchDelete(ids: number[]): Promise<void>;
  batchUpdate(input: UserBatchUpdateInput): Promise<void>;
  create(input: UserCreateInput): Promise<void>;
  delete(id: number): Promise<void>;
  export(params?: { ids?: number[] }): Promise<Blob>;
  get(id: number): Promise<SysUser>;
  getDeptTree(): Promise<DeptTreeNode[]>;
  getImportTemplate(): Promise<Blob>;
  getPostOptions(deptId?: number): Promise<UserPostOption[]>;
  import(file: File, updateSupport: boolean): Promise<UserImportResult>;
  list(params: UserListParams): Promise<UserListResult>;
  resetPassword(id: number, password: string): Promise<void>;
  update(input: UserUpdateInput): Promise<void>;
  updateStatus(id: number, status: number): Promise<void>;
}

export function createSystemUserApi(client: ApiClient): SystemUserApi {
  return {
    batchDelete: (ids) => client.delete<void>("user", { query: { ids } }),
    batchUpdate: (input) => client.put<void>("user", input),
    create: (input) => client.post<void>("user", input),
    delete: (id) => client.delete<void>(`user/${id}`),
    export: (params) => client.downloadBlob("user/export", { query: { ids: params?.ids } }),
    get: (id) => client.get<SysUser>(`user/${id}`),
    async getDeptTree() {
      const response = await client.get<{ list: DeptTreeNode[] }>("user/dept-tree");
      return response.list;
    },
    getImportTemplate: () => client.downloadBlob("user/import-template"),
    async getPostOptions(deptId) {
      const response = await client.get<{ list: UserPostOption[] }>("user/post-options", { query: { deptId } });
      return response.list;
    },
    async import(file, updateSupport) {
      const formData = new FormData();
      formData.append("file", file);
      if (updateSupport) formData.append("updateSupport", "1");
      const response = await client.uploadMultipart("user/import", formData);
      const payload = await response.json() as { data?: UserImportResult } | UserImportResult;
      return "data" in payload && payload.data ? payload.data : payload as UserImportResult;
    },
    list: (params) => client.get<UserListResult>("user", { query: { ...params } }),
    resetPassword: (id, password) => client.put<void>(`user/${id}/reset-password`, { password }),
    update: ({ id, ...input }) => client.put<void>(`user/${id}`, input),
    updateStatus: (id, status) => client.put<void>(`user/${id}/status`, { status }),
  };
}
