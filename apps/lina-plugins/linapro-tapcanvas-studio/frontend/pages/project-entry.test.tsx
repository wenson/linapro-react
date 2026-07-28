import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PluginHostContextValue } from "@linapro/plugin-ui";

import ProjectEntry from "./project-entry";

let currentHost: PluginHostContextValue;

vi.mock("@linapro/plugin-ui", async (importOriginal) => {
  const original = await importOriginal<typeof import("@linapro/plugin-ui")>();
  return { ...original, useLinaPluginHost: () => currentHost };
});

function buildHost(overrides: Partial<PluginHostContextValue> = {}): PluginHostContextValue {
  return {
    api: {
      plugin: vi.fn(async (_pluginId: string, path: string) => {
        if (path.startsWith("projects?")) {
          return {
            list: [{
              chapterCount: 2,
              createdAt: 1_784_102_400_000,
              description: "A tenant-scoped story",
              id: "project-1",
              latestFlow: null,
              name: "North Star",
              ownerId: 1,
              updatedAt: 1_784_102_400_000,
            }],
            total: 1,
          };
        }
        if (path === "projects/project-1/chapters") return { list: [] };
        throw new Error(`Unexpected plugin request: ${path}`);
      }),
      pluginBlob: vi.fn(),
      request: vi.fn(async () => ({ list: [{ label: "Draft", value: "draft" }] })),
      requestBlob: vi.fn(),
    },
    locale: "en-US",
    permissions: new Set(["tapcanvas:project:view"]),
    t: (key) => key,
    tenant: { code: "alpha", id: 10, impersonated: false, name: "Alpha" },
    user: { id: 1, name: "Lina" },
    ...overrides,
  };
}

beforeEach(() => {
  currentHost = buildHost();
});

describe("TapCanvas project entry", () => {
  it("blocks before issuing project or dictionary requests without an active tenant", async () => {
    currentHost = buildHost({ tenant: null });
    render(<ProjectEntry />);

    expect(screen.getByRole("alert")).toHaveTextContent("plugin.linapro-tapcanvas-studio.studio.tenantRequiredTitle");
    await waitFor(() => {
      expect(currentHost.api.plugin).not.toHaveBeenCalled();
      expect(currentHost.api.request).not.toHaveBeenCalled();
    });
  });

  it("loads visible projects while hiding mutations not granted by LinaPro permissions", async () => {
    render(<ProjectEntry />);

    expect(await screen.findByText("North Star")).toBeInTheDocument();
    expect(currentHost.api.plugin).toHaveBeenCalledWith(
      "linapro-tapcanvas-studio",
      "projects?pageNum=1&pageSize=10",
      undefined,
    );
    expect(currentHost.api.request).toHaveBeenCalledWith("dict/data/type/tapcanvas_chapter_status");
    expect(screen.queryByText("keyword", { exact: true })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("plugin.linapro-tapcanvas-studio.projects.searchPlaceholder")).toBeVisible();
    expect(screen.queryByText("plugin.linapro-tapcanvas-studio.projects.create")).not.toBeInTheDocument();
    expect(screen.queryByText("pages.common.edit")).not.toBeInTheDocument();
    expect(screen.queryByText("pages.common.delete")).not.toBeInTheDocument();
    expect(screen.getByText("plugin.linapro-tapcanvas-studio.projects.chapters.manage")).toBeInTheDocument();
  });
});
