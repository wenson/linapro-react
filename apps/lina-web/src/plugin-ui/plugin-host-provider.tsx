import type { PropsWithChildren } from "react";

import {
  PluginHostContext,
  type PluginHostContextValue,
} from "#/plugin-ui/plugin-host-context";

export function LinaPluginHostProvider({
  children,
  value,
}: PropsWithChildren<{ value: PluginHostContextValue }>) {
  return <PluginHostContext.Provider value={value}>{children}</PluginHostContext.Provider>;
}
