import { test, expect } from '../../../fixtures/auth';
import { UserPage } from '../../../pages/UserPage';

test.describe('TC005 用户导入', () => {
  test('TC005a: 点击导入按钮打开导入弹窗', async ({ adminPage }) => {
    const userPage = new UserPage(adminPage);
    await userPage.goto();

    await userPage.clickImport();

    const modal = adminPage.getByTestId('user-import-dialog');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal).toContainText(/点击或拖拽 Excel 文件到此处上传/);
  });

  test('TC005b: 导入弹窗中有下载模板链接', async ({ adminPage }) => {
    const userPage = new UserPage(adminPage);
    await userPage.goto();

    await userPage.clickImport();

    const modal = adminPage.getByTestId('user-import-dialog');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.getByText('下载模板')).toBeVisible();
  });

  test('TC005c: 导入弹窗中有拖拽上传区域', async ({ adminPage }) => {
    const userPage = new UserPage(adminPage);
    await userPage.goto();

    await userPage.clickImport();

    const modal = adminPage.getByTestId('user-import-dialog');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.getByText(/点击或拖拽 Excel 文件到此处上传/)).toBeVisible();
    await expect(modal.getByText(/仅支持 .xlsx、.xls 文件/)).toBeVisible();
    await expect(modal.getByText(/覆盖已有用户数据/)).toBeVisible();
  });

  test('TC005d: 下载模板请求发送到正确的端点', async ({ adminPage }) => {
    const userPage = new UserPage(adminPage);
    await userPage.goto();

    await userPage.clickImport();

    const modal = adminPage.getByTestId('user-import-dialog');
    await expect(modal).toBeVisible({ timeout: 5000 });

    const responsePromise = adminPage.waitForResponse(
      (res) => res.url().includes('/api/v1/user/import-template'),
      { timeout: 10000 },
    );

    await modal.getByText('下载模板').click();
    const response = await responsePromise;

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('spreadsheetml');
  });
});
