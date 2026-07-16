import { createContext, useContext } from "react";

import type { MenuRouteItem } from "#/api/menu";
import type { PluginRuntimeState } from "#/api/plugins";
import type { CurrentUser } from "#/api/user";
import type { CapabilityProjection } from "#/plugins/capabilities";

export interface AuthenticatedContext {
  capabilities: CapabilityProjection;
  menus: MenuRouteItem[];
  plugins: PluginRuntimeState[];
  user: CurrentUser;
}

export const AuthContext = createContext<AuthenticatedContext | null>(null);
export const AuthRefreshContext = createContext<null | (() => Promise<AuthenticatedContext>)>(null);

export function useAuthContext(): AuthenticatedContext | null {
  return useContext(AuthContext);
}

export function useAuthContextRefresh(): null | (() => Promise<AuthenticatedContext>) {
  return useContext(AuthRefreshContext);
}
