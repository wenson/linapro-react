import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";

import type { PluginRuntimeState } from "#/api/plugins";
import {
  createPluginStateSignature,
  completeTargetedPluginRefresh,
  planPluginGenerationRefresh,
  PluginStateSyncCoordinator,
} from "#/plugin-ui/generation-refresh";

function state(id: string, generation = 1): PluginRuntimeState {
  return {
    enabled: 1,
    generation,
    id,
    installed: 1,
    runtimeState: "normal",
    statusKey: "plugins.status.enabled",
    version: "1.0.0",
  };
}

describe("plugin generation refresh", () => {
  it("creates a stable signature independent of response order", () => {
    expect(createPluginStateSignature([state("b"), state("a")])).toBe(
      createPluginStateSignature([state("a"), state("b")]),
    );
  });

  it("does not rebuild routes when the state signature is unchanged", () => {
    expect(planPluginGenerationRefresh([state("a")], [state("a")], "a")).toEqual({
      changedPluginIds: [],
      generationChangedPluginIds: [],
      shouldInterruptCurrentPage: false,
      shouldRebuildRoutes: false,
    });
  });

  it("only interrupts the current page when its own generation changes", () => {
    const previous = [state("a"), state("b")];
    const next = [state("a"), state("b", 2)];
    expect(planPluginGenerationRefresh(previous, next, "a").shouldInterruptCurrentPage).toBe(false);
    expect(planPluginGenerationRefresh(previous, next, "b").shouldInterruptCurrentPage).toBe(true);
    expect(planPluginGenerationRefresh(previous, next).shouldInterruptCurrentPage).toBe(false);
  });

  it("coalesces concurrent focus and visibility synchronizations", async () => {
    let resolveLoad!: (value: readonly PluginRuntimeState[]) => void;
    const load = vi.fn(() => new Promise<readonly PluginRuntimeState[]>((resolve) => {
      resolveLoad = resolve;
    }));
    const apply = vi.fn();
    const coordinator = new PluginStateSyncCoordinator([state("a")], { apply, load });
    const focusSync = coordinator.sync("a");
    const visibilitySync = coordinator.sync("a");
    expect(load).toHaveBeenCalledTimes(1);
    resolveLoad([state("a", 2)]);
    expect(await focusSync).toBe(await visibilitySync);
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it("clears only the changed plugin cache before closing tabs and re-entering", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(["runtime", "plugin", "a", "1", "records"], "a");
    queryClient.setQueryData(["runtime", "plugin", "b", "1", "records"], "b");
    const order: string[] = [];
    await completeTargetedPluginRefresh({
      closePluginTabs: () => { order.push("tabs"); },
      pluginId: "a",
      queryClient,
      reenterCurrentUrl: () => { order.push("reenter"); },
    });
    expect(queryClient.getQueryData(["runtime", "plugin", "a", "1", "records"])).toBeUndefined();
    expect(queryClient.getQueryData(["runtime", "plugin", "b", "1", "records"])).toBe("b");
    expect(order).toEqual(["tabs", "reenter"]);
  });
});
