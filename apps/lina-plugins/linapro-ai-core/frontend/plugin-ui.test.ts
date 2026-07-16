import enUS from "../manifest/i18n/en-US/plugin.json";
import zhCN from "../manifest/i18n/zh-CN/plugin.json";
import { createAiCoreApi } from "./pages/ai-client";
import { protocolLabel } from "./pages/ai-data";
import definition from "./plugin-ui";

const routes = ["/ai/providers", "/ai/models", "/ai/tiers", "/ai/invocations"] as const;

describe("linapro-ai-core React plugin UI", () => {
  it.each(routes)("registers and lazy-loads %s", async (route) => {
    const page = definition.pages[route];
    expect(page).toMatchObject({ capabilities: [], surface: "page" });
    const module = await page!.load();
    expect(module.default).toEqual(expect.any(Function));
  });

  it("uses the governed host plugin API for queries and JSON writes", async () => {
    const plugin = vi.fn()
      .mockResolvedValueOnce({ list: [], total: 0 })
      .mockResolvedValueOnce({ id: 42 });
    const api = createAiCoreApi({ plugin, pluginBlob: vi.fn(), request: vi.fn(), requestBlob: vi.fn() });
    await expect(api.providerList({ enabled: 1, pageNum: 2, pageSize: 10 })).resolves.toEqual({ items: [], total: 0 });
    expect(plugin).toHaveBeenNthCalledWith(1, "linapro-ai-core", "ai/providers?enabled=1&pageNum=2&pageSize=10", undefined);
    await api.providerAdd({ enabled: 1, name: "Acme" });
    expect(plugin).toHaveBeenNthCalledWith(2, "linapro-ai-core", "ai/providers", expect.objectContaining({
      body: JSON.stringify({ enabled: 1, name: "Acme" }),
      method: "POST",
    }));
  });

  it("ships matching English and Chinese React UI resources", () => {
    const english = enUS.plugin["linapro-ai-core"];
    const chinese = zhCN.plugin["linapro-ai-core"];
    for (const key of ["deleteConfirm", "detail", "endTime", "required", "reset", "startTime"] as const) {
      expect(english.common[key]).toBeTruthy();
      expect(chinese.common[key]).toBeTruthy();
    }
    expect(english.provider.tableTitle).toBe("Providers");
    expect(chinese.provider.tableTitle).toBe("渠道列表");
  });

  it("normalizes protocol codes before rendering their product labels", () => {
    expect(protocolLabel("ANTHROPIC")).toBe("Anthropic");
    expect(protocolLabel("openai-compatible")).toBe("OpenAI Compatible");
  });
});
