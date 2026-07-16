import type { ApiClient } from "#/api/client";

export interface SystemComponentInfo {
  description: string;
  name: string;
  url: string;
  version: string;
}

export interface SystemFrameworkInfo {
  description: string;
  homepage: string;
  license: string;
  name: string;
  repositoryUrl: string;
  version: string;
}

export interface SystemInfo {
  arch: string;
  backendComponents: SystemComponentInfo[];
  dbVersion: string;
  framework: SystemFrameworkInfo;
  frontendComponents: SystemComponentInfo[];
  gfVersion: string;
  goVersion: string;
  os: string;
  runDuration: string;
  runDurationSeconds: number;
  startTime: number | null;
}

export interface AboutApi {
  getSystemInfo(): Promise<SystemInfo>;
}

export function createAboutApi(client: ApiClient): AboutApi {
  return { getSystemInfo: () => client.get<SystemInfo>("system/info") };
}
