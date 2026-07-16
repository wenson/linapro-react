import { expect, test } from "../../../fixtures/auth";
import { UserPage } from "../../../pages/UserPage";

test.describe("TC006 重置密码", () => {
  test("TC006a: 点击重置密码打开弹窗", async ({ adminPage }) => {
    const userPage = new UserPage(adminPage);
    await userPage.goto();

    await adminPage.getByRole("button", { name: /重置密码|Reset password/i }).first().click();
    const dialog = adminPage.getByTestId("user-reset-password-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("textbox", { name: /^新密码\*?$|^New password\*?$/i })).toHaveValue("");
  });

  test("TC006b: 重置密码API调用成功", async ({ adminPage }) => {
    const userPage = new UserPage(adminPage);
    await userPage.goto();

    const responsePromise = adminPage.waitForResponse(
      (response) => response.url().includes("/reset-password") && response.request().method() === "PUT",
      { timeout: 15_000 },
    );
    await adminPage.getByRole("button", { name: /重置密码|Reset password/i }).first().click();
    const dialog = adminPage.getByTestId("user-reset-password-dialog");
    await dialog.getByRole("textbox", { name: /^新密码\*?$|^New password\*?$/i }).fill("NewPass12345");
    await dialog.getByRole("button", { name: /^确\s*认$|^Confirm$/i }).click();

    expect((await responsePromise).status()).toBe(200);
  });
});
