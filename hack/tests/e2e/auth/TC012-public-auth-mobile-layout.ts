import { test, expect } from "../../fixtures/auth";
import { workspacePath } from "../../fixtures/config";
import { LoginPage } from "../../pages/LoginPage";

test.describe("TC-12 手机公开认证入口", () => {
  test("TC-12a: 登录、注册、找回密码和重置密码在手机宽度下完整可用", async ({ page }) => {
    await page.setViewportSize({ height: 844, width: 390 });
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.forgotPasswordEntry).toBeVisible();
    await expect(loginPage.createAccountEntry).toBeVisible();
    await loginPage.expectNoHorizontalOverflow();
    await loginPage.capture("ui-remediation-390x844-zh-CN-login-e2e");

    await loginPage.gotoPublicPath("/auth/register");
    await expect(loginPage.registerSubmitButton).toBeVisible();
    await loginPage.expectNoHorizontalOverflow();

    await loginPage.gotoPublicPath("/auth/forget-password");
    await expect(loginPage.forgetPasswordSubmitButton).toBeVisible();
    await loginPage.expectNoHorizontalOverflow();

    await page.goto(`${workspacePath("/auth/reset-password")}?token=e2e-layout-only`);
    await expect(page.getByTestId("reset-password-submit")).toBeVisible();
    await loginPage.expectNoHorizontalOverflow();
    await loginPage.capture("ui-remediation-390x844-zh-CN-reset-password-e2e");
  });
});
