import { test } from "../../fixtures/auth";
import { LayoutAuditPage } from "../../pages/LayoutAuditPage";

const listCases = [
  { fields: ["用户账号", "角色", "状态"], headers: ["用户账号", "角色", "状态", "操作"], mobile: "user-mobile-list", name: "user", path: "/system/user", table: "user-table" },
  { fields: ["权限字符", "数据权限", "状态"], headers: ["角色名称", "权限字符", "数据权限", "操作"], mobile: "role-mobile-list", name: "role", path: "/system/role", table: "role-table" },
  { fields: ["菜单类型", "权限标识", "状态"], headers: ["菜单名称", "菜单类型", "权限标识", "操作"], mobile: "menu-mobile-list", name: "menu", path: "/system/menu", table: "menu-table" },
  { fields: ["参数键", "值类型", "参数值"], headers: ["参数名称", "参数键", "值类型", "操作"], mobile: "config-mobile-list", name: "config", path: "/system/config", table: "config-table" },
  { fields: ["字典类型", "状态"], headers: ["字典名称", "字典类型", "状态", "操作"], mobile: "dict-type-mobile-list", name: "dict", path: "/system/dict", table: "dict-type-table" },
  { fields: ["所属分组", "状态", "定时表达式"], headers: ["任务名称", "分组", "状态", "操作"], mobile: "job-mobile-list", name: "job", path: "/system/job", table: "job-table" },
  { fields: ["插件标识", "插件类型", "版本号", "运行时状态"], headers: ["插件名称", "版本号", "状态", "运行时状态", "操作"], mobile: "plugin-mobile-list", name: "plugin", path: "/system/plugin", table: "plugin-table" },
] as const;

test.describe("TC-1 宿主核心列表响应式布局", () => {
  test("TC-1a: 1366×768 下表头、末尾字段和操作列可见且不互相遮挡", async ({ adminPage }) => {
    const audit = new LayoutAuditPage(adminPage);
    await audit.mockConfigListForLayoutAudit();
    await audit.setViewport(1366, 768);

    for (const item of listCases) {
      await audit.goto(item.path, { tableSelector: `[data-testid="${item.table}"]` });
      await audit.expectDesktopList({
        headers: [...item.headers],
        mobileListTestId: item.mobile,
        tableTestId: item.table,
      });
      await audit.capture(`ui-remediation-1366x768-zh-CN-${item.name}-desktop-e2e`);
    }
  });

  test("TC-1b: 390×844 下使用信息卡展示核心字段和操作且页面无横向溢出", async ({ adminPage }) => {
    const audit = new LayoutAuditPage(adminPage);
    await audit.mockConfigListForLayoutAudit();
    await audit.setViewport(390, 844);

    for (const item of listCases) {
      await audit.goto(item.path);
      await audit.expectMobileList({
        action: /.+/,
        fields: [...item.fields],
        mobileListTestId: item.mobile,
        tableTestId: item.table,
      });
      await audit.capture(`ui-remediation-390x844-zh-CN-${item.name}-mobile-e2e`);
    }
  });
});
