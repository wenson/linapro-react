import { createContext, useContext } from "react";

import type { PluginUIRegistry } from "#/plugin-ui/registry";

export const PluginUIRegistryContext = createContext<PluginUIRegistry | null>(null);

export function usePluginUIRegistry(): PluginUIRegistry {
  const registry = useContext(PluginUIRegistryContext);
  if (!registry) {
    throw new Error("usePluginUIRegistry must be used within PluginUIRegistryProvider");
  }
  return registry;
}
