import { render, screen } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";

import type { PluginRuntimeState } from "#/api/plugins";
import { definePluginUI } from "#/plugin-ui/contract";
import { attachPluginPagesToRoutes, createPluginUIRegistry } from "#/plugin-ui/registry";
import { PluginSlotOutlet } from "#/plugin-ui/slot-outlet";

function state(id: string, overrides: Partial<PluginRuntimeState> = {}): PluginRuntimeState {
  return {
    enabled: 1,
    generation: 3,
    id,
    installed: 1,
    runtimeState: "normal",
    statusKey: "plugins.status.enabled",
    version: "1.0.0",
    ...overrides,
  };
}

function component(text: string) {
  return async () => ({ default: () => <span>{text}</span> });
}

describe("source-plugin UI registry", () => {
  it("does not invoke page loaders while projecting the registry", () => {
    const load = vi.fn(component("page"));
    const registry = createPluginUIRegistry(
      [{
        definition: definePluginUI({
          pages: { "/studio": { capabilities: [], load, surface: "workspace" } },
          slots: {},
        }),
        pluginId: "acme-studio-source",
      }],
      [state("acme-studio-source")],
      new Set(),
    );
    expect(registry.pages["/studio"]?.surface).toBe("workspace");
    expect(registry.pages["/studio"]?.generation).toBe(3);
    expect(load).not.toHaveBeenCalled();
    const [route] = attachPluginPagesToRoutes([{
      children: [], componentKey: "system/plugin/dynamic-page", hidden: false,
      hideInBreadcrumb: false, hideInTab: false, id: 1, keepAlive: false,
      name: "Studio", path: "/studio", query: {}, title: "Studio",
    }], registry);
    expect(route).toMatchObject({
      componentKey: "/studio",
      generation: 3,
      pluginId: "acme-studio-source",
    });
  });

  it("hides disabled plugins and unmet capabilities", () => {
    const entries = [{
      definition: definePluginUI({
        pages: {
          "/allowed": { capabilities: ["organization.management"], load: component("allowed"), surface: "page" },
          "/hidden": { capabilities: ["tenant.management"], load: component("hidden"), surface: "page" },
        },
        slots: {},
      }),
      pluginId: "acme-records-source",
    }];
    expect(
      Object.keys(createPluginUIRegistry(entries, [state("acme-records-source")], new Set(["organization.management"])).pages),
    ).toEqual(["/allowed"]);
    expect(
      Object.keys(createPluginUIRegistry(entries, [state("acme-records-source", { enabled: 0 })], new Set(["organization.management"])).pages),
    ).toEqual([]);
  });

  it("preserves the identity of legacy hosted plugin routes", () => {
    const [route] = attachPluginPagesToRoutes([{
      children: [], componentKey: "IFrameView", hidden: false,
      hideInBreadcrumb: false, hideInTab: false, id: 2, iframeSrc: "/x-assets/plugin-demo/v1/index.html",
      keepAlive: false, name: "Demo", path: "/plugin-demo", pluginId: "plugin-demo",
      query: {}, title: "Demo",
    }], createPluginUIRegistry([], [], new Set()));

    expect(route?.pluginId).toBe("plugin-demo");
  });

  it("sorts visible slot items and renders their lazy components", async () => {
    const registry = createPluginUIRegistry(
      [{
        definition: definePluginUI({
          pages: {},
          slots: {
            "layout.header.actions.after": [
              { capabilities: [], key: "later", load: component("Later"), order: 20 },
              { capabilities: [], key: "first", load: component("First"), order: 10 },
            ],
          },
        }),
        pluginId: "acme-header-source",
      }],
      [state("acme-header-source")],
      new Set(),
    );
    const items = registry.slots["layout.header.actions.after"];
    expect(items.map((item) => item.key)).toEqual(["first", "later"]);
    await act(async () => {
      render(<PluginSlotOutlet items={items} />);
    });
    expect(screen.getAllByText(/First|Later/).map((item) => item.textContent)).toEqual(["First", "Later"]);
  });

  it("rejects page and slot collisions across plugins", () => {
    const definition = definePluginUI({
      pages: { "/same": { capabilities: [], load: component("same"), surface: "page" } },
      slots: {
        "layout.header.actions.after": [
          { capabilities: [], key: "same", load: component("same"), order: 1 },
        ],
      },
    });
    expect(() =>
      createPluginUIRegistry(
        [
          { definition, pluginId: "acme-one-source" },
          { definition, pluginId: "acme-two-source" },
        ],
        [state("acme-one-source"), state("acme-two-source")],
        new Set(),
      ),
    ).toThrow(/duplicate source-plugin page route/i);
  });
});
