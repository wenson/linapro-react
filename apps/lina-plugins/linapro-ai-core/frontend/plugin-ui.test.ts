import enUS from "../manifest/i18n/en-US/plugin.json";
import zhCN from "../manifest/i18n/zh-CN/plugin.json";
import { createAiCoreApi } from "./pages/ai-client";
import { effortLabel, protocolLabel, tierDescription, tierTestStatusLabel, type Translate } from "./pages/ai-data";
import definition from "./plugin-ui";

const routes = ["/ai/providers", "/ai/models", "/ai/tiers", "/ai/invocations"] as const;

function translator(resource: unknown): Translate {
  return (key) => {
    let current: unknown = resource;
    for (const part of key.split(".")) current = current && typeof current === "object" ? (current as Record<string, unknown>)[part] : undefined;
    return typeof current === "string" ? current : key;
  };
}

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

  it("localizes tier descriptions, test status and thinking effort without translating editable fallback text", () => {
    const tier = { binding: undefined, capabilityMethod: "generate", capabilityType: "image", code: "advanced", defaultEffort: "high", description: "Editable fallback", displayName: "Advanced", enabled: 1, id: 1, lastTestAt: 0, lastTestErrorSummary: "", lastTestLatencyMs: 120, lastTestStatus: "success", sortOrder: 3, updatedAt: 0 };
    const english = translator(enUS);
    const chinese = translator(zhCN);
    expect(tierDescription(english, tier)).toContain("High-quality image generation");
    expect(tierDescription(chinese, tier)).toContain("高质量图像生成");
    expect(tierTestStatusLabel(chinese, "success")).toBe("成功");
    expect(effortLabel(english, "high")).toBe("High");
    expect(tierDescription(english, { ...tier, capabilityMethod: "custom", capabilityType: "custom", code: "custom" })).toBe("Editable fallback");
  });
});
