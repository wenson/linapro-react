import enUS from "../manifest/i18n/en-US/plugin.json";
import zhCN from "../manifest/i18n/zh-CN/plugin.json";
import { createOnlineApi } from "./pages/online-client";
import definition from "./plugin-ui";

describe("linapro-monitor-online React plugin UI", () => {
  it("registers and lazy-loads the online-user page", async () => {
    const page = definition.pages["/monitor/online"];
    expect(page).toMatchObject({ capabilities: [], surface: "page" });
    expect((await page!.load()).default).toEqual(expect.any(Function));
  });

  it("uses tenant-governed plugin endpoints for list and force logout", async () => {
    const plugin = vi.fn().mockResolvedValueOnce({ items: [], total: 0 }).mockResolvedValueOnce(undefined);
    const api = createOnlineApi({ plugin, pluginBlob: vi.fn(), request: vi.fn(), requestBlob: vi.fn() });
    await api.list({ ip: "127.0.0.1", pageNum: 2, pageSize: 10 });
    expect(plugin).toHaveBeenNthCalledWith(1, "linapro-monitor-online", "monitor/online/list?ip=127.0.0.1&pageNum=2&pageSize=10");
    await api.forceLogout("token/a");
    expect(plugin).toHaveBeenNthCalledWith(2, "linapro-monitor-online", "monitor/online/token%2Fa", { method: "DELETE" });
  });

  it("ships matching bilingual action resources", () => {
    expect(enUS.plugin["linapro-monitor-online"].page.actions.forceLogout).toBe("Force Logout");
    expect(zhCN.plugin["linapro-monitor-online"].page.actions.forceLogout).toBe("强制下线");
  });
});
