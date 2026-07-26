import { mkdirSync } from "node:fs";
import path from "node:path";

import { test, expect } from "../../fixtures/auth";
import { LoginPage } from "../../pages/LoginPage";

test.describe("TC-11 登录页辅助入口布局", () => {
  test("TC-11a: 忘记密码和创建账号两端对齐且显示中文翻译", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.forgotPasswordEntry).toHaveText("忘记密码？");
    await expect(loginPage.createAccountEntry).toHaveText("创建账号");

    const [actions, forgotPassword, createAccount] = await Promise.all([
      loginPage.createAccountRegion.boundingBox(),
      loginPage.forgotPasswordEntry.boundingBox(),
      loginPage.createAccountEntry.boundingBox(),
    ]);
    expect(actions).not.toBeNull();
    expect(forgotPassword).not.toBeNull();
    expect(createAccount).not.toBeNull();
    if (!actions || !forgotPassword || !createAccount) return;

    expect(Math.abs(forgotPassword.x - actions.x)).toBeLessThanOrEqual(2);
    expect(
      Math.abs(actions.x + actions.width - (createAccount.x + createAccount.width)),
    ).toBeLessThanOrEqual(2);

    const timestamp = new Date();
    const date = timestamp.toISOString().slice(0, 10).replaceAll("-", "");
    const time = timestamp.toTimeString().slice(0, 8).replaceAll(":", "");
    const screenshotDirectory = path.resolve("../../temp", date);
    mkdirSync(screenshotDirectory, { recursive: true });
    await page.screenshot({
      path: path.join(screenshotDirectory, `${time}-login-public-actions.png`),
      fullPage: false,
    });
  });
});
