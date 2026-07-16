import { LoginPage } from '../../pages/LoginPage';
import { config } from '../../fixtures/config';
import { test, expect } from '../../fixtures/auth';

test.describe('TC002 登录失败', () => {
  test('TC002a: 错误密码显示错误提示', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(config.adminUser, 'wrongpassword');

    await expect(page.getByRole('alert')).toHaveText('用户名或密码错误', { timeout: 5000 });
  });

  test('TC002b: 错误密码后仍在登录页', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(config.adminUser, 'wrongpassword');

    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
  });

  test('TC002c: 英文界面显示英文错误提示', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.switchLanguage('English');
    await loginPage.login(config.adminUser, 'wrongpassword');

    await expect(page.getByRole('alert')).toHaveText('Invalid username or password', { timeout: 5000 });
  });
});
