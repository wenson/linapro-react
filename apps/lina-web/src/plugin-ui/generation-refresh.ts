import type { PluginRuntimeState } from "#/api/plugins";
import type { Query, QueryClient } from "@tanstack/react-query";

export interface PluginGenerationRefreshPlan {
  changedPluginIds: readonly string[];
  generationChangedPluginIds: readonly string[];
  shouldInterruptCurrentPage: boolean;
  shouldRebuildRoutes: boolean;
}

function signaturePart(state: PluginRuntimeState): string {
  return [
    state.id,
    state.installed,
    state.enabled,
    state.version,
    state.generation,
    state.statusKey,
    state.runtimeState ?? "",
  ].join(":");
}

export function createPluginStateSignature(states: readonly PluginRuntimeState[]): string {
  return [...states]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map(signaturePart)
    .join("|");
}

export function planPluginGenerationRefresh(
  previous: readonly PluginRuntimeState[],
  next: readonly PluginRuntimeState[],
  currentPluginId?: string,
): PluginGenerationRefreshPlan {
  if (createPluginStateSignature(previous) === createPluginStateSignature(next)) {
    return {
      changedPluginIds: [],
      generationChangedPluginIds: [],
      shouldInterruptCurrentPage: false,
      shouldRebuildRoutes: false,
    };
  }

  const previousById = new Map(previous.map((state) => [state.id, state]));
  const nextById = new Map(next.map((state) => [state.id, state]));
  const allIds = new Set([...previousById.keys(), ...nextById.keys()]);
  const changedPluginIds: string[] = [];
  const generationChangedPluginIds: string[] = [];
  for (const pluginId of [...allIds].sort()) {
    const before = previousById.get(pluginId);
    const after = nextById.get(pluginId);
    if (!before || !after || signaturePart(before) !== signaturePart(after)) {
      changedPluginIds.push(pluginId);
    }
    if (before?.generation !== after?.generation) {
      generationChangedPluginIds.push(pluginId);
    }
  }

  return {
    changedPluginIds,
    generationChangedPluginIds,
    shouldInterruptCurrentPage:
      !!currentPluginId && generationChangedPluginIds.includes(currentPluginId),
    shouldRebuildRoutes: true,
  };
}

export interface PluginStateSyncEffects {
  apply(next: readonly PluginRuntimeState[], plan: PluginGenerationRefreshPlan): Promise<void> | void;
  load(): Promise<readonly PluginRuntimeState[]>;
}

export class PluginStateSyncCoordinator {
  private inFlight: null | Promise<PluginGenerationRefreshPlan> = null;
  private states: readonly PluginRuntimeState[];

  constructor(initialStates: readonly PluginRuntimeState[], private readonly effects: PluginStateSyncEffects) {
    this.states = initialStates;
  }

  sync(currentPluginId?: string): Promise<PluginGenerationRefreshPlan> {
    if (!this.inFlight) {
      this.inFlight = this.performSync(currentPluginId).finally(() => {
        this.inFlight = null;
      });
    }
    return this.inFlight;
  }

  private async performSync(currentPluginId?: string): Promise<PluginGenerationRefreshPlan> {
    const next = await this.effects.load();
    const plan = planPluginGenerationRefresh(this.states, next, currentPluginId);
    if (plan.shouldRebuildRoutes) {
      await this.effects.apply(next, plan);
      this.states = next;
    }
    return plan;
  }
}

function isPluginQuery(query: Query, pluginId: string): boolean {
  const key = query.queryKey;
  return key[0] === "runtime" && key[1] === "plugin" && key[2] === pluginId;
}

export async function clearPluginGenerationQueries(
  queryClient: QueryClient,
  pluginId: string,
): Promise<void> {
  const predicate = (query: Query) => isPluginQuery(query, pluginId);
  await queryClient.cancelQueries({ predicate });
  queryClient.removeQueries({ predicate });
}

export async function completeTargetedPluginRefresh(options: {
  closePluginTabs(): Promise<void> | void;
  pluginId: string;
  queryClient: QueryClient;
  reenterCurrentUrl(): Promise<void> | void;
}): Promise<void> {
  await clearPluginGenerationQueries(options.queryClient, options.pluginId);
  await options.closePluginTabs();
  await options.reenterCurrentUrl();
}
