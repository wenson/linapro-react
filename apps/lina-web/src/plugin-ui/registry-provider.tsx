import type { PropsWithChildren } from "react";

import { PluginUIRegistryContext } from "#/plugin-ui/registry-context";
import type { PluginUIRegistry } from "#/plugin-ui/registry";

export function PluginUIRegistryProvider({
  children,
  registry,
}: PropsWithChildren<{ registry: PluginUIRegistry }>) {
  return <PluginUIRegistryContext.Provider value={registry}>{children}</PluginUIRegistryContext.Provider>;
}
