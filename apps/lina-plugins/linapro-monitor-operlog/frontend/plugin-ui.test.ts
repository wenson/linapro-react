import enUS from "../manifest/i18n/en-US/plugin.json";
import zhCN from "../manifest/i18n/zh-CN/plugin.json";
import { parseJson } from "./pages/data";
import { createOperLogApi } from "./pages/operlog-client";
import definition from "./plugin-ui";

describe("linapro-monitor-operlog React plugin UI", () => {
  it("registers and lazy-loads the operation-log page", async () => {
    const page = definition.pages["/monitor/operlog"];
    expect(page).toMatchObject({ capabilities: [], surface: "page" });
    expect((await page!.load()).default).toEqual(expect.any(Function));
  });

  it("routes paged queries, selected export and cleanup through governed host APIs", async () => {
    const plugin = vi.fn().mockResolvedValueOnce({ items: [], total: 0 }).mockResolvedValueOnce({ deleted: 3 });
    const pluginBlob = vi.fn().mockResolvedValue(new Blob(["xlsx"]));
    const api = createOperLogApi({ plugin, pluginBlob, request: vi.fn(), requestBlob: vi.fn() });
    await api.list({ operType: "delete", pageNum: 1, pageSize: 10 });
    expect(plugin).toHaveBeenNthCalledWith(1, "linapro-monitor-operlog", "operlog?operType=delete&pageNum=1&pageSize=10", undefined);
    await api.clean({ beginTime: "2026-07-01", endTime: "2026-07-12" });
    expect(plugin).toHaveBeenNthCalledWith(2, "linapro-monitor-operlog", "operlog/clean?beginTime=2026-07-01&endTime=2026-07-12", { method: "DELETE" });
    await api.export({ ids: [4, 8] });
    expect(pluginBlob).toHaveBeenCalledWith("linapro-monitor-operlog", "operlog/export?ids=4&ids=8");
  });

  it("keeps JSON detail rendering safe and bilingual date labels complete", () => {
    expect(parseJson('{"ok":true}')).toEqual({ ok: true });
    expect(parseJson("not-json")).toBeNull();
    expect(enUS.plugin["linapro-monitor-operlog"].fields.endDate).toBe("End Date");
    expect(zhCN.plugin["linapro-monitor-operlog"].fields.endDate).toBe("结束日期");
  });
});
