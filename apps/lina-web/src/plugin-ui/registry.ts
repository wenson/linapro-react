import { lazy } from "react";
import type { LazyExoticComponent } from "react";
import type { ComponentType } from "react";

import type { PluginRuntimeState } from "#/api/plugins";
import type {
  PluginPageSurface,
  PluginSlotDefinition,
  PluginSlotKey,
  PluginUIDefinition,
} from "#/plugin-ui/contract";
import { normalizePluginPageRoute, pluginSlotKeys } from "#/plugin-ui/contract";
import type { HostPageRegistry, WorkbenchRoute } from "#/router/contracts";

export interface SourcePluginUIEntry {
  definition: PluginUIDefinition;
  pluginId: string;
}

export interface RegisteredPluginPage {
  component: LazyExoticComponent<ComponentType>;
  generation: number;
  pluginId: string;
  route: string;
  surface: PluginPageSurface;
}

export interface RegisteredPluginSlot extends PluginSlotDefinition {
  component: LazyExoticComponent<ComponentType>;
  generation: number;
  pluginId: string;
  slot: PluginSlotKey;
}

export interface PluginUIRegistry {
  pages: Readonly<Record<string, RegisteredPluginPage>>;
  slots: Readonly<Record<PluginSlotKey, readonly RegisteredPluginSlot[]>>;
}

function enabledPluginState(state: PluginRuntimeState | undefined): state is PluginRuntimeState {
  return !!state && state.installed === 1 && state.enabled === 1 && (!state.runtimeState || state.runtimeState === "normal");
}

function hasCapabilities(required: readonly string[], capabilities: ReadonlySet<string>): boolean {
  return required.every((capability) => capabilities.has(capability));
}

function emptySlots(): Record<PluginSlotKey, RegisteredPluginSlot[]> {
  const slots = {} as Record<PluginSlotKey, RegisteredPluginSlot[]>;
  for (const key of pluginSlotKeys) {
    slots[key] = [];
  }
  return slots;
}

export function createPluginUIRegistry(
  entries: readonly SourcePluginUIEntry[],
  pluginStates: readonly PluginRuntimeState[],
  capabilities: ReadonlySet<string>,
): PluginUIRegistry {
  const stateByPlugin = new Map(pluginStates.map((state) => [state.id, state]));
  const pages: Record<string, RegisteredPluginPage> = {};
  const slots = emptySlots();
  const slotKeys = new Map<PluginSlotKey, Set<string>>(
    pluginSlotKeys.map((slot) => [slot, new Set<string>()]),
  );

  for (const entry of [...entries].sort((left, right) => left.pluginId.localeCompare(right.pluginId))) {
    const state = stateByPlugin.get(entry.pluginId);
    if (!enabledPluginState(state)) {
      continue;
    }
    for (const [route, page] of Object.entries(entry.definition.pages)) {
      if (!hasCapabilities(page.capabilities, capabilities)) {
        continue;
      }
      const normalizedRoute = normalizePluginPageRoute(route);
      if (pages[normalizedRoute]) {
        throw new Error(`Duplicate source-plugin page route: ${normalizedRoute}`);
      }
      pages[normalizedRoute] = {
        component: lazy(page.load),
        generation: state.generation,
        pluginId: entry.pluginId,
        route: normalizedRoute,
        surface: page.surface,
      };
    }
    for (const slot of pluginSlotKeys) {
      for (const item of entry.definition.slots[slot] ?? []) {
        if (!hasCapabilities(item.capabilities, capabilities)) {
          continue;
        }
        const seen = slotKeys.get(slot)!;
        if (seen.has(item.key)) {
          throw new Error(`Duplicate source-plugin slot item key in ${slot}: ${item.key}`);
        }
        seen.add(item.key);
        slots[slot].push({
          ...item,
          component: lazy(item.load),
          generation: state.generation,
          pluginId: entry.pluginId,
          slot,
        });
      }
    }
  }

  for (const slot of pluginSlotKeys) {
    slots[slot].sort(
      (left, right) => left.order - right.order || left.pluginId.localeCompare(right.pluginId) || left.key.localeCompare(right.key),
    );
    Object.freeze(slots[slot]);
  }
  return Object.freeze({ pages: Object.freeze(pages), slots: Object.freeze(slots) });
}

export function projectPluginPageRegistry(registry: PluginUIRegistry): HostPageRegistry {
  return Object.fromEntries(
    Object.entries(registry.pages).map(([route, page]) => [
      route,
      { component: page.component, surface: page.surface },
    ]),
  );
}

export function attachPluginPagesToRoutes(
  routes: readonly WorkbenchRoute[],
  registry: PluginUIRegistry,
): WorkbenchRoute[] {
  return routes.map((route) => {
    const pluginPage = registry.pages[normalizePluginPageRoute(route.path)];
    return {
      ...route,
      children: attachPluginPagesToRoutes(route.children, registry),
      componentKey: pluginPage ? pluginPage.route : route.componentKey,
      generation: pluginPage?.generation,
      pluginId: pluginPage?.pluginId ?? route.pluginId,
    };
  });
}
