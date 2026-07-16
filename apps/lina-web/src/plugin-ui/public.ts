export {
  definePluginUI,
  pluginSlotKeys,
  type PluginCapabilityKey,
  type PluginPageDefinition,
  type PluginPageSurface,
  type PluginSlotDefinition,
  type PluginSlotKey,
  type PluginUIDefinition,
} from "#/plugin-ui/contract";
export {
  type PluginHostApi,
  type PluginHostContextValue,
  type PluginHostLocale,
  type PluginHostTenantProjection,
  type PluginHostUserProjection,
  useLinaPluginHost,
} from "#/plugin-ui/plugin-host-context";
export {
  type PluginTenantTarget,
  requestTenantImpersonation,
  requestTenantImpersonationExit,
  requestTenantSwitch,
} from "#/plugin-ui/tenant-actions";
