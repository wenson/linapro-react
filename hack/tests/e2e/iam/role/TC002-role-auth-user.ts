import { expect, test } from "../../../fixtures/auth";
import { RolePage } from "../../../pages/RolePage";

test.describe("TC002 角色授权用户管理", () => {
  test("TC002a: 授权用户页面正常加载", async ({ adminPage }) => {
    const rolePage = new RolePage(adminPage);
    await rolePage.goto();
    await rolePage.clickFirstAssign();

    await expect(adminPage.getByTestId("role-auth-table")).toBeVisible();
    await expect(
      adminPage.getByRole("button", { name: /取消授权|Remove assignment/i }).first(),
    ).toBeVisible();
  });

  test("TC002b: 授权用户列表包含邮箱列", async ({ adminPage }) => {
    const rolePage = new RolePage(adminPage);
    await rolePage.goto();
    await rolePage.clickFirstAssign();

    await expect(
      adminPage.getByTestId("role-auth-table").getByRole("columnheader", { name: /邮箱|Email/i }),
    ).toBeVisible();
  });

  test("TC002c: 批量取消授权按钮状态", async ({ adminPage }) => {
    const rolePage = new RolePage(adminPage);
    await rolePage.goto();
    await rolePage.clickFirstAssign();

    const batchCancelButton = adminPage
      .getByRole("button", { name: /取消授权|Remove assignment/i })
      .first();
    await expect(batchCancelButton).toBeDisabled();

    const firstRow = adminPage
      .getByTestId("role-auth-table")
      .locator(".semi-table-tbody > .semi-table-row")
      .first();
    if (await firstRow.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await firstRow.locator(".semi-checkbox").first().click();
      await expect(firstRow.getByRole("checkbox")).toBeChecked();
      await expect(batchCancelButton).toBeEnabled();
    }
  });
});
