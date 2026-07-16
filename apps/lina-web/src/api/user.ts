import type { ApiClient } from "#/api/client";

export interface UserMenuItem {
  children?: UserMenuItem[];
  component: string;
  icon: string;
  id: number;
  isCache: number;
  isFrame: number;
  name: string;
  parentId: number;
  path: string;
  perms: string;
  sort: number;
  status: number;
  type: string;
  visible: number;
}

export interface CurrentUser {
  avatar: string;
  email: string;
  homePath: string;
  menus: UserMenuItem[];
  permissions: string[];
  realName: string;
  roles: string[];
  userId: number;
  username: string;
}

export interface UserApi {
  getCurrentUser(): Promise<CurrentUser>;
}

export function createUserApi(client: ApiClient): UserApi {
  return {
    getCurrentUser: () => client.get<CurrentUser>("user/info"),
  };
}
