import { test, expect } from "../../../fixtures/auth";
import { UserPage } from "../../../pages/UserPage";
import { waitForDialogReady } from "../../../support/ui";

test.describe("TC-1 用户管理账号字段展示", () => {
  test("TC-1a: 列表和新增抽屉统一使用用户账号文案", async ({ adminPage }) => {
    const userPage = new UserPage(adminPage);
    await userPage.goto();

    const headers = userPage.table.getByRole("columnheader");
    await expect(headers.filter({ hasText: /^用户账号\s*$/ })).toBeVisible();
    await expect(headers.filter({ hasText: /^用户昵称\s*$/ })).toBeVisible();
    await expect(headers.filter({ hasText: /^账号\s*$/ })).toHaveCount(0);
    await expect(headers.filter({ hasText: /^名称\s*$/ })).toHaveCount(0);

    await adminPage.getByTestId("user-create-button").click();
    const drawer = await waitForDialogReady(
      adminPage
        .locator('.semi-sidesheet-inner[role="dialog"]')
        .filter({
          has: adminPage.getByRole("textbox", {
            name: /用户账号|Account/i,
          }),
        })
        .last(),
      20000,
    );

    await expect(drawer.getByRole("textbox", {
      name: /用户账号|Account/i,
    })).toBeVisible();
    await expect(drawer.getByText(/用户名/)).toHaveCount(0);
  });
});
