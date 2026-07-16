import enUS from "../manifest/i18n/en-US/plugin.json";
import zhCN from "../manifest/i18n/zh-CN/plugin.json";
import { createLoginLogApi } from "./pages/loginlog-client";
import definition from "./plugin-ui";

describe("linapro-monitor-loginlog React plugin UI", () => {
  it("registers and lazy-loads the login-log page", async () => {
    const page = definition.pages["/monitor/loginlog"];
    expect(page).toMatchObject({ capabilities: [], surface: "page" });
    expect((await page!.load()).default).toEqual(expect.any(Function));
  });

  it("routes list, governed cleanup, dictionary and export calls through the host API", async () => {
    const plugin = vi.fn().mockResolvedValueOnce({ items: [], total: 0 }).mockResolvedValueOnce({ deleted: 2 });
    const pluginBlob = vi.fn().mockResolvedValue(new Blob(["xlsx"]));
    const request = vi.fn().mockResolvedValue({ list: [{ label: "Success", value: "0" }] });
    const api = createLoginLogApi({ plugin, pluginBlob, request, requestBlob: vi.fn() });
    await api.list({ beginTime: "2026-07-01", pageNum: 1, pageSize: 10, status: 0 });
    expect(plugin).toHaveBeenNthCalledWith(1, "linapro-monitor-loginlog", "loginlog?beginTime=2026-07-01&pageNum=1&pageSize=10&status=0", undefined);
    await api.clean({ beginTime: "2026-07-01", endTime: "2026-07-12" });
    expect(plugin).toHaveBeenNthCalledWith(2, "linapro-monitor-loginlog", "loginlog/clean?beginTime=2026-07-01&endTime=2026-07-12", { method: "DELETE" });
    await expect(api.dict("sys_login_status")).resolves.toHaveLength(1);
    await expect(api.export({ userName: "admin" })).resolves.toBeInstanceOf(Blob);
    expect(pluginBlob).toHaveBeenCalledWith("linapro-monitor-loginlog", "loginlog/export?userName=admin");
  });

  it("ships matching bilingual React fields", () => {
    expect(enUS.plugin["linapro-monitor-loginlog"].fields.beginDate).toBe("Start Date");
    expect(zhCN.plugin["linapro-monitor-loginlog"].fields.beginDate).toBe("开始日期");
  });
});
