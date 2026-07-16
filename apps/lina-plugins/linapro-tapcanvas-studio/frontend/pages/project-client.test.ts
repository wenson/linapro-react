import type { PluginHostApi } from "@linapro/plugin-ui";
import { describe, expect, it, vi } from "vitest";

import { createProjectApi } from "./project-client";

function hostApi(plugin = vi.fn(), request = vi.fn()): PluginHostApi {
  return { plugin, pluginBlob: vi.fn(), request, requestBlob: vi.fn() };
}

describe("TapCanvas project host API", () => {
  it("routes project CRUD through the governed plugin endpoint", async () => {
    const plugin = vi.fn()
      .mockResolvedValueOnce({ list: [], total: 0 })
      .mockResolvedValueOnce({ id: "project-1" })
      .mockResolvedValueOnce({ id: "project-1" })
      .mockResolvedValueOnce(undefined);
    const api = createProjectApi(hostApi(plugin));

    await expect(api.listProjects({ keyword: "story bible", pageNum: 2, pageSize: 20 }))
      .resolves.toEqual({ items: [], total: 0 });
    expect(plugin).toHaveBeenNthCalledWith(
      1,
      "linapro-tapcanvas-studio",
      "projects?keyword=story+bible&pageNum=2&pageSize=20",
      undefined,
    );

    await api.createProject({ description: "First season", name: "North Star" });
    expect(plugin).toHaveBeenNthCalledWith(2, "linapro-tapcanvas-studio", "projects", {
      body: JSON.stringify({ description: "First season", name: "North Star" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    await api.updateProject("project/1", { description: "Second season", name: "North Star" });
    expect(plugin).toHaveBeenNthCalledWith(3, "linapro-tapcanvas-studio", "projects/project%2F1", expect.objectContaining({ method: "PUT" }));

    await api.deleteProject("project/1");
    expect(plugin).toHaveBeenNthCalledWith(4, "linapro-tapcanvas-studio", "projects/project%2F1", { method: "DELETE" });
  });

  it("routes chapter CRUD and complete-order replacement without client-owned scope fields", async () => {
    const plugin = vi.fn()
      .mockResolvedValueOnce({ list: [] })
      .mockResolvedValueOnce({ id: "chapter-1" })
      .mockResolvedValueOnce({ id: "chapter-1" })
      .mockResolvedValueOnce({ list: [] })
      .mockResolvedValueOnce(undefined);
    const api = createProjectApi(hostApi(plugin));

    await api.listChapters("project/1");
    expect(plugin).toHaveBeenNthCalledWith(1, "linapro-tapcanvas-studio", "projects/project%2F1/chapters", undefined);

    const input = { status: "planning", summary: "Opening", title: "Chapter One" };
    await api.createChapter("project/1", input);
    expect(plugin).toHaveBeenNthCalledWith(2, "linapro-tapcanvas-studio", "projects/project%2F1/chapters", expect.objectContaining({
      body: JSON.stringify(input),
      method: "POST",
    }));

    await api.updateChapter("chapter/1", input);
    expect(plugin).toHaveBeenNthCalledWith(3, "linapro-tapcanvas-studio", "chapters/chapter%2F1", expect.objectContaining({ method: "PUT" }));

    await api.reorderChapters("project/1", ["chapter-2", "chapter-1"]);
    expect(plugin).toHaveBeenNthCalledWith(4, "linapro-tapcanvas-studio", "projects/project%2F1/chapters/order", expect.objectContaining({
      body: JSON.stringify({ chapterIds: ["chapter-2", "chapter-1"] }),
      method: "PUT",
    }));

    await api.deleteChapter("chapter/1");
    expect(plugin).toHaveBeenNthCalledWith(5, "linapro-tapcanvas-studio", "chapters/chapter%2F1", { method: "DELETE" });
  });

  it("reads chapter status options from the LinaPro dictionary API", async () => {
    const request = vi.fn().mockResolvedValue({ list: [{ label: "Draft", value: "draft" }] });
    const api = createProjectApi(hostApi(vi.fn(), request));

    await expect(api.listStatuses()).resolves.toEqual([{ label: "Draft", value: "draft" }]);
    expect(request).toHaveBeenCalledWith("dict/data/type/tapcanvas_chapter_status");
  });
});
