import enUS from "../manifest/i18n/en-US/plugin.json";
import zhCN from "../manifest/i18n/zh-CN/plugin.json";
import { createDeptApi, type Dept } from "./pages/dept-client";
import { buildDeptRows, deptRowKeys } from "./pages/dept-data";
import { createPostApi } from "./pages/post-client";
import definition from "./plugin-ui";

const routes = ["/system/dept", "/system/post"] as const;

describe("linapro-org-core React plugin UI", () => {
  it.each(routes)("registers and lazy-loads capability-gated route %s", async (route) => {
    const page = definition.pages[route];
    expect(page).toMatchObject({ capabilities: ["organization.management"], surface: "page" });
    expect((await page!.load()).default).toEqual(expect.any(Function));
  });

  it("routes department CRUD, tree projections and bounded leader queries through host APIs", async () => {
    const plugin = vi.fn().mockResolvedValueOnce({ list: [] }).mockResolvedValueOnce({ list: [] }).mockResolvedValueOnce({ list: [] }).mockResolvedValueOnce({ id: 8 });
    const request = vi.fn().mockResolvedValue({ list: [{ label: "Enabled", value: "1" }] });
    const api = createDeptApi({ plugin, pluginBlob: vi.fn(), request, requestBlob: vi.fn() });
    await api.list({ name: "R&D", status: 1 }); await api.tree(); await api.users(5, { keyword: "admin", limit: 10 }); await api.add({ name: "R&D", parentId: 0 }); await api.update(8, { name: "Engineering" }); await api.delete(8); await api.dict("sys_normal_disable");
    expect(plugin.mock.calls.map((call) => [call[1], call[2]?.method])).toEqual([
      ["dept?name=R%26D&status=1", undefined], ["dept/tree", undefined], ["dept/5/users?keyword=admin&limit=10", undefined], ["dept", "POST"], ["dept/8", "PUT"], ["dept/8", "DELETE"],
    ]);
    expect(request).toHaveBeenCalledWith("dict/data/type/sys_normal_disable");
  });

  it("routes paged position CRUD and Blob export through the governed plugin projection", async () => {
    const plugin = vi.fn().mockResolvedValueOnce({ list: [], total: 0 }).mockResolvedValueOnce(undefined);
    const pluginBlob = vi.fn().mockResolvedValue(new Blob(["xlsx"]));
    const api = createPostApi({ plugin, pluginBlob, request: vi.fn(), requestBlob: vi.fn() });
    await expect(api.list({ deptId: 2, pageNum: 1, pageSize: 10 })).resolves.toEqual({ items: [], total: 0 });
    await api.delete([3, 4]); await expect(api.export({ name: "Engineer" })).resolves.toBeInstanceOf(Blob);
    expect(plugin).toHaveBeenNthCalledWith(1, "linapro-org-core", "post?deptId=2&pageNum=1&pageSize=10", undefined);
    expect(plugin).toHaveBeenNthCalledWith(2, "linapro-org-core", "post/3,4", { method: "DELETE" });
    expect(pluginBlob).toHaveBeenCalledWith("linapro-org-core", "post/export?name=Engineer");
  });

  it("builds stable sorted department trees without losing descendants", () => {
    const item = (id: number, parentId: number, orderNum: number): Dept => ({ ancestors: "", code: String(id), createdAt: null, email: "", id, leader: 0, name: `D${id}`, orderNum, parentId, phone: "", remark: "", status: 1 });
    const tree = buildDeptRows([item(3, 1, 1), item(2, 0, 2), item(1, 0, 1)]);
    expect(tree.map((row) => row.id)).toEqual([1, 2]);
    expect(tree[0]?.children?.[0]?.id).toBe(3);
    expect(deptRowKeys(tree)).toEqual([1, 3, 2]);
  });

  it("ships matching bilingual organization workbench resources", () => {
    expect(enUS.plugin["linapro-org-core"].post.tree.title).toBe("Departments");
    expect(zhCN.plugin["linapro-org-core"].post.tree.title).toBe("部门树");
    expect(enUS.plugin["linapro-org-core"].dept.fields.email).toBe("Email");
    expect(zhCN.plugin["linapro-org-core"].dept.fields.email).toBe("电子邮箱");
  });
});
