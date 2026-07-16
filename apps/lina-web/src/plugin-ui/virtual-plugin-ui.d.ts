declare module "virtual:linapro-plugin-ui" {
  import type { PluginUIDefinition } from "@linapro/plugin-ui";

  export interface SourcePluginUIEntry {
    definition: PluginUIDefinition;
    pluginId: string;
  }

  export const sourcePluginUI: readonly SourcePluginUIEntry[];
}
