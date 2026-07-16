import type { ApiClient } from "#/api/client";

export type MenuType = "B" | "D" | "M";
export interface Menu {
  children?: Menu[]; component: string; createdAt: number | null; icon: string; id: number;
  isCache: number; isFrame: number; name: string; parentId: number; path: string; perms: string;
  queryParam: string; remark: string; sort: number; status: number; type: MenuType;
  updatedAt: number | null; visible: number;
}
export interface MenuTreeNode { children?: MenuTreeNode[]; icon?: string; id: number; label: string; parentId: number; type: MenuType }
export interface MenuListParams { name?: string; status?: number; visible?: number }

export interface SystemMenuApi {
  create(input: Partial<Menu>): Promise<void>;
  delete(id: number, cascadeDelete: boolean): Promise<void>;
  get(id: number): Promise<Menu>;
  getRoleTree(roleId: number): Promise<{ checkedKeys: number[]; menus: MenuTreeNode[] }>;
  getTreeSelect(): Promise<MenuTreeNode[]>;
  list(params: MenuListParams): Promise<Menu[]>;
  update(id: number, input: Partial<Menu>): Promise<void>;
}

export function createSystemMenuApi(client: ApiClient): SystemMenuApi {
  return {
    create: (input) => client.post<void>("menu", input),
    delete: (id, cascadeDelete) => client.delete<void>(`menu/${id}`, { query: { cascadeDelete } }),
    get: (id) => client.get<Menu>(`menu/${id}`),
    getRoleTree: (roleId) => client.get<{ checkedKeys: number[]; menus: MenuTreeNode[] }>(`menu/role/${roleId}`),
    async getTreeSelect() {
      const response = await client.get<{ list: MenuTreeNode[] }>("menu/treeselect");
      return response.list;
    },
    async list(params) {
      const response = await client.get<{ list: Menu[] }>("menu", { query: { ...params } });
      return response.list;
    },
    update: (id, input) => client.put<void>(`menu/${id}`, input),
  };
}
