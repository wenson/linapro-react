import { createContext, useContext } from "react";

import type { ApiClient } from "#/api/client";
import type { PublicFrontendConfig } from "#/runtime/public-config";
import type { TenantStore } from "#/tenant/tenant-store";

export interface WorkbenchRuntimeContextValue {
  apiClient: ApiClient;
  config: PublicFrontendConfig;
  tenantStore?: TenantStore;
}

export const WorkbenchRuntimeContext = createContext<WorkbenchRuntimeContextValue | null>(null);

export function useWorkbenchRuntime(): WorkbenchRuntimeContextValue {
  const context = useContext(WorkbenchRuntimeContext);
  if (!context) {
    throw new Error("useWorkbenchRuntime must be used within WorkbenchRuntimeProvider");
  }
  return context;
}
