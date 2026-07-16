import type { PluginHostApi } from "@linapro/plugin-ui";

const pluginId = "linapro-monitor-online";

export interface OnlineUser {
  browser: string;
  deptName: string;
  ip: string;
  loginTime: number | null;
  os: string;
  tokenId: string;
  username: string;
}

export interface OnlineListParams {
  ip?: string;
  pageNum?: number;
  pageSize?: number;
  username?: string;
}

function path(params?: OnlineListParams): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  }
  return query.size ? `monitor/online/list?${query.toString()}` : "monitor/online/list";
}

export function createOnlineApi(host: PluginHostApi) {
  return {
    forceLogout: (tokenId: string) => host.plugin<void>(pluginId, `monitor/online/${encodeURIComponent(tokenId)}`, { method: "DELETE" }),
    list: (params?: OnlineListParams) => host.plugin<{ items: OnlineUser[]; total: number }>(pluginId, path(params)),
  };
}
