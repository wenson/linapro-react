import enUS from "../manifest/i18n/en-US/plugin.json";
import zhCN from "../manifest/i18n/zh-CN/plugin.json";
import { sanitizeNoticeHtml } from "./pages/data";
import { createNoticeApi } from "./pages/notice-client";
import definition from "./plugin-ui";

describe("linapro-content-notice React plugin UI", () => {
  it("registers and lazy-loads the notice page", async () => {
    const page = definition.pages["/system/notice"];
    expect(page).toMatchObject({ capabilities: [], surface: "page" });
    expect((await page!.load()).default).toEqual(expect.any(Function));
  });

  it("routes notice CRUD and host dictionary reads through the stable host API", async () => {
    const plugin = vi.fn().mockResolvedValueOnce({ list: [], total: 0 }).mockResolvedValueOnce(undefined);
    const request = vi.fn().mockResolvedValue({ list: [{ label: "Notice", value: "1" }] });
    const api = createNoticeApi({ plugin, pluginBlob: vi.fn(), request, requestBlob: vi.fn() });
    await expect(api.list({ pageNum: 1, pageSize: 10, title: "hello" })).resolves.toEqual({ items: [], total: 0 });
    expect(plugin).toHaveBeenCalledWith("linapro-content-notice", "notice?pageNum=1&pageSize=10&title=hello", undefined);
    await api.delete([2, 3]);
    expect(plugin).toHaveBeenLastCalledWith("linapro-content-notice", "notice/2,3", { method: "DELETE" });
    await expect(api.dict("sys_notice_type")).resolves.toHaveLength(1);
    expect(request).toHaveBeenCalledWith("dict/data/type/sys_notice_type");
  });

  it("allowlists editor HTML before preview rendering", () => {
    const output = sanitizeNoticeHtml('<h2 onclick="alert(1)">Title</h2><script>alert(1)</script><a href="javascript:alert(1)">bad</a><img src="/uploads/a.png" onerror="alert(1)">');
    expect(output).toContain("<h2>Title</h2>");
    expect(output).not.toMatch(/script|onclick|onerror|javascript:/i);
    expect(output).toContain('src="/uploads/a.png"');
  });

  it("ships matching bilingual editor and upload resources", () => {
    const english = enUS.plugin["linapro-content-notice"];
    const chinese = zhCN.plugin["linapro-content-notice"];
    expect(english.editor.image).toBe("Image");
    expect(chinese.editor.image).toBe("图片");
    expect(english.upload.hint).toBeTruthy();
    expect(chinese.upload.hint).toBeTruthy();
  });
});
