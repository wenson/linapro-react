import enUS from "../manifest/i18n/en-US/plugin.json";
import zhCN from "../manifest/i18n/zh-CN/plugin.json";
import { createTenantManagementApi } from "./pages/tenant-client";
import { createTenantPluginManagementApi } from "./pages/tenant-plugin-client";
import definition from "./plugin-ui";

describe("linapro-tenant-core React plugin UI", () => {
  it.each(["/platform/tenants", "/tenant/plugins"])("registers and lazy-loads capability-gated route %s", async (route) => {
    const page = definition.pages[route];
    expect(page).toMatchObject({ capabilities: ["tenant.management"], surface: "page" });
    expect((await page!.load()).default).toEqual(expect.any(Function));
  });

  it("registers the impersonation status in the published header-before slot", async () => {
    const item = definition.slots["layout.header.actions.before"]?.[0];
    expect(item).toMatchObject({ capabilities: ["tenant.management"], key: "tenant-impersonation-status", order: 0 });
    expect((await item!.load()).default).toEqual(expect.any(Function));
  });

  it("routes tenant CRUD and lifecycle changes through the stable plugin API", async () => {
    const plugin = vi.fn().mockResolvedValueOnce({ list: [], total: 0 }).mockResolvedValue({ id: 7 });
    const api = createTenantManagementApi({ plugin, pluginBlob: vi.fn(), request: vi.fn(), requestBlob: vi.fn() });
    await api.list({ code: "alpha", pageNum: 1, pageSize: 10, status: "active" });
    await api.create({ code: "alpha", name: "Alpha" });
    await api.update(7, { name: "Alpha 2" });
    await api.changeStatus(7, "suspended");
    await api.delete(7);
    expect(plugin.mock.calls.map((call) => [call[1], call[2]?.method])).toEqual([
      ["platform/tenants?code=alpha&pageNum=1&pageSize=10&status=active", undefined],
      ["platform/tenants", "POST"], ["platform/tenants/7", "PUT"],
      ["platform/tenants/7/status", "PUT"], ["platform/tenants/7", "DELETE"],
    ]);
  });

  it("routes tenant-scoped plugin governance through the current tenant context", async () => {
    const plugin = vi.fn().mockResolvedValueOnce({ list: [{ id: "demo" }], total: 1 }).mockResolvedValue(undefined);
    const api = createTenantPluginManagementApi({ plugin, pluginBlob: vi.fn(), request: vi.fn(), requestBlob: vi.fn() });
    await expect(api.list()).resolves.toMatchObject({ total: 1 });
    await api.enable("demo/source"); await api.disable("demo/source");
    expect(plugin.mock.calls.map((call) => [call[1], call[2]?.method])).toEqual([
      ["tenant/plugins", undefined], ["tenant/plugins/demo%2Fsource/enable", "POST"], ["tenant/plugins/demo%2Fsource/disable", "POST"],
    ]);
  });

  it("ships matching bilingual tenant management resources", () => {
    expect(enUS.plugin["linapro-tenant-core"].tenant.tableTitle).toBe("Tenants");
    expect(zhCN.plugin["linapro-tenant-core"].tenant.tableTitle).toBe("租户列表");
    expect(enUS.plugin["linapro-tenant-core"].impersonation.exit).toBe("Exit");
    expect(zhCN.plugin["linapro-tenant-core"].impersonation.exit).toBe("退出代操作");
  });
});
