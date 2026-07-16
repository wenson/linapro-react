import type { ApiClient } from "#/api/client";

export interface Role {
  createdAt: number | null; dataScope: number; id: number; key: string; menuIds?: number[];
  name: string; remark: string; sort: number; status: number; updatedAt: number | null;
}
export interface RoleOption { id: number; key: string; name: string }
export interface RoleUser {
  createdAt: number | null; email: string; id: number; nickname: string;
  phone: string; status: number; username: string;
}
export interface RoleListParams { key?: string; name?: string; page?: number; size?: number; status?: number }
export interface RoleUsersParams { page?: number; phone?: string; size?: number; status?: number; username?: string }

export interface SystemRoleApi {
  assignUsers(roleId: number, userIds: number[]): Promise<void>;
  batchDelete(ids: number[]): Promise<void>;
  create(input: Partial<Role>): Promise<{ id: number }>;
  delete(id: number): Promise<void>;
  get(id: number): Promise<Role>;
  list(params: RoleListParams): Promise<{ list: Role[]; total: number }>;
  listOptions(): Promise<RoleOption[]>;
  listUsers(roleId: number, params: RoleUsersParams): Promise<{ list: RoleUser[]; total: number }>;
  unassignUser(roleId: number, userId: number): Promise<void>;
  unassignUsers(roleId: number, userIds: number[]): Promise<void>;
  update(id: number, input: Partial<Role>): Promise<void>;
  updateStatus(id: number, status: number): Promise<void>;
}

export function createSystemRoleApi(client: ApiClient): SystemRoleApi {
  return {
    assignUsers: (roleId, userIds) => client.post<void>(`role/${roleId}/users`, { userIds }),
    batchDelete: (ids) => client.delete<void>("role", { query: { ids } }),
    create: (input) => client.post<{ id: number }>("role", input),
    delete: (id) => client.delete<void>(`role/${id}`),
    get: (id) => client.get<Role>(`role/${id}`),
    list: (params) => client.get<{ list: Role[]; total: number }>("role", { query: { ...params } }),
    async listOptions() {
      const response = await client.get<{ list: RoleOption[] }>("role/options");
      return response.list;
    },
    listUsers: (roleId, params) => client.get<{ list: RoleUser[]; total: number }>(`role/${roleId}/users`, { query: { ...params } }),
    unassignUser: (roleId, userId) => client.delete<void>(`role/${roleId}/users/${userId}`),
    unassignUsers: (roleId, userIds) => client.request<void>(`role/${roleId}/users`, { body: { userIds }, method: "DELETE" }),
    update: (id, input) => client.put<void>(`role/${id}`, input),
    updateStatus: (id, status) => client.put<void>(`role/${id}/status`, { status }),
  };
}
