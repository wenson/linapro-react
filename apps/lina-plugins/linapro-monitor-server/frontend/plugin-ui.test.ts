import enUS from "../manifest/i18n/en-US/plugin.json";
import zhCN from "../manifest/i18n/zh-CN/plugin.json";
import { createServerMonitorApi } from "./pages/server-client";
import { formatBytes } from "./pages/server-data";
import definition from "./plugin-ui";

describe("linapro-monitor-server React plugin UI", () => {
  it("registers and lazy-loads the server-monitor page", async () => {
    const page = definition.pages["/monitor/server"];
    expect(page).toMatchObject({ capabilities: [], surface: "page" });
    expect((await page!.load()).default).toEqual(expect.any(Function));
  });

  it("queries all nodes or an encoded node through the governed plugin API", async () => {
    const plugin = vi.fn().mockResolvedValue({ dbInfo: null, nodes: [] });
    const api = createServerMonitorApi({ plugin, pluginBlob: vi.fn(), request: vi.fn(), requestBlob: vi.fn() });
    await api.get();
    await api.get("node/a");
    expect(plugin).toHaveBeenNthCalledWith(1, "linapro-monitor-server", "monitor/server");
    expect(plugin).toHaveBeenNthCalledWith(2, "linapro-monitor-server", "monitor/server?nodeName=node%2Fa");
  });

  it("formats binary metrics and ships bilingual runtime labels", () => {
    expect(formatBytes(1024)).toBe("1.00 KB");
    expect(enUS.plugin["linapro-monitor-server"].fields.goroutines).toBe("Goroutines");
    expect(zhCN.plugin["linapro-monitor-server"].fields.goroutines).toBe("协程数");
    expect(enUS.plugin["linapro-monitor-server"].units.cores).toBe("{{value}} core(s)");
    expect(zhCN.plugin["linapro-monitor-server"].time.minutes).toBe("{{value}} 分钟");
  });
});
