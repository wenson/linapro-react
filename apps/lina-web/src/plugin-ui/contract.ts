import type { ComponentType } from "react";

export const pluginSlotKeys = [
  "auth.login.after",
  "auth.login.social",
  "crud.table.after",
  "crud.toolbar.after",
  "dashboard.workspace.before",
  "dashboard.workspace.after",
  "layout.header.actions.before",
  "layout.header.actions.after",
  "layout.user-dropdown.after",
] as const;

export type PluginSlotKey = (typeof pluginSlotKeys)[number];
export type PluginCapabilityKey = string;
export type PluginPageSurface = "page" | "workspace";
export type PluginComponentModule = { default: ComponentType };

export interface PluginPageDefinition {
  capabilities: readonly PluginCapabilityKey[];
  load: () => Promise<PluginComponentModule>;
  surface: PluginPageSurface;
}

export interface PluginSlotDefinition {
  capabilities: readonly PluginCapabilityKey[];
  key: string;
  load: () => Promise<PluginComponentModule>;
  order: number;
}

export interface PluginUIDefinition {
  pages: Readonly<Record<string, PluginPageDefinition>>;
  slots: Partial<Readonly<Record<PluginSlotKey, readonly PluginSlotDefinition[]>>>;
}

const publishedSlots = new Set<string>(pluginSlotKeys);

export function normalizePluginPageRoute(route: string): string {
  const input = route.trim().replaceAll("\\", "/");
  if (!input || input.startsWith("//") || /^[a-z][a-z\d+.-]*:/i.test(input)) {
    throw new TypeError(`Invalid plugin page route: ${route}`);
  }
  if (input.includes("?") || input.includes("#")) {
    throw new TypeError(`Plugin page routes cannot contain query strings or fragments: ${route}`);
  }
  const segments = input.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  if (segments.some((segment) => segment === "." || segment === "..")) {
    throw new TypeError(`Plugin page routes cannot escape their route root: ${route}`);
  }
  return segments.length ? `/${segments.join("/")}` : "/";
}

function assertPageDefinition(route: string, page: PluginPageDefinition): void {
  if (typeof page?.load !== "function") {
    throw new TypeError(`Plugin page ${route} must declare a lazy load() function`);
  }
  if (page.surface !== "page" && page.surface !== "workspace") {
    throw new TypeError(`Plugin page ${route} uses an unknown surface`);
  }
  if (!Array.isArray(page.capabilities)) {
    throw new TypeError(`Plugin page ${route} must declare capabilities`);
  }
}

function assertSlotDefinition(slot: string, item: PluginSlotDefinition): void {
  if (!item.key?.trim()) {
    throw new TypeError(`Plugin slot ${slot} contains an item without a key`);
  }
  if (typeof item.load !== "function") {
    throw new TypeError(`Plugin slot item ${item.key} must declare a lazy load() function`);
  }
  if (!Number.isFinite(item.order)) {
    throw new TypeError(`Plugin slot item ${item.key} must declare a finite order`);
  }
  if (!Array.isArray(item.capabilities)) {
    throw new TypeError(`Plugin slot item ${item.key} must declare capabilities`);
  }
}

export function definePluginUI(definition: PluginUIDefinition): PluginUIDefinition {
  if (Object.hasOwn(definition as object, "pluginId")) {
    throw new TypeError("Plugin UI manifests cannot override the directory-owned plugin ID");
  }

  const normalizedPages: Record<string, PluginPageDefinition> = {};
  for (const [route, page] of Object.entries(definition.pages ?? {})) {
    const normalizedRoute = normalizePluginPageRoute(route);
    if (normalizedPages[normalizedRoute]) {
      throw new TypeError(`Duplicate plugin page route: ${normalizedRoute}`);
    }
    assertPageDefinition(normalizedRoute, page);
    normalizedPages[normalizedRoute] = page;
  }

  const normalizedSlots: Partial<Record<PluginSlotKey, readonly PluginSlotDefinition[]>> = {};
  for (const [slot, items] of Object.entries(definition.slots ?? {})) {
    if (!publishedSlots.has(slot)) {
      throw new TypeError(`Unknown plugin slot: ${slot}`);
    }
    const seenKeys = new Set<string>();
    for (const item of items ?? []) {
      assertSlotDefinition(slot, item);
      const key = item.key.trim();
      if (seenKeys.has(key)) {
        throw new TypeError(`Duplicate slot item key: ${key}`);
      }
      seenKeys.add(key);
    }
    normalizedSlots[slot as PluginSlotKey] = Object.freeze([...(items ?? [])]);
  }

  return Object.freeze({
    pages: Object.freeze(normalizedPages),
    slots: Object.freeze(normalizedSlots),
  });
}
