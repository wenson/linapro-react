import type { PluginHostApi } from "@linapro/plugin-ui";

const pluginId = "linapro-monitor-server";

export interface ServerDiskInfo {
  free: number;
  fsType: string;
  path: string;
  total: number;
  usagePercent: number;
  used: number;
}

export interface ServerNodeInfo {
  collectAt: number | null;
  cpu: null | { cores: number; modelName: string; usagePercent: number };
  disks: ServerDiskInfo[];
  goInfo: null | { gcPauseNs: number; gfVersion: string; goroutines: number; processCpu: number; processMemory: number; serviceUptime: string; version: string };
  memory: null | { available: number; total: number; usagePercent: number; used: number };
  network: null | { bytesRecv: number; bytesSent: number; recvRate: number; sendRate: number };
  nodeIp: string;
  nodeName: string;
  server: null | { arch: string; bootTime: number | null; hostname: string; os: string; startTime: number | null; uptime: number };
}

export interface ServerMonitorResult {
  dbInfo: null | { idle: number; inUse: number; maxOpenConns: number; openConns: number; version: string };
  nodes: ServerNodeInfo[];
}

export function createServerMonitorApi(host: PluginHostApi) {
  return {
    get: (nodeName?: string) => host.plugin<ServerMonitorResult>(pluginId, nodeName ? `monitor/server?nodeName=${encodeURIComponent(nodeName)}` : "monitor/server"),
  };
}
