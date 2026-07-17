import type { Locator } from "@playwright/test";

import { test, expect } from "../../fixtures/auth";

/**
 * Regression coverage for Semi form controls: focus must remain visible and
 * client-side required-field feedback must remain readable.
 */

type FocusStyleSnapshot = {
  boxShadow: string;
  borderColor: string;
  outlineStyle: string;
};

async function readFocusStyle(locator: Locator): Promise<FocusStyleSnapshot> {
  return locator.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      boxShadow: style.boxShadow,
      borderColor: style.borderColor,
      outlineStyle: style.outlineStyle,
    };
  });
}

function hasVisibleFocusStyle(style: FocusStyleSnapshot): boolean {
  return style.outlineStyle !== "none" || style.boxShadow !== "none" || style.borderColor !== "";
}

test.describe("TC-10 登录页输入域焦点高亮", () => {
  test("TC-10a: 点击用户名输入域时出现完整焦点 ring（非四角残影）", async ({
    loginPage,
    page,
  }) => {
    await loginPage.goto();
    await expect(loginPage.usernameInput).toBeVisible();

    await loginPage.usernameInput.click();
    await expect(loginPage.usernameInput).toBeFocused();

    const style = await readFocusStyle(loginPage.usernameInput);
    expect(
      hasVisibleFocusStyle(style),
      `expected visible Semi focus style, got: ${JSON.stringify(style)}`,
    ).toBe(true);

    const stamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    await page.screenshot({
      path: `../../temp/20260717/${stamp}-login-input-focus-username.png`,
      fullPage: false,
    });
  });

  test("TC-10b: 空提交显示校验错误，且重新聚焦仍保留完整焦点高亮", async ({
    loginPage,
    page,
  }) => {
    await loginPage.goto();
    await expect(loginPage.loginButton).toBeVisible();

    // Empty submit → field-level validation errors on username/password.
    await loginPage.loginButton.click();

    const fieldErrors = page.locator('[role="alert"], .semi-form-field-validate-status-error');
    await expect(fieldErrors.first()).toBeVisible({ timeout: 5000 });
    await expect(fieldErrors.first()).not.toBeEmpty();
    // At least one error message has non-zero layout box (not clipped to 0 height).
    const errorBox = await fieldErrors.first().boundingBox();
    expect(
      errorBox && errorBox.height > 0 && errorBox.width > 0,
      "validation feedback must have a visible layout box",
    ).toBe(true);

    await loginPage.usernameInput.click();
    await expect(loginPage.usernameInput).toBeFocused();

    const style = await readFocusStyle(loginPage.usernameInput);
    expect(
      hasVisibleFocusStyle(style),
      `expected visible Semi focus style after validation error, got: ${JSON.stringify(style)}`,
    ).toBe(true);

    const stamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    await page.screenshot({
      path: `../../temp/20260717/${stamp}-login-input-focus-after-validation.png`,
      fullPage: false,
    });
  });

  test("TC-10c: 密码输入域焦点高亮同样不被裁切", async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.passwordInput.click();
    await expect(loginPage.passwordInput).toBeFocused();

    const style = await readFocusStyle(loginPage.passwordInput);
    expect(
      hasVisibleFocusStyle(style),
      `expected password Semi focus style, got: ${JSON.stringify(style)}`,
    ).toBe(true);
  });
});
