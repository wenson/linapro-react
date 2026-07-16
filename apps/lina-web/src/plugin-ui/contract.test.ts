import { describe, expect, it, vi } from "vitest";

import {
  definePluginUI,
  normalizePluginPageRoute,
  pluginSlotKeys,
  type PluginPageDefinition,
  type PluginSlotDefinition,
} from "#/plugin-ui/contract";

function page(load = vi.fn()): PluginPageDefinition {
  return { capabilities: [], load, surface: "page" };
}

function slot(key: string): PluginSlotDefinition {
  return { capabilities: [], key, load: vi.fn(), order: 10 };
}

describe("source-plugin UI contract", () => {
  it("publishes the frozen eight host slots", () => {
    expect(pluginSlotKeys).toEqual([
      "auth.login.after",
      "crud.table.after",
      "crud.toolbar.after",
      "dashboard.workspace.before",
      "dashboard.workspace.after",
      "layout.header.actions.before",
      "layout.header.actions.after",
      "layout.user-dropdown.after",
    ]);
  });

  it("normalizes page map keys as menu routes", () => {
    expect(normalizePluginPageRoute("ai//providers/")).toBe("/ai/providers");
    expect(() => normalizePluginPageRoute("../providers")).toThrow(/escape/i);
    expect(() => normalizePluginPageRoute("https://example.com/page")).toThrow(/invalid/i);
  });

  it("rejects duplicate normalized page routes", () => {
    expect(() =>
      definePluginUI({
        pages: {
          "/ai/providers": page(),
          "ai/providers/": page(),
        },
        slots: {},
      }),
    ).toThrow(/duplicate plugin page route/i);
  });

  it("rejects duplicate slot items and unknown slots", () => {
    expect(() =>
      definePluginUI({
        pages: {},
        slots: {
          "layout.header.actions.after": [slot("duplicate"), slot("duplicate")],
        },
      }),
    ).toThrow(/duplicate slot item key/i);
    expect(() =>
      definePluginUI({ pages: {}, slots: { unknown: [slot("x")] } as never }),
    ).toThrow(/unknown plugin slot/i);
  });

  it("keeps component modules lazy and rejects manifest-owned plugin IDs", () => {
    const load = vi.fn();
    definePluginUI({ pages: { "/studio": page(load) }, slots: {} });
    expect(load).not.toHaveBeenCalled();
    expect(() =>
      definePluginUI({ pages: {}, pluginId: "forbidden", slots: {} } as never),
    ).toThrow(/directory-owned plugin ID/i);
  });
});
