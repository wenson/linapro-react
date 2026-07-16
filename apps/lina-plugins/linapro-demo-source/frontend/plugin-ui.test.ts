import enUS from "../manifest/i18n/en-US/plugin.json";
import zhCN from "../manifest/i18n/zh-CN/plugin.json";
import { createDemoRecordApi } from "./pages/demo-record-client";
import definition from "./plugin-ui";

describe("linapro-demo-source React plugin UI", () => {
  it("registers and lazy-loads the canonical extension route", async () => {
    const page = definition.pages["/extension/linapro-demo-source-sidebar-entry"];
    expect(page).toMatchObject({ capabilities: [], surface: "page" });
    expect((await page!.load()).default).toEqual(expect.any(Function));
  });

  it("keeps multipart CRUD and attachment downloads behind the host projection", async () => {
    const plugin = vi.fn().mockResolvedValueOnce({ id: 9 });
    const pluginBlob = vi.fn().mockResolvedValue(new Blob(["demo"]));
    const api = createDemoRecordApi({ plugin, pluginBlob, request: vi.fn(), requestBlob: vi.fn() });
    const file = new File(["body"], "demo.txt", { type: "text/plain" });
    await api.create({ content: "Body", title: "Title" }, file);
    expect(plugin).toHaveBeenCalledWith("linapro-demo-source", "plugins/linapro-demo-source/records", expect.objectContaining({ body: expect.any(FormData), method: "POST" }));
    await expect(api.download(9)).resolves.toBeInstanceOf(Blob);
    expect(pluginBlob).toHaveBeenCalledWith("linapro-demo-source", "plugins/linapro-demo-source/records/9/attachment");
  });

  it("ships matching bilingual page resources", () => {
    expect(enUS.plugin["linapro-demo-source"].page.tableTitle).toBe("Demo Records");
    expect(zhCN.plugin["linapro-demo-source"].page.tableTitle).toBe("示例记录");
  });
});
