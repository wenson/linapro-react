import { test, expect } from "../../fixtures/auth";

test.describe("TC-9 手机工作台框架", () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.setViewportSize({ height: 844, width: 390 });
    await expect(adminPage.locator("html")).toHaveAttribute("lang", "zh-CN");
  });

  test("TC-9a: 手机顶栏与移动导航完整且不横向溢出", async ({
    mainLayout,
  }) => {
    await mainLayout.expectHeaderWithinViewport();
    await expect(mainLayout.mobileNavigationTrigger).toBeVisible();
    await expect(mainLayout.preferencesTrigger).toBeVisible();
    await expect(mainLayout.userDropdownTrigger).toBeVisible();

    await mainLayout.openMobileNavigation();
    await mainLayout.expectMobileNavigationItem("工作台");
    await mainLayout.capture("ui-remediation-390x844-zh-CN-mobile-navigation-e2e");
    await mainLayout.closeMobileNavigation();
  });

  test("TC-9b: 多页面标签保持单行且当前标签自动可见", async ({
    mainLayout,
  }) => {
    for (const path of ["/system/user", "/system/role", "/system/menu"]) {
      await mainLayout.navigateDirect(path);
    }

    await mainLayout.expectTabsSingleRow();
    await mainLayout.capture("ui-remediation-390x844-zh-CN-mobile-tabs-e2e");
  });
});
