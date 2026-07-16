import type { WorkbenchRoute } from "#/router/contracts";

const hostedComponentKey = "system/plugin/dynamic-page";
const pluginAccessModes = ["iframe", "new-window"] as const;

type PluginAccessMode = (typeof pluginAccessModes)[number];

export interface HostedAsset {
  mode: PluginAccessMode;
  pluginId: string;
  source: string;
  version: string;
}

function decodePathSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new TypeError("Hosted plugin asset encoding is invalid");
  }
}

export function normalizeHostedAsset(route: WorkbenchRoute, expectedVersion?: string): HostedAsset {
  const pluginId = route.pluginId?.trim() || "";
  const mode = route.query.pluginAccessMode?.trim();
  const input = route.query.pluginAssetUrl?.trim() || "";
  if (route.componentKey !== hostedComponentKey || !pluginId) {
    throw new TypeError("Hosted plugin route identity is invalid");
  }
  if (!pluginAccessModes.includes(mode as PluginAccessMode)) {
    throw new TypeError("Hosted plugin access mode is invalid");
  }
  if (
    !input.startsWith("/x-assets/") ||
    input.startsWith("//") ||
    input.includes("?") ||
    input.includes("#") ||
    input.includes("\\") ||
    /^[a-z][a-z\d+.-]*:/i.test(input)
  ) {
    throw new TypeError("Hosted plugin asset must be a governed same-origin path");
  }
  const rawSegments = input.split("/");
  if (rawSegments.length < 5 || rawSegments[1] !== "x-assets") {
    throw new TypeError("Hosted plugin asset path is invalid");
  }
  const segments = rawSegments.map(decodePathSegment);
  if (segments.some((segment) => segment === "." || segment === ".." || segment.includes("/") || segment.includes("\\"))) {
    throw new TypeError("Hosted plugin asset path cannot escape its public root");
  }
  const assetPluginId = segments[2] || "";
  const version = segments[3] || "";
  const filename = segments.at(-1) || "";
  if (assetPluginId !== pluginId) {
    throw new TypeError("Hosted plugin asset belongs to another plugin");
  }
  if (expectedVersion && version !== expectedVersion) {
    throw new TypeError("Hosted plugin asset version is stale");
  }
  if (!filename.toLowerCase().endsWith(".html")) {
    throw new TypeError("Hosted plugin asset must be an HTML document");
  }
  return { mode: mode as PluginAccessMode, pluginId, source: input, version };
}
