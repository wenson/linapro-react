import type { ApiClient } from "#/api/client";

export interface MenuRouteMeta {
  activeIcon?: string;
  authority?: string;
  hideInBreadcrumb?: boolean;
  hideInMenu?: boolean;
  hideInTab?: boolean;
  icon?: string;
  iframeSrc?: string;
  ignoreAccess?: boolean;
  i18nKey?: string;
  keepAlive?: boolean;
  link?: string;
  openInNewWindow?: boolean;
  order: number;
	pluginId?: string;
  query?: Record<string, string>;
  title: string;
}

export interface MenuRouteItem {
  children?: MenuRouteItem[];
  component: string;
  id: number;
  meta: MenuRouteMeta;
  name: string;
  parentId: number;
  path: string;
  redirect?: string;
}

interface MenuListResponse {
  list?: MenuRouteItem[];
}

export interface MenuApi {
  getAllMenus(): Promise<MenuRouteItem[]>;
}

export function createMenuApi(client: ApiClient): MenuApi {
  return {
    async getAllMenus() {
      const response = await client.get<MenuListResponse>("menus/all");
      return response.list ?? [];
    },
  };
}
